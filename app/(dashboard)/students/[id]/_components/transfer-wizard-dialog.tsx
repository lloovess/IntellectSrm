"use client";

import { useState, useTransition, useEffect } from "react";
import { transferStudentAction } from "@/lib/actions/transfer.actions";
import { MoveRight } from "lucide-react";
import { useRouter } from "next/navigation";

interface TransferWizardDialogProps {
    studentId: string;
    enrollmentId: string;
    currentGrade: string;
    currentBranch: string;
    onSuccess?: () => void;
}

export function TransferWizardDialog({
    studentId,
    enrollmentId,
    currentGrade,
    currentBranch,
    onSuccess,
}: TransferWizardDialogProps) {
    const router = useRouter();
    const [open, setOpen] = useState(false);
    const [isPending, startTransition] = useTransition();
    const [error, setError] = useState<string | null>(null);

    // Form state
    const [reason, setReason] = useState("");
    const [effectiveDate, setEffectiveDate] = useState(() => {
        const d = new Date();
        return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
    });

    // New enrollment state
    const [branches, setBranches] = useState<{ id: string; name: string }[]>([]);
    const [classes, setClasses] = useState<{ id: string; name: string; branchId: string; academicYear: string }[]>([]);
    const [selectedBranchId, setSelectedBranchId] = useState("");
    const [selectedClassId, setSelectedClassId] = useState("");

    // Load branches and classes on mount
    useEffect(() => {
        if (!open) return;

        async function loadData() {
            try {
                // We'll fetch from API endpoints or server action if available
                // For MVP, we can fetch via direct supabase call in a client component, 
                // but proper way is a server action. 
                // Since this is a wizard, we'll fetch basic data.
                const res = await fetch('/api/branches');
                if (res.ok) {
                    const payload = await res.json();
                    setBranches(payload.data ?? []);
                    if ((payload.data ?? []).length > 0) setSelectedBranchId(payload.data[0].id);
                }

                const clsRes = await fetch('/api/classes');
                if (clsRes.ok) {
                    const clsPayload = await clsRes.json();
                    setClasses(clsPayload.data ?? []);
                }
            } catch (err) {
                console.error("Failed to load generic data", err);
            }
        }

        loadData();
    }, [open]);

    // Filter classes by branch
    const availableClasses = classes.filter(c => c.branchId === selectedBranchId);

    function handleSubmit(e: React.FormEvent) {
        e.preventDefault();
        setError(null);
        startTransition(async () => {
            const result = await transferStudentAction({
                studentId,
                enrollmentId,
                reason,
                effectiveDate,
                newBranchId: selectedBranchId,
                newClassId: selectedClassId,
            });

            if (result.ok) {
                setOpen(false);
                if (onSuccess) onSuccess();
                router.refresh();
            } else {
                setError(result.error);
            }
        });
    }

    return (
        <>
            <button
                onClick={() => setOpen(true)}
                className="flex flex-col items-center justify-center p-4 rounded-xl bg-slate-50 dark:bg-slate-800 hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors group w-full"
            >
                <div className="w-10 h-10 rounded-full bg-white dark:bg-slate-600 shadow-sm flex items-center justify-center mb-2 group-hover:scale-110 transition-transform text-fuchsia-600">
                    <MoveRight className="h-5 w-5" />
                </div>
                <span className="text-xs font-semibold text-slate-700 dark:text-slate-300 text-center">
                    Перевод
                </span>
            </button>

            {open && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm">
                    <div className="w-full max-w-2xl max-h-[90vh] overflow-y-auto mx-4 rounded-2xl bg-white dark:bg-slate-900 shadow-2xl border border-slate-200 dark:border-slate-700">
                        {/* Modal header */}
                        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100 dark:border-slate-800">
                            <h2 className="text-xl font-bold text-slate-900 dark:text-white">Перевод ученика</h2>
                            <button
                                onClick={() => setOpen(false)}
                                className="p-2 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
                            >
                                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                                    <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                                </svg>
                            </button>
                        </div>

                        <form onSubmit={handleSubmit} className="p-6 space-y-6">
                            {error && (
                                <div className="rounded-lg bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 px-4 py-3 text-sm text-red-700 dark:text-red-400">
                                    {error}
                                </div>
                            )}

                            {/* Current context info */}
                            <div className="bg-slate-50 dark:bg-slate-800/50 p-4 rounded-xl border border-slate-200 dark:border-slate-700 flex items-center gap-4">
                                <div className="flex-1">
                                    <p className="text-xs font-semibold text-slate-500 uppercase tracking-widest mb-1">
                                        Текущее зачисление
                                    </p>
                                    <p className="text-sm font-medium text-slate-900 dark:text-white">
                                        {currentGrade} • {currentBranch}
                                    </p>
                                </div>
                                <MoveRight className="text-slate-400 h-5 w-5" />
                                <div className="flex-1 text-right">
                                    <p className="text-xs font-semibold text-[#207fdf] uppercase tracking-widest mb-1">
                                        Новое зачисление
                                    </p>
                                    <p className="text-sm font-medium text-[#207fdf]">
                                        Будет создано
                                    </p>
                                </div>
                            </div>

                            {/* Transfer parameters */}
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                {/* Branch */}
                                <div>
                                    <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
                                        Новый филиал *
                                    </label>
                                    <select
                                        value={selectedBranchId}
                                        onChange={(e) => {
                                            setSelectedBranchId(e.target.value);
                                            setSelectedClassId("");
                                        }}
                                        required
                                        className="w-full rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 px-4 py-2.5 text-sm text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-[#207fdf]"
                                        disabled={branches.length === 0}
                                    >
                                        <option value="" disabled>Выберите филиал...</option>
                                        {branches.map(b => (
                                            <option key={b.id} value={b.id}>{b.name}</option>
                                        ))}
                                    </select>
                                </div>

                                {/* Class */}
                                <div>
                                    <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
                                        Новый класс *
                                    </label>
                                    <select
                                        value={selectedClassId}
                                        onChange={(e) => setSelectedClassId(e.target.value)}
                                        required
                                        className="w-full rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 px-4 py-2.5 text-sm text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-[#207fdf]"
                                        disabled={!selectedBranchId || availableClasses.length === 0}
                                    >
                                        <option value="" disabled>Выберите класс...</option>
                                        {availableClasses.map(c => (
                                            <option key={c.id} value={c.id}>{c.name} ({c.academicYear})</option>
                                        ))}
                                    </select>
                                    {selectedBranchId && availableClasses.length === 0 && (
                                        <p className="mt-1 text-xs text-amber-600">В этом филиале нет классов</p>
                                    )}
                                </div>
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                <div>
                                    <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
                                        С какого числа перевести? *
                                    </label>
                                    <input
                                        type="date"
                                        value={effectiveDate}
                                        onChange={(e) => setEffectiveDate(e.target.value)}
                                        required
                                        className="w-full rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 px-4 py-2.5 text-sm text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-[#207fdf]"
                                    />
                                </div>
                            </div>

                            {/* Reason details */}
                            <div>
                                <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
                                    Причина перевода *
                                </label>
                                <textarea
                                    value={reason}
                                    onChange={(e) => setReason(e.target.value)}
                                    required
                                    rows={3}
                                    placeholder="Смена смены в общеобразовательной школе, переезд и т.д."
                                    className="w-full rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 px-4 py-2.5 text-sm text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-[#207fdf] resize-none"
                                />
                            </div>

                            {/* Actions */}
                            <div className="flex justify-end gap-3 pt-4 border-t border-slate-100 dark:border-slate-800">
                                <button
                                    type="button"
                                    onClick={() => setOpen(false)}
                                    className="px-5 py-2.5 rounded-lg border border-slate-200 dark:border-slate-700 text-sm font-semibold text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors"
                                >
                                    Отмена
                                </button>
                                <button
                                    type="submit"
                                    disabled={isPending || !selectedClassId}
                                    className="px-5 py-2.5 rounded-lg bg-[#207fdf] text-sm font-semibold text-white hover:bg-[#1a6bc4] disabled:opacity-50 disabled:cursor-not-allowed transition-colors shadow-sm shadow-blue-500/20 flex items-center gap-2"
                                >
                                    {isPending ? "Оформление..." : (
                                        <>
                                            Оформить перевод
                                            <MoveRight className="h-4 w-4" />
                                        </>
                                    )}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </>
    );
}
