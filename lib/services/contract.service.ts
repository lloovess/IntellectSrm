import { contractRepository, type ContractDetail, type PaymentItemDetail } from "@/lib/db/repositories/contract.repo";
import { studentRepository } from "@/lib/db/repositories/student.repo";
import { paymentRepository } from "@/lib/db/repositories/payment.repo";
import { createContractSchema, KZ_ACADEMIC_MONTHS, type CreateContractInput } from "@/lib/validators/contract.schema";
import { checkPermission } from "@/lib/auth/guard";
import type { Role } from "@/lib/auth/config";
import { createAdminClient } from "@/lib/supabase/server";

// ─── Types ────────────────────────────────────────────────────────────────────

export interface PaymentPlanItem {
    label: string;
    dueDate: Date;
    amount: number;
    index: number;
}

type PaymentMode = "monthly" | "quarterly" | "annual";

export interface ContractPageData {
    student: {
        id: string;
        fullName: string;
        phone: string | null;
        status: string;
        branchId: string | null;
    };
    guardians: {
        id: string;
        fullName: string;
        iin: string | null;
        phone: string | null;
        passport: string | null;
        address: string | null;
    }[];
    contract: ContractDetail | null;
    enrollmentId: string | null; // active enrollment for contract creation
    grade: string | null;
    paymentItems: PaymentItemDetail[];
    stats: {
        totalPaid: number;
        totalExpected: number;
        totalRemaining: number;
        percentPaid: number;
        overdueCount: number;
        nextPayment: PaymentItemDetail | null;
    };
    advance: {
        balance: number;
        lastEntryAt: string | null;
        lastReason: string | null;
    };
    availablePeriods: {
        enrollmentId: string;
        academicYear: string | null;
        grade: string | null;
        contractId: string;
        contractNumber: string;
        status: string;
    }[];
    canWrite: boolean;
    canRecordPayment: boolean;
}

export interface RenewContractInput {
    studentId: string;
    /** New class ID */
    classId: string;
    /** New contract base price */
    basePrice: number;
    discountPercent?: number;
    prepayPercent?: number;
    months?: number;
    startDate: string; // ISO date string
    paymentDueDay: number;
    contractNumber: string;
    paymentMode?: string;
}

// ─── Service ──────────────────────────────────────────────────────────────────

