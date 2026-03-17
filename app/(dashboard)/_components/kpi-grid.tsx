import { Suspense } from "react";
import { checkPermission } from "@/lib/auth/guard";
import { Banknote, CreditCard, Users, AlertTriangle } from "lucide-react";
import { dashboardService } from "@/lib/services/dashboard.service";
import { KpiCard } from "@/components/dashboard/kpi-card";

// Component that fetches and computes metrics on the server
async function RevenueCard() {
    const revenue = await dashboardService.getRevenueMetric();
    return (
        <KpiCard
            title="Выручка"
            value={fmt(revenue.current)}
            trend={revenue.trend}
            icon={Banknote}
            variant="primary"
        />
    );
}

async function ActiveStudentsCard() {
    const activeStudents = await dashboardService.getActiveStudentsMetric();
    return (
        <KpiCard
            title="Активных учеников"
            value={activeStudents.current.toLocaleString("ru-RU")}
            trend={activeStudents.trend}
            icon={Users}
        />
    );
}

async function DebtCard() {
    const debt = await dashboardService.getDebtMetric();
    return (
        <KpiCard
            title="Общий долг"
            value={fmt(debt.current)}
            trend={debt.trend}
            icon={CreditCard}
            trendInverted
        />
    );
}

async function OverdueCountCard() {
    const overdueCount = await dashboardService.getOverdueCountMetric();
    return (
        <KpiCard
            title="Просрочек"
            value={overdueCount.current.toString()}
            trend={overdueCount.trend}
            icon={AlertTriangle}
            trendInverted
        />
    );
}

function KpiSkeleton() {
    return (
        <div className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm dark:border-slate-800 dark:bg-slate-950 animate-pulse">
            <div className="h-4 w-24 bg-slate-200 dark:bg-slate-800 rounded mb-4"></div>
            <div className="h-8 w-32 bg-slate-200 dark:bg-slate-800 rounded"></div>
        </div>
    );
}

function fmt(n: number) {
    if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(1)}M сом`;
    if (n >= 1_000) return `${(n / 1_000).toFixed(0)}k сом`;
    return `${n.toLocaleString("ru-RU")} сом`;
}

export function KpiGrid({ role }: { role: string }) {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const canViewFinancials = checkPermission(role as any, "payments.read");
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const canViewCollections = checkPermission(role as any, "collections.read");

    return (
        <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
            {canViewFinancials && (
                <Suspense fallback={<KpiSkeleton />}>
                    <RevenueCard />
                </Suspense>
            )}

            <Suspense fallback={<KpiSkeleton />}>
                <ActiveStudentsCard />
            </Suspense>

            {canViewFinancials && (
                <Suspense fallback={<KpiSkeleton />}>
                    <DebtCard />
                </Suspense>
            )}

            {canViewCollections && (
                <Suspense fallback={<KpiSkeleton />}>
                    <OverdueCountCard />
                </Suspense>
            )}
        </div>
    );
}
