import { redirect } from "next/navigation";
import { requireAuth } from "@/lib/auth/session";
import { studentProfileService } from "@/lib/services/student-profile.service";
import { NewWithdrawalForm } from "./_components/new-withdrawal-form";

interface Props {
    searchParams: Promise<{ studentId?: string }>;
}

export default async function NewWithdrawalPage({ searchParams }: Props) {
    const { role } = await requireAuth();
    if (!["admin", "finance_manager", "accountant", "assistant"].includes(role)) {
        redirect("/login");
    }

    const { studentId } = await searchParams;
    if (!studentId) {
        redirect("/withdrawals");
    }

    const profile = await studentProfileService.getProfile(studentId, role);

    if (!profile || !profile.enrollment) {
        return (
            <div className="p-8 max-w-2xl mx-auto mt-10">
                <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 text-red-600 dark:text-red-400 p-6 rounded-2xl">
                    <h3 className="text-lg font-bold mb-2">Ошибка</h3>
                    <p>Ученик не найден или не имеет активного зачисления. Отчисление невозможно.</p>
                </div>
            </div>
        );
    }

    return (
        <div className="p-6 md:p-8 max-w-2xl mx-auto space-y-6">
            <div>
                <h1 className="text-2xl font-bold text-slate-900 dark:text-white flex items-center gap-2">
                    <span className="w-1.5 h-6 rounded-full bg-rose-500 inline-block" />
                    Оформление выбытия
                </h1>
                <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
                    Ученик: <span className="font-medium text-slate-700 dark:text-slate-300">{profile.fullName}</span> • Класс: {profile.enrollment.grade}
                </p>
            </div>

            <div className="bg-white dark:bg-slate-900 rounded-2xl shadow-sm border border-slate-200 dark:border-slate-800 overflow-hidden">
                <NewWithdrawalForm enrollmentId={profile.enrollment.id} />
            </div>
        </div>
    );
}
