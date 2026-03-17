import { createAdminClient } from "@/lib/supabase/server";
import { requireAuth } from "@/lib/auth/session";
import { checkPermission } from "@/lib/auth/guard";
import { BranchesManager } from "./_components/branches-manager";

type Branch = {
  id: string;
  name: string;
};

async function getBranches(): Promise<Branch[]> {
  const admin = await createAdminClient();
  const { data } = await admin.from("branches").select("id, name").order("name");
  return (data ?? []) as Branch[];
}

export default async function BranchesPage() {
  const { role } = await requireAuth();

  if (!checkPermission(role, "students.write")) {
    return (
      <div className="p-6">
        <p className="text-slate-500">Нет доступа к управлению филиалами</p>
      </div>
    );
  }

  const branches = await getBranches();

  return (
    <div className="max-w-4xl p-6 md:p-8 space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-slate-900 dark:text-white">Филиалы</h1>
        <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
          Справочник филиалов для зачислений и импорта
        </p>
      </div>

      <BranchesManager initialBranches={branches} />
    </div>
  );
}
