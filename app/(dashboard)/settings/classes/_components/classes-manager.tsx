'use client';

import { FormEvent, useState } from "react";
import { createClassAction, updateClassAction, deleteClassAction } from "@/lib/actions/class.actions";

type ClassData = {
    id: string;
    name: string;
    branch_id: string;
    academic_year_id: string;
    academic_year: string;
    capacity: number;
    status: string;
};

type AcademicYearData = {
    id: string;
    name: string;
    status: string;
};

type BranchData = {
    id: string;
    name: string;
};

type Props = {
    initialClasses: ClassData[];
    branches: BranchData[];
    academicYears: AcademicYearData[];
};

export function ClassesManager({ initialClasses, branches, academicYears }: Props) {
    const [classesList, setClassesList] = useState<ClassData[]>(initialClasses);

    // Create form state
    const [newName, setNewName] = useState("");
    const [newBranchId, setNewBranchId] = useState(branches.length > 0 ? branches[0].id : "");
    const [newAcademicYearId, setNewAcademicYearId] = useState(academicYears.length > 0 ? academicYears[0].id : "");
    const [newCapacity, setNewCapacity] = useState<number>(20);

    // Edit form state
    const [editingId, setEditingId] = useState<string | null>(null);
    const [editName, setEditName] = useState("");
    const [editAcademicYearId, setEditAcademicYearId] = useState("");
    const [editCapacity, setEditCapacity] = useState<number>(20);

    // Status state
    const [saving, setSaving] = useState(false);
    const [error, setError] = useState("");
    const [success, setSuccess] = useState("");
    const [deletingId, setDeletingId] = useState<string | null>(null);

    const resetMessages = () => { setError(""); setSuccess(""); };

    const handleCreate = async (event: FormEvent) => {
        event.preventDefault();
        if (!newBranchId) {
            setError("Пожалуйста, выберите филиал");
            return;
        }
        if (!newAcademicYearId) {
            setError("Пожалуйста, выберите учебный год");
            return;
        }
        
        const selectedYear = academicYears.find(y => y.id === newAcademicYearId)?.name || "";
        
        resetMessages();
        setSaving(true);
        const result = await createClassAction({
            name: newName,
            branchId: newBranchId,
            academicYearId: newAcademicYearId,
            academicYear: selectedYear,
            capacity: newCapacity
        });
        setSaving(false);

        if (!result.ok) { setError(result.message); return; }

        const classData = result.data as unknown as ClassData | undefined;
        const newRecord: ClassData = {
            id: classData?.id || "",
            name: newName.trim(),
            branch_id: newBranchId,
            academic_year_id: newAcademicYearId,
            academic_year: selectedYear,
            capacity: newCapacity,
            status: "active"
        };

        setClassesList((prev) => [...prev, newRecord].sort((a, b) => a.name.localeCompare(b.name, "ru")));
        setNewName("");
        setSuccess("Класс успешно создан");
        setTimeout(() => setSuccess(""), 3000);
    };

    const startEdit = (c: ClassData) => {
        setEditingId(c.id);
        setEditName(c.name);
        setEditAcademicYearId(c.academic_year_id);
        setEditCapacity(c.capacity);
        resetMessages();
    };

    const handleSaveEdit = async (id: string, originalBranchId: string) => {
        resetMessages();
        setSaving(true);
        const selectedYear = academicYears.find(y => y.id === editAcademicYearId)?.name || "";
        const result = await updateClassAction(id, { name: editName, academicYearId: editAcademicYearId, academicYear: selectedYear, capacity: editCapacity });
        setSaving(false);
        if (!result.ok) { setError(result.message); return; }
        setClassesList((prev) =>
            prev.map((c) => c.id === id ? { ...c, name: editName.trim(), academic_year_id: editAcademicYearId, academic_year: selectedYear, capacity: editCapacity } : c)
                .sort((a, b) => a.name.localeCompare(b.name, "ru"))
        );
        setEditingId(null);
        setSuccess("Изменения сохранены");
        setTimeout(() => setSuccess(""), 3000);
    };

    const handleDelete = async (id: string) => {
        resetMessages();
        setDeletingId(id);
        const result = await deleteClassAction(id);
        setDeletingId(null);
        if (!result.ok) { setError(result.message); return; }
        setClassesList((prev) => prev.filter((c) => c.id !== id));
        setSuccess("Класс удалён");
        setTimeout(() => setSuccess(""), 3000);
    };

    const getBranchName = (id: string) => branches.find(b => b.id === id)?.name || "Неизвестный филиал";

    // Group classes by branch for better display
    const groupedClasses = classesList.reduce((acc, currentVal) => {
        const branchId = currentVal.branch_id;
        if (!acc[branchId]) acc[branchId] = [];
        acc[branchId].push(currentVal);
        return acc;
    }, {} as Record<string, ClassData[]>);

    return (
        <div className="space-y-6">
            {/* Create form */}
            <form
                onSubmit={handleCreate}
                className="rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-5 space-y-4"
            >
                <h2 className="text-sm font-semibold text-slate-900 dark:text-white">
                    Новый класс
                </h2>

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                    <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 space-y-1.5">
                        <span>Филиал</span>
                        <select
                            value={newBranchId}
                            onChange={(e) => setNewBranchId(e.target.value)}
                            className="w-full rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#207fdf]/50"
                            required
                        >
                            {branches.length === 0 && <option value="" disabled>Нет доступных филиалов</option>}
                            {branches.map(b => <option key={b.id} value={b.id}>{b.name}</option>)}
                        </select>
                    </label>

                    <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 space-y-1.5">
                        <span>Название (Grade)</span>
                        <input
                            value={newName}
                            onChange={(e) => setNewName(e.target.value)}
                            className="w-full rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#207fdf]/50"
                            placeholder="Например: 5А"
                            required
                        />
                    </label>

                    <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 space-y-1.5">
                        <span>Учебный год</span>
                        <select
                            value={newAcademicYearId}
                            onChange={(e) => setNewAcademicYearId(e.target.value)}
                            className="w-full rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#207fdf]/50"
                            required
                        >
                            {academicYears.length === 0 && <option value="" disabled>Нет доступных годов</option>}
                            {academicYears.map(ay => <option key={ay.id} value={ay.id}>{ay.name}</option>)}
                        </select>
                    </label>

                    <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 space-y-1.5">
                        <span>Вместимость</span>
                        <input
                            type="number"
                            min={1}
                            value={newCapacity}
                            onChange={(e) => setNewCapacity(parseInt(e.target.value) || 20)}
                            className="w-full rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#207fdf]/50"
                            required
                        />
                    </label>
                </div>

                <div className="flex items-center justify-end pt-2">
                    <button
                        type="submit"
                        disabled={saving || branches.length === 0 || academicYears.length === 0}
                        className="rounded-lg bg-[#207fdf] px-6 py-2 text-sm font-semibold text-white hover:bg-[#1a6bc4] disabled:opacity-50"
                    >
                        {saving ? "..." : "Создать класс"}
                    </button>
                </div>

                {error ? <p className="text-sm text-red-600 dark:text-red-400">{error}</p> : null}
                {success ? <p className="text-sm text-emerald-600 dark:text-emerald-400">{success}</p> : null}
            </form>

            {/* Classes list grouped by branch */}
            <div className="space-y-6">
                {branches.map(branch => {
                    const branchClasses = groupedClasses[branch.id] || [];
                    if (branchClasses.length === 0) return null;

                    return (
                        <div key={branch.id} className="rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 overflow-hidden">
                            <div className="bg-slate-50 dark:bg-slate-800/50 px-4 py-3 border-b border-slate-200 dark:border-slate-800">
                                <h3 className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-2">
                                    <span className="w-2.5 h-2.5 rounded-full bg-[#207fdf]" />
                                    Филиал: {branch.name}
                                </h3>
                            </div>

                            <ul className="divide-y divide-slate-100 dark:divide-slate-800">
                                {branchClasses.map((c) => (
                                    <li key={c.id} className="px-4 py-3 flex flex-col md:flex-row md:items-center justify-between gap-4">
                                        {editingId === c.id ? (
                                            <div className="grid grid-cols-1 md:grid-cols-3 gap-3 flex-1">
                                                <input
                                                    value={editName}
                                                    onChange={(e) => setEditName(e.target.value)}
                                                    className="rounded-lg border border-[#207fdf] bg-white dark:bg-slate-800 px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-[#207fdf]/50"
                                                    placeholder="Имя"
                                                />
                                                <select
                                                    value={editAcademicYearId}
                                                    onChange={(e) => setEditAcademicYearId(e.target.value)}
                                                    className="rounded-lg border border-[#207fdf] bg-white dark:bg-slate-800 px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-[#207fdf]/50"
                                                    required
                                                >
                                                    {academicYears.map(ay => <option key={ay.id} value={ay.id}>{ay.name}</option>)}
                                                </select>
                                                <input
                                                    type="number"
                                                    value={editCapacity}
                                                    onChange={(e) => setEditCapacity(parseInt(e.target.value) || 20)}
                                                    className="rounded-lg border border-[#207fdf] bg-white dark:bg-slate-800 px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-[#207fdf]/50"
                                                    placeholder="Вместимость"
                                                />
                                            </div>
                                        ) : (
                                            <div className="flex items-center gap-6 flex-1 min-w-0 text-sm">
                                                <div className="font-semibold text-slate-800 dark:text-slate-200 w-24">
                                                    {c.name}
                                                </div>
                                                <div className="text-slate-500 dark:text-slate-400 w-32 flex items-center gap-1.5">
                                                    <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="4" width="18" height="18" rx="2" ry="2"></rect><line x1="16" y1="2" x2="16" y2="6"></line><line x1="8" y1="2" x2="8" y2="6"></line><line x1="3" y1="10" x2="21" y2="10"></line></svg>
                                                    {c.academic_year}
                                                </div>
                                                <div className="bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 px-2 py-0.5 rounded text-xs font-medium">
                                                    Мест: {c.capacity}
                                                </div>
                                            </div>
                                        )}

                                        <div className="flex items-center gap-2 shrink-0">
                                            {editingId === c.id ? (
                                                <>
                                                    <button
                                                        onClick={() => handleSaveEdit(c.id, c.branch_id)}
                                                        disabled={saving}
                                                        className="rounded-lg bg-emerald-600 px-3 py-1.5 text-xs font-semibold text-white hover:bg-emerald-700 disabled:opacity-50"
                                                    >
                                                        {saving ? "..." : "Сохранить"}
                                                    </button>
                                                    <button
                                                        onClick={() => setEditingId(null)}
                                                        className="rounded-lg border border-slate-200 dark:border-slate-700 px-3 py-1.5 text-xs font-semibold text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800"
                                                    >
                                                        Отмена
                                                    </button>
                                                </>
                                            ) : (
                                                <>
                                                    <button
                                                        onClick={() => startEdit(c)}
                                                        className="rounded-lg p-2 text-slate-400 hover:text-[#207fdf] hover:bg-blue-50 dark:hover:bg-blue-900/20 transition-colors"
                                                        title="Редактировать"
                                                    >
                                                        <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                                                            <path strokeLinecap="round" strokeLinejoin="round" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                                                        </svg>
                                                    </button>
                                                    <button
                                                        onClick={() => {
                                                            if (window.confirm(`Удалить класс «${c.name}»?`)) {
                                                                handleDelete(c.id);
                                                            }
                                                        }}
                                                        disabled={deletingId === c.id}
                                                        className="rounded-lg p-2 text-slate-400 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors disabled:opacity-50"
                                                        title="Удалить"
                                                    >
                                                        {deletingId === c.id ? (
                                                            <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 animate-spin" fill="none" viewBox="0 0 24 24">
                                                                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                                                                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                                                            </svg>
                                                        ) : (
                                                            <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                                                                <path strokeLinecap="round" strokeLinejoin="round" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                                                            </svg>
                                                        )}
                                                    </button>
                                                </>
                                            )}
                                        </div>
                                    </li>
                                ))}
                            </ul>
                        </div>
                    )
                })}

                {Object.keys(groupedClasses).length === 0 && (
                    <div className="rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 px-4 py-8 text-center">
                        <p className="text-sm text-slate-500 dark:text-slate-400">Нет добавленных классов.</p>
                    </div>
                )}
            </div>
        </div>
    );
}
