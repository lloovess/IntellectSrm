import { cn } from "@/lib/utils";
import { InboxIcon } from "lucide-react";

interface EmptyStateProps {
    icon?: React.ReactNode;
    title: string;
    description?: string;
    children?: React.ReactNode;
    className?: string;
}

export function EmptyState({
    icon,
    title,
    description,
    children,
    className,
}: EmptyStateProps) {
    return (
        <div
            className={cn(
                "flex flex-col items-center justify-center rounded-xl border border-dashed border-border/60 bg-muted/30 px-6 py-16 text-center",
                className
            )}
        >
            <div className="mb-4 rounded-full bg-muted p-3 text-muted-foreground">
                {icon ?? <InboxIcon className="h-6 w-6" />}
            </div>
            <h3 className="text-base font-semibold">{title}</h3>
            {description && (
                <p className="mt-1 max-w-sm text-sm text-muted-foreground">
                    {description}
                </p>
            )}
            {children && <div className="mt-4">{children}</div>}
        </div>
    );
}
