import { BaseRepository } from "./base.repo";
import { db } from "../index";
import { students, type Student, type NewStudent } from "../schema/students";
import { enrollments } from "../schema/enrollments";
import { branches } from "../schema/branches";
import { contracts } from "../schema/contracts";
import { paymentItems } from "../schema/payment-items";
import { paymentTransactions } from "../schema/payment-transactions";
import { studentInteractions } from "../schema/student-interactions";
import { guardians, type NewGuardian, type Guardian } from "../schema/guardians";
import { classes } from "../schema/classes";
import { eq, or, ilike, count, sql, desc, ne, and, lt, gte, asc } from "drizzle-orm";

export interface RegistryFilters {
    search?: string;
    status?: string;
    grade?: string;
    branchId?: string;
    page?: number;
    pageSize?: number;
}

export interface StudentRow {
    id: string;
    fullName: string;
    phone: string | null;
    email: string | null;
    status: string;
    grade: string | null;
    branchName: string | null;
    academicYear: string | null;
}

export interface GradeGroup {
    grade: string;
    students: StudentRow[];
}

export interface RegistryResult {
    data: StudentRow[];
    total: number;
    page: number;
    pageSize: number;
}

export interface EnrollmentRecord {
    id: string;
    grade: string;
    academicYear: string | null;
    status: string;
    branchName: string | null;
    branchId: string | null;
    createdAt: string;
}

export interface PaymentItemRow {
    id: string;
    label: string | null;
    dueDate: string;
    amountExpected: number;
    amountPaid: number;
    status: string;
}

export interface ContractRow {
    id: string;
    contractNumber: string | null;
    startDate: string;
    endDate: string;
    totalAmount: number;
    status: string;
}

export interface ActivityEvent {
    id: string;
    type: 'payment' | 'status' | 'enrollment' | 'note';
    title: string;
    detail: string | null;
    occurredAt: string;
}

export interface StudentProfile {
    id: string;
    fullName: string;
    phone: string | null;
    email: string | null;
    notes: string | null;
    status: string;
    createdAt: string;
    enrollment: EnrollmentRecord | null;
    enrollmentHistory: EnrollmentRecord[];
    contract: ContractRow | null;
    paymentItems: PaymentItemRow[];
    activity: ActivityEvent[];
    guardians: Guardian[];
}

export interface StudentWithoutContract {
    id: string;
    fullName: string;
    grade: string | null;
    branchName: string | null;
    enrolledAt: string;
}

export interface RecentEnrollment {
    enrollmentId: string;
    studentId: string;
    fullName: string;
    grade: string;
    branchName: string | null;
    academicYear: string | null;
    status: string;
    enrolledAt: string;
}

export interface DashboardActivityEvent {
    id: string;
    type: 'payment' | 'call' | 'msg' | 'meeting' | 'note';
    title: string;
    detail: string | null;
    occurredAt: string;
    studentId: string;
    fullName: string;
}

export interface OverduePayment {
    id: string;
    studentId: string;
    fullName: string;
    phone: string | null;
    label: string | null;
    dueDate: string;
    amountExpected: number;
    amountPaid: number;
    debtAmount: number;
}

export interface AssistantStats {
    totalStudents: number;
    activeEnrollments: number;
    studentsWithoutContract: number;
    contractsThisMonth: number;
    studentsWithoutContractList: StudentWithoutContract[];
    recentEnrollments: RecentEnrollment[];
    overduePayments: OverduePayment[];
    recentActivity: DashboardActivityEvent[];
    totalDebtAmount: number;
}

export class StudentRepository extends BaseRepository<typeof students, Student, NewStudent> {
    constructor() {
        super(students);
    }

