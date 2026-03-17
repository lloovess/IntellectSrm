import { LoadingSkeleton } from "@/components/shared/loading-skeleton";
import { Skeleton } from "@/components/ui/skeleton";

export default function DashboardLoading() {
    return (
        <div className="p-6 md:p-8 space-y-6">
            {/* Page header */}
            <div>
                <Skeleton className="h-8 w-48 mb-2" />
                <Skeleton className="h-4 w-64" />
            </div>

            {/* KPI Grid */}
            <LoadingSkeleton variant="card" className="grid-cols-1 md:grid-cols-2 lg:grid-cols-4" />

            {/* Bottom Grid */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <div className="rounded-xl border bg-card p-6 space-y-4">
                    <Skeleton className="h-5 w-48 mb-4" />
                    <LoadingSkeleton variant="list" rows={4} />
                </div>
                <div className="rounded-xl border bg-card p-6 space-y-4">
                    <Skeleton className="h-5 w-48 mb-4" />
                    <LoadingSkeleton variant="list" rows={4} />
                </div>
            </div>
        </div>
    );
}
