'use client';

import { FormEvent, useState } from "react";
import { createBranchAction, updateBranchAction, deleteBranchAction } from "@/lib/actions/branch.actions";

type Branch = {
  id: string;
  name: string;
};

type Props = {
  initialBranches: Branch[];
};

export function BranchesManager({ initialBranches }: Props) {
  const [branches, setBranches] = useState<Branch[]>(initialBranches);
  const [name, setName] = useState("");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editingName, setEditingName] = useState("");
  const [deletingId, setDeletingId] = useState<string | null>(null);

  const resetMessages = () => { setError(""); setSuccess(""); };

  const handleCreate = async (event: FormEvent) => {
    event.preventDefault();
    resetMessages();
    setSaving(true);
    const result = await createBranchAction(name);
    setSaving(false);
    if (!result.ok) { setError(result.error); return; }
    setBranches((prev) => [...prev, result.data].sort((a, b) => a.name.localeCompare(b.name, "ru")));
    setName("");
    setSuccess("Филиал создан");
    setTimeout(() => setSuccess(""), 3000);
  };

  const handleEdit = (branch: Branch) => {
    setEditingId(branch.id);
    setEditingName(branch.name);
    resetMessages();
  };

  const handleSaveEdit = async (id: string) => {
    resetMessages();
    setSaving(true);
    const result = await updateBranchAction(id, editingName);
    setSaving(false);
    if (!result.ok) { setError(result.error); return; }
    setBranches((prev) =>
      prev.map((b) => b.id === id ? { ...b, name: editingName.trim() } : b)
        .sort((a, b) => a.name.localeCompare(b.name, "ru"))
    );
    setEditingId(null);
    setSuccess("Изменения сохранены");
    setTimeout(() => setSuccess(""), 3000);
  };

  const handleDelete = async (id: string) => {
    resetMessages();
    setDeletingId(id);
    const result = await deleteBranchAction(id);
    setDeletingId(null);
    if (!result.ok) { setError(result.error); return; }
    setBranches((prev) => prev.filter((b) => b.id !== id));
    setSuccess("Филиал удалён");
    setTimeout(() => setSuccess(""), 3000);
  };

  return (
    <div className="space-y-5">
      {/* Create form */}
      <form
        onSubmit={handleCreate}
        className="rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-5"
      >
        <label className="block text-sm font-medium text-slate-700 dark:text-slate-300">
          Новый филиал
          <div className="mt-2 flex items-center gap-2">
            <input
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#207fdf]/50"
              placeholder="Например: Интеллект Центр"
              required
            />
            <button
              type="submit"
              disabled={saving}
              className="rounded-lg bg-[#207fdf] px-4 py-2 text-sm font-semibold text-white hover:bg-[#1a6bc4] disabled:opacity-50 whitespace-nowrap"
            >
              {saving ? "..." : "Добавить"}
            </button>
          </div>
        </label>
        {error ? <p className="mt-2 text-sm text-red-600 dark:text-red-400">{error}</p> : null}
        {success ? <p className="mt-2 text-sm text-emerald-600 dark:text-emerald-400">{success}</p> : null}
      </form>

      {/* Branches list */}
      <div className="rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 overflow-hidden">
        <div className="px-4 py-3 border-b border-slate-100 dark:border-slate-800">
          <h2 className="text-sm font-semibold text-slate-900 dark:text-white">
            Список филиалов ({branches.length})
          </h2>
        </div>

        {branches.length === 0 ? (
          <div className="px-4 py-8 text-center">
            <p className="text-sm text-slate-500 dark:text-slate-400">Пока нет филиалов. Добавьте первый выше.</p>
          </div>
        ) : (
          <ul className="divide-y divide-slate-100 dark:divide-slate-800">
            {branches.map((branch) => (
              <li key={branch.id} className="px-4 py-3 flex items-center justify-between gap-2">
                {editingId === branch.id ? (
                  <div className="flex items-center gap-2 flex-1">
                    <input
                      value={editingName}
                      onChange={(e) => setEditingName(e.target.value)}
                      className="flex-1 rounded-lg border border-[#207fdf] bg-white dark:bg-slate-800 px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-[#207fdf]/50"
                      autoFocus
                      onKeyDown={(e) => {
                        if (e.key === "Enter") handleSaveEdit(branch.id);
                        if (e.key === "Escape") setEditingId(null);
                      }}
                    />
                    <button
                      onClick={() => handleSaveEdit(branch.id)}
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
                  </div>
                ) : (
                  <>
                    <div className="flex items-center gap-3 flex-1 min-w-0">
                      <div className="h-2 w-2 rounded-full bg-[#207fdf] shrink-0" />
                      <span className="text-sm font-medium text-slate-700 dark:text-slate-300 truncate">
                        {branch.name}
                      </span>
                    </div>
                    <div className="flex items-center gap-1 shrink-0">
                      <button
                        onClick={() => handleEdit(branch)}
                        className="rounded-lg p-2 text-slate-400 hover:text-[#207fdf] hover:bg-blue-50 dark:hover:bg-blue-900/20 transition-colors"
                        title="Переименовать"
                      >
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                          <path strokeLinecap="round" strokeLinejoin="round" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                        </svg>
                      </button>
                      <button
                        onClick={() => {
                          if (window.confirm(`Удалить филиал «${branch.name}»?`)) {
                            handleDelete(branch.id);
                          }
                        }}
                        disabled={deletingId === branch.id}
                        className="rounded-lg p-2 text-slate-400 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors disabled:opacity-50"
                        title="Удалить"
                      >
                        {deletingId === branch.id ? (
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
                    </div>
                  </>
                )}
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}
