"use client";

import { useRouter, useSearchParams, usePathname } from "next/navigation";
import { useCallback } from "react";
import { Input } from "@/components/ui/input";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import { Search, X } from "lucide-react";
import { Button } from "@/components/ui/button";

export function StudentFilters() {
    const router = useRouter();
    const pathname = usePathname();
    const searchParams = useSearchParams();

    const createQueryString = useCallback(
        (updates: Record<string, string | undefined>) => {
            const params = new URLSearchParams(searchParams.toString());
            for (const [key, value] of Object.entries(updates)) {
                if (value) {
                    params.set(key, value);
                } else {
                    params.delete(key);
                }
            }
            // Сбрасываем страницу при изменении фильтров
            if (!("page" in updates)) params.delete("page");
            return params.toString();
        },
        [searchParams]
    );

    const handleSearch = (value: string) => {
        router.push(`${pathname}?${createQueryString({ search: value || undefined })}`);
    };

    const handleStatus = (value: string) => {
        router.push(`${pathname}?${createQueryString({ status: value === "all" ? undefined : value })}`);
    };

    const hasFilters = searchParams.has("search") || searchParams.has("status");

    return (
        <div className="flex flex-wrap items-center gap-3">
            {/* Поиск */}
            <div className="relative flex-1 min-w-[220px]">
                <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                <Input
                    className="pl-9"
                    placeholder="Поиск по ФИО..."
                    defaultValue={searchParams.get("search") ?? ""}
                    onChange={(e) => handleSearch(e.target.value)}
                />
            </div>

            {/* Фильтр по статусу */}
            <Select
                defaultValue={searchParams.get("status") ?? "all"}
                onValueChange={handleStatus}
            >
                <SelectTrigger className="w-[170px]">
                    <SelectValue placeholder="Статус" />
                </SelectTrigger>
                <SelectContent>
                    <SelectItem value="all">Все статусы</SelectItem>
                    <SelectItem value="active">Активные</SelectItem>
                    <SelectItem value="inactive">Неактивные</SelectItem>
                    <SelectItem value="graduated">Выпускники</SelectItem>
                    <SelectItem value="suspended">Приостановленные</SelectItem>
                </SelectContent>
            </Select>

            {/* Сброс фильтров */}
            {hasFilters && (
                <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => router.push(pathname)}
                    className="text-slate-500"
                >
                    <X className="mr-1 h-4 w-4" />
                    Сбросить
                </Button>
            )}
        </div>
    );
}
