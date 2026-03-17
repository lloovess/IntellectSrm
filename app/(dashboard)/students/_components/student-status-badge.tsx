import { cn } from "@/lib/utils";

const STATUS_MAP: Record<string, { label: string; className: string }> = {
    active: { label: "Активный", className: "bg-green-50 text-green-700 ring-green-600/20" },
    inactive: { label: "Неактивный", className: "bg-slate-50 text-slate-600 ring-slate-500/20" },
    graduated: { label: "Выпускник", className: "bg-blue-50 text-blue-700 ring-blue-700/20" },
    suspended: { label: "Приостановлен", className: "bg-amber-50 text-amber-700 ring-amber-600/20" },
};

interface StudentStatusBadgeProps {
    status: string;
    className?: string;
}

export function StudentStatusBadge({ status, className }: StudentStatusBadgeProps) {
    const config = STATUS_MAP[status] ?? { label: status, className: "bg-slate-50 text-slate-600 ring-slate-500/20" };
    return (
        <span
            className={cn(
                "inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ring-1 ring-inset",
                config.className,
                className
            )}
        >
            {config.label}
        </span>
    );
}
