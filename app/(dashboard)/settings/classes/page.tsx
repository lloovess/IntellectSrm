import { createAdminClient } from "@/lib/supabase/server";
import { requireAuth } from "@/lib/auth/session";
import { checkPermission } from "@/lib/auth/guard";
import { ClassesManager } from "./_components/classes-manager";

type ClassData = {
    id: string;
    name: string;
    branch_id: string;
    academic_year: string;
    capacity: number;
    status: string;
};

type BranchData = {
    id: string;
    name: string;
};

async function getClassesAndBranches(): Promise<{ classes: ClassData[]; branches: BranchData[] }> {
    const admin = await createAdminClient();
    const [classesRes, branchesRes] = await Promise.all([
        admin.from("classes").select("id, name, branch_id, academic_year, capacity, status").order("name"),
        admin.from("branches").select("id, name").order("name")
    ]);

    return {
        classes: (classesRes.data ?? []) as ClassData[],
        branches: (branchesRes.data ?? []) as BranchData[],
    };
}

export default async function ClassesPage() {
    const { role } = await requireAuth();

    if (!checkPermission(role, "classes.read")) {
        return (
            <div className="p-6">
                <p className="text-slate-500">Нет доступа к управлению классами</p>
            </div>
        );
    }

    const { classes, branches } = await getClassesAndBranches();

    return (
        <div className="max-w-5xl p-6 md:p-8 space-y-6">
            <div>
                <h1 className="text-2xl font-bold text-slate-900 dark:text-white">Классы</h1>
                <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
                    Управление классами (группами) для зачисления учеников
                </p>
            </div>

            <ClassesManager initialClasses={classes} branches={branches} />
        </div>
    );
}
