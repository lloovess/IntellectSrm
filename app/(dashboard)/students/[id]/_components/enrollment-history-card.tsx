import type { StudentProfile } from "@/lib/services/student-profile.service";

const ENROLLMENT_STATUS: Record<string, { label: string; classes: string }> = {
    active: { label: "Активен", classes: "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400" },
    paused: { label: "Пауза", classes: "bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400" },
    dropped: { label: "Выбыл", classes: "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400" },
    graduated: { label: "Выпускник", classes: "bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400" },
};

interface EnrollmentHistoryCardProps {
    profile: StudentProfile;
}

export function EnrollmentHistoryCard({ profile }: EnrollmentHistoryCardProps) {
    const history = profile.enrollmentHistory;

    return (
        <div className="bg-white dark:bg-slate-900 rounded-xl p-6 shadow-sm border border-slate-100 dark:border-slate-800">
            <h3 className="text-lg font-bold text-slate-900 dark:text-white mb-4">
                История зачислений
            </h3>

            {history.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-8 text-slate-400">
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8 mb-2 opacity-30" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                    </svg>
                    <p className="text-sm">Нет записей о зачислении</p>
                </div>
            ) : (
                <div className="overflow-x-auto">
                    <table className="w-full text-sm text-left">
                        <thead className="text-xs text-slate-500 uppercase bg-slate-50 dark:bg-slate-800/50 border-y border-slate-200 dark:border-slate-700">
                            <tr>
                                <th className="px-4 py-3 font-semibold">Учебный год</th>
                                <th className="px-4 py-3 font-semibold">Класс</th>
                                <th className="px-4 py-3 font-semibold">Филиал</th>
                                <th className="px-4 py-3 font-semibold text-right">Статус</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                            {history.map((e) => {
                                const s = ENROLLMENT_STATUS[e.status] ?? ENROLLMENT_STATUS.active;
                                return (
                                    <tr key={e.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/30 transition-colors">
                                        <td className="px-4 py-3 text-slate-900 dark:text-white font-medium">
                                            {e.academicYear ?? "—"}
                                        </td>
                                        <td className="px-4 py-3 text-slate-600 dark:text-slate-300">
                                            {e.grade}
                                        </td>
                                        <td className="px-4 py-3 text-slate-600 dark:text-slate-300">
                                            {e.branchName ?? "—"}
                                        </td>
                                        <td className="px-4 py-3 text-right">
                                            <span className={`px-2.5 py-1 rounded-full text-xs font-semibold ${s.classes}`}>
                                                {s.label}
                                            </span>
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
}
