import { cn } from "@/lib/utils";
import { LucideIcon, TrendingUp, TrendingDown } from "lucide-react";

interface KpiCardProps {
    title: string;
    /** Отформатированное значение (строка) */
    value: string;
    /** Процент изменения. 0 = нет данных (серый) */
    trend: number;
    icon: LucideIcon;
    /**
     * trendInverted: рост — это ПЛОХО (просрочки, долги).
     * Если true, +trend = красный, -trend = зелёный.
     */
    trendInverted?: boolean;
    /** primary = синяя рамка + мини бар-чарт */
    variant?: "primary" | "default";
    className?: string;
}

const MINI_BARS = [30, 50, 40, 70, 90, 60, 80];

export function KpiCard({
    title,
    value,
    trend,
    icon: Icon,
    trendInverted = false,
    variant = "default",
    className,
}: KpiCardProps) {
    const isPrimary = variant === "primary";
    const hasTrend = trend !== 0;

    // Определяем семантику тренда
    const isGood = hasTrend ? (trendInverted ? trend < 0 : trend > 0) : null;
    const trendColor = !hasTrend
        ? "text-slate-400"
        : isGood
            ? "text-green-600 dark:text-green-400"
            : "text-red-600 dark:text-red-400";
    const trendBg = !hasTrend
        ? "bg-slate-100 dark:bg-slate-800"
        : isGood
            ? "bg-green-50 dark:bg-green-500/10"
            : "bg-red-50 dark:bg-red-500/10";

    const TrendIcon = trend > 0 ? TrendingUp : TrendingDown;

    return (
        <div
            className={cn(
                "relative overflow-hidden rounded-xl border bg-white p-6 shadow-sm dark:bg-slate-900 transition-shadow hover:shadow-md",
                isPrimary
                    ? "border-[#207fdf] border-2 shadow-lg shadow-blue-500/10"
                    : "border-slate-200 dark:border-slate-800",
                className,
            )}
        >
            {/* Floating drag-handle dot (Stitch style) — primary only */}
            {isPrimary && (
                <div className="absolute -left-3 -top-3 flex h-7 w-7 items-center justify-center rounded-full bg-[#207fdf] text-white shadow-md">
                    <Icon className="h-3.5 w-3.5" />
                </div>
            )}

            {/* Header */}
            <div className="mb-4 flex items-start justify-between gap-2">
                <div className="flex-1 min-w-0">
                    <p className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 truncate">
                        {title}
                    </p>
                    <p
                        className={cn(
                            "mt-1.5 text-3xl font-black leading-none",
                            isPrimary ? "text-[#207fdf]" : "text-slate-900 dark:text-slate-100",
                        )}
                    >
                        {value}
                    </p>
                </div>

                {/* Trend badge */}
                <div
                    className={cn(
                        "flex shrink-0 items-center gap-1 rounded-lg px-2 py-1 text-xs font-bold",
                        trendColor,
                        trendBg,
                    )}
                >
                    {hasTrend && <TrendIcon className="h-3 w-3" />}
                    {hasTrend ? `${trend > 0 ? "+" : ""}${trend}%` : "—"}
                </div>
            </div>

            {/* Bottom section */}
            {isPrimary ? (
                /* Mini bar chart (Stitch style) */
                <div className="flex h-14 w-full items-end gap-1 overflow-hidden rounded-lg bg-gradient-to-r from-blue-50 to-blue-100 dark:from-blue-950/30 dark:to-blue-900/20 px-2 pt-2">
                    {MINI_BARS.map((h, i) => (
                        <div
                            key={i}
                            className="w-full rounded-t bg-[#207fdf]/50"
                            style={{ height: `${h}%` }}
                        />
                    ))}
                </div>
            ) : (
                /* Ghost icon bottom-right */
                <div className="absolute bottom-5 right-5 opacity-[0.06]">
                    <Icon className="h-16 w-16 text-slate-900 dark:text-slate-100" />
                </div>
            )}
        </div>
    );
}
