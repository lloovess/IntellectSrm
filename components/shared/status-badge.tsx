import { cn } from "@/lib/utils";
import { cva, type VariantProps } from "class-variance-authority";

const statusBadgeVariants = cva(
    "inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-semibold transition-colors",
    {
        variants: {
            variant: {
                success: "bg-green-100 text-green-700 border border-green-200",
                warning: "bg-orange-100 text-orange-600 border border-orange-200",
                danger: "bg-red-100 text-red-700 border border-red-200",
                info: "bg-primary/10 text-primary border border-primary/20",
                neutral: "bg-slate-100 text-slate-600 border border-slate-200",
            },
        },
        defaultVariants: {
            variant: "neutral",
        },
    }
);

export interface StatusBadgeProps
    extends React.HTMLAttributes<HTMLSpanElement>,
    VariantProps<typeof statusBadgeVariants> {
    label: string;
}

export function StatusBadge({
    label,
    variant,
    className,
    ...props
}: StatusBadgeProps) {
    return (
        <span className={cn(statusBadgeVariants({ variant }), className)} {...props}>
            {label}
        </span>
    );
}

/** Convenience mapping for common payment statuses */
export const paymentStatusVariant = {
    paid: "success",
    partially_paid: "warning",
    overdue: "danger",
    planned: "neutral",
} as const satisfies Record<string, StatusBadgeProps["variant"]>;

/** Convenience mapping for enrollment statuses */
export const enrollmentStatusVariant = {
    active: "success",
    withdrawal_requested: "warning",
    withdrawn: "danger",
    re_enrolled: "info",
    completed: "neutral",
} as const satisfies Record<string, StatusBadgeProps["variant"]>;

/** Convenience mapping for contract statuses */
export const contractStatusVariant = {
    active: "success",
    completed: "neutral",
    cancelled: "danger",
} as const satisfies Record<string, StatusBadgeProps["variant"]>;