    async createWithEnrollment(
        studentData: NewStudent,
        enrollmentData: Omit<typeof enrollments.$inferInsert, "id" | "studentId" | "createdAt">,
        guardianData: Omit<NewGuardian, "id" | "studentId" | "createdAt">,
        classId?: string | null
    ): Promise<StudentProfile | null> {
        return db.transaction(async (tx) => {
            // 1. Resolve class legacy fields if classId provided
            let finalGrade = enrollmentData.grade;
            let finalYear = enrollmentData.academicYear;
            let finalBranchId = enrollmentData.branchId;

            if (classId) {
                const [cls] = await tx.select().from(classes).where(eq(classes.id, classId));
                if (cls) {
                    finalGrade = cls.name;
                    finalYear = cls.academicYear;
                    if (!finalBranchId) finalBranchId = cls.branchId;
                }
            }

            // 2. Create student
            const [newStudent] = await tx.insert(students).values(studentData).returning();

            // 3. Create enrollment
            const [newEnrollment] = await tx.insert(enrollments).values({
                studentId: newStudent.id,
                branchId: finalBranchId,
                classId: classId || null,
                grade: finalGrade,
                academicYear: finalYear,
                status: enrollmentData.status || "active",
            }).returning();

            // 3.5 Create draft/inactive contract to prevent data mapping breaks
            const contractNumberStr = newStudent.id.substring(0, 6).toUpperCase() + '-' + Date.now().toString().slice(-4);
            await tx.insert(contracts).values({
                contractNumber: contractNumberStr,
                enrollmentId: newEnrollment.id,
                status: 'inactive', // Draft status until assistant configures it
                basePrice: "0",
                discountAmount: "0",
                prepaymentAmount: "0",
                paymentMode: "monthly",
                startedAt: new Date().toISOString().split("T")[0]
            });

            // 4. Create Guardian
            await tx.insert(guardians).values({
                studentId: newStudent.id,
                fullName: guardianData.fullName,
                phone: guardianData.phone,
                relationship: guardianData.relationship || null,
            });

            return this.getById(newStudent.id); // Or just return newStudent to save a query if needed, but getById fetches full profile.
        });
    }

    async getRegistry(filters: RegistryFilters): Promise<RegistryResult> {
        const page = filters.page ?? 1;
        const pageSize = filters.pageSize ?? 20;
        const offset = (page - 1) * pageSize;

        let baseQuery = db
            .select({
                id: students.id,
                fullName: students.fullName,
                phone: students.phone,
                email: students.email,
                status: students.status,
                grade: enrollments.grade,
                branchName: branches.name,
                academicYear: enrollments.academicYear,
            })
            .from(students)
            .leftJoin(enrollments, and(eq(enrollments.studentId, students.id), eq(enrollments.status, 'active')))
            .leftJoin(branches, eq(enrollments.branchId, branches.id))
            .$dynamic();

        if (filters.search) {
            baseQuery = baseQuery.where(ilike(students.fullName, `%${filters.search}%`));
        }
        if (filters.status) {
            baseQuery = baseQuery.where(eq(students.status, filters.status));
        }
        if (filters.grade) {
            baseQuery = baseQuery.where(eq(enrollments.grade, filters.grade));
        }
        if (filters.branchId) {
            baseQuery = baseQuery.where(eq(enrollments.branchId, filters.branchId));
        }

        const [totalCountResult] = await db.select({ count: count() }).from(baseQuery.as('sq'));
        const total = totalCountResult?.count ?? 0;

        const data = await baseQuery
            .orderBy(asc(students.fullName))
            .limit(pageSize)
            .offset(offset);

        return {
            data: data.map(r => ({
                id: r.id,
                fullName: r.fullName,
                phone: r.phone,
                email: r.email,
                status: r.status,
                grade: r.grade,
                branchName: r.branchName,
                academicYear: r.academicYear,
            })),
            total,
            page,
            pageSize,
        };
    }

    async getGroupedByGrade(branchId?: string): Promise<GradeGroup[]> {
        let query = db
            .select({
                id: students.id,
                fullName: students.fullName,
                phone: students.phone,
                email: students.email,
                status: students.status,
                grade: enrollments.grade,
                branchName: branches.name,
                academicYear: enrollments.academicYear,
            })
            .from(students)
            .innerJoin(enrollments, eq(enrollments.studentId, students.id))
            .leftJoin(branches, eq(enrollments.branchId, branches.id))
            .$dynamic();

        if (branchId) {
            query = query.where(eq(enrollments.branchId, branchId));
        }

        const data = await query.orderBy(asc(students.fullName));

        const grouped = new Map<string, StudentRow[]>();
        for (const row of data) {
            const grade = row.grade ?? "Без класса";
            if (!grouped.has(grade)) grouped.set(grade, []);
            grouped.get(grade)!.push({
                id: row.id,
                fullName: row.fullName,
                phone: row.phone,
                email: row.email,
                status: row.status,
                grade: row.grade,
                branchName: row.branchName,
                academicYear: row.academicYear,
            });
        }

        return Array.from(grouped.entries())
            .sort(([a], [b]) => a.localeCompare(b, "ru"))
            .map(([grade, students]) => ({ grade, students }));
    }

