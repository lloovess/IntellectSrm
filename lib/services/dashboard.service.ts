import { dashboardRepository, type RecentTransaction, type OverdueItem } from "@/lib/db/repositories/dashboard.repo";
import type { Role } from "@/lib/auth/config";

// ─── Types ───────────────────────────────────────────────────────────────────

export type { RecentTransaction, OverdueItem };

export interface KpiMetric {
    current: number;
    /** Trend placeholder — рассчитывается сравнением с прошлым периодом (Phase 3) */
    trend: number;
}

export interface DashboardSnapshot {
    revenue: KpiMetric;
    debt: KpiMetric;
    activeStudents: KpiMetric;
    overdueCount: KpiMetric;
    recentTransactions: RecentTransaction[];
    overdueItems: OverdueItem[];
}

// ─── Service ─────────────────────────────────────────────────────────────────

export class DashboardService {
    async getRevenueMetric(): Promise<KpiMetric> {
        return { current: await dashboardRepository.getTotalRevenue(), trend: 0 };
    }

    async getDebtMetric(): Promise<KpiMetric> {
        return { current: await dashboardRepository.getTotalDebt(), trend: 0 };
    }

    async getActiveStudentsMetric(): Promise<KpiMetric> {
        return { current: await dashboardRepository.getActiveStudentsCount(), trend: 0 };
    }

    async getOverdueCountMetric(): Promise<KpiMetric> {
        return { current: await dashboardRepository.getOverdueItemsCount(), trend: 0 };
    }

    async getRecentTransactions(): Promise<RecentTransaction[]> {
        return await dashboardRepository.getRecentTransactions(8);
    }

    async getOverdueItems(): Promise<OverdueItem[]> {
        return await dashboardRepository.getOverdueItems(5);
    }

    /**
     * Агрегированный снимок дашборда. (Legacy - to be replaced by Suspense components)
     */
    async getSnapshot(_role: Role): Promise<DashboardSnapshot> {
        const [revenue, debt, activeStudents, overdueCount, recentTransactions, overdueItems] =
            await Promise.all([
                this.getRevenueMetric(),
                this.getDebtMetric(),
                this.getActiveStudentsMetric(),
                this.getOverdueCountMetric(),
                this.getRecentTransactions(),
                this.getOverdueItems(),
            ]);

        return {
            revenue,
            debt,
            activeStudents,
            overdueCount,
            recentTransactions,
            overdueItems,
        };
    }
}

export const dashboardService = new DashboardService();
