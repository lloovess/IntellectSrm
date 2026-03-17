import { z } from "zod";
import { KZ_MONTHS, type ImportResult, type ValidatedRow } from "@/lib/import/csv";

function monthToDueDate(label: string, academicYear: string): string {
  const [startYear] = academicYear.split("-").map(Number);
  const map: Record<string, [number, number]> = {
    "Сентябрь": [startYear, 9],
    "Октябрь": [startYear, 10],
    "Ноябрь": [startYear, 11],
    "Декабрь": [startYear, 12],
    "Январь": [startYear + 1, 1],
    "Февраль": [startYear + 1, 2],
    "Март": [startYear + 1, 3],
    "Апрель": [startYear + 1, 4],
    "Май": [startYear + 1, 5],
    "Июнь": [startYear + 1, 6],
  };
  const [year, month] = map[label] ?? [startYear, 9];
  return `${year}-${String(month).padStart(2, "0")}-01`;
}

function roundMoney(value: number): number {
  return Math.round(value);
}

function normalizeExpectedPayments(params: {
  contractTotal: number;
  prepayment: number;
  monthlyAmount: number;
  monthLabels: readonly string[];
}): Array<{ label: string; amount: number }> {
  const { contractTotal, prepayment, monthlyAmount, monthLabels } = params;

  if (contractTotal <= 0) return [];

  const safePrepayment = Math.max(0, roundMoney(Math.min(prepayment, contractTotal)));
  const remainder = Math.max(0, contractTotal - safePrepayment);

  if (monthLabels.length === 0) {
    return safePrepayment > 0 ? [{ label: "Предоплата", amount: safePrepayment }] : [];
  }

  const hasMonthlyFromImport = monthlyAmount > 0;
  const normalizedMonthly = hasMonthlyFromImport ? roundMoney(monthlyAmount) : 0;
  const monthsCount = hasMonthlyFromImport
    ? Math.max(1, Math.min(monthLabels.length, Math.ceil(remainder / Math.max(1, normalizedMonthly))))
    : monthLabels.length;

  const selectedLabels = monthLabels.slice(0, monthsCount);
  const plannedMonthly = hasMonthlyFromImport
    ? normalizedMonthly
    : roundMoney(remainder / Math.max(1, selectedLabels.length));

  const payments = selectedLabels.map((label) => ({ label, amount: Math.max(0, plannedMonthly) }));

  const expectedWithoutAdjustment =
    safePrepayment + payments.reduce((sum, item) => sum + item.amount, 0);
  const diff = contractTotal - expectedWithoutAdjustment;

  if (payments.length > 0) {
    payments[payments.length - 1].amount = Math.max(
      0,
      payments[payments.length - 1].amount + diff
    );
  }

  const result: Array<{ label: string; amount: number }> = [];
  if (safePrepayment > 0) {
    result.push({ label: "Предоплата", amount: safePrepayment });
  }
  result.push(...payments.filter((item) => item.amount > 0));
  return result;
}

