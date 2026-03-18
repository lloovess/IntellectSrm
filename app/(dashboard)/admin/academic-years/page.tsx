import { AcademicYearService } from "@/lib/services/academic-year.service";
import { AcademicYearDialog } from "./_components/academic-year-dialog";
import { AcademicYearsList } from "./_components/academic-years-list";

export const metadata = {
    title: "Управление учебными годами",
    description: "Создание и управление учебными годами",
};

export default async function AcademicYearsPage() {
    const academicYears = await AcademicYearService.getAllAcademicYears();

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-3xl font-bold tracking-tight text-slate-900 dark:text-white">
                        Учебные годы
                    </h1>
                    <p className="mt-2 text-sm text-slate-600 dark:text-slate-400">
                        Создавайте и управляйте учебными годами для вашего учреждения
                    </p>
                </div>
                <AcademicYearDialog mode="create" />
            </div>

            <AcademicYearsList initialData={academicYears} />
        </div>
    );
}
