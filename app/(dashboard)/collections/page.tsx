import { collectionService } from "@/lib/services/collection.service";
import { requireAuth } from "@/lib/auth/session";
import { StatsBar } from "./_components/stats-bar";
import { QueueTable } from "./_components/queue-table";
import { checkPermission } from "@/lib/auth/guard";

export default async function CollectionsPage() {
    const { role } = await requireAuth();
    const { rows, stats } = await collectionService.getCollectionPage(role);
    const canWrite = checkPermission(role, "collections.write");

    return (
        <div className="flex flex-col gap-6 h-full">
            {/* Page Header */}
            <div>
                <h1 className="text-2xl font-bold text-slate-900 dark:text-white flex items-center gap-2">
                    <span className="w-1.5 h-6 rounded-full bg-[#207fdf] inline-block" />
                    Задолженности
                </h1>
                <p className="text-sm text-slate-500 dark:text-slate-400 mt-0.5">
                    Очередь задач колл-центра — просроченные платежи
                </p>
            </div>

            {/* Stats */}
            <StatsBar stats={stats} />

            {/* Queue Table + Detail Panel (client) */}
            <div className="flex-1 min-h-0">
                <QueueTable rows={rows} canWrite={canWrite} />
            </div>
        </div>
    );
}
