import Link from 'next/link';
import { redirect } from 'next/navigation';
import { collectionStatusLabel, paymentStatusLabel } from '@/lib/labels';
import { getDashboardSnapshot, getReportsOverview, getReceiptsSummary, getAllDebtors } from '@/lib/finance-store';
import { formatMoney } from '@/lib/format';
import { getCurrentRoleFromCookies } from '@/lib/user-role';
import PageShell from '@/components/preprod/page-shell';
import SectionShell from '@/components/preprod/section-shell';
import TableShell from '@/components/preprod/table-shell';
import StateBlock from '@/components/preprod/state-block';
import ChartShell from '@/components/preprod/chart-shell';
import ActionOverlaySlot from '@/components/preprod/action-overlay-slot';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { ExportDebtorsBtn } from './_components/export-debtors-btn';

export default async function FinanceWorkspacePage() {
  const role = await getCurrentRoleFromCookies();
  if (!['finance_manager', 'accountant', 'admin'].includes(role)) {
    redirect('/');
  }

  const todayStr = new Date().toISOString().slice(0, 10);
  const thirtyDaysAgoStr = new Date(Date.now() - 30 * 24 * 3600 * 1000).toISOString().slice(0, 10);

  const [dashboard, reports, receipts, debtors] = await Promise.all([
    getDashboardSnapshot().catch(() => ({
      summary: {
        totalStudents: 0,
        overdueAmount: 0,
        dueThisWeek: 0,
        withdrawalCount: 0
      },
      queue: []
    })),
    getReportsOverview().catch(() => ({
      aging: { bucket_0_7: 0, bucket_8_30: 0, bucket_31_plus: 0 },
      planFact: {
        periodFrom: '-',
        periodTo: '-',
        plannedAmount: 0,
        actualAmount: 0,
        gapAmount: 0
      },
      collectionPerformance: {
        no_contact: 0,
        contacted: 0,
        promise_to_pay: 0,
        refused: 0,
        closed: 0
      }
    })),
    getReceiptsSummary(thirtyDaysAgoStr, todayStr).catch(() => ({
      kaspi: 0,
      cash: 0,
      bank_transfer: 0,
      manual: 0
    })),
    getAllDebtors().catch(() => [])
  ]);

  return (
    <PageShell title="Финансы" subtitle="Аналитика оплат, просрочек, взыскания и план/факт денежных потоков.">
      <Tabs defaultValue="workspace" className="space-y-6">
        <TabsList>
          <TabsTrigger value="workspace">Рабочее место</TabsTrigger>
          <TabsTrigger value="reports">Финансовые Отчеты</TabsTrigger>
        </TabsList>

        <TabsContent value="workspace" className="space-y-6">
          <SectionShell
            title="Панель фильтров и действий"
            subtitle="Preproduction slot: фильтры по филиалу, периоду, статусам и экспорт отчетов."
          >
            <div className="card pp-filter-bar">
              <button>Филиал</button>
              <button>Период</button>
              <button>Статусы оплат</button>
              <button className="primary">Экспорт отчета</button>
            </div>
          </SectionShell>

          <SectionShell title="Контейнеры графиков (slot)">
            <div className="grid">
              <ChartShell title="План/Факт по неделям" subtitle="Линейный график cashflow" />
              <ChartShell title="Структура задолженности" subtitle="Donut/stacked chart slot" />
              <ChartShell title="Динамика взыскания" subtitle="Area chart slot" />
            </div>
          </SectionShell>

          <SectionShell title="Action overlays (drawer/modal slots)">
            <div className="grid">
              <ActionOverlaySlot title="Сценарий: массовый перерасчет" hint="Контейнер под drawer массовых действий." primaryLabel="Открыть drawer" />
              <ActionOverlaySlot title="Сценарий: подтверждение закрытия периода" hint="Контейнер под confirm modal." primaryLabel="Открыть modal" />
            </div>
          </SectionShell>

          <div className="grid">
            <article className="card">
              <p className="small">Общая просрочка</p>
              <p className="metric">{formatMoney(dashboard.summary.overdueAmount)}</p>
            </article>
            <article className="card">
              <p className="small">План (30 дней)</p>
              <p className="metric">{formatMoney(reports.planFact.plannedAmount)}</p>
            </article>
            <article className="card">
              <p className="small">Факт (30 дней)</p>
              <p className="metric">{formatMoney(reports.planFact.actualAmount)}</p>
            </article>
            <article className="card">
              <p className="small">Разрыв план/факт</p>
              <p className="metric">{formatMoney(reports.planFact.gapAmount)}</p>
            </article>
          </div>

          <h2 className="section-title">Aging просрочки</h2>
          <div className="grid">
            <article className="card">
              <p className="small">0-7 дней</p>
              <p className="metric">{formatMoney(reports.aging.bucket_0_7)}</p>
            </article>
            <article className="card">
              <p className="small">8-30 дней</p>
              <p className="metric">{formatMoney(reports.aging.bucket_8_30)}</p>
            </article>
            <article className="card">
              <p className="small">31+ дней</p>
              <p className="metric">{formatMoney(reports.aging.bucket_31_plus)}</p>
            </article>
          </div>

          <SectionShell title="Эффективность колл-центра">
            <TableShell>
              <table>
                <thead>
                  <tr>
                    <th>Статус</th>
                    <th>Кол-во задач</th>
                  </tr>
                </thead>
                <tbody>
                  {Object.entries(reports.collectionPerformance).map(([status, value]) => (
                    <tr key={status}>
                      <td>{collectionStatusLabel[status as keyof typeof collectionStatusLabel]}</td>
                      <td>{value}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </TableShell>
          </SectionShell>

          <SectionShell title="Текущие кейсы взыскания">
            <TableShell>
              <table>
                <thead>
                  <tr>
                    <th>Ученик</th>
                    <th>Филиал</th>
                    <th>Статус</th>
                    <th>Комментарий</th>
                    <th>Карточка</th>
                  </tr>
                </thead>
                <tbody>
                  {dashboard.queue.length === 0 ? (
                    <StateBlock type="empty" text="Нет активных кейсов" colSpan={5} />
                  ) : (
                    dashboard.queue.map((task) => (
                      <tr key={task.taskId}>
                        <td>{task.studentName}</td>
                        <td>{task.branchName}</td>
                        <td>{collectionStatusLabel[task.status]}</td>
                        <td>{task.note}</td>
                        <td>
                          <Link href={`/students/${task.studentId}`} className="btn">
                            Открыть
                          </Link>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </TableShell>
          </SectionShell>
        </TabsContent>

        <TabsContent value="reports" className="space-y-6">
          <SectionShell
            title="Сводка поступлений по типам источника (За 30 дней)"
            subtitle="Поступления на основе реальных оплаченных транзакций (без учета сторно)."
          >
            <div className="grid">
              <article className="card">
                <p className="small">Kaspi</p>
                <p className="metric">{formatMoney(receipts.kaspi)}</p>
              </article>
              <article className="card">
                <p className="small">Наличные (Cash)</p>
                <p className="metric">{formatMoney(receipts.cash)}</p>
              </article>
              <article className="card">
                <p className="small">Банковский перевод</p>
                <p className="metric">{formatMoney(receipts.bank_transfer)}</p>
              </article>
              <article className="card">
                <p className="small">Итого</p>
                <p className="metric">{formatMoney(receipts.kaspi + receipts.cash + receipts.bank_transfer + receipts.manual)}</p>
              </article>
            </div>
          </SectionShell>

          <SectionShell
            title="Список всех должников"
            subtitle="Все студенты, у которых есть неоплаченные счета со статусом Просрочено."
            actions={debtors.length > 0 ? <ExportDebtorsBtn debtors={debtors} /> : undefined}
          >
            <TableShell>
              <table>
                <thead>
                  <tr>
                    <th>ФИО Ученика</th>
                    <th>Филиал</th>
                    <th>Месяц / Назначение</th>
                    <th>Дедлайн</th>
                    <th>Сумма Долга</th>
                    <th>Действия</th>
                  </tr>
                </thead>
                <tbody>
                  {debtors.length === 0 ? (
                    <StateBlock type="empty" text="Должников не найдено" colSpan={6} />
                  ) : (
                    debtors.map((debtor) => (
                      <tr key={debtor.paymentItemId}>
                        <td>
                          <p>{debtor.studentName}</p>
                          <p className="text-xs text-slate-500">{debtor.phone || 'Нет телефона'}</p>
                        </td>
                        <td>{debtor.branchName || '—'}</td>
                        <td>{debtor.label || 'Не указано'}</td>
                        <td>{new Date(debtor.dueDate).toLocaleDateString('ru-RU')}</td>
                        <td>
                          <p className="font-semibold text-red-600">{formatMoney(debtor.debtAmount)}</p>
                          <p className="text-xs text-slate-500">Из {formatMoney(debtor.amount)}</p>
                        </td>
                        <td>
                          <Link href={`/students/${debtor.studentId}/contract`} className="btn">
                            Окно оплаты
                          </Link>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </TableShell>
          </SectionShell>
        </TabsContent>
      </Tabs>
    </PageShell>
  );
}
