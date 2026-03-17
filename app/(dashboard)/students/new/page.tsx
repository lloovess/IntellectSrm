"use client";

import { useState, useTransition, useEffect } from "react";
import { useRouter } from "next/navigation";
import { createStudentAction } from "@/lib/actions/student.actions";

type BranchOption = { id: string; name: string };
type ClassOption = { id: string; name: string; branchId: string; capacity: number; academicYear: string };

function getCurrentAcademicYear(): string {
  const now = new Date();
  const year = now.getFullYear();
  return now.getMonth() + 1 >= 9 ? `${year}-${year + 1}` : `${year - 1}-${year}`;
}

const INPUT_CLS = "w-full rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 px-4 py-2.5 text-sm text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-[#207fdf]/60 transition-all";

function FieldGroup({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div>
      <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
        {label}
      </label>
      {children}
    </div>
  );
}

export default function NewStudentPage() {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();

  const [fullName, setFullName] = useState("");
  const [phone, setPhone] = useState("");
  const [grade, setGrade] = useState("");
  const [classId, setClassId] = useState("");
  const [academicYear, setAcademicYear] = useState(getCurrentAcademicYear());
  const [branchId, setBranchId] = useState("");

  const [iin, setIin] = useState("");
  const [dateOfBirth, setDateOfBirth] = useState("");
  const [gender, setGender] = useState("");
  const [address, setAddress] = useState("");

  const [guardianName, setGuardianName] = useState("");
  const [guardianPhone, setGuardianPhone] = useState("");
  const [guardianRelationship, setGuardianRelationship] = useState("");

  const [branches, setBranches] = useState<BranchOption[]>([]);
  const [classesList, setClassesList] = useState<ClassOption[]>([]);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const run = async () => {
      const [resBranches, resClasses] = await Promise.all([
        fetch("/api/branches", { cache: "no-store" }),
        fetch("/api/classes", { cache: "no-store" })
      ]);

      if (resBranches.ok) {
        const payload = (await resBranches.json()) as { data: BranchOption[] };
        setBranches(payload.data ?? []);
        if ((payload.data ?? []).length > 0) {
          setBranchId(payload.data[0].id);
        }
      }

      if (resClasses.ok) {
        const payload = (await resClasses.json()) as { data: ClassOption[] };
        setClassesList(payload.data ?? []);
      }
    };
    void run();
  }, []);

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);

    if (!branchId) {
      setError("Выберите филиал");
      return;
    }

    startTransition(async () => {
      const result = await createStudentAction({
        fullName,
        phone: phone.trim() || undefined,
        guardianName: guardianName.trim(),
        guardianPhone: guardianPhone.trim(),
        guardianRelationship: guardianRelationship.trim() || undefined,
        classId: classId || undefined,
        grade: grade || undefined,
        branchId,
        academicYear,
        status: "active",
        iin: iin.trim() || undefined,
        dateOfBirth: dateOfBirth || undefined,
        gender: gender || undefined,
        address: address.trim() || undefined,
      });

      if (!result.success) {
        setError(result.error);
        return;
      }

      router.push("/students");
    });
  }

  return (
    <div className="max-w-3xl mx-auto p-6 md:p-8 space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-slate-900 dark:text-white">Новый ученик</h1>
        <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
          Создание профиля ученика и его первого зачисления
        </p>
      </div>

      <form
        onSubmit={handleSubmit}
        className="rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-6 space-y-6 shadow-sm"
      >
        {error && (
          <div className="rounded-lg bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 px-4 py-3 text-sm text-red-700 dark:text-red-400">
            {error}
          </div>
        )}

        {/* Section: Личные данные */}
        <div>
          <h3 className="text-sm font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 mb-4 pb-2 border-b border-slate-100 dark:border-slate-800">
            Личные данные
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            <FieldGroup label="ФИО ученика *">
              <input
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                className={INPUT_CLS}
                placeholder="Иванов Иван"
                required
              />
            </FieldGroup>
            <FieldGroup label="Телефон">
              <input
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                className={INPUT_CLS}
                placeholder="+7 (705) 123-4567"
              />
            </FieldGroup>

            <FieldGroup label="ИИН (для договоров)">
              <input
                value={iin}
                onChange={(e) => setIin(e.target.value)}
                className={INPUT_CLS}
                placeholder="123456789012"
              />
            </FieldGroup>
            <FieldGroup label="Дата рождения">
              <input
                type="date"
                value={dateOfBirth}
                onChange={(e) => setDateOfBirth(e.target.value)}
                className={INPUT_CLS}
              />
            </FieldGroup>

            <FieldGroup label="Пол">
              <select
                value={gender}
                onChange={(e) => setGender(e.target.value)}
                className={INPUT_CLS}
              >
                <option value="">Не указано</option>
                <option value="male">Мужской</option>
                <option value="female">Женский</option>
              </select>
            </FieldGroup>
            <FieldGroup label="Адрес проживания">
              <input
                value={address}
                onChange={(e) => setAddress(e.target.value)}
                className={INPUT_CLS}
                placeholder="г. Алматы, ул. Абая..."
              />
            </FieldGroup>
          </div>
        </div>

        {/* Section: Данные опекуна */}
        <div>
          <h3 className="text-sm font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 mb-4 pb-2 border-b border-slate-100 dark:border-slate-800 mt-6 md:mt-8">
            Контакты и родители
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            <FieldGroup label="ФИО родителя / опекуна *">
              <input
                value={guardianName}
                onChange={(e) => setGuardianName(e.target.value)}
                className={INPUT_CLS}
                placeholder="Иванова Анна"
                required
              />
            </FieldGroup>
            <FieldGroup label="Телефон родителя *">
              <input
                value={guardianPhone}
                onChange={(e) => setGuardianPhone(e.target.value)}
                className={INPUT_CLS}
                placeholder="+7 (705) 123-4567"
                required
              />
            </FieldGroup>
            <FieldGroup label="Кем приходится ученику?">
              <input
                value={guardianRelationship}
                onChange={(e) => setGuardianRelationship(e.target.value)}
                className={INPUT_CLS}
                placeholder="Мама, Папа, Бабушка"
              />
            </FieldGroup>
          </div>
        </div>

        {/* Section: Зачисление */}
        <div>
          <h3 className="text-sm font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 mb-4 pb-2 border-b border-slate-100 dark:border-slate-800 mt-6 md:mt-8">
            Зачисление
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            <FieldGroup label="Филиал *">
              <select
                value={branchId}
                onChange={(e) => {
                  setBranchId(e.target.value);
                  setClassId(""); // Reset class when branch changes
                }}
                className={INPUT_CLS}
                required
              >
                {branches.length === 0 ? <option value="">Нет филиалов</option> : null}
                {branches.map((branch) => (
                  <option key={branch.id} value={branch.id}>
                    {branch.name}
                  </option>
                ))}
              </select>
            </FieldGroup>
            <FieldGroup label="Класс / Группа *">
              <div className="space-y-2">
                <select
                  value={classId}
                  onChange={(e) => setClassId(e.target.value)}
                  className={INPUT_CLS}
                >
                  <option value="">-- Выбрать класс --</option>
                  {classesList.filter(c => c.branchId === branchId).map(c => (
                    <option key={c.id} value={c.id}>{c.name} (Учебный год: {c.academicYear})</option>
                  ))}
                </select>
                <p className="text-xs text-slate-500">Если нужного класса нет, введите вручную ниже (устаревший способ):</p>
                <input
                  value={grade}
                  onChange={(e) => setGrade(e.target.value)}
                  className={INPUT_CLS}
                  placeholder="Вручную: 1, 5А, 10Б"
                  disabled={!!classId}
                />
              </div>
            </FieldGroup>
            <div className="md:col-span-2">
              <FieldGroup label="Учебный год *">
                <input
                  value={academicYear}
                  onChange={(e) => setAcademicYear(e.target.value)}
                  className={INPUT_CLS}
                  placeholder="2026-2027"
                  required
                />
              </FieldGroup>
            </div>
          </div>
        </div>

        <div className="pt-4 flex items-center gap-3">
          <button
            type="submit"
            disabled={isPending}
            className="inline-flex items-center rounded-lg bg-[#207fdf] px-6 py-2.5 text-sm font-semibold text-white hover:bg-[#1a6bc4] disabled:opacity-50 transition-colors shadow-sm shadow-blue-500/20"
          >
            {isPending ? (
              <span className="flex items-center gap-2">
                <svg className="animate-spin h-4 w-4" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                </svg>
                Сохранение...
              </span>
            ) : (
              "Создать ученика и зачисление"
            )}
          </button>
          <button
            type="button"
            onClick={() => router.back()}
            className="px-5 py-2.5 rounded-lg border border-slate-200 dark:border-slate-700 text-sm font-semibold text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors"
          >
            Отмена
          </button>
        </div>
      </form>
    </div>
  );
}
