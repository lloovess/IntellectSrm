import { redirect } from "next/navigation";
import { requireAuth } from "@/lib/auth/session";
import { studentService } from "@/lib/services/student.service";
import { AssistantDashboard } from "./_components/assistant-dashboard";

export default async function AssistantWorkspacePage() {
  const { role } = await requireAuth();
  if (!["assistant", "admin"].includes(role)) {
    redirect("/");
  }

  const stats = await studentService.getAssistantStats().catch(() => ({
    totalStudents: 0,
    activeEnrollments: 0,
    studentsWithoutContract: 0,
    contractsThisMonth: 0,
    studentsWithoutContractList: [],
    recentEnrollments: [],
    overduePayments: [],
    recentActivity: [],
    totalDebtAmount: 0,
  }));

  return (
    <div>
      {/* Page header */}
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-slate-900 dark:text-white tracking-tight">
          Рабочее место: Ассистент директора
        </h1>
        <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
          Регистрация учеников, зачисление и оформление договоров
        </p>
      </div>

      <AssistantDashboard stats={stats} />
    </div>
  );
}
