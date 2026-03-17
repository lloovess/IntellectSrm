import { formatDistanceToNow } from "date-fns";
import { ru } from "date-fns/locale";
import type { ActivityEvent } from "@/lib/db/repositories/student.repo";

const EVENT_DOT: Record<string, string> = {
    payment: "bg-blue-500",
    status: "bg-green-500",
    enrollment: "bg-violet-500",
    note: "bg-slate-400 dark:bg-slate-500",
};

interface ActivityTimelineProps {
    events: ActivityEvent[];
}

export function ActivityTimeline({ events }: ActivityTimelineProps) {
    return (
        <div className="bg-white dark:bg-slate-900 rounded-xl p-6 shadow-sm border border-slate-100 dark:border-slate-800">
            <div className="flex justify-between items-center mb-4">
                <h3 className="text-lg font-bold text-slate-900 dark:text-white">
                    Последние события
                </h3>
            </div>

            {events.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-6 text-slate-400">
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8 mb-2 opacity-30" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                    <p className="text-sm">Нет событий</p>
                </div>
            ) : (
                <div className="relative pl-4 border-l border-slate-200 dark:border-slate-700 space-y-5">
                    {events.map((event) => {
                        const dotColor = EVENT_DOT[event.type] ?? EVENT_DOT.note;
                        return (
                            <div key={event.id} className="relative">
                                {/* Timeline dot */}
                                <div
                                    className={`absolute -left-[21px] top-1 h-3 w-3 rounded-full border-2 border-white dark:border-slate-900 ${dotColor}`}
                                />
                                <div>
                                    <p className="text-sm font-medium text-slate-900 dark:text-white">
                                        {event.title}
                                    </p>
                                    <p className="text-xs text-slate-400 mt-0.5">
                                        {formatDistanceToNow(new Date(event.occurredAt), {
                                            addSuffix: true,
                                            locale: ru,
                                        })}
                                    </p>
                                    {event.detail && (
                                        <p className="mt-1 text-xs text-slate-600 dark:text-slate-400 bg-slate-50 dark:bg-slate-800 p-2 rounded border border-slate-100 dark:border-slate-700">
                                            {event.detail}
                                        </p>
                                    )}
                                </div>
                            </div>
                        );
                    })}
                </div>
            )}
        </div>
    );
}
