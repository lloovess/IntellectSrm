import type { AssistantStats } from "@/lib/services/student.service";
import Link from "next/link";

// ─── KPI Card ─────────────────────────────────────────────────────────────────

interface KpiCardProps {
    label: string;
    value: number;
    icon: React.ReactNode;
    color: "indigo" | "emerald" | "amber" | "violet";
    href?: string;
}

function KpiCard({ label, value, icon, color, href }: KpiCardProps) {
    const colorMap = {
        indigo: {
            bg: "bg-indigo-50 dark:bg-indigo-950/40",
            icon: "bg-indigo-100 dark:bg-indigo-900/60 text-indigo-600 dark:text-indigo-400",
            text: "text-indigo-700 dark:text-indigo-300",
        },
        emerald: {
            bg: "bg-emerald-50 dark:bg-emerald-950/40",
            icon: "bg-emerald-100 dark:bg-emerald-900/60 text-emerald-600 dark:text-emerald-400",
            text: "text-emerald-700 dark:text-emerald-300",
        },
        amber: {
            bg: "bg-amber-50 dark:bg-amber-950/40",
            icon: "bg-amber-100 dark:bg-amber-900/60 text-amber-600 dark:text-amber-400",
            text: "text-amber-700 dark:text-amber-300",
        },
        violet: {
            bg: "bg-violet-50 dark:bg-violet-950/40",
            icon: "bg-violet-100 dark:bg-violet-900/60 text-violet-600 dark:text-violet-400",
            text: "text-violet-700 dark:text-violet-300",
        },
    };

    const c = colorMap[color];

    const card = (
        <div
            className={`rounded-xl border border-slate-100 dark:border-slate-800 ${c.bg} p-5 flex items-center gap-4 transition-shadow hover:shadow-md`}
        >
            <div className={`h-12 w-12 flex-shrink-0 rounded-xl ${c.icon} flex items-center justify-center`}>
                {icon}
            </div>
            <div>
                <p className="text-sm font-medium text-slate-500 dark:text-slate-400">{label}</p>
                <p className={`text-2xl font-bold ${c.text} mt-0.5`}>{value.toLocaleString("ru-RU")}</p>
            </div>
        </div>
    );

    if (href) {
        return <Link href={href} className="block">{card}</Link>;
    }
    return card;
}

// ─── Quick Action Button ───────────────────────────────────────────────────────

interface QuickActionProps {
    href: string;
    icon: React.ReactNode;
    label: string;
    description: string;
    variant?: "primary" | "default";
}

function QuickAction({ href, icon, label, description, variant = "default" }: QuickActionProps) {
    return (
        <Link
            href={href}
            className={`flex items-start gap-4 rounded-xl border p-4 transition-all hover:shadow-md group
        ${variant === "primary"
                    ? "border-indigo-200 dark:border-indigo-800 bg-indigo-50 dark:bg-indigo-950/40 hover:bg-indigo-100 dark:hover:bg-indigo-900/50"
                    : "border-slate-100 dark:border-slate-800 bg-white dark:bg-slate-900 hover:bg-slate-50 dark:hover:bg-slate-800/50"
                }`}
        >
            <div className={`h-10 w-10 flex-shrink-0 rounded-lg flex items-center justify-center
        ${variant === "primary"
                    ? "bg-indigo-600 text-white shadow-sm shadow-indigo-200 dark:shadow-indigo-900"
                    : "bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 group-hover:bg-slate-200 dark:group-hover:bg-slate-700"
                }`}>
                {icon}
            </div>
            <div>
                <p className={`text-sm font-semibold ${variant === "primary" ? "text-indigo-700 dark:text-indigo-300" : "text-slate-800 dark:text-slate-200"}`}>
                    {label}
                </p>
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">{description}</p>
            </div>
        </Link>
    );
}

// ─── Formatters ───────────────────────────────────────────────────────────────

function formatDate(iso: string): string {
    try {
        return new Date(iso).toLocaleDateString("ru-RU", { day: "2-digit", month: "2-digit", year: "numeric" });
    } catch {
        return iso;
    }
}