    async getById(id: string): Promise<StudentProfile | null> {
        // 1. Fetch independent core entities in parallel
        const [
            [student],
            allEnrollmentsData,
            studentGuardians,
            activity
        ] = await Promise.all([
            db.select().from(students).where(eq(students.id, id)),
            db
                .select({
                    id: enrollments.id,
                    grade: enrollments.grade,
                    academicYear: enrollments.academicYear,
                    status: enrollments.status,
                    branchId: enrollments.branchId,
                    createdAt: enrollments.createdAt,
                    branchName: branches.name,
                })
                .from(enrollments)
                .leftJoin(branches, eq(enrollments.branchId, branches.id))
                .where(eq(enrollments.studentId, id))
                .orderBy(desc(enrollments.createdAt)),
            db
                .select()
                .from(guardians)
                .where(eq(guardians.studentId, id))
                .orderBy(asc(guardians.createdAt)),
            this.getActivityLog(id, 5)
        ]);

        if (!student) return null;

        const allEnrollments = allEnrollmentsData.map(e => ({
            id: e.id,
            grade: e.grade ?? "—",
            academicYear: e.academicYear,
            status: e.status,
            branchName: e.branchName,
            branchId: e.branchId,
            createdAt: e.createdAt.toISOString(),
        }));

        const currentEnrollment = allEnrollments.find((e) => e.status === "active") ?? allEnrollments[0] ?? null;

        // 3. Contract (depends on enrollment)
        let contractRow: ContractRow | null = null;
        let pItems: PaymentItemRow[] = [];

        if (currentEnrollment) {
            const [contract] = await db
                .select()
                .from(contracts)
                .where(and(eq(contracts.enrollmentId, currentEnrollment.id), eq(contracts.status, "active")))
                .orderBy(desc(contracts.createdAt))
                .limit(1);

            if (contract) {
                contractRow = {
                    id: contract.id,
                    contractNumber: contract.contractNumber,
                    startDate: contract.startedAt,
                    endDate: "",
                    totalAmount: parseFloat(contract.basePrice) - parseFloat(contract.discountAmount),
                    status: contract.status,
                };

                const dbItems = await db
                    .select()
                    .from(paymentItems)
                    .where(eq(paymentItems.contractId, contract.id))
                    .orderBy(asc(paymentItems.dueDate));

                pItems = dbItems.map(item => ({
                    id: item.id,
                    label: item.label,
                    dueDate: item.dueDate,
                    amountExpected: parseFloat(item.amount),
                    amountPaid: parseFloat(item.paidAmount),
                    status: item.status,
                }));
            }
        }


        return {
            id: student.id,
            fullName: student.fullName,
            phone: student.phone,
            email: student.email,
            notes: student.notes,
            status: student.status,
            createdAt: student.createdAt.toISOString(),
            enrollment: currentEnrollment,
            enrollmentHistory: allEnrollments,
            contract: contractRow,
            paymentItems: pItems,
            activity,
            guardians: studentGuardians,
        };
    }

