import type { StudentProfile } from "@/lib/services/student-profile.service";
import { Phone, User } from "lucide-react";

interface ContactsCardProps {
    profile: StudentProfile;
}

export function ContactsCard({ profile }: ContactsCardProps) {
    const hasStudentContact = profile.phone || profile.email;
    const hasGuardians = profile.guardians && profile.guardians.length > 0;
    const hasContact = hasStudentContact || hasGuardians;

    return (
        <div className="bg-white dark:bg-slate-900 rounded-xl p-6 shadow-sm border border-slate-100 dark:border-slate-800">
            <div className="flex justify-between items-center mb-4">
                <h3 className="text-lg font-bold text-slate-900 dark:text-white">
                    Контакты и родители
                </h3>
            </div>

            <div className="space-y-3">
                {/* Student contacts */}
                {hasStudentContact && (
                    <div className="flex items-start gap-4 p-4 rounded-xl border border-slate-100 dark:border-slate-700 bg-slate-50/50 dark:bg-slate-800/30">
                        <div className="h-10 w-10 rounded-full bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 flex items-center justify-center shrink-0">
                            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                                <path strokeLinecap="round" strokeLinejoin="round" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                            </svg>
                        </div>
                        <div className="flex-1 min-w-0">
                            <p className="text-sm font-bold text-slate-900 dark:text-white">
                                {profile.fullName}
                                <span className="ml-2 text-xs font-normal text-slate-500 bg-white dark:bg-slate-700 px-2 py-0.5 rounded border border-slate-200 dark:border-slate-600">
                                    Ученик
                                </span>
                            </p>
                            <div className="mt-2 space-y-1">
                                {profile.phone && (
                                    <div className="flex items-center gap-2 text-sm text-slate-600 dark:text-slate-300">
                                        <Phone className="h-4 w-4 text-slate-400 shrink-0" />
                                        {profile.phone}
                                    </div>
                                )}
                                {profile.email && (
                                    <div className="flex items-center gap-2 text-sm text-slate-600 dark:text-slate-300">
                                        <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 text-slate-400 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                                            <path strokeLinecap="round" strokeLinejoin="round" d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                                        </svg>
                                        {profile.email}
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>
                )}

                {/* Guardians contacts */}
                {profile.guardians?.map((guardian) => (
                    <div key={guardian.id} className="flex items-start gap-4 p-4 rounded-xl border border-slate-100 dark:border-slate-700 bg-white dark:bg-slate-800">
                        <div className="h-10 w-10 rounded-full bg-emerald-100 dark:bg-emerald-900/30 text-emerald-600 dark:text-emerald-400 flex items-center justify-center shrink-0">
                            <User className="h-5 w-5" />
                        </div>
                        <div className="flex-1 min-w-0">
                            <p className="text-sm font-bold text-slate-900 dark:text-white">
                                {guardian.fullName}
                                <span className="ml-2 text-xs font-normal text-slate-500 bg-slate-50 dark:bg-slate-700/50 px-2 py-0.5 rounded border border-slate-200 dark:border-slate-600">
                                    {guardian.relationship || "Родитель/Опекун"}
                                </span>
                            </p>
                            <div className="mt-2 space-y-1">
                                {guardian.phone && (
                                    <div className="flex items-center gap-2 text-sm text-slate-600 dark:text-slate-300">
                                        <Phone className="h-4 w-4 text-slate-400 shrink-0" />
                                        {guardian.phone}
                                    </div>
                                )}
                                {guardian.email && (
                                    <div className="flex items-center gap-2 text-sm text-slate-600 dark:text-slate-300">
                                        <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 text-slate-400 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                                            <path strokeLinecap="round" strokeLinejoin="round" d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                                        </svg>
                                        {guardian.email}
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>
                ))}

                {/* Empty state */}
                {!hasContact && (
                    <div className="flex flex-col items-center justify-center py-8 text-slate-400">
                        <Phone className="h-8 w-8 mb-2 opacity-30" />
                        <p className="text-sm">Контактная информация не указана</p>
                    </div>
                )}
            </div>
        </div>
    );
}
