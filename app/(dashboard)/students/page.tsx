import { requireAuth } from "@/lib/auth/session";
import { checkPermission } from "@/lib/auth/guard";
import { studentService } from "@/lib/services/student.service";
import { StudentTable } from "./_components/student-table";
import { db } from "@/lib/db";
import { branches } from "@/lib/db/schema/branches";
import { asc } from "drizzle-orm";

interface PageProps {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}

export default async function StudentsPage({ searchParams }: PageProps) {
  // 1. Аутентификация
  const user = await requireAuth();
  const { role } = user;

  // 2. Авторизация
  const canRead = checkPermission(role, "students.read");
  if (!canRead) {
    return (
      <div className="flex h-64 items-center justify-center">
        <p className="text-slate-500">Нет доступа к реестру студентов</p>
      </div>
    );
  }

  // 3. Парсим URL-параметры
  const rawParams = await searchParams;
  const filters = {
    search: typeof rawParams.search === "string" ? rawParams.search : undefined,
    status: typeof rawParams.status === "string" ? rawParams.status : undefined,
    grade: typeof rawParams.grade === "string" ? rawParams.grade : undefined,
    branchId: typeof rawParams.branch === "string" ? rawParams.branch : undefined,
    page: rawParams.page ? Number(rawParams.page) : 1,
    pageSize: rawParams.pageSize ? Number(rawParams.pageSize) : 20,
  };

  // 4. Загружаем данные: реестр и филиалы для фильтра
  const [tableResult, branchList] = await Promise.all([
    studentService.getRegistry(filters),
    db.select({ id: branches.id, name: branches.name }).from(branches).orderBy(asc(branches.name)),
  ]);

  return (
    <div className="p-6 md:p-8">
      <StudentTable
        result={tableResult}
        search={filters.search}
        status={filters.status}
        grade={filters.grade}
        branchId={filters.branchId}
        role={role}
        branches={branchList}
      />
    </div>
  );
}