export async function importBatch(
  validatedRows: ValidatedRow[],
  branchId: string,
  grade: string,
  academicYear: string,
  userEmail: string
): Promise<ImportResult> {
  const { createAdminClient } = await import("@/lib/supabase/server");
  const admin = await createAdminClient();

  const result: ImportResult = { imported: 0, skipped: 0, errors: [] };
  const validRows = validatedRows.filter((r) => r.valid && r.parsed);
  const CHUNK = 5;

  for (let i = 0; i < validRows.length; i += CHUNK) {
    const chunk = validRows.slice(i, i + CHUNK);
    await Promise.all(
      chunk.map(async (row) => {
        const p = row.parsed!;
        try {
          const { data: student, error: sErr } = await admin
            .from("students")
            .insert({ full_name: p.fullName, phone: p.phone, status: "active" })
            .select("id")
            .single();
          if (sErr) throw new Error(sErr.message);

          if (p.parentName) {
            const { error: gErr } = await admin
              .from("guardians")
              .insert({
                student_id: student.id,
                full_name: p.parentName,
                phone: p.phone,
                relationship: "Родитель/Опекун"
              });
            if (gErr) throw new Error(gErr.message);
          }

          const { data: enrollment, error: eErr } = await admin
            .from("enrollments")
            .insert({ student_id: student.id, branch_id: branchId, grade, academic_year: academicYear, status: "active" })
            .select("id")
            .single();
          if (eErr) throw new Error(eErr.message);

          const { data: contract, error: cErr } = await admin
            .from("contracts")
            .insert({
              enrollment_id: enrollment.id,
              base_price: p.basePrice,
              discount_amount: 0,
              prepayment_amount: p.prepayment,
              payment_mode: "monthly",
              started_at: `${academicYear.split("-")[0]}-09-01`,
              contract_number: p.contractNumber || null,
              status: "active",
            })
            .select("id")
            .single();
          if (cErr) throw new Error(cErr.message);

          const contractTotal = roundMoney(p.basePrice);
          const monthsToCreate = KZ_MONTHS;
          const normalizedPlan = normalizeExpectedPayments({
            contractTotal,
            prepayment: p.prepayment,
            monthlyAmount: p.monthlyAmount,
            monthLabels: monthsToCreate,
          });

          const itemsData: Array<{ contract_id: string; due_date: string; amount: number; paid_amount: number; status: string; label: string }> = [];

          const prepaymentItem = normalizedPlan.find((item) => item.label === "Предоплата");
          if (prepaymentItem) {
            itemsData.push({
              contract_id: contract.id,
              due_date: `${academicYear.split("-")[0]}-08-25`,
              amount: prepaymentItem.amount,
              paid_amount: 0,
              status: "planned",
              label: "Предоплата",
            });
          }

          normalizedPlan
            .filter((item) => item.label !== "Предоплата")
            .forEach((item) => {
            itemsData.push({
              contract_id: contract.id,
              due_date: monthToDueDate(item.label, academicYear),
              amount: item.amount,
              paid_amount: 0,
              status: "planned",
              label: item.label,
            });
          });

          const { data: items, error: piErr } = await admin
            .from("payment_items")
            .insert(itemsData)
            .select("id, label");
          if (piErr) throw new Error(piErr.message);

          const txData: Array<{ payment_item_id: string; amount: number; paid_at: string; source: string; created_by: string }> = [];
          const itemMap: Record<string, string> = {};
          (items ?? []).forEach((item: { id: string; label: string }) => {
            itemMap[item.label] = item.id;
          });

          for (const [label, amount] of Object.entries(p.monthPayments)) {
            const itemId = itemMap[label];
            if (itemId && amount > 0) {
              txData.push({
                payment_item_id: itemId,
                amount,
                paid_at: monthToDueDate(label, academicYear),
                source: "manual",
                created_by: userEmail,
              });
            }
          }

          if (txData.length > 0) {
            await admin.from("payment_transactions").insert(txData);

            const expectedByItemId: Record<string, number> = {};
            (items ?? []).forEach((item: { id: string; label: string }) => {
              const planItem = normalizedPlan.find((plan) => plan.label === item.label);
              expectedByItemId[item.id] = planItem?.amount ?? 0;
            });

            for (const tx of txData) {
              const expectedAmount = expectedByItemId[tx.payment_item_id] ?? 0;
              const newStatus = tx.amount >= expectedAmount ? "paid" : "partially_paid";
              await admin
                .from("payment_items")
                .update({ paid_amount: tx.amount, status: newStatus })
                .eq("id", tx.payment_item_id);
            }
          }

          result.imported++;
        } catch (err) {
          result.errors.push({ row: row.rowIndex, error: err instanceof Error ? err.message : "Ошибка" });
          result.skipped++;
        }
      })
    );
  }

  result.skipped += validatedRows.filter((r) => !r.valid).length;
  return result;
}

export const importConfigSchema = z.object({
  branchId: z.string().uuid("Выберите филиал"),
  grade: z.string().min(1, "Выберите класс"),
  academicYear: z.string().regex(/^\d{4}-\d{4}$/, "Формат учебного года: 2025-2026"),
  mapping: z.object({
    fullName: z.string().nullable(),
    phone: z.string().nullable(),
    contractNumber: z.string().nullable(),
    basePrice: z.string().nullable(),
    monthlyAmount: z.string().nullable(),
    prepayment: z.string().nullable(),
    months: z.record(z.string(), z.string()),
  }),
});

export type ImportConfig = z.infer<typeof importConfigSchema>;