export class ContractService {
    /**
     * Вычисляет план платежей по параметрам договора.
     * Казахстанский учебный год: Сентябрь – Июнь (10 месяцев).
     */
    calculatePaymentPlan(params: {
        basePrice: number;
        discountPercent: number;
        prepayPercent: number;
        months: number;
        startDate: Date;
        paymentDueDay?: number;
        paymentMode?: PaymentMode;
    }): PaymentPlanItem[] {
        const { basePrice, discountPercent, prepayPercent, months, startDate, paymentDueDay = 1, paymentMode = "monthly" } = params;

        const discountAmount = basePrice * (discountPercent / 100);
        const afterDiscount = basePrice - discountAmount;
        const prepayAmount = afterDiscount * (prepayPercent / 100);
        const remainder = afterDiscount - prepayAmount;

        const startCalendarYear = startDate.getFullYear();
        const startMonthNumeric = startDate.getMonth() + 1;
        const academicStartYear = startMonthNumeric < 9 ? startCalendarYear - 1 : startCalendarYear;

        const startMonthIndex = KZ_ACADEMIC_MONTHS.findIndex(
            (m: { month: number; label: string }) => m.month === startMonthNumeric
        );
        const monthStart = startMonthIndex >= 0 ? startMonthIndex : 0;

        const items: PaymentPlanItem[] = [];

        // Предоплата (если есть)
        if (prepayAmount > 0) {
            items.push({
                label: "Предоплата",
                dueDate: new Date(startDate),
                amount: Math.round(prepayAmount),
                index: 0,
            });
        }

        // Разовый договор: один платеж на весь остаток
        if (paymentMode === "annual") {
            if (remainder > 0) {
                items.push({
                    label: "Полная оплата",
                    dueDate: new Date(startDate),
                    amount: Math.round(remainder),
                    index: items.length,
                });
            }
            return items;
        }

        // Monthly/Quarterly schedule
        const usedMonths = KZ_ACADEMIC_MONTHS.slice(monthStart, monthStart + months);
        const effectiveMonths =
            usedMonths.length < months
                ? [...usedMonths, ...KZ_ACADEMIC_MONTHS.slice(0, months - usedMonths.length)]
                : usedMonths;

        const chunkSize = paymentMode === "quarterly" ? 3 : 1;
        const groups: Array<Array<{ month: number; label: string }>> = [];
        for (let i = 0; i < effectiveMonths.length; i += chunkSize) {
            groups.push(effectiveMonths.slice(i, i + chunkSize));
        }

        const groupAmount = groups.length > 0 ? remainder / groups.length : remainder;

        let accrued = 0;
        groups.forEach((group, idx) => {
            const m = group[0];
            const year = m.month < 9 ? academicStartYear + 1 : academicStartYear;

            // Generate due date with proper handling for days end of month
            const expectedDate = new Date(year, m.month - 1, paymentDueDay);
            // If the month doesn't have that day (e.g. Feb 31), JS will bump to next month
            // We fix this by checking if the month shifted and setting it to the last day of the intended month
            const safeDueDate = expectedDate.getMonth() === m.month - 1
                ? expectedDate
                : new Date(year, m.month, 0); // Last day of the intended month

            const isLast = idx === groups.length - 1;
            const amount = isLast
                ? Math.max(0, remainder - accrued)
                : Math.round(groupAmount);
            accrued += amount;
            items.push({
                label: paymentMode === "quarterly" ? `Квартал ${idx + 1}` : m.label,
                dueDate: safeDueDate,
                amount,
                index: items.length,
            });
        });

        return items;
    }

    /**
     * Создаёт договор + платёжный план в БД.
     */
    async createContract(input: CreateContractInput, role: Role): Promise<ContractDetail> {
        if (!checkPermission(role, "contracts.write")) {
            throw new Error("Недостаточно прав для создания договора");
        }

        const parsed = createContractSchema.parse(input);
        const startDate = new Date(parsed.startDate);

        const planItems = this.calculatePaymentPlan({
            basePrice: parsed.basePrice,
            discountPercent: parsed.discountPercent ?? 0,
            prepayPercent: parsed.prepayPercent ?? 0,
            months: parsed.months ?? 9,
            startDate,
            paymentDueDay: parsed.paymentDueDay,
            paymentMode: parsed.paymentMode,
        });

        const discountAmount = parsed.basePrice * ((parsed.discountPercent ?? 0) / 100);
        const prepaymentAmount = (parsed.basePrice - discountAmount) * ((parsed.prepayPercent ?? 0) / 100);

        return contractRepository.createContractWithItems({
            contractNumber: parsed.contractNumber,
            enrollmentId: parsed.enrollmentId,
            startedAt: startDate,
            basePrice: parsed.basePrice,
            discountAmount,
            prepaymentAmount,
            paymentMode: parsed.paymentMode ?? "monthly",
            paymentDueDay: parsed.paymentDueDay,
            previousContractId: null,
            paymentItems: planItems.map((p) => ({
                label: p.label,
                dueDate: p.dueDate,
                amount: p.amount,
            })),
        });
    }

