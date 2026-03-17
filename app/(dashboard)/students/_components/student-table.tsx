"use client";

import Link from "next/link";
import { useState, useTransition } from "react";
import { useRouter, useSearchParams, usePathname } from "next/navigation";
import type { RegistryResult, StudentRow } from "@/lib/db/repositories/student.repo";
import { CreateStudentDialog } from "./create-student-dialog";

// ─── Helpers ─────────────────────────────────────────────────────────────────

function getInitials(name: string) {
    return name.split(" ").slice(0, 2).map((w) => w[0]).join("").toUpperCase();
}

const AVATAR_COLORS = [
    "bg-blue-100 text-blue-700",
    "bg-violet-100 text-violet-700",
    "bg-emerald-100 text-emerald-700",
    "bg-amber-100 text-amber-700",
    "bg-rose-100 text-rose-700",
    "bg-cyan-100 text-cyan-700",
    "bg-orange-100 text-orange-700",
    "bg-indigo-100 text-indigo-700",
];

function avatarColor(name: string) {
    return AVATAR_COLORS[name.charCodeAt(0) % AVATAR_COLORS.length];
}

const GRADES = ["1", "2", "3", "4", "5", "5А", "5Б", "6", "6А", "6Б", "7", "7А", "7Б", "8", "8А", "8Б", "9", "9А", "9Б", "10", "10А", "10Б", "11", "11А", "11Б"];

// ─── Component ───────────────────────────────────────────────────────────────

interface BranchOption {
    id: string;
    name: string;
}

interface StudentTableProps {
    result: RegistryResult;
    search?: string;
    status?: string;
    grade?: string;
    branchId?: string;
    role?: string;
    branches?: BranchOption[];
}

