import { createAdminClient } from "@/lib/supabase/server";
import { requireAuth } from "@/lib/auth";
import { ImportTabs } from "./_components/import-tabs";

async function getBranches() {
    const admin = await createAdminClient();
    const { data } = await admin.from("branches").select("id, name").order("name");
    return (data ?? []) as Array<{ id: string; name: string }>;
}


function getCurrentAcademicYear(): string {
    const now = new Date();
    const year = now.getFullYear();
    const month = now.getMonth() + 1;
    // Academic year starts in September
    return month >= 9 ? `${year}-${year + 1}` : `${year - 1}-${year}`;
}

export default async function ImportExportPage() {
    await requireAuth();
    const branches = await getBranches();
    const defaultAcademicYear = getCurrentAcademicYear();

    return (
        <div className="space-y-6">
            {/* Header */}
            <div>
                <h1 className="text-2xl font-bold text-slate-900 dark:text-white flex items-center gap-2">
                    <span className="w-1.5 h-6 rounded-full bg-[#207fdf] inline-block" />
                    Импорт данных
                </h1>
                <p className="text-sm text-slate-500 dark:text-slate-400 mt-0.5">
                    Импорт учеников из таблиц или PDF договоров
                </p>
            </div>

            <ImportTabs
                branches={branches}
                defaultAcademicYear={defaultAcademicYear}
            />
        </div>
    );
}
