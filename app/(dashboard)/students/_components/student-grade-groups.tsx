"use client";

import { useState } from "react";
import Link from "next/link";
import type { GradeGroup, StudentRow } from "@/lib/db/repositories/student.repo";
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

// ─── Component ───────────────────────────────────────────────────────────────

interface StudentGradeGroupsProps {
    groups: GradeGroup[];
}

export function StudentGradeGroups({ groups }: StudentGradeGroupsProps) {
    const [openGrades, setOpenGrades] = useState<Set<string>>(
        new Set(groups.map((g) => g.grade))
    );

    function toggleGrade(grade: string) {
        setOpenGrades((prev) => {
            const next = new Set(prev);
            next.has(grade) ? next.delete(grade) : next.add(grade);
            return next;
        });
    }

    const totalStudents = groups.reduce((acc, g) => acc + g.students.length, 0);

    return (
        <div className="p-8 space-y-6">

            {/* ── Header Row (same as StudentTable) ───────────────────── */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                    <h2 className="text-2xl font-bold tracking-tight">Students Registry</h2>
                    <p className="text-slate-500 text-sm">
                        Managing {totalStudents} enrolled students across all branches
                    </p>
                </div>
                <div className="flex items-center gap-3">
                    <CreateStudentDialog />
                </div>
            </div>

            {/* ── Groups ──────────────────────────────────────────────── */}
            {groups.length === 0 ? (
                <div className="bg-white dark:bg-slate-900 rounded-xl shadow-sm border border-slate-200 dark:border-slate-800">
                    <div className="flex flex-col items-center justify-center py-24 text-slate-400">
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-14 w-14 mb-4 opacity-20" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z" />
                        </svg>
                        <p className="font-medium">No students found</p>
                    </div>
                </div>
            ) : (
                <div className="space-y-4">
                    {groups.map(({ grade, students }) => {
                        const isOpen = openGrades.has(grade);
                        return (
                            <div
                                key={grade}
                                className="bg-white dark:bg-slate-900 rounded-xl shadow-sm border border-slate-200 dark:border-slate-800 overflow-hidden"
                            >
                                {/* Group header */}
                                <button
                                    onClick={() => toggleGrade(grade)}
                                    className="w-full flex items-center justify-between px-6 py-4 hover:bg-slate-50 dark:hover:bg-slate-800/30 transition-colors"
                                >
                                    <div className="flex items-center gap-3">
                                        {/* Icon */}
                                        <div className="w-9 h-9 rounded-lg bg-[#207fdf]/10 flex items-center justify-center shrink-0">
                                            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-[#207fdf]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                                                <path strokeLinecap="round" strokeLinejoin="round" d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z" />
                                            </svg>
                                        </div>
                                        <div className="text-left">
                                            <p className="text-sm font-semibold text-slate-900 dark:text-slate-100">
                                                Grade {grade}
                                            </p>
                                            <p className="text-xs text-slate-400">{students.length} students</p>
                                        </div>
                                    </div>

                                    <div className="flex items-center gap-3">
                                        <span className="px-2.5 py-0.5 bg-[#207fdf]/10 text-[#207fdf] text-xs font-bold rounded-full">
                                            {students.length}
                                        </span>
                                        <svg
                                            xmlns="http://www.w3.org/2000/svg"
                                            className={`h-4 w-4 text-slate-400 transition-transform duration-200 ${isOpen ? "rotate-180" : ""}`}
                                            fill="none"
                                            viewBox="0 0 24 24"
                                            stroke="currentColor"
                                            strokeWidth={2}
                                        >
                                            <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
                                        </svg>
                                    </div>
                                </button>

                                {/* Students table (same style as StudentTable) */}
                                {isOpen && (
                                    <div className="border-t border-slate-100 dark:border-slate-800">
                                        <table className="w-full text-left border-collapse">
                                            <thead className="bg-slate-50 dark:bg-slate-800/50 text-xs font-bold text-slate-400 uppercase tracking-widest">
                                                <tr>
                                                    <th className="px-6 py-3.5">Student</th>
                                                    <th className="px-6 py-3.5">Parent/Guardian</th>
                                                    <th className="px-6 py-3.5">Branch</th>
                                                    <th className="px-6 py-3.5 text-center">Actions</th>
                                                </tr>
                                            </thead>
                                            <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                                                {students.map((student: StudentRow) => {
                                                    const initials = getInitials(student.fullName);
                                                    const colorCls = avatarColor(student.fullName);
                                                    const shortId = `#${student.id.slice(-7, -4).toUpperCase()}-${student.id.slice(-4).toUpperCase()}`;

                                                    return (
                                                        <tr
                                                            key={student.id}
                                                            className="hover:bg-slate-50 dark:hover:bg-slate-800/30 transition-colors group"
                                                        >
                                                            {/* STUDENT */}
                                                            <td className="px-6 py-4">
                                                                <div className="flex items-center gap-3">
                                                                    <div className={`w-10 h-10 rounded-full flex items-center justify-center text-sm font-bold shrink-0 border border-slate-200 dark:border-slate-700 ${colorCls}`}>
                                                                        {initials}
                                                                    </div>
                                                                    <div>
                                                                        <p className="text-sm font-semibold text-slate-900 dark:text-slate-100">
                                                                            {student.fullName}
                                                                        </p>
                                                                        <p className="text-[10px] font-mono text-slate-400">{shortId}</p>
                                                                    </div>
                                                                </div>
                                                            </td>

                                                            {/* PARENT / GUARDIAN — phone */}
                                                            <td className="px-6 py-4">
                                                                <div className="flex items-center gap-2">
                                                                    <span className="text-sm text-slate-600 dark:text-slate-400">
                                                                        {student.phone ?? "—"}
                                                                    </span>
                                                                    {student.phone && (
                                                                        <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 text-slate-300" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                                                                            <path strokeLinecap="round" strokeLinejoin="round" d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.948V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
                                                                        </svg>
                                                                    )}
                                                                </div>
                                                            </td>

                                                            {/* BRANCH */}
                                                            <td className="px-6 py-4">
                                                                <span className="text-sm text-slate-600 dark:text-slate-400">
                                                                    {student.branchName ?? "—"}
                                                                </span>
                                                            </td>

                                                            {/* ACTIONS */}
                                                            <td className="px-6 py-4">
                                                                <div className="flex items-center justify-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                                                                    <Link
                                                                        href={`/students/${student.id}`}
                                                                        aria-label="Открыть карточку ученика"
                                                                        className="p-1.5 hover:bg-[#207fdf]/10 hover:text-[#207fdf] rounded-md transition-all"
                                                                    >
                                                                        <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                                                                            <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                                                                            <path strokeLinecap="round" strokeLinejoin="round" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                                                                        </svg>
                                                                    </Link>
                                                                    <Link
                                                                        href={`/students/${student.id}/edit`}
                                                                        aria-label="Редактировать ученика"
                                                                        className="p-1.5 hover:bg-[#207fdf]/10 hover:text-[#207fdf] rounded-md transition-all"
                                                                    >
                                                                        <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                                                                            <path strokeLinecap="round" strokeLinejoin="round" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                                                                        </svg>
                                                                    </Link>
                                                                </div>
                                                            </td>
                                                        </tr>
                                                    );
                                                })}
                                            </tbody>
                                        </table>
                                    </div>
                                )}
                            </div>
                        );
                    })}
                </div>
            )}
        </div>
    );
}
