import { cn } from "@/lib/utils";
import { Skeleton } from "@/components/ui/skeleton";

interface LoadingSkeletonProps {
    variant?: "table" | "card" | "form" | "list";
    rows?: number;
    className?: string;
}

export function LoadingSkeleton({
    variant = "table",
    rows = 5,
    className,
}: LoadingSkeletonProps) {
    if (variant === "card") {
        return (
            <div className={cn("grid gap-4 md:grid-cols-2 lg:grid-cols-4", className)}>
                {Array.from({ length: 4 }).map((_, i) => (
                    <div key={i} className="rounded-xl border bg-card p-5">
                        <Skeleton className="mb-3 h-4 w-1/2" />
                        <Skeleton className="mb-2 h-8 w-2/3" />
                        <Skeleton className="h-3 w-1/3" />
                    </div>
                ))}
            </div>
        );
    }

    if (variant === "form") {
        return (
            <div className={cn("space-y-6", className)}>
                {Array.from({ length: rows }).map((_, i) => (
                    <div key={i} className="space-y-2">
                        <Skeleton className="h-4 w-24" />
                        <Skeleton className="h-10 w-full" />
                    </div>
                ))}
            </div>
        );
    }

    if (variant === "list") {
        return (
            <div className={cn("space-y-3", className)}>
                {Array.from({ length: rows }).map((_, i) => (
                    <div key={i} className="flex items-center gap-3 rounded-lg border p-4">
                        <Skeleton className="h-10 w-10 rounded-full" />
                        <div className="flex-1 space-y-2">
                            <Skeleton className="h-4 w-2/3" />
                            <Skeleton className="h-3 w-1/3" />
                        </div>
                    </div>
                ))}
            </div>
        );
    }

    // Default: table
    return (
        <div className={cn("rounded-xl border", className)}>
            {/* Header */}
            <div className="flex gap-4 border-b bg-muted/30 px-6 py-3">
                {Array.from({ length: 5 }).map((_, i) => (
                    <Skeleton key={i} className="h-4 flex-1" />
                ))}
            </div>
            {/* Rows */}
            {Array.from({ length: rows }).map((_, i) => (
                <div key={i} className="flex gap-4 border-b px-6 py-4 last:border-0">
                    {Array.from({ length: 5 }).map((_, j) => (
                        <Skeleton key={j} className="h-4 flex-1" />
                    ))}
                </div>
            ))}
        </div>
    );
}
