import { LoadingSkeleton } from "@/components/shared/loading-skeleton";
import { Skeleton } from "@/components/ui/skeleton";

export default function StudentProfileLoading() {
    return (
        <div className="p-6 md:p-8 max-w-7xl mx-auto space-y-6">
            {/* Header Card skeleton */}
            <div className="rounded-xl border bg-card p-6 flex items-start justify-between">
                <div className="flex items-center gap-4">
                    <Skeleton className="h-16 w-16 rounded-full" />
                    <div className="space-y-2">
                        <Skeleton className="h-6 w-48" />
                        <Skeleton className="h-4 w-32" />
                    </div>
                </div>
                <Skeleton className="h-9 w-24" />
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* Left column (2/3) */}
                <div className="lg:col-span-2 space-y-6">
                    {/* Contacts skeleton */}
                    <div className="rounded-xl border bg-card p-6 space-y-4">
                        <Skeleton className="h-5 w-32 mb-4" />
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <Skeleton className="h-12 w-full" />
                            <Skeleton className="h-12 w-full" />
                        </div>
                        <LoadingSkeleton variant="list" rows={1} />
                    </div>

                    {/* Enrollment History skeleton */}
                    <div className="rounded-xl border bg-card p-6 space-y-4">
                        <Skeleton className="h-5 w-48 mb-4" />
                        <LoadingSkeleton variant="table" rows={2} />
                    </div>
                </div>

                {/* Right column (1/3) */}
                <div className="lg:col-span-1 space-y-6">
                    {/* Financial Overview skeleton */}
                    <div className="rounded-xl border bg-card p-6 space-y-4">
                        <Skeleton className="h-5 w-40 mb-4" />
                        <Skeleton className="h-24 w-full" />
                    </div>

                    {/* Quick Actions skeleton */}
                    <div className="rounded-xl border bg-card p-6 space-y-4">
                        <Skeleton className="h-5 w-32 mb-4" />
                        <div className="space-y-2">
                            <Skeleton className="h-10 w-full" />
                            <Skeleton className="h-10 w-full" />
                            <Skeleton className="h-10 w-full" />
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
