import { redirect } from "next/navigation";
import { requireAuth } from "@/lib/auth/session";
import { checkPermission } from "@/lib/auth/guard";
import { financialJournalService } from "@/lib/services/financial-journal.service";
import { FinancialJournalTable } from "./_components/financial-journal-table";

interface ReportsPageProps {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}

export default async function ReportsPage({ searchParams }: ReportsPageProps) {
  const { role } = await requireAuth();
  if (!checkPermission(role, "financial_audit.read")) {
    redirect("/");
  }

  const params = await searchParams;
  const data = await financialJournalService.getPage({
    periodFrom: typeof params.periodFrom === "string" ? params.periodFrom : undefined,
    periodTo: typeof params.periodTo === "string" ? params.periodTo : undefined,
    studentQuery: typeof params.studentQuery === "string" ? params.studentQuery : undefined,
    payerQuery: typeof params.payerQuery === "string" ? params.payerQuery : undefined,
    actorQuery: typeof params.actorQuery === "string" ? params.actorQuery : undefined,
    branchId: typeof params.branchId === "string" ? params.branchId : undefined,
    eventType: typeof params.eventType === "string" ? params.eventType : undefined,
    source: typeof params.source === "string" ? params.source : undefined,
  }, role);

  return (
    <section className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-slate-900 dark:text-white">Единый журнал оплат и изменений</h1>
        <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
          Что оплатили, кто оплатил, кто изменил и как изменились финансовые данные.
        </p>
      </div>

      <form className="grid grid-cols-1 gap-3 rounded-2xl border border-slate-200 bg-white p-4 shadow-sm md:grid-cols-4 dark:border-slate-800 dark:bg-slate-900">
        <input name="periodFrom" type="date" defaultValue={data.filters.periodFrom} className="rounded-lg border border-slate-200 px-3 py-2 dark:border-slate-700 dark:bg-slate-950" />
        <input name="periodTo" type="date" defaultValue={data.filters.periodTo} className="rounded-lg border border-slate-200 px-3 py-2 dark:border-slate-700 dark:bg-slate-950" />
        <input name="studentQuery" placeholder="Ученик" defaultValue={data.filters.studentQuery} className="rounded-lg border border-slate-200 px-3 py-2 dark:border-slate-700 dark:bg-slate-950" />
        <input name="payerQuery" placeholder="Плательщик" defaultValue={data.filters.payerQuery} className="rounded-lg border border-slate-200 px-3 py-2 dark:border-slate-700 dark:bg-slate-950" />
        <input name="actorQuery" placeholder="Кто изменил / внес" defaultValue={data.filters.actorQuery} className="rounded-lg border border-slate-200 px-3 py-2 dark:border-slate-700 dark:bg-slate-950" />
        <select name="branchId" defaultValue={data.filters.branchId} className="rounded-lg border border-slate-200 px-3 py-2 dark:border-slate-700 dark:bg-slate-950">
          <option value="">Все филиалы</option>
          {data.branches.map((branch) => (
            <option key={branch.id} value={branch.id}>{branch.name}</option>
          ))}
        </select>
        <select name="eventType" defaultValue={data.filters.eventType} className="rounded-lg border border-slate-200 px-3 py-2 dark:border-slate-700 dark:bg-slate-950">
          <option value="">Все события</option>
          <option value="payment">Оплата</option>
          <option value="auto_allocation">Автозачет</option>
          <option value="payment_reversal">Сторно</option>
          <option value="update">Изменение</option>
          <option value="create">Создание</option>
        </select>
        <select name="source" defaultValue={data.filters.source} className="rounded-lg border border-slate-200 px-3 py-2 dark:border-slate-700 dark:bg-slate-950">
          <option value="">Все источники</option>
          <option value="cash">Наличные</option>
          <option value="kaspi">Kaspi</option>
          <option value="bank_transfer">Банк. перевод</option>
        </select>
        <div className="md:col-span-4 flex justify-end">
          <button type="submit" className="rounded-lg bg-[#207fdf] px-4 py-2 text-sm font-semibold text-white hover:bg-[#1a6bc4]">
            Применить фильтры
          </button>
        </div>
      </form>

      <FinancialJournalTable rows={data.rows} />
    </section>
  );
}
