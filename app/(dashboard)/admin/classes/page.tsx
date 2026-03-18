import { ClassManagementService } from "@/lib/services/class-management.service";
import { AcademicYearService } from "@/lib/services/academic-year.service";
import { ClassDialog } from "./_components/class-dialog";
import { ClassesList } from "./_components/classes-list";

export const metadata = {
    title: "Управление классами",
    description: "Создание и управление классами по филиалам и годам обучения",
};

export default async function ClassesPage() {
    const [classes, academicYears] = await Promise.all([
        ClassManagementService.getAllClasses(),
        AcademicYearService.getAllAcademicYears(),
    ]);

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-3xl font-bold tracking-tight text-slate-900 dark:text-white">
                        Классы
                    </h1>
                    <p className="mt-2 text-sm text-slate-600 dark:text-slate-400">
                        Создавайте и управляйте классами с указанием вместимости
                    </p>
                </div>
                <ClassDialog
                    mode="create"
                    academicYears={academicYears}
                />
            </div>

            <ClassesList
                initialData={classes}
                academicYears={academicYears}
            />
        </div>
    );
}
