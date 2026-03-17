import { Suspense } from "react";
import { checkPermission } from "@/lib/auth/guard";
import { dashboardService } from "@/lib/services/dashboard.service";
import { RecentPayments } from "@/components/dashboard/recent-payments";
import { OverdueAlerts } from "@/components/dashboard/overdue-alerts";

async function RecentPaymentsSection() {
    const transactions = await dashboardService.getRecentTransactions();
    return <RecentPayments payments={transactions} />;
}

async function OverdueAlertsSection() {
    const overdue = await dashboardService.getOverdueItems();
    return <OverdueAlerts items={overdue} />;
}

function SectionSkeleton() {
    return (
        <div className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm dark:border-slate-800 dark:bg-slate-950 animate-pulse h-96">
            <div className="h-6 w-1/3 bg-slate-200 dark:bg-slate-800 rounded mb-4"></div>
            <div className="space-y-3">
                <div className="h-10 w-full bg-slate-100 dark:bg-slate-900 rounded"></div>
                <div className="h-10 w-full bg-slate-100 dark:bg-slate-900 rounded"></div>
                <div className="h-10 w-full bg-slate-100 dark:bg-slate-900 rounded"></div>
                <div className="h-10 w-full bg-slate-100 dark:bg-slate-900 rounded"></div>
            </div>
        </div>
    );
}

export function BottomGrid({ role }: { role: string }) {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const canViewFinancials = checkPermission(role as any, "payments.read");
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const canViewCollections = checkPermission(role as any, "collections.read");

    return (
        <div className="grid gap-5 md:grid-cols-2 lg:grid-cols-4 mt-6">
            {canViewFinancials && (
                <Suspense fallback={<SectionSkeleton />}>
                    <RecentPaymentsSection />
                </Suspense>
            )}

            {canViewCollections && (
                <Suspense fallback={<SectionSkeleton />}>
                    <OverdueAlertsSection />
                </Suspense>
            )}
        </div>
    );
}