    async getAssistantStats(): Promise<AssistantStats> {
        const now = new Date();
        const firstOfMonth = new Date(now.getFullYear(), now.getMonth(), 1).toISOString();

                // Active enrollments with no active contract (subquery for NOT IN)
                const activeEnrollmentsSubquery = db
                    .select({ enrollmentId: enrollments.id })
                    .from(enrollments)
                    .innerJoin(contracts, eq(contracts.enrollmentId, enrollments.id))
                    .where(and(eq(enrollments.status, 'active'), eq(contracts.status, 'active')));

                // Run all independent queries in parallel
                const [
                    [{ count: totalStudents }],
                    [{ count: activeEnrollments }],
                    [{ count: contractsThisMonth }],
                    recentEnrollmentRecords,
                    overduePaymentsRecords,
                    withoutContractRecords,
                    activityQuery
                ] = await Promise.all([
                    db.select({ count: count() }).from(students),
                    db.select({ count: count() }).from(enrollments).where(eq(enrollments.status, 'active')),
                    db.select({ count: count() }).from(contracts).where(gte(contracts.createdAt, new Date(firstOfMonth))),
                    db.select({
                        enrollmentId: enrollments.id,
                        studentId: students.id,
                        fullName: students.fullName,
                        grade: enrollments.grade,
                        branchName: branches.name,
                        academicYear: enrollments.academicYear,
                        status: enrollments.status,
                        enrolledAt: enrollments.createdAt,
                    })
                        .from(enrollments)
                        .innerJoin(students, eq(enrollments.studentId, students.id))
                        .leftJoin(branches, eq(enrollments.branchId, branches.id))
                        .orderBy(desc(enrollments.createdAt))
                        .limit(10),
                    db.select({
                        id: paymentItems.id,
                        studentId: students.id,
                        fullName: students.fullName,
                        phone: students.phone,
                        label: paymentItems.label,
                        dueDate: paymentItems.dueDate,
                        amountExpected: paymentItems.amount,
                        amountPaid: paymentItems.paidAmount,
                    })
                        .from(paymentItems)
                        .innerJoin(contracts, eq(paymentItems.contractId, contracts.id))
                        .innerJoin(enrollments, eq(contracts.enrollmentId, enrollments.id))
                        .innerJoin(students, eq(enrollments.studentId, students.id))
                        .where(and(ne(paymentItems.status, 'paid'), lt(paymentItems.dueDate, now.toISOString().split('T')[0]), eq(contracts.status, 'active')))
                        .orderBy(asc(paymentItems.dueDate)),
                    db.select({
                        id: students.id,
                        fullName: students.fullName,
                        grade: enrollments.grade,
                        branchName: branches.name,
                        enrolledAt: enrollments.createdAt,
                    })
                        .from(enrollments)
                        .innerJoin(students, eq(enrollments.studentId, students.id))
                        .leftJoin(branches, eq(enrollments.branchId, branches.id))
                        .where(and(
                            eq(enrollments.status, 'active'),
                            sql`${enrollments.id} NOT IN ${activeEnrollmentsSubquery}`
                        ))
                        .limit(25),
                    db.transaction(async (tx) => {
                        const payments = await tx.select({
                            id: paymentTransactions.id,
                            amount: paymentTransactions.amount,
                            paidAt: paymentTransactions.paidAt,
                            label: paymentItems.label,
                            studentId: students.id,
                            fullName: students.fullName,
                        })
                            .from(paymentTransactions)
                            .innerJoin(paymentItems, eq(paymentTransactions.paymentItemId, paymentItems.id))
                            .innerJoin(contracts, eq(paymentItems.contractId, contracts.id))
                            .innerJoin(enrollments, eq(contracts.enrollmentId, enrollments.id))
                            .innerJoin(students, eq(enrollments.studentId, students.id))
                            .orderBy(desc(paymentTransactions.paidAt))
                            .limit(15);

                        const interactions = await tx.select({
                            id: studentInteractions.id,
                            type: studentInteractions.type,
                            notes: studentInteractions.notes,
                            createdAt: studentInteractions.createdAt,
                            studentId: students.id,
                            fullName: students.fullName,
                        })
                            .from(studentInteractions)
                            .innerJoin(students, eq(studentInteractions.studentId, students.id))
                            .orderBy(desc(studentInteractions.createdAt))
                            .limit(15);

                        return { payments, interactions };
                    })
                ]);

                const typeLabels: Record<string, string> = {
                    call: "Звонок",
                    msg: "Сообщение",
                    meeting: "Встреча",
                };

                const activityLog: DashboardActivityEvent[] = [
                    ...activityQuery.interactions.map(int => ({
                        id: int.id,
                        // eslint-disable-next-line @typescript-eslint/no-explicit-any
                        type: int.type as any,
                        title: typeLabels[int.type] ?? "Заметка",
                        detail: int.notes,
                        occurredAt: int.createdAt.toISOString(),
                        studentId: int.studentId,
                        fullName: int.fullName,
                    })),
                    ...activityQuery.payments.map(tx => ({
                        id: tx.id,
                        type: "payment" as const,
                        title: "Оплата получена",
                        detail: `${parseFloat(tx.amount).toLocaleString("ru-RU")} сом · ${tx.label ?? ""}`,
                        occurredAt: tx.paidAt.toISOString(),
                        studentId: tx.studentId,
                        fullName: tx.fullName,
                    }))
                ].sort((a, b) => new Date(b.occurredAt).getTime() - new Date(a.occurredAt).getTime()).slice(0, 20);

                let totalDebt = 0;
                const overduePaymentsList: OverduePayment[] = overduePaymentsRecords.map(item => {
                    const expected = parseFloat(item.amountExpected);
                    const paid = parseFloat(item.amountPaid);
                    const debt = expected - paid;
                    if (debt > 0) totalDebt += debt;

                    return {
                        id: item.id,
                        studentId: item.studentId,
                        fullName: item.fullName,
                        phone: item.phone,
                        label: item.label,
                        dueDate: item.dueDate,
                        amountExpected: expected,
                        amountPaid: paid,
                        debtAmount: debt > 0 ? debt : 0,
                    };
                }).filter(p => p.debtAmount > 0);

                return {
                    totalStudents,
                    activeEnrollments,
                    studentsWithoutContract: withoutContractRecords.length,
                    contractsThisMonth,
                    studentsWithoutContractList: withoutContractRecords.map(r => ({
                        id: r.id,
                        fullName: r.fullName,
                        grade: r.grade,
                        branchName: r.branchName,
                        enrolledAt: r.enrolledAt.toISOString()
                    })),
                    recentEnrollments: recentEnrollmentRecords.map(r => ({
                        ...r,
                        grade: r.grade ?? "—",
                        enrolledAt: r.enrolledAt.toISOString(),
                    })),
                    overduePayments: overduePaymentsList,
                    recentActivity: activityLog,
                    totalDebtAmount: totalDebt,
                };
    }

