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
import { AcademicYearDialog } from "./academic-year-dialog";
import { deleteAcademicYearAction } from "@/lib/actions/academic-year.actions";
import { useToast } from "@/hooks/use-toast";
import { Trash2, RefreshCw } from "lucide-react";

type AcademicYear = {
    id: string;
    name: string;
    startDate: Date;
    endDate: Date;
    status: string;
    createdAt: Date;
};

type AcademicYearsListProps = {
    initialData: AcademicYear[];
};

export function AcademicYearsList({ initialData }: AcademicYearsListProps) {
    const [data, setData] = useState(initialData);
    const [loading, setLoading] = useState(false);
    const { toast } = useToast();

    const handleDelete = async (id: string, name: string) => {
        if (!confirm(`Вы уверены, что хотите удалить год "${name}"?`)) {
            return;
        }

        setLoading(true);
        try {
            const result = await deleteAcademicYearAction(id);
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
        // Reload data
        window.location.reload();
    };

    const formatDate = (date: Date | string) => {
        const d = new Date(date);
        return d.toLocaleDateString("ru-RU");
    };

    return (
        <div className="rounded-lg border border-slate-200 dark:border-slate-800">
            <div className="p-4 flex justify-between items-center border-b border-slate-200 dark:border-slate-800">
                <h2 className="text-lg font-semibold">Все учебные годы</h2>
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
                        <TableHead>Начало</TableHead>
                        <TableHead>Окончание</TableHead>
                        <TableHead>Статус</TableHead>
                        <TableHead className="text-right">Действия</TableHead>
                    </TableRow>
                </TableHeader>
                <TableBody>
                    {data.length === 0 ? (
                        <TableRow>
                            <TableCell
                                colSpan={5}
                                className="text-center py-8 text-slate-500"
                            >
                                Нет учебных годов
                            </TableCell>
                        </TableRow>
                    ) : (
                        data.map((item) => (
                            <TableRow key={item.id}>
                                <TableCell className="font-medium">
                                    {item.name}
                                </TableCell>
                                <TableCell>
                                    {formatDate(item.startDate)}
                                </TableCell>
                                <TableCell>
                                    {formatDate(item.endDate)}
                                </TableCell>
                                <TableCell>
                                    <Badge
                                        variant={
                                            item.status === "active"
                                                ? "default"
                                                : "secondary"
                                        }
                                    >
                                        {item.status === "active"
                                            ? "Активный"
                                            : "Архив"}
                                    </Badge>
                                </TableCell>
                                <TableCell className="text-right space-x-2">
                                    <AcademicYearDialog
                                        mode="edit"
                                        data={item}
                                        onSuccess={handleRefresh}
                                    />
                                    <Button
                                        variant="outline"
                                        size="sm"
                                        onClick={() =>
                                            handleDelete(item.id, item.name)
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
    );
}
