import { cn } from "@/lib/utils";

interface MoneyDisplayProps {
    amount: number;
    className?: string;
    /** Show sign for positive amounts too */
    showSign?: boolean;
    /** Size variant */
    size?: "sm" | "md" | "lg" | "xl";
}

/**
 * Formats a number as KZT currency with space separators.
 * e.g. 1200000 → "1 200 000 сом"
 */
export function formatMoney(amount: number): string {
    const formatted = new Intl.NumberFormat("ru-RU", {
        maximumFractionDigits: 0,
    }).format(Math.abs(amount));

    return `${amount < 0 ? "−" : ""}${formatted} сом`;
}

const sizeClasses = {
    sm: "text-sm",
    md: "text-base",
    lg: "text-lg font-semibold",
    xl: "text-2xl font-bold",
} as const;

export function MoneyDisplay({
    amount,
    className,
    showSign = false,
    size = "md",
}: MoneyDisplayProps) {
    const isNegative = amount < 0;
    const isPositive = amount > 0;

    return (
        <span
            className={cn(
                sizeClasses[size],
                "tabular-nums",
                isNegative && "text-destructive",
                isPositive && showSign && "text-success",
                className
            )}
        >
            {showSign && isPositive && "+"}
            {formatMoney(amount)}
        </span>
    );
}