function statusBadge(status: string) {
    const map: Record<string, { label: string; cls: string }> = {
        active: { label: "Активно", cls: "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-400" },
        withdrawal_requested: { label: "Запрос выбытия", cls: "bg-amber-100 text-amber-700 dark:bg-amber-900/40 dark:text-amber-400" },
        withdrawn: { label: "Выбыл", cls: "bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-400" },
        re_enrolled: { label: "Переведён", cls: "bg-indigo-100 text-indigo-700 dark:bg-indigo-900/40 dark:text-indigo-400" },
        completed: { label: "Завершён", cls: "bg-blue-100 text-blue-700 dark:bg-blue-900/40 dark:text-blue-400" },
    };
    const entry = map[status] ?? { label: status, cls: "bg-slate-100 text-slate-600" };
    return (
        <span className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-semibold ${entry.cls}`}>
            {entry.label}
        </span>
    );
}

// ─── Main Component ──────────────────────────────────────────────────────────

interface Props {
    stats: AssistantStats;
}

export function AssistantDashboard({ stats }: Props) {
    return (
        <div className="space-y-8">
            {/* ── KPI Row ────────────────────────────────────────────────── */}
            <section>
                <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
                    <KpiCard
                        label="Всего учеников"
                        value={stats.totalStudents}
                        color="indigo"
                        href="/students"
                        icon={
                            <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                                <path strokeLinecap="round" strokeLinejoin="round" d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0" />
                            </svg>
                        }
                    />
                    <KpiCard
                        label="Активных зачислений"
                        value={stats.activeEnrollments}
                        color="emerald"
                        icon={
                            <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                                <path strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                            </svg>
                        }
                    />
                    <KpiCard
                        label="Всего должников"
                        value={stats.overduePayments.length}
                        color="amber"
                        icon={
                            <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                                <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                            </svg>
                        }
                    />
                    <KpiCard
                        label="Общий долг"
                        value={stats.totalDebtAmount}
                        color="violet"
                        icon={
                            <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                                <path strokeLinecap="round" strokeLinejoin="round" d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                            </svg>
                        }
                    />
                </div>
            </section>

            {/* ── Quick Actions ─────────────────────────────────────────── */}
            <section>
                <h2 className="text-base font-semibold text-slate-900 dark:text-white mb-3">Быстрые действия</h2>
                <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-4">
                    <QuickAction
                        href="/students/new"
                        variant="primary"
                        label="Добавить ученика"
                        description="Создать новый профиль студента"
                        icon={
                            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                                <path strokeLinecap="round" strokeLinejoin="round" d="M18 9v3m0 0v3m0-3h3m-3 0h-3m-2-5a4 4 0 11-8 0 4 4 0 018 0zM3 20a6 6 0 0112 0v1H3v-1z" />
                            </svg>
                        }
                    />
                    <QuickAction
                        href="/students"
                        label="Реестр учеников"
                        description="Список всех студентов по классам"
                        icon={
                            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                                <path strokeLinecap="round" strokeLinejoin="round" d="M4 6h16M4 10h16M4 14h16M4 18h16" />
                            </svg>
                        }
                    />
                    <QuickAction
                        href="/withdrawals"
                        label="Центр выбытия"
                        description="Заявки на выбытие учеников"
                        icon={
                            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                                <path strokeLinecap="round" strokeLinejoin="round" d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
                            </svg>
                        }
                    />
                    <QuickAction
                        href="/settings/import-export"
                        label="Импорт реестра"
                        description="Загрузка учеников и договоров из CSV"
                        icon={
                            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                                <path strokeLinecap="round" strokeLinejoin="round" d="M3 16.5v2.25A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75V16.5m-9-12v12m0 0l4-4m-4 4l-4-4" />
                            </svg>
                        }
                    />
                </div>
            </section>

            {/* ── Two-column tables (Row 1) ─────────────────────────────────────── */}
            <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">

                {/* Overdue Payments */}
                <section className="rounded-xl border border-slate-100 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-sm overflow-hidden flex flex-col h-[400px]">
                    <div className="flex items-center justify-between px-5 py-4 border-b border-slate-100 dark:border-slate-800 flex-shrink-0">
                        <div>
                            <h2 className="text-sm font-semibold text-slate-900 dark:text-white">Требуют внимания (Должники)</h2>
                            <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">Самые старые долги сверху</p>
                        </div>
                        {stats.overduePayments.length > 0 && (
                            <span className="inline-flex items-center rounded-full bg-red-100 dark:bg-red-900/40 px-2.5 py-0.5 text-xs font-semibold text-red-700 dark:text-red-400">
                                {stats.overduePayments.length} просрочек
                            </span>
                        )}
                    </div>

                    <div className="flex-1 overflow-y-auto min-h-0">
                        {stats.overduePayments.length === 0 ? (
                            <div className="flex flex-col items-center justify-center py-12 text-center h-full">
                                <div className="h-12 w-12 rounded-full bg-emerald-50 dark:bg-emerald-950/40 flex items-center justify-center mb-3">
                                    <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-emerald-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                                        <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                                    </svg>
                                </div>
                                <p className="text-sm font-medium text-slate-600 dark:text-slate-300">Нет долгов</p>
                                <p className="text-xs text-slate-400 dark:text-slate-500 mt-1">Все счета оплачены вовремя</p>
                            </div>
                        ) : (
                            <div className="divide-y divide-slate-50 dark:divide-slate-800/50">
                                {stats.overduePayments.map((p) => (
                                    <div key={p.id} className="flex items-center justify-between px-5 py-3 hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors">
                                        <div className="min-w-0 flex-1">
                                            <div className="flex justify-between items-start">
                                                <p className="text-sm font-medium text-slate-800 dark:text-slate-200 truncate">{p.fullName}</p>
                                                <span className="text-sm font-bold text-red-600 dark:text-red-400 whitespace-nowrap ml-2">
                                                    {p.debtAmount.toLocaleString("ru-RU")} сом
                                                </span>
                                            </div>
                                            <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5 truncate">
                                                Ожидалось: {formatDate(p.dueDate)} · {p.label}
                                            </p>
                                            {p.phone && (
                                                <p className="text-xs text-slate-400 dark:text-slate-500 mt-0.5 truncate">
                                                    {p.phone}
                                                </p>
                                            )}
                                        </div>
                                        <Link
                                            href={`/students/${p.studentId}/contract`}
                                            className="ml-3 flex-shrink-0 rounded-lg bg-red-50 dark:bg-red-950/40 px-3 py-1.5 text-xs font-semibold text-red-700 dark:text-red-400 hover:bg-red-100 dark:hover:bg-red-900/50 transition-colors"
                                        >
                                            Перейти
                                        </Link>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>
                </section>

                {/* Students without contract */}
                <section className="rounded-xl border border-slate-100 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-sm overflow-hidden flex flex-col h-[400px]">
                    <div className="flex items-center justify-between px-5 py-4 border-b border-slate-100 dark:border-slate-800 flex-shrink-0">
                        <div>
                            <h2 className="text-sm font-semibold text-slate-900 dark:text-white">Без договора</h2>
                            <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">Активные зачисления без контракта</p>
                        </div>
                        {stats.studentsWithoutContract > 0 && (
                            <span className="inline-flex items-center rounded-full bg-amber-100 dark:bg-amber-900/40 px-2.5 py-0.5 text-xs font-semibold text-amber-700 dark:text-amber-400">
                                {stats.studentsWithoutContract}
                            </span>
                        )}
                    </div>

                    <div className="flex-1 overflow-y-auto min-h-0">
                        {stats.studentsWithoutContractList.length === 0 ? (
                            <div className="flex flex-col items-center justify-center py-12 text-center h-full">
                                <div className="h-12 w-12 rounded-full bg-emerald-50 dark:bg-emerald-950/40 flex items-center justify-center mb-3">
                                    <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-emerald-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                                        <path strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                                    </svg>
                                </div>
                                <p className="text-sm font-medium text-slate-600 dark:text-slate-300">Все ученики оформлены</p>
                                <p className="text-xs text-slate-400 dark:text-slate-500 mt-1">У каждого активного ученика есть договор</p>
                            </div>
                        ) : (
                            <div className="divide-y divide-slate-50 dark:divide-slate-800/50">
                                {stats.studentsWithoutContractList.map((s) => (
                                    <div key={s.id} className="flex items-center justify-between px-5 py-3 hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors">
                                        <div className="min-w-0">
                                            <p className="text-sm font-medium text-slate-800 dark:text-slate-200 truncate">{s.fullName}</p>
                                            <p className="text-xs text-slate-500 dark:text-slate-400">
                                                {s.grade ?? "—"} · {s.branchName ?? "—"}
                                            </p>
                                        </div>
                                        <Link
                                            href={`/students/${s.id}/contract`}
                                            className="ml-3 flex-shrink-0 rounded-lg bg-indigo-50 dark:bg-indigo-950/40 px-3 py-1.5 text-xs font-semibold text-indigo-700 dark:text-indigo-400 hover:bg-indigo-100 dark:hover:bg-indigo-900/50 transition-colors whitespace-nowrap"
                                        >
                                            Создать
                                        </Link>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>
                </section>

            </div>

            {/* ── Two-column tables (Row 2) ─────────────────────────────────────── */}
            <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">

                {/* Activity Feed */}
                <section className="rounded-xl border border-slate-100 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-sm overflow-hidden flex flex-col h-[400px]">
                    <div className="px-5 py-4 border-b border-slate-100 dark:border-slate-800 flex-shrink-0">
                        <h2 className="text-sm font-semibold text-slate-900 dark:text-white">Лента событий (Activity Feed)</h2>
                        <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">Коммуникации и оплаты</p>
                    </div>

                    <div className="flex-1 overflow-y-auto min-h-0">
                        {stats.recentActivity.length === 0 ? (
                            <div className="flex flex-col items-center justify-center py-12 text-center h-full">
                                <p className="text-sm text-slate-500 dark:text-slate-400">Лента пока пуста</p>
                            </div>
                        ) : (
                            <div className="divide-y divide-slate-50 dark:divide-slate-800/50 px-5 pt-2">
                                {stats.recentActivity.map((event) => (
                                    <div key={event.id} className="py-4 flex gap-4">
                                        <div className="mt-0.5 flex-shrink-0">
                                            {event.type === "payment" ? (
                                                <div className="h-8 w-8 rounded-full bg-emerald-100 flex items-center justify-center text-emerald-600 dark:bg-emerald-900/40 dark:text-emerald-400">
                                                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                                                    </svg>
                                                </div>
                                            ) : event.type === "call" ? (
                                                <div className="h-8 w-8 rounded-full bg-indigo-100 flex items-center justify-center text-indigo-600 dark:bg-indigo-900/40 dark:text-indigo-400">
                                                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
                                                    </svg>
                                                </div>
                                            ) : (
                                                <div className="h-8 w-8 rounded-full bg-slate-100 flex items-center justify-center text-slate-600 dark:bg-slate-800 dark:text-slate-400">
                                                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                                                    </svg>
                                                </div>
                                            )}
                                        </div>
                                        <div className="flex-1 min-w-0">
                                            <p className="text-sm font-medium text-slate-800 dark:text-slate-200">
                                                {event.title} <span className="text-slate-500 font-normal ml-1">по ученику</span>{" "}
                                                <Link href={`/students/${event.studentId}`} className="text-indigo-600 hover:text-indigo-700 dark:text-indigo-400 hover:underline">
                                                    {event.fullName}
                                                </Link>
                                            </p>
                                            {event.detail && (
                                                <p className="mt-1 text-sm text-slate-600 dark:text-slate-300 break-words line-clamp-2">
                                                    {event.detail}
                                                </p>
                                            )}
                                            <p className="mt-1 text-xs text-slate-400 dark:text-slate-500">
                                                {formatDate(event.occurredAt)}
                                            </p>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>
                </section>

                {/* Recent enrollments */}
                <section className="rounded-xl border border-slate-100 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-sm overflow-hidden flex flex-col h-[400px]">
                    <div className="px-5 py-4 border-b border-slate-100 dark:border-slate-800 flex-shrink-0">
                        <h2 className="text-sm font-semibold text-slate-900 dark:text-white">Последние зачисления</h2>
                        <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">10 последних записей</p>
                    </div>

                    <div className="flex-1 overflow-y-auto min-h-0">
                        {stats.recentEnrollments.length === 0 ? (
                            <div className="flex flex-col items-center justify-center py-12 text-center h-full">
                                <p className="text-sm text-slate-500 dark:text-slate-400">Зачислений пока нет</p>
                            </div>
                        ) : (
                            <div className="divide-y divide-slate-50 dark:divide-slate-800/50">
                                {stats.recentEnrollments.map((enr) => (
                                    <div key={enr.enrollmentId} className="flex items-center justify-between px-5 py-3 hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors">
                                        <div className="min-w-0 flex-1">
                                            <div className="flex items-center gap-2">
                                                <Link
                                                    href={`/students/${enr.studentId}`}
                                                    className="text-sm font-medium text-slate-800 dark:text-slate-200 hover:text-indigo-600 dark:hover:text-indigo-400 truncate"
                                                >
                                                    {enr.fullName}
                                                </Link>
                                                {statusBadge(enr.status)}
                                            </div>
                                            <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                                                {enr.grade} · {enr.branchName ?? "—"} · {formatDate(enr.enrolledAt)}
                                            </p>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>
                </section>
            </div>
        </div>
    );
}
