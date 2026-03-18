"use client";

import { useState } from "react";
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import { ClassDialog } from "./class-dialog";
import { deleteClassAction } from "@/lib/actions/class.actions";
import { useToast } from "@/hooks/use-toast";
import { Trash2, RefreshCw } from "lucide-react";
import { useBranches } from "@/hooks/use-branches";

type Class = {
    id: string;
    branchId: string;
    academicYearId: string;
    name: string;
    academicYear: string;
    capacity: number;
    currentEnrollment: number;
    status: string;
};

type AcademicYear = {
    id: string;
    name: string;
};

type ClassesListProps = {
    initialData: Class[];
    academicYears: AcademicYear[];
};

export function ClassesList({
    initialData,
    academicYears,
}: ClassesListProps) {
    const [data, setData] = useState(initialData);
    const [filterBranch, setFilterBranch] = useState<string>("");
    const [filterYear, setFilterYear] = useState<string>("");
    const [loading, setLoading] = useState(false);
    const { toast } = useToast();
    const { branches } = useBranches();

    const filteredData = data.filter((item) => {
        if (filterBranch && item.branchId !== filterBranch) return false;
        if (filterYear && item.academicYearId !== filterYear) return false;
        return true;
    });

    const handleDelete = async (id: string, name: string) => {
        if (!confirm(`Вы уверены, что хотите удалить класс "${name}"?`)) {
            return;
        }

        setLoading(true);
        try {
            const result = await deleteClassAction(id);
            if (result.ok) {
                setData((prev) => prev.filter((item) => item.id !== id));
                toast({
                    title: "Успешно",
                    description: result.message,
                });
            } else {
                toast({
                    title: "Ошибка",
                    description: result.message,
                    variant: "destructive",
                });
            }
        } catch (error) {
            toast({
                title: "Ошибка",
                description:
                    error instanceof Error
                        ? error.message
                        : "Неизвестная ошибка",
                variant: "destructive",
            });
        } finally {
            setLoading(false);
        }
    };

    const handleRefresh = async () => {
        window.location.reload();
    };

    const getBranchName = (branchId: string) => {
        return (
            branches?.find((b) => b.id === branchId)?.name ||
            "Неизвестный филиал"
        );
    };

    const getOccupancyStatus = (current: number, capacity: number) => {
        const percentage = (current / capacity) * 100;
        if (percentage >= 100) {
            return <Badge variant="destructive">Полный класс</Badge>;
        }
        if (percentage >= 80) {
            return <Badge variant="outline">Почти полный</Badge>;
        }
        return <Badge variant="secondary">Есть места</Badge>;
    };

    return (
        <div className="space-y-4">
            {/* Фильтры */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                    <label className="text-sm font-medium text-slate-700 dark:text-slate-300 mb-2 block">
                        Филиал
                    </label>
                    <Select value={filterBranch} onValueChange={setFilterBranch}>
                        <SelectTrigger>
                            <SelectValue placeholder="Все филиалы" />
                        </SelectTrigger>
                        <SelectContent>
                            <SelectItem value="">Все филиалы</SelectItem>
                            {branches?.map((branch) => (
                                <SelectItem key={branch.id} value={branch.id}>
                                    {branch.name}
                                </SelectItem>
                            ))}
                        </SelectContent>
                    </Select>
                </div>
                <div>
                    <label className="text-sm font-medium text-slate-700 dark:text-slate-300 mb-2 block">
                        Учебный год
                    </label>
                    <Select value={filterYear} onValueChange={setFilterYear}>
                        <SelectTrigger>
                            <SelectValue placeholder="Все годы" />
                        </SelectTrigger>
                        <SelectContent>
                            <SelectItem value="">Все годы</SelectItem>
                            {academicYears.map((year) => (
                                <SelectItem key={year.id} value={year.id}>
                                    {year.name}
                                </SelectItem>
                            ))}
                        </SelectContent>
                    </Select>
                </div>
            </div>

            {/* Таблица */}
            <div className="rounded-lg border border-slate-200 dark:border-slate-800">
                <div className="p-4 flex justify-between items-center border-b border-slate-200 dark:border-slate-800">
                    <h2 className="text-lg font-semibold">
                        Классы ({filteredData.length})
                    </h2>
                    <Button
                        variant="outline"
                        size="sm"
                        onClick={handleRefresh}
                    >
                        <RefreshCw className="h-4 w-4" />
                    </Button>
                </div>
                <Table>
                    <TableHeader>
                        <TableRow>
                            <TableHead>Название</TableHead>
                            <TableHead>Филиал</TableHead>
                            <TableHead>Год</TableHead>
                            <TableHead>Вместимость</TableHead>
                            <TableHead>Статус</TableHead>
                            <TableHead className="text-right">
                                Действия
                            </TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {filteredData.length === 0 ? (
                            <TableRow>
                                <TableCell
                                    colSpan={6}
                                    className="text-center py-8 text-slate-500"
                                >
                                    Нет классов, соответствующих фильтрам
                                </TableCell>
                            </TableRow>
                        ) : (
                            filteredData.map((item) => (
                                <TableRow key={item.id}>
                                    <TableCell className="font-medium">
                                        {item.name}
                                    </TableCell>
                                    <TableCell>
                                        {getBranchName(item.branchId)}
                                    </TableCell>
                                    <TableCell>{item.academicYear}</TableCell>
                                    <TableCell>
                                        <div className="space-y-1">
                                            <div className="text-sm font-medium">
                                                {item.currentEnrollment}/
                                                {item.capacity}
                                            </div>
                                            <div className="w-full bg-slate-200 dark:bg-slate-700 rounded-full h-2">
                                                <div
                                                    className="bg-blue-500 h-2 rounded-full transition-all"
                                                    style={{
                                                        width: `${Math.min(
                                                            100,
                                                            (item.currentEnrollment /
                                                                item.capacity) *
                                                                100
                                                        )}%`,
                                                    }}
                                                />
                                            </div>
                                        </div>
                                    </TableCell>
                                    <TableCell>
                                        {getOccupancyStatus(
                                            item.currentEnrollment,
                                            item.capacity
                                        )}
                                    </TableCell>
                                    <TableCell className="text-right space-x-2">
                                        <ClassDialog
                                            mode="edit"
                                            data={item}
                                            academicYears={academicYears}
                                            onSuccess={handleRefresh}
                                        />
                                        <Button
                                            variant="outline"
                                            size="sm"
                                            onClick={() =>
                                                handleDelete(
                                                    item.id,
                                                    item.name
                                                )
                                            }
                                            disabled={loading}
                                        >
                                            <Trash2 className="h-4 w-4" />
                                        </Button>
                                    </TableCell>
                                </TableRow>
                            ))
                        )}
                    </TableBody>
                </Table>
            </div>
        </div>
    );
}
