import Link from 'next/link';
import { redirect } from 'next/navigation';
import { collectionStatusLabel } from '@/lib/labels';
import { getDashboardSnapshot } from '@/lib/finance-store';
import { formatMoney } from '@/lib/format';
import { getCurrentRoleFromCookies } from '@/lib/user-role';
import SectionShell from '@/components/preprod/section-shell';
import ChartShell from '@/components/preprod/chart-shell';
import ActionOverlaySlot from '@/components/preprod/action-overlay-slot';

export default async function CallCenterWorkspacePage() {
  const role = await getCurrentRoleFromCookies();
  if (!['call_center', 'finance_manager', 'admin'].includes(role)) {
    redirect('/');
  }

  const dashboard = await getDashboardSnapshot().catch(() => ({
    summary: {
      totalStudents: 0,
      overdueAmount: 0,
      dueThisWeek: 0,
      withdrawalCount: 0
    },
    queue: []
  }));

  return (
    <section>
      <h1>Рабочее место: Колл-центр</h1>
      <p className="small">Контроль просрочек, обзвон и фиксация результата контакта.</p>

      <div className="grid">
        <article className="card">
          <p className="small">Задач в очереди</p>
          <p className="metric">{dashboard.queue.length}</p>
        </article>
        <article className="card">
          <p className="small">Просроченная сумма</p>
          <p className="metric">{formatMoney(dashboard.summary.overdueAmount)}</p>
        </article>
        <article className="card">
          <p className="small">Платежи к контролю (7 дней)</p>
          <p className="metric">{dashboard.summary.dueThisWeek}</p>
        </article>
        <article className="card">
          <p className="small">Активные выбытия</p>
          <p className="metric">{dashboard.summary.withdrawalCount}</p>
        </article>
      </div>

      <SectionShell
        title="Панель фильтров и действий"
        subtitle="Preproduction slot: дизайн подключит фильтры по филиалу/статусу/дате и быстрые действия."
      >
        <div className="card pp-filter-bar">
          <button>Фильтр: филиал</button>
          <button>Фильтр: статус</button>
          <button>Фильтр: период</button>
          <button className="primary">Экспорт очереди</button>
        </div>
      </SectionShell>

      <SectionShell title="Контейнеры графиков (slot)">
        <div className="grid">
          <ChartShell title="Воронка обзвона" subtitle="by status per period" />
          <ChartShell title="Конверсия обещаний в оплату" subtitle="line/bar chart slot" />
        </div>
      </SectionShell>

      <SectionShell title="Action overlays (drawer/modal slots)">
        <div className="grid">
          <ActionOverlaySlot title="Сценарий: быстрый звонок" hint="Контейнер под call drawer." primaryLabel="Открыть call drawer" />
          <ActionOverlaySlot title="Сценарий: шаблон сообщения" hint="Контейнер под message modal." primaryLabel="Открыть message modal" />
        </div>
      </SectionShell>

      <h2 className="section-title">Очередь обзвона</h2>
      <div className="table-wrap">
        <table>
          <thead>
            <tr>
              <th>Ученик</th>
              <th>Филиал</th>
              <th>Статус контакта</th>
              <th>Комментарий</th>
              <th>Открыть карточку</th>
            </tr>
          </thead>
          <tbody>
            {dashboard.queue.length === 0 ? (
              <tr>
                <td colSpan={5}>Очередь пустая</td>
              </tr>
            ) : (
              dashboard.queue.map((task) => (
                <tr key={task.taskId}>
                  <td>{task.studentName}</td>
                  <td>{task.branchName}</td>
                  <td>{collectionStatusLabel[task.status]}</td>
                  <td>{task.note}</td>
                  <td>
                    <Link href={`/students/${task.studentId}`} className="btn primary">
                      Обработать
                    </Link>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </section>
  );
}