    /**
     * Продление договора: закрывает старый enrollment+contract,
     * создаёт новый с previous_contract_id и переносит хвост долга.
     *
     * All DB ops are sequential (Supabase JS doesn't support true transactions),
     * but each step is atomic at the row level.
     */
    async renewContract(input: RenewContractInput, role: Role): Promise<ContractDetail> {
        if (!checkPermission(role, "contracts.write")) {
            throw new Error("Недостаточно прав для продления договора");
        }

        const admin = await createAdminClient();
        const {
            studentId,
            classId,
            basePrice,
            discountPercent = 0,
            prepayPercent = 0,
            months = 9,
            startDate: startDateStr,
            paymentDueDay = 1,
            contractNumber,
            paymentMode = "monthly",
        } = input;

        // 1. Find active enrollment
        const { data: enrollments, error: enrollErr } = await admin
            .from("enrollments")
            .select("id, branch_id")
            .eq("student_id", studentId)
            .eq("status", "active")
            .order("created_at", { ascending: false })
            .limit(1);

        if (enrollErr) throw new Error(enrollErr.message);
        const oldEnrollment = enrollments?.[0];
        const oldEnrollmentId = oldEnrollment?.id ?? null;
        let branchId = oldEnrollment?.branch_id;

        // Fallback to any past enrollment if no active one is found
        if (!branchId) {
            const { data: pastEnrollments } = await admin
                .from("enrollments")
                .select("branch_id")
                .eq("student_id", studentId)
                .order("created_at", { ascending: false })
                .limit(1);
            branchId = pastEnrollments?.[0]?.branch_id;
        }

        if (!branchId) {
            throw new Error("Не удалось определить филиал для продления. Сначала зачислите ученика в филиал.");
        }

        let oldContractId: string | null = null;
        if (oldEnrollmentId) {
            const { data: contracts, error: contractErr } = await admin
                .from("contracts")
                .select("id")
                .eq("enrollment_id", oldEnrollmentId)
                .in("status", ["active"])
                .limit(1);

            if (contractErr) throw new Error(contractErr.message);
            oldContractId = contracts?.[0]?.id ?? null;

            // NOTE: We no longer close the old contract or transfer debt immediately 
            // if the renewal happens mid-year, allowing the student to finish the current year.
        }

        // 2b. Fetch the new class details
        const { data: newClass, error: newClassErr } = await admin
            .from("classes")
            .select("name, academic_year, branch_id")
            .eq("id", classId)
            .single();

        if (newClassErr || !newClass) {
            throw new Error("Класс не найден или произошла ошибка при получении класса");
        }

        // 3. Create new enrollment
        const { data: newEnroll, error: newEnrollErr } = await admin
            .from("enrollments")
            .insert({
                student_id: studentId,
                branch_id: newClass.branch_id,
                class_id: classId,
                grade: newClass.name,
                academic_year: newClass.academic_year,
                status: "active",
            })
            .select("id")
            .single();

        if (newEnrollErr) throw new Error(newEnrollErr.message);
        const newEnrollmentId = (newEnroll as { id: string }).id;

        // 4. Calculate new payment plan
        const startDate = new Date(startDateStr);
        const planItems = this.calculatePaymentPlan({
            basePrice,
            discountPercent,
            prepayPercent,
            months,
            startDate,
            paymentDueDay,
            paymentMode: paymentMode as PaymentMode,
        });

        const discountAmount = basePrice * (discountPercent / 100);
        const prepaymentAmount = (basePrice - discountAmount) * (prepayPercent / 100);

        // (Debt carry-forward will be handled by a separate background job or manual action when old contract completes)

        // 6. Create new contract
        const newContract = await contractRepository.createContractWithItems({
            contractNumber,
            enrollmentId: newEnrollmentId,
            startedAt: startDate,
            basePrice,
            discountAmount,
            prepaymentAmount,
            paymentMode,
            paymentDueDay,
            status: "active",
            previousContractId: oldContractId,
            paymentItems: planItems.map((p) => ({
                label: p.label,
                dueDate: p.dueDate,
                amount: p.amount,
            })),
        });

        return newContract;
    }

