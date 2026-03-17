"use client";

import { useState } from "react";
import { addInteractionLogAction } from "@/lib/actions/interaction.actions";

export function InteractionLogger({ studentId }: { studentId: string }) {
    const [type, setType] = useState("call");
    const [notes, setNotes] = useState("");
    const [saving, setSaving] = useState(false);
    const [error, setError] = useState("");
    const [success, setSuccess] = useState(false);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError("");
        setSuccess(false);

        if (!notes.trim()) return;

        setSaving(true);
        const result = await addInteractionLogAction(studentId, { type, notes });
        setSaving(false);

        if (!result.ok) {
            setError(result.error);
        } else {
            setSuccess(true);
            setNotes("");
            setTimeout(() => setSuccess(false), 3000);
        }
    };

    return (
        <div className="rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-5 mt-6">
            <h3 className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-2 mb-4">
                <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-blue-500">
                    <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"></path>
                </svg>
                Добавить запись в журнал
            </h3>

            <form onSubmit={handleSubmit} className="space-y-3">
                <div className="flex gap-2">
                    <select
                        value={type}
                        onChange={(e) => setType(e.target.value)}
                        className="rounded-lg border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-800 text-sm px-3 py-2 text-slate-700 dark:text-slate-300 focus:outline-none focus:ring-2 focus:ring-blue-500/50"
                    >
                        <option value="call">Звонок</option>
                        <option value="msg">Сообщение</option>
                        <option value="meeting">Встреча</option>
                    </select>

                    <input
                        value={notes}
                        onChange={(e) => setNotes(e.target.value)}
                        placeholder="О чем договорились?"
                        className="flex-1 rounded-lg border border-slate-200 dark:border-slate-800 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/50 dark:bg-slate-900 dark:text-white"
                        required
                    />

                    <button
                        type="submit"
                        disabled={saving || !notes.trim()}
                        className="rounded-lg bg-blue-600 px-4 py-2 text-sm font-semibold text-white hover:bg-blue-700 disabled:opacity-50 transition-colors"
                    >
                        {saving ? "..." : "Добавить"}
                    </button>
                </div>
                {error && <p className="text-xs text-red-500 ml-1">{error}</p>}
                {success && <p className="text-xs text-emerald-500 ml-1">Запись добавлена в историю.</p>}
            </form>
        </div>
    );
}
