'use client';

import { FormEvent, useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';

type BranchOption = { id: string; name: string };

type Props = {
  studentId: string;
};

function getCurrentAcademicYear(): string {
  const now = new Date();
  const year = now.getFullYear();
  return now.getMonth() + 1 >= 9 ? `${year}-${year + 1}` : `${year - 1}-${year}`;
}

export function CreateEnrollmentDialog({ studentId }: Props) {
  const router = useRouter();

  const [open, setOpen] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  const [branches, setBranches] = useState<BranchOption[]>([]);
  const [branchId, setBranchId] = useState('');
  const [grade, setGrade] = useState('1');
  const [academicYear, setAcademicYear] = useState(getCurrentAcademicYear());

  useEffect(() => {
    const run = async () => {
      const response = await fetch('/api/branches', { cache: 'no-store' });
      if (!response.ok) return;
      const payload = (await response.json()) as { data: BranchOption[] };
      setBranches(payload.data ?? []);
      if ((payload.data ?? []).length > 0) {
        setBranchId(payload.data[0].id);
      }
    };
    void run();
  }, []);

  const handleSubmit = async (event: FormEvent) => {
    event.preventDefault();
    setError('');

    if (!branchId) {
      setError('Выберите филиал');
      return;
    }

    setSaving(true);

    const response = await fetch('/api/enrollments', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        studentId,
        branchId,
        academicYear,
        grade,
        status: 'active'
      })
    });

    const payload = (await response.json().catch(() => ({}))) as { error?: string };

    if (!response.ok) {
      setError(payload.error ?? 'Не удалось создать зачисление');
      setSaving(false);
      return;
    }

    setSaving(false);
    setOpen(false);
    router.refresh();
  };

  return (
    <>
      <button
        onClick={() => setOpen(true)}
        className="inline-flex items-center rounded-lg bg-[#207fdf] px-4 py-2 text-sm font-semibold text-white hover:bg-[#1a6bc4]"
      >
        Создать зачисление
      </button>

      {open ? (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 px-4">
          <div className="w-full max-w-md rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 p-5">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-bold text-slate-900 dark:text-white">Новое зачисление</h3>
              <button
                onClick={() => setOpen(false)}
                className="text-slate-400 hover:text-slate-700 dark:hover:text-slate-200"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4">
              <label className="block text-sm font-medium text-slate-700 dark:text-slate-300">
                Филиал
                <select
                  value={branchId}
                  onChange={(e) => setBranchId(e.target.value)}
                  className="mt-1.5 w-full rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 px-3 py-2 text-sm"
                >
                  {branches.length === 0 ? <option value="">Нет филиалов</option> : null}
                  {branches.map((branch) => (
                    <option key={branch.id} value={branch.id}>
                      {branch.name}
                    </option>
                  ))}
                </select>
              </label>

              <label className="block text-sm font-medium text-slate-700 dark:text-slate-300">
                Класс
                <input
                  value={grade}
                  onChange={(e) => setGrade(e.target.value)}
                  className="mt-1.5 w-full rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 px-3 py-2 text-sm"
                  placeholder="Например: 5А"
                />
              </label>

              <label className="block text-sm font-medium text-slate-700 dark:text-slate-300">
                Учебный год
                <input
                  value={academicYear}
                  onChange={(e) => setAcademicYear(e.target.value)}
                  className="mt-1.5 w-full rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 px-3 py-2 text-sm"
                  placeholder="2026-2027"
                />
              </label>

              {error ? <p className="text-sm text-red-600 dark:text-red-400">{error}</p> : null}

              <div className="flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setOpen(false)}
                  className="rounded-lg border border-slate-200 dark:border-slate-700 px-3 py-2 text-sm font-medium text-slate-700 dark:text-slate-300"
                >
                  Отмена
                </button>
                <button
                  type="submit"
                  disabled={saving}
                  className="rounded-lg bg-[#207fdf] px-3 py-2 text-sm font-semibold text-white hover:bg-[#1a6bc4] disabled:opacity-50"
                >
                  {saving ? 'Создание...' : 'Сохранить'}
                </button>
              </div>
            </form>
          </div>
        </div>
      ) : null}
    </>
  );
}
