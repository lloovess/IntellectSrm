import Link from "next/link";
import { Printer, Pencil } from "lucide-react";
import type { StudentProfile } from "@/lib/services/student-profile.service";

const STATUS_STYLES: Record<string, { label: string; classes: string }> = {
    active: { label: "Активен", classes: "bg-green-100 text-green-700 border-green-200 dark:bg-green-900/30 dark:text-green-400 dark:border-green-800" },
    inactive: { label: "Неактивен", classes: "bg-slate-100 text-slate-600 border-slate-200 dark:bg-slate-800 dark:text-slate-400 dark:border-slate-700" },
    graduated: { label: "Выпускник", classes: "bg-blue-100 text-blue-700 border-blue-200 dark:bg-blue-900/30 dark:text-blue-400" },
    suspended: { label: "Отстранён", classes: "bg-red-100 text-red-700 border-red-200 dark:bg-red-900/30 dark:text-red-400" },
};

function avatarColor(name: string) {
    const colors = [
        "bg-blue-500", "bg-violet-500", "bg-emerald-500",
        "bg-amber-500", "bg-rose-500", "bg-indigo-500",
    ];
    return colors[name.charCodeAt(0) % colors.length];
}

function getInitials(name: string) {
    return name.split(" ").slice(0, 2).map((w) => w[0]).join("").toUpperCase();
}

interface ProfileHeaderProps {
    profile: StudentProfile;
    canEdit: boolean;
}

export function ProfileHeader({ profile, canEdit }: ProfileHeaderProps) {
    const status = STATUS_STYLES[profile.status] ?? STATUS_STYLES.inactive;
    const enrollment = profile.enrollment;

    return (
        <div>
            {/* Breadcrumb */}
            <div className="flex items-center gap-2 text-sm font-medium text-slate-500 dark:text-slate-400 mb-6">
                <Link href="/students" className="hover:text-[#207fdf] transition-colors">
                    Ученики
                </Link>
                <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
                </svg>
                <span className="text-slate-900 dark:text-white">{profile.fullName}</span>
            </div>

            {/* Title row */}
            <div className="flex items-end justify-between gap-4 mb-6">
                <div>
                    <h1 className="text-3xl font-bold tracking-tight text-slate-900 dark:text-white">
                        {profile.fullName}
                    </h1>
                    <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
                        #{profile.id.slice(0, 8).toUpperCase()}
                        {enrollment && ` · ${enrollment.grade} класс · ${enrollment.branchName ?? "—"}`}
                    </p>
                </div>
                <div className="hidden sm:flex items-center gap-3 shrink-0">
                    <button className="bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 px-4 py-2 rounded-xl text-sm font-semibold hover:bg-slate-50 dark:hover:bg-slate-700 transition-colors flex items-center gap-2 shadow-sm">
                        <Printer className="h-4 w-4" />
                        Печать
                    </button>
                    {canEdit && (
                        <Link
                            href={`/students/${profile.id}/edit`}
                            className="bg-[#207fdf] text-white px-4 py-2 rounded-xl text-sm font-semibold hover:bg-[#1a6bc4] transition-colors shadow-lg shadow-blue-500/20 flex items-center gap-2"
                        >
                            <Pencil className="h-4 w-4" />
                            Редактировать
                        </Link>
                    )}
                </div>
            </div>

            {/* Main info card */}
            <div className="bg-white dark:bg-slate-900 rounded-xl p-6 shadow-sm border border-slate-100 dark:border-slate-800">
                <div className="flex flex-col md:flex-row gap-6 items-start">
                    {/* Avatar */}
                    <div className="relative shrink-0">
                        <div className={`h-32 w-32 rounded-full flex items-center justify-center text-3xl font-black text-white border-4 border-slate-50 dark:border-slate-700 shadow-inner ${avatarColor(profile.fullName)}`}>
                            {getInitials(profile.fullName)}
                        </div>
                    </div>

                    {/* Info */}
                    <div className="flex-1 w-full">
                        <div className="flex justify-between items-start mb-4">
                            <div>
                                <h2 className="text-xl font-bold text-slate-900 dark:text-white">
                                    {profile.fullName}
                                </h2>
                                {profile.phone && (
                                    <p className="text-slate-500 text-sm mt-0.5">{profile.phone}</p>
                                )}
                            </div>
                            <span className={`px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider border ${status.classes}`}>
                                {status.label}
                            </span>
                        </div>

                        {/* Meta grid */}
                        <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                            <div className="p-3 bg-slate-50 dark:bg-slate-800/50 rounded-lg">
                                <p className="text-xs text-slate-400 uppercase tracking-wide font-semibold mb-1">Класс</p>
                                <p className="text-slate-900 dark:text-white font-medium">{enrollment?.grade ?? "—"}</p>
                            </div>
                            <div className="p-3 bg-slate-50 dark:bg-slate-800/50 rounded-lg">
                                <p className="text-xs text-slate-400 uppercase tracking-wide font-semibold mb-1">Филиал</p>
                                <p className="text-slate-900 dark:text-white font-medium">{enrollment?.branchName ?? "—"}</p>
                            </div>
                            <div className="p-3 bg-slate-50 dark:bg-slate-800/50 rounded-lg">
                                <p className="text-xs text-slate-400 uppercase tracking-wide font-semibold mb-1">Учебный год</p>
                                <p className="text-slate-900 dark:text-white font-medium">{enrollment?.academicYear ?? "—"}</p>
                            </div>
                            {profile.email && (
                                <div className="p-3 bg-slate-50 dark:bg-slate-800/50 rounded-lg sm:col-span-2">
                                    <p className="text-xs text-slate-400 uppercase tracking-wide font-semibold mb-1">Email</p>
                                    <p className="text-slate-900 dark:text-white font-medium">{profile.email}</p>
                                </div>
                            )}
                            <div className="p-3 bg-slate-50 dark:bg-slate-800/50 rounded-lg">
                                <p className="text-xs text-slate-400 uppercase tracking-wide font-semibold mb-1">С нами с</p>
                                <p className="text-slate-900 dark:text-white font-medium">
                                    {new Date(profile.createdAt).toLocaleDateString("ru-RU", { day: "numeric", month: "short", year: "numeric" })}
                                </p>
                            </div>
                        </div>

                        {profile.notes && (
                            <p className="mt-3 text-sm text-slate-500 italic bg-slate-50 dark:bg-slate-800/50 p-3 rounded-lg">
                                &ldquo;{profile.notes}&rdquo;
                            </p>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
}
