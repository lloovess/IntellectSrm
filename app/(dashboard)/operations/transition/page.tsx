"use client";

import { useState, useTransition, useEffect } from "react";
import { getPromotionPreviewAction, promoteStudentsAction } from "@/lib/actions/transition.actions";
import { MoveRight, Loader2, Info, AlertTriangle, CheckCircle2 } from "lucide-react";
import { useRouter } from "next/navigation";

function getCurrentAcademicYear(): string {
    const now = new Date();
    const year = now.getFullYear();
    return now.getMonth() + 1 >= 9 ? `${year}-${year + 1}` : `${year - 1}-${year}`;
}

export default function TransitionPage() {
    const router = useRouter();
    const [isPending, startTransition] = useTransition();

    const [sourceYear, setSourceYear] = useState(getCurrentAcademicYear());
    const [branchId, setBranchId] = useState("");

    const [branches, setBranches] = useState<{ id: string; name: string }[]>([]);

    // Preview state
    const [previewLoading, setPreviewLoading] = useState(false);
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const [candidates, setCandidates] = useState<any[]>([]);
    const [previewError, setPreviewError] = useState<string | null>(null);
    const [hasLoadedPreview, setHasLoadedPreview] = useState(false);

    // Execution state
    const [execResult, setExecResult] = useState<{ ok: boolean, message: string } | null>(null);

    // Initial load
    useEffect(() => {
        async function loadBranches() {
            try {
                const res = await fetch("/api/branches");
                if (res.ok) {
                    const payload = await res.json();
                    setBranches(payload.data ?? []);
                }
            } catch (err) {
                console.error("Failed to load branches", err);
            }
        }
        loadBranches();
    }, []);

    const handlePreview = () => {
        setPreviewLoading(true);
        setPreviewError(null);
        setExecResult(null);
        setHasLoadedPreview(false);

        startTransition(async () => {
            const result = await getPromotionPreviewAction(sourceYear, branchId || undefined);
            if (result.ok) {
                setCandidates(result.data);
                setHasLoadedPreview(true);
            } else {
                setPreviewError(result.error);
            }
            setPreviewLoading(false);
        });
    };

    const handleExecute = (dryRun: boolean) => {
        startTransition(async () => {
            setExecResult(null);

            // Only send those that have a target class
            const validPromotions = candidates
                .filter(c => c.status === "ready")
                .map(c => ({
                    enrollmentId: c.enrollmentId,
                    studentId: c.studentId,
                    targetClassId: c.proposedClassId,
                    targetGrade: c.proposedGrade,
                    targetYear: c.proposedAcademicYear,
                    branchId: c.branchId
                }));

            if (validPromotions.length === 0) {
                setExecResult({ ok: false, message: "Нет учеников, готовых к переводу." });
                return;
            }

            const result = await promoteStudentsAction(validPromotions, dryRun);

            if (result) {
                setExecResult({
                    ok: result.ok ?? false,
                    message: result.ok ? "Успешно" : (result.error ?? "Ошибка")
                });
                if (!dryRun && result.ok) {
                    // Reload to show they are gone from this year's active list
                    handlePreview();
                    router.refresh();
                }
            } else {
                setExecResult({ ok: false, message: "Неизвестная ошибка." });
            }
        });
    };

    const readyCount = candidates.filter(c => c.status === "ready").length;
    const errorCount = candidates.length - readyCount;
    const overflowCount = candidates.filter(
        (c) =>
            c.status === "ready" &&
            c.targetClassCapacity &&
            c.targetClassCurrentEnrollment >= c.targetClassCapacity
    ).length;

    return (
        <div className="p-6 md:p-8 max-w-7xl mx-auto space-y-6">
            <div>
                <h1 className="text-2xl font-bold text-slate-900 dark:text-white mb-2">
                    Перевод учебного года
                </h1>
                <p className="text-sm text-slate-500 dark:text-slate-400">
                    Массовый перевод всех активных учеников в следующий учебный год и следующий класс.
                </p>
            </div>

            {/* Selection Form */}
            <div className="bg-white dark:bg-slate-900 rounded-xl p-6 shadow-sm border border-slate-100 dark:border-slate-800">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6 items-end">
                    <div>
                        <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
                            Текущий учебный год
                        </label>
                        <input
                            type="text"
                            value={sourceYear}
                            onChange={(e) => setSourceYear(e.target.value)}
                            placeholder="2023-2024"
                            className="w-full rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 px-4 py-2.5 text-sm text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-[#207fdf]"
                        />
                    </div>
                    <div>
                        <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
                            Филиал (Опционально)
                        </label>
                        <select
                            value={branchId}
                            onChange={(e) => setBranchId(e.target.value)}
                            className="w-full rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 px-4 py-2.5 text-sm text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-[#207fdf]"
                        >
                            <option value="">Все филиалы</option>
                            {branches.map(b => (
                                <option key={b.id} value={b.id}>{b.name}</option>
                            ))}
                        </select>
                    </div>
                    <div>
                        <button
                            onClick={handlePreview}
                            disabled={previewLoading || !sourceYear}
                            className="w-full flex items-center justify-center gap-2 rounded-lg bg-slate-900 dark:bg-white px-5 py-2.5 text-sm font-semibold text-white dark:text-slate-900 hover:bg-slate-800 dark:hover:bg-slate-100 transition-colors disabled:opacity-50"
                        >
                            {previewLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : "Анализировать"}
                        </button>
                    </div>
                </div>
            </div>

            {/* Error Message */}
            {previewError && (
                <div className="rounded-xl border border-red-200 bg-red-50 p-4 dark:border-red-900/50 dark:bg-red-900/20">
                    <div className="flex items-center gap-3">
                        <AlertTriangle className="h-5 w-5 text-red-600 dark:text-red-400" />
                        <p className="text-sm font-medium text-red-800 dark:text-red-300">{previewError}</p>
                    </div>
                </div>
            )}

            {/* Execution Result */}
            {execResult && (
                <div className={`rounded-xl border p-4 ${execResult.ok ? 'border-green-200 bg-green-50 dark:border-green-900/50 dark:bg-green-900/20' : 'border-red-200 bg-red-50 dark:border-red-900/50 dark:bg-red-900/20'}`}>
                    <div className="flex items-center gap-3">
                        {execResult.ok ? (
                            <CheckCircle2 className="h-5 w-5 text-green-600 dark:text-green-400" />
                        ) : (
                            <AlertTriangle className="h-5 w-5 text-red-600 dark:text-red-400" />
                        )}
                        <p className={`text-sm font-medium ${execResult.ok ? 'text-green-800 dark:text-green-300' : 'text-red-800 dark:text-red-300'}`}>
                            {execResult.message}
                        </p>
                    </div>
                </div>
            )}

            {/* Capacity Warning */}
            {hasLoadedPreview && overflowCount > 0 && (
                <div className="rounded-xl border border-red-200 bg-red-50 p-4 dark:border-red-900/50 dark:bg-red-900/20">
                    <div className="flex items-start gap-3">
                        <AlertTriangle className="h-5 w-5 text-red-600 dark:text-red-400 flex-shrink-0 mt-0.5" />
                        <div>
                            <p className="text-sm font-medium text-red-800 dark:text-red-300">
                                ⚠️ {overflowCount} класс{overflowCount === 1 ? "" : "ов"} будут переполнены при переводе!
                            </p>
                            <p className="text-xs text-red-700 dark:text-red-400 mt-1">
                                Проверьте вместимость целевых классов перед выполнением перевода.
                            </p>
                        </div>
                    </div>
                </div>
            )}

            {/* Preview Results */}
            {hasLoadedPreview && (
                <div className="bg-white dark:bg-slate-900 rounded-xl shadow-sm border border-slate-100 dark:border-slate-800 overflow-hidden flex flex-col h-[600px]">
                    <div className="px-6 py-4 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between bg-slate-50/50 dark:bg-slate-800/30">
                        <div>
                            <h2 className="text-lg font-bold text-slate-900 dark:text-white">
                                Предпросмотр перевода
                            </h2>
                            <p className="text-sm text-slate-500 mt-1">
                                Найдено учеников: <strong>{candidates.length}</strong>. Готовы к переводу: <strong className="text-green-600">{readyCount}</strong>. Требуют внимания: <strong className="text-amber-600">{errorCount}</strong>.
                            </p>
                        </div>
                        <div className="flex gap-3">
                            <button
                                onClick={() => handleExecute(true)}
                                disabled={isPending || readyCount === 0}
                                className="px-4 py-2 rounded-lg border border-slate-200 dark:border-slate-700 text-sm font-semibold text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors"
                            >
                                Dry Run (Тест)
                            </button>
                            <button
                                onClick={() => {
                                    if (confirm("Вы уверены, что хотите массово перевести учеников? Это действие необратимо.")) {
                                        handleExecute(false);
                                    }
                                }}
                                disabled={isPending || readyCount === 0}
                                className="px-4 py-2 rounded-lg bg-[#207fdf] text-sm font-semibold text-white hover:bg-[#1a6bc4] disabled:opacity-50 transition-colors shadow-sm shadow-blue-500/20"
                            >
                                {isPending ? "Выполнение..." : "Выполнить перевод"}
                            </button>
                        </div>
                    </div>

                    <div className="flex-1 overflow-auto">
                        {candidates.length === 0 ? (
                            <div className="h-full flex flex-col items-center justify-center text-slate-500">
                                <Info className="h-10 w-10 text-slate-300 dark:text-slate-600 mb-3" />
                                <p>Учеников в {sourceYear} не найдено.</p>
                            </div>
                        ) : (
                            <table className="w-full text-left text-sm">
                                <thead className="bg-slate-50 dark:bg-slate-800/50 text-slate-500 dark:text-slate-400 sticky top-0 z-10">
                                    <tr>
                                        <th className="px-6 py-3 font-semibold w-1/3">Ученик</th>
                                        <th className="px-6 py-3 font-semibold w-1/3">Текущий класс</th>
                                        <th className="font-semibold text-center w-8"></th>
                                        <th className="px-6 py-3 font-semibold w-1/3 text-right">Новый класс</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                                    {candidates.map((c) => (
                                        <tr key={c.enrollmentId} className="hover:bg-slate-50/50 dark:hover:bg-slate-800/30 transition-colors group">
                                            <td className="px-6 py-4">
                                                <div className="font-medium text-slate-900 dark:text-white">
                                                    {c.studentName}
                                                </div>
                                            </td>
                                            <td className="px-6 py-4 text-slate-500 dark:text-slate-400">
                                                {c.currentClassName}
                                            </td>
                                            <td className="text-center">
                                                <MoveRight className={`h-4 w-4 mx-auto ${c.status === 'ready' ? 'text-[#207fdf]' : 'text-slate-300 dark:text-slate-600'}`} />
                                            </td>
                                            <td className="px-6 py-4 text-right">
                                                {c.status === "ready" ? (
                                                    <div className="space-y-1">
                                                        <div className="inline-flex items-center gap-2 px-2.5 py-1 rounded-md bg-green-50 dark:bg-green-900/30 text-green-700 dark:text-green-400 font-medium">
                                                            {c.proposedClassName}
                                                        </div>
                                                        {/* Capacity info if available */}
                                                        {c.targetClassCapacity && (
                                                            <div className={`text-xs px-2.5 py-1 rounded-md ${
                                                                c.targetClassCurrentEnrollment >=
                                                                c.targetClassCapacity
                                                                    ? "bg-red-50 dark:bg-red-900/30 text-red-600 dark:text-red-400"
                                                                    : "bg-blue-50 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400"
                                                            }`}>
                                                                {c.targetClassCurrentEnrollment}/
                                                                {c.targetClassCapacity}
                                                                {c.targetClassCurrentEnrollment >=
                                                                c.targetClassCapacity && (
                                                                    <span className="ml-1 font-semibold">
                                                                        (Класс будет переполнен!)
                                                                    </span>
                                                                )}
                                                            </div>
                                                        )}
                                                    </div>
                                                ) : (
                                                    <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-amber-50 dark:bg-amber-900/30 text-amber-700 dark:text-amber-400 text-xs font-semibold">
                                                        <AlertTriangle className="h-3.5 w-3.5" />
                                                        Нет класса {c.proposedClassName} в {c.proposedAcademicYear}
                                                    </div>
                                                )}
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        )}
                    </div>
                </div>
            )}
        </div>
    );
}