    /**
     * Полные данные для страницы /students/[id]/contract.
     */
    async getContractPage(studentId: string, role: Role, contractId?: string): Promise<ContractPageData | null> {
        if (!checkPermission(role, "contracts.read")) return null;

        const profile = await studentRepository.getById(studentId);
        if (!profile) return null;

        const { contract, paymentItems } = await contractRepository.getByStudentId(studentId, contractId);

        // Fetch all contracts to build the periods tab UI
        const allContracts = await contractRepository.getAllByStudentId(studentId);
        const availablePeriods = allContracts.map(c => {
            const enrollment = profile.enrollmentHistory.find(e => e.id === c.enrollmentId);
            return {
                enrollmentId: c.enrollmentId,
                academicYear: enrollment?.academicYear ?? "Не указан",
                grade: enrollment?.grade ?? "Не указан",
                contractId: c.id,
                contractNumber: c.contractNumber || "Б/Н",
                status: c.status,
                startDate: c.startedAt,
            };
        }).sort((a, b) => new Date(b.startDate).getTime() - new Date(a.startDate).getTime());

        const totalExpectedFromItems = paymentItems.reduce((s: number, p: PaymentItemDetail) => s + p.amountExpected, 0);
        const totalExpected = contract ? contract.totalAmount : totalExpectedFromItems;
        const totalPaid = paymentItems.reduce((s: number, p: PaymentItemDetail) => s + p.amountPaid, 0);
        const totalRemaining = Math.max(0, totalExpected - totalPaid);
        const percentPaid =
            totalExpected > 0 ? Math.round((totalPaid / totalExpected) * 100) : 0;
        const overdueCount = paymentItems.filter((p: PaymentItemDetail) => p.status === "overdue").length;
        const nextPayment =
            paymentItems.find(
                (p: PaymentItemDetail) => p.status === "overdue" || p.status === "partially_paid" || p.status === "planned"
            ) ?? null;
        const advance = await paymentRepository.getStudentAdvanceSummary(studentId);

        return {
            student: {
                id: profile.id,
                fullName: profile.fullName,
                phone: profile.phone,
                status: profile.status,
                branchId: profile.enrollment?.branchId ?? null,
            },
            guardians: profile.guardians.map((g) => ({
                id: g.id,
                fullName: g.fullName,
                iin: g.iin,
                phone: g.phone,
                passport: g.passport,
                address: g.address,
            })),
            contract,
            enrollmentId: profile.enrollment?.id ?? null,
            grade: profile.enrollment?.grade ?? null,
            paymentItems,
            stats: { totalPaid, totalExpected, totalRemaining, percentPaid, overdueCount, nextPayment },
            advance,
            availablePeriods,
            canWrite: checkPermission(role, "contracts.write"),
            canRecordPayment: checkPermission(role, "payments.write"),
        };
    }

    /**
     * Recalculates contract balance and adjusts the last payment item if necessary.
     */
    async recalculateContractBalance(contractId: string, role: Role): Promise<{ diff: number }> {
        if (!checkPermission(role, "contracts.write")) {
            throw new Error("Недостаточно прав для пересчета баланса");
        }

        const admin = await createAdminClient();

        // 1. Fetch contract
        const { data: contract, error: contractErr } = await admin
            .from("contracts")
            .select("base_price, discount_amount, prepayment_amount")
            .eq("id", contractId)
            .single();

        if (contractErr || !contract) throw new Error("Contract not found");

        // 2. Fetch all payment items
        const { data: items, error: itemsErr } = await admin
            .from("payment_items")
            .select("id, amount, paid_amount, status, due_date")
            .eq("contract_id", contractId)
            .order("due_date", { ascending: true });

        if (itemsErr || !items) throw new Error("Could not fetch payment items");

        const base = parseFloat(contract.base_price.toString());
        const disc = parseFloat(contract.discount_amount?.toString() ?? "0");
        const expectedTotal = base - disc;

        const currentTotal = items.reduce((sum, item) => sum + parseFloat(item.amount.toString()), 0);

        const diff = expectedTotal - currentTotal;
        if (Math.abs(diff) < 0.01) return { diff: 0 };

        if (items.length === 0) return { diff };

        // 4. If we need to increase total, add delta to the last item
        if (diff > 0) {
            const lastItem = items[items.length - 1];
            const newAmount = parseFloat(lastItem.amount.toString()) + diff;
            const { error: updateErr } = await admin
                .from("payment_items")
                .update({ amount: newAmount.toString() })
                .eq("id", lastItem.id);

            if (updateErr) throw new Error("Failed to update last payment item");
            return { diff };
        }

        // 5. If we need to decrease total, reduce only non-committed items from the end
        let remainingToReduce = Math.abs(diff);
        const reducible = [...items].reverse().filter((item) => {
            const paidAmount = parseFloat(item.paid_amount?.toString() ?? "0");
            return paidAmount === 0 && item.status !== "paid" && item.status !== "partially_paid";
        });

        for (const item of reducible) {
            if (remainingToReduce <= 0) break;
            const currentAmount = parseFloat(item.amount.toString());
            const reduction = Math.min(currentAmount, remainingToReduce);
            const newAmount = Math.max(0, currentAmount - reduction);
            remainingToReduce -= reduction;

            const { error: updateErr } = await admin
                .from("payment_items")
                .update({ amount: newAmount.toString() })
                .eq("id", item.id);

            if (updateErr) throw new Error("Failed to reduce payment item");
        }

        if (remainingToReduce > 0.01) {
            throw new Error("Нельзя уменьшить график: часть суммы уже зафиксирована оплатами.");
        }

        return { diff };
    }