export function StudentTable({ result, status = "", grade = "", branchId = "", role = "", branches: branchOptions = [] }: StudentTableProps) {
    const router = useRouter();
    const pathname = usePathname();
    const searchParams = useSearchParams();
    const [, startTransition] = useTransition();

    const { data, total, page, pageSize } = result;
    const totalPages = Math.max(1, Math.ceil(total / pageSize));
    const from = total === 0 ? 0 : (page - 1) * pageSize + 1;
    const to = Math.min(page * pageSize, total);

    const canCreateStudent = ["assistant", "admin"].includes(role);

    // Status pills
    const STATUS_PILLS = [
        { value: "active", label: "Активный" },
        { value: "suspended", label: "В группе риска" },
        { value: "inactive", label: "На паузе" },
        { value: "graduated", label: "Выбыл" },
    ];

    function setFilter(key: string, value: string) {
        const params = new URLSearchParams(searchParams.toString());
        if (value) params.set(key, value);
        else params.delete(key);
        params.delete("page");
        startTransition(() => router.push(`${pathname}?${params.toString()}`));
    }

    function toggleStatus(val: string) {
        setFilter("status", status === val ? "" : val);
    }

    function goPage(p: number) {
        const params = new URLSearchParams(searchParams.toString());
        params.set("page", String(p));
        startTransition(() => router.push(`${pathname}?${params.toString()}`));
    }

    function resetFilters() {
        setLocalSearch("");
        startTransition(() => router.push(pathname));
    }

    const [localSearch, setLocalSearch] = useState("");
    function submitSearch(e: React.FormEvent) {
        e.preventDefault();
        setFilter("search", localSearch);
    }

    return (
        <div className="p-8 space-y-6">

            {/* ── Header Row ─────────────────────────────────────────────── */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                    <h2 className="text-2xl font-bold tracking-tight">Реестр учеников</h2>
                    <p className="text-slate-500 text-sm">
                        {total > 0
                            ? `Управление ${total.toLocaleString()} учениками во всех филиалах`
                            : "Ученики не найдены"}
                    </p>
                </div>

                <div className="flex items-center gap-3">
                    <button className="flex items-center gap-2 px-4 py-2 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-sm font-semibold hover:bg-slate-50 dark:hover:bg-slate-700 transition-all text-slate-700 dark:text-slate-200 shadow-sm shadow-slate-200/50">
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-[18px] w-[18px]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                            <path strokeLinecap="round" strokeLinejoin="round" d="M4 16v2a2 2 0 002 2h12a2 2 0 002-2v-2M16 12l-4 4m0 0l-4-4m4 4V4" />
                        </svg>
                        Экспорт в Excel
                    </button>

                    {canCreateStudent && <CreateStudentDialog />}
                </div>
            </div>

            {/* ── Quick Filter Bar ───────────────── */}
            <div className="bg-white dark:bg-slate-900 p-4 rounded-xl shadow-sm border border-slate-200 dark:border-slate-800 flex flex-wrap items-center gap-4">

                {/* SEARCH */}
                <form onSubmit={submitSearch} className="flex flex-col gap-1.5 flex-[2] min-w-[250px]">
                    <label className="text-xs font-bold text-slate-400 uppercase tracking-wider">Поиск</label>
                    <div className="relative">
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                            <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                        </svg>
                        <input
                            type="text"
                            placeholder="ФИО, телефон..."
                            value={localSearch}
                            onChange={(e) => setLocalSearch(e.target.value)}
                            className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-sm focus:ring-[#207fdf] focus:border-[#207fdf] pl-9 pr-3 py-2"
                        />
                    </div>
                </form>

                {/* GRADE LEVEL */}
                <div className="flex flex-col gap-1.5 flex-1 min-w-[140px]">
                    <label className="text-xs font-bold text-slate-400 uppercase tracking-wider">Класс</label>
                    <select
                        value={grade}
                        onChange={(e) => setFilter("grade", e.target.value)}
                        className="form-select w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-sm focus:ring-[#207fdf] focus:border-[#207fdf] px-3 py-2"
                    >
                        <option value="">Все классы</option>
                        {GRADES.map((g) => <option key={g} value={g}>{g}</option>)}
                    </select>
                </div>

                {/* BRANCH FILTER */}
                {branchOptions.length > 0 && (
                    <div className="flex flex-col gap-1.5 flex-1 min-w-[160px]">
                        <label className="text-xs font-bold text-slate-400 uppercase tracking-wider">Филиал</label>
                        <select
                            value={branchId}
                            onChange={(e) => setFilter("branch", e.target.value)}
                            className="form-select w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-sm focus:ring-[#207fdf] focus:border-[#207fdf] px-3 py-2"
                        >
                            <option value="">Все филиалы</option>
                            {branchOptions.map((b) => <option key={b.id} value={b.id}>{b.name}</option>)}
                        </select>
                    </div>
                )}

                {/* STATUS */}
                <div className="flex flex-col gap-1.5 flex-[2] min-w-[250px]">
                    <label className="text-xs font-bold text-slate-400 uppercase tracking-wider">Статус</label>
                    <div className="flex items-center gap-2 h-[38px] px-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg overflow-x-auto">
                        {STATUS_PILLS.map(({ value, label }) => (
                            <button
                                key={value}
                                onClick={() => toggleStatus(value)}
                                className={`px-2.5 py-1 text-[11px] font-bold rounded-md whitespace-nowrap transition-all ${status === value
                                    ? "bg-[#207fdf] text-white shadow-sm"
                                    : "bg-transparent text-slate-500 hover:text-slate-700 dark:hover:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700"
                                    }`}
                            >
                                {label}
                            </button>
                        ))}
                    </div>
                </div>

                {/* Reset filter */}
                <div className="flex items-end h-[38px] mt-auto">
                    <button
                        onClick={resetFilters}
                        className="p-2 text-slate-400 hover:text-[#207fdf] hover:bg-blue-50 dark:hover:bg-blue-900/20 rounded-lg transition-colors"
                        title="Сбросить фильтры"
                    >
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-[22px] w-[22px]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                            <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                        </svg>
                    </button>
                </div>
            </div>

            {/* ── Main Data Table ──────────────────────────────────────── */}
            <div className="bg-white dark:bg-slate-900 rounded-xl shadow-sm border border-slate-200 dark:border-slate-800 overflow-hidden">

                {data.length === 0 ? (
                    <div className="flex flex-col items-center justify-center py-24 text-slate-400">
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-14 w-14 mb-4 opacity-20" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z" />
                        </svg>
                        <p className="font-medium">Ученики не найдены</p>
                    </div>
                ) : (
                    <div className="overflow-x-auto">
                        <table className="w-full text-left border-collapse min-w-[800px]">
                            <thead className="bg-slate-50 dark:bg-slate-800/50 border-b border-slate-200 dark:border-slate-800 text-[11px] font-bold text-slate-500 uppercase tracking-widest">
                                <tr>
                                    <th className="px-6 py-4 w-[30%]">Ученик</th>
                                    <th className="px-6 py-4">Класс</th>
                                    <th className="px-6 py-4">Филиал</th>
                                    <th className="px-6 py-4">Контакты</th>
                                    <th className="px-6 py-4">Статус</th>
                                    <th className="px-6 py-4">Учебный год</th>
                                    <th className="px-6 py-4 text-right">Действия</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                                {data.map((student: StudentRow) => {
                                    const initials = getInitials(student.fullName);
                                    const colorCls = avatarColor(student.fullName);
                                    const shortId = `#STU-${student.id.slice(-4).toUpperCase()}`;

                                    // Status badges logic
                                    let statusTrans = { label: "Активный", cls: "bg-emerald-100 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-400" };
                                    if (student.status === "suspended") statusTrans = { label: "Риск", cls: "bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-400" };
                                    if (student.status === "graduated") statusTrans = { label: "Выбыл", cls: "bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400" };
                                    if (student.status === "inactive") statusTrans = { label: "Пауза", cls: "bg-amber-100 dark:bg-amber-900/30 text-amber-700 dark:text-amber-400" };

                                    return (
                                        <tr key={student.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/30 transition-colors group">
                                            {/* STUDENT */}
                                            <td className="px-6 py-4">
                                                <Link href={`/students/${student.id}`} className="flex items-center gap-3 group/name">
                                                    <div className={`w-10 h-10 rounded-full flex items-center justify-center text-sm font-bold shrink-0 border border-slate-200 dark:border-slate-700 ${colorCls}`}>
                                                        {initials}
                                                    </div>
                                                    <div>
                                                        <p className="text-sm font-semibold text-slate-900 dark:text-slate-100 group-hover/name:text-[#207fdf] transition-colors line-clamp-1">
                                                            {student.fullName}
                                                        </p>
                                                        <p className="text-[10px] font-mono text-slate-400">{shortId}</p>
                                                    </div>
                                                </Link>
                                            </td>

                                            {/* GRADE & CLASS */}
                                            <td className="px-6 py-4">
                                                <span className="text-sm text-slate-600 dark:text-slate-400 whitespace-nowrap">
                                                    {student.grade ? `${student.grade} класс` : "—"}
                                                </span>
                                            </td>

                                            {/* BRANCH */}
                                            <td className="px-6 py-4">
                                                <span className="text-sm text-slate-600 dark:text-slate-400 whitespace-nowrap">
                                                    {student.branchName ?? "Не указан"}
                                                </span>
                                            </td>

                                            {/* CONTACTS */}
                                            <td className="px-6 py-4">
                                                <div className="flex items-center gap-2">
                                                    {student.phone ? (
                                                        <span className="text-sm text-slate-600 dark:text-slate-400 whitespace-nowrap">
                                                            {student.phone}
                                                        </span>
                                                    ) : (
                                                        <span className="text-sm text-slate-400">—</span>
                                                    )}
                                                </div>
                                            </td>

                                            {/* STATUS */}
                                            <td className="px-6 py-4">
                                                <span className={`px-2.5 py-1 text-[11px] font-bold rounded-lg whitespace-nowrap ${statusTrans.cls}`}>
                                                    {statusTrans.label}
                                                </span>
                                            </td>

                                            {/* ENROLLED */}
                                            <td className="px-6 py-4 text-sm text-slate-500 whitespace-nowrap">
                                                {student.academicYear ?? "—"}
                                            </td>

                                            {/* ACTIONS */}
                                            <td className="px-6 py-4 text-right">
                                                <div className="flex items-center justify-end gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                                                    <Link
                                                        href={`/students/${student.id}`}
                                                        className="p-2 hover:bg-[#207fdf]/10 hover:text-[#207fdf] rounded-lg transition-all text-slate-400"
                                                        title="Открыть карточку"
                                                    >
                                                        <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                                                            <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                                                            <path strokeLinecap="round" strokeLinejoin="round" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                                                        </svg>
                                                    </Link>
                                                    {canCreateStudent && (
                                                        <Link
                                                            href={`/students/${student.id}/edit`}
                                                            className="p-2 hover:bg-[#207fdf]/10 hover:text-[#207fdf] rounded-lg transition-all text-slate-400"
                                                            title="Редактировать профиль"
                                                        >
                                                            <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                                                                <path strokeLinecap="round" strokeLinejoin="round" d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
                                                            </svg>
                                                        </Link>
                                                    )}
                                                </div>
                                            </td>
                                        </tr>
                                    );
                                })}
                            </tbody>
                        </table>
                    </div>
                )}

                {/* ── Pagination Footer ─────────────────── */}
                {total > 0 && (
                    <div className="px-6 py-4 bg-slate-50 dark:bg-slate-800/50 flex items-center justify-between border-t border-slate-100 dark:border-slate-800">
                        <p className="text-sm text-slate-500">
                            Показаны <span className="font-bold">{from} - {to}</span> из <span className="font-bold">{total.toLocaleString()}</span>
                        </p>

                        {totalPages > 1 && (
                            <div className="flex items-center gap-1.5">
                                <button
                                    onClick={() => goPage(page - 1)}
                                    disabled={page <= 1}
                                    className="p-1.5 border border-slate-200 dark:border-slate-700 rounded-lg hover:bg-white dark:hover:bg-slate-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all shadow-sm"
                                >
                                    <svg xmlns="http://www.w3.org/2000/svg" className="h-[18px] w-[18px]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                                        <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
                                    </svg>
                                </button>

                                <div className="flex items-center gap-1">
                                    {[1, 2, 3].map((p) => p <= totalPages && (
                                        <button
                                            key={p}
                                            onClick={() => goPage(p)}
                                            className={`w-8 h-8 rounded-lg text-xs font-bold transition-all ${page === p
                                                ? "bg-[#207fdf] text-white shadow-sm"
                                                : "hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300"
                                                }`}
                                        >
                                            {p}
                                        </button>
                                    ))}
                                    {totalPages > 4 && <span className="px-1 text-slate-400 text-xs">...</span>}
                                    {totalPages > 3 && (
                                        <button
                                            onClick={() => goPage(totalPages)}
                                            className={`w-8 h-8 rounded-lg text-xs font-bold transition-all ${page === totalPages
                                                ? "bg-[#207fdf] text-white shadow-sm"
                                                : "hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300"
                                                }`}
                                        >
                                            {totalPages}
                                        </button>
                                    )}
                                </div>

                                <button
                                    onClick={() => goPage(page + 1)}
                                    disabled={page >= totalPages}
                                    className="p-1.5 border border-slate-200 dark:border-slate-700 rounded-lg hover:bg-white dark:hover:bg-slate-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all shadow-sm"
                                >
                                    <svg xmlns="http://www.w3.org/2000/svg" className="h-[18px] w-[18px]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                                        <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
                                    </svg>
                                </button>
                            </div>
                        )}
                    </div>
                )}
            </div>
        </div>
    );
}