    async getActivityLog(studentId: string, limit = 10): Promise<ActivityEvent[]> {
        return db.transaction(async (tx) => {
            const payments = await tx.select({
                id: paymentTransactions.id,
                amount: paymentTransactions.amount,
                paidAt: paymentTransactions.paidAt,
                label: paymentItems.label,
            })
                .from(paymentTransactions)
                .innerJoin(paymentItems, eq(paymentTransactions.paymentItemId, paymentItems.id))
                .innerJoin(contracts, eq(paymentItems.contractId, contracts.id))
                .innerJoin(enrollments, eq(contracts.enrollmentId, enrollments.id))
                .where(eq(enrollments.studentId, studentId))
                .orderBy(desc(paymentTransactions.paidAt))
                .limit(limit);

            const interactions = await tx.select({
                id: studentInteractions.id,
                type: studentInteractions.type,
                notes: studentInteractions.notes,
                createdBy: studentInteractions.createdBy,
                createdAt: studentInteractions.createdAt,
            })
                .from(studentInteractions)
                .where(eq(studentInteractions.studentId, studentId))
                .orderBy(desc(studentInteractions.createdAt))
                .limit(limit);

            const typeLabels: Record<string, string> = {
                call: "Звонок",
                msg: "Сообщение",
                meeting: "Встреча",
            };

            const combined: ActivityEvent[] = [
                ...payments.map(tx => ({
                    id: tx.id,
                    type: "payment" as const,
                    title: "Оплата получена",
                    detail: `${parseFloat(tx.amount).toLocaleString("ru-RU")} сом · ${tx.label ?? ""}`,
                    occurredAt: tx.paidAt.toISOString(),
                })),
                ...interactions.map(int => ({
                    id: int.id,
                    type: "note" as const,
                    title: typeLabels[int.type] || "Заметка",
                    detail: `${int.notes} (Автор: ${int.createdBy})`,
                    occurredAt: int.createdAt.toISOString(),
                }))
            ].sort((a, b) => new Date(b.occurredAt).getTime() - new Date(a.occurredAt).getTime()).slice(0, limit);

            return combined;
        });
    }
}

export const studentRepository = new StudentRepository();