    /**
     * Regenerates the payment schedule for a contract.
     * Keeps paid/partially paid items, wipes planned items, and redistributes remainder.
     */
    async generatePaymentSchedule(contractId: string, role: Role, months: number = 9): Promise<void> {
        if (!checkPermission(role, "contracts.write")) {
            throw new Error("Недостаточно прав для генерации графика");
        }

        const admin = await createAdminClient();

        const { data: contract, error: contractErr } = await admin
            .from("contracts")
            .select("base_price, discount_amount, prepayment_amount, started_at, payment_due_day")
            .eq("id", contractId)
            .single();

        if (contractErr || !contract) throw new Error("Contract not found");

        const { data: items, error: itemsErr } = await admin
            .from("payment_items")
            .select("id, amount, paid_amount, status, due_date")
            .eq("contract_id", contractId)
            .order("due_date", { ascending: true });

        if (itemsErr || !items) throw new Error("Could not fetch payment items");

        const alreadyPaidOrCommitted = items
            .filter(i => i.status === "paid" || i.status === "partially_paid" || parseFloat(i.paid_amount.toString()) > 0)
            .reduce((sum, item) => sum + parseFloat(item.amount.toString()), 0);

        const base = parseFloat(contract.base_price.toString());
        const disc = parseFloat(contract.discount_amount?.toString() ?? "0");
        const expectedTotal = base - disc;

        const remainder = Math.max(0, expectedTotal - alreadyPaidOrCommitted);

        // Delete purely planned un-paid zero-paid items
        const itemsToDelete = items.filter(i => parseFloat(i.paid_amount.toString()) === 0 && i.status !== "paid" && i.status !== "partially_paid");
        if (itemsToDelete.length > 0) {
            const { error: delErr } = await admin
                .from("payment_items")
                .delete()
                .in("id", itemsToDelete.map(i => i.id));
            if (delErr) throw new Error("Failed to delete old payment items");
        }

        // Distribute remainder
        if (remainder > 0) {
            const latestCommittedDateStr = items
                .filter(i => parseFloat(i.paid_amount.toString()) > 0 || i.status === "paid" || i.status === "partially_paid")
                .map(i => i.due_date)
                .sort()
                .pop();

            let nextStartDateStr = contract.started_at;
            if (latestCommittedDateStr) {
                const d = new Date(latestCommittedDateStr);
                d.setMonth(d.getMonth() + 1);
                nextStartDateStr = d.toISOString().split("T")[0];
            }

            const planItems = this.calculatePaymentPlan({
                basePrice: remainder,
                discountPercent: 0,
                prepayPercent: 0,
                months,
                startDate: new Date(nextStartDateStr),
                paymentDueDay: contract.payment_due_day,
                paymentMode: "monthly",
            });

            if (planItems.length > 0) {
                const { error: insertErr } = await admin
                    .from("payment_items")
                    .insert(planItems.map(p => ({
                        contract_id: contractId,
                        label: p.label,
                        due_date: p.dueDate.toISOString().split("T")[0],
                        amount: p.amount,
                        status: "planned",
                        paid_amount: 0
                    })));

                if (insertErr) throw new Error("Failed to insert new payment items");
            }
        }
    }

