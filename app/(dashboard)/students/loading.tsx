import { LoadingSkeleton } from "@/components/shared/loading-skeleton";

export default function StudentsLoading() {
    return (
        <div className="p-6 md:p-8">
            {/* Header / Search skeleton */}
            <div className="mb-6 flex animate-pulse items-center justify-between gap-4">
                <div className="h-10 w-full max-w-sm rounded-md bg-muted/50" />
                <div className="h-10 w-32 rounded-md bg-muted/50" />
            </div>

            <LoadingSkeleton variant="table" rows={10} />
        </div>
    );
}
