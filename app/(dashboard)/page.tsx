import { requireAuth } from "@/lib/auth/session";
import { KpiGrid } from "./_components/kpi-grid";
import { BottomGrid } from "./_components/bottom-grid";

export default async function DashboardPage() {
    const { role } = await requireAuth();

    return (
        <div className="p-6 md:p-8 space-y-6">
            {/* ── Page header ─────────────────────────────────────── */}
            <div>
                <h2 className="text-2xl font-bold tracking-tight text-slate-900 dark:text-slate-100">
                    Dashboard
                </h2>
                <p className="mt-0.5 text-sm text-slate-500 dark:text-slate-400">
                    Сводка по филиалам и основным показателям
                </p>
            </div>

            {/* ── KPI Grid ────────────────────────────────────────── */}
            <KpiGrid role={role} />

            {/* ── Bottom row: Recent Payments + Overdue Alerts ────── */}
            <BottomGrid role={role} />
        </div>
    );
}