    /**
     * Updates payment mode/due day and regenerates only non-committed part of schedule.
     * Paid/partially paid rows are preserved as-is.
     */
    async updatePaymentTermsAndRegenerate(params: {
        contractId: string;
        paymentMode: PaymentMode;
        months: number;
        paymentDueDay: number;
        role: Role;
    }): Promise<void> {
        const { contractId, paymentMode, months, paymentDueDay, role } = params;
        if (!checkPermission(role, "contracts.write")) {
            throw new Error("Недостаточно прав для изменения условий оплаты");
        }

        const admin = await createAdminClient();

        const { data: contract, error: contractErr } = await admin
            .from("contracts")
            .select("base_price, discount_amount, started_at")
            .eq("id", contractId)
            .single();

        if (contractErr || !contract) throw new Error("Contract not found");

        const { data: items, error: itemsErr } = await admin
            .from("payment_items")
            .select("id, amount, paid_amount, status, due_date")
            .eq("contract_id", contractId)
            .order("due_date", { ascending: true });

        if (itemsErr || !items) throw new Error("Could not fetch payment items");

        const committed = items.filter(
            (i) => i.status === "paid" || i.status === "partially_paid" || parseFloat(i.paid_amount.toString()) > 0
        );
        const committedTotal = committed.reduce((sum, item) => sum + parseFloat(item.amount.toString()), 0);

        const base = parseFloat(contract.base_price.toString());
        const disc = parseFloat(contract.discount_amount?.toString() ?? "0");
        const expectedTotal = base - disc;
        const remainder = Math.max(0, expectedTotal - committedTotal);

        const idsToDelete = items
            .filter((i) => parseFloat(i.paid_amount.toString()) === 0 && i.status !== "paid" && i.status !== "partially_paid")
            .map((i) => i.id);

        if (idsToDelete.length > 0) {
            const { error: delErr } = await admin
                .from("payment_items")
                .delete()
                .in("id", idsToDelete);
            if (delErr) throw new Error("Failed to delete planned payment items");
        }

        const { error: updateContractErr } = await admin
            .from("contracts")
            .update({
                payment_mode: paymentMode,
                payment_due_day: paymentDueDay,
            })
            .eq("id", contractId);

        if (updateContractErr) throw new Error("Failed to update contract payment terms");

        if (remainder <= 0) return;

        const latestCommittedDateStr = committed
            .map((i) => i.due_date)
            .sort()
            .pop();

        let nextStartDateStr = contract.started_at;
        if (latestCommittedDateStr) {
            const d = new Date(latestCommittedDateStr);
            d.setMonth(d.getMonth() + 1);
            nextStartDateStr = d.toISOString().split("T")[0];
        }

        const planItems = this.calculatePaymentPlan({
            basePrice: remainder,
            discountPercent: 0,
            prepayPercent: 0,
            months,
            startDate: new Date(nextStartDateStr),
            paymentDueDay,
            paymentMode,
        });

        if (planItems.length > 0) {
            const { error: insertErr } = await admin
                .from("payment_items")
                .insert(planItems.map((p) => ({
                    contract_id: contractId,
                    label: p.label,
                    due_date: p.dueDate.toISOString().split("T")[0],
                    amount: p.amount,
                    status: "planned",
                    paid_amount: 0,
                })));

            if (insertErr) throw new Error("Failed to create regenerated payment items");
        }
    }
}

export const contractService = new ContractService();
