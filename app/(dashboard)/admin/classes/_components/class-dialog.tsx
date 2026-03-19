"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
} from "@/components/ui/dialog";
import {
    Form,
    FormControl,
    FormField,
    FormItem,
    FormLabel,
    FormMessage,
} from "@/components/ui/form";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { createClassSchema, updateClassSchema } from "@/lib/validators/class.schema";
import {
    createClassAction,
    updateClassAction,
} from "@/lib/actions/class.actions";
import { useToast } from "@/hooks/use-toast";
import { Loader2, Plus, Pencil } from "lucide-react";
import { useBranches } from "@/hooks/use-branches";

type ClassDialogProps = {
    mode: "create" | "edit";
    academicYears: Array<{
        id: string;
        name: string;
    }>;
    data?: {
        id: string;
        branchId: string;
        academicYearId: string;
        name: string;
        academicYear: string;
        capacity: number;
        status: string;
    };
    onSuccess?: () => void;
};

export function ClassDialog({
    mode,
    academicYears,
    data,
    onSuccess,
}: ClassDialogProps) {
    const [open, setOpen] = useState(false);
    const [loading, setLoading] = useState(false);
    const { toast } = useToast();
    const { branches } = useBranches();

    const schema = mode === "create" ? createClassSchema : updateClassSchema;

    const form = useForm({
        resolver: zodResolver(schema),
        defaultValues: {
            branchId: data?.branchId || "",
            academicYearId: data?.academicYearId || "",
            name: data?.name || "",
            academicYear: data?.academicYear || "",
            capacity: data?.capacity || 20,
            status: (data?.status as "active" | "archived") || "active",
        },
    });

    const onSubmit = async (formData: unknown) => {
        setLoading(true);
        try {
            let result;
            if (mode === "create") {
                result = await createClassAction(formData);
            } else {
                result = await updateClassAction(data?.id || "", formData);
            }

            if (result.ok) {
                toast({
                    title: "Успешно",
                    description: result.message,
                });
                setOpen(false);
                form.reset();
                onSuccess?.();
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

    return (
        <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
                <Button
                    variant={mode === "create" ? "default" : "outline"}
                    size={mode === "create" ? "default" : "sm"}
                >
                    {mode === "create" ? (
                        <>
                            <Plus className="mr-2 h-4 w-4" />
                            Новый класс
                        </>
                    ) : (
                        <>
                            <Pencil className="mr-2 h-4 w-4" />
                            Редактировать
                        </>
                    )}
                </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-[500px]">
                <DialogHeader>
                    <DialogTitle>
                        {mode === "create"
                            ? "Создать класс"
                            : "Редактировать класс"}
                    </DialogTitle>
                    <DialogDescription>
                        {mode === "create"
                            ? "Добавьте новый класс"
                            : "Обновите информацию о классе"}
                    </DialogDescription>
                </DialogHeader>

                <Form {...form}>
                    <form
                        onSubmit={form.handleSubmit(onSubmit)}
                        className="space-y-4"
                    >
                        <FormField
                            control={form.control}
                            name="branchId"
                            render={({ field }) => (
                                <FormItem>
                                    <FormLabel>Филиал</FormLabel>
                                    <Select
                                        value={field.value}
                                        onValueChange={field.onChange}
                                    >
                                        <FormControl>
                                            <SelectTrigger>
                                                <SelectValue placeholder="Выберите филиал" />
                                            </SelectTrigger>
                                        </FormControl>
                                        <SelectContent>
                                            {branches?.map((branch) => (
                                                <SelectItem
                                                    key={branch.id}
                                                    value={branch.id}
                                                >
                                                    {branch.name}
                                                </SelectItem>
                                            ))}
                                        </SelectContent>
                                    </Select>
                                    <FormMessage />
                                </FormItem>
                            )}
                        />

                        <FormField
                            control={form.control}
                            name="academicYearId"
                            render={({ field }) => (
                                <FormItem>
                                    <FormLabel>Учебный год</FormLabel>
                                    <Select
                                        value={field.value}
                                        onValueChange={field.onChange}
                                    >
                                        <FormControl>
                                            <SelectTrigger>
                                                <SelectValue placeholder="Выберите год" />
                                            </SelectTrigger>
                                        </FormControl>
                                        <SelectContent>
                                            {academicYears.map((year) => (
                                                <SelectItem
                                                    key={year.id}
                                                    value={year.id}
                                                >
                                                    {year.name}
                                                </SelectItem>
                                            ))}
                                        </SelectContent>
                                    </Select>
                                    <FormMessage />
                                </FormItem>
                            )}
                        />

                        <FormField
                            control={form.control}
                            name="name"
                            render={({ field }) => (
                                <FormItem>
                                    <FormLabel>Название класса</FormLabel>
                                    <FormControl>
                                        <Input
                                            placeholder="7-В"
                                            {...field}
                                        />
                                    </FormControl>
                                    <FormMessage />
                                </FormItem>
                            )}
                        />

                        <FormField
                            control={form.control}
                            name="academicYear"
                            render={({ field }) => (
                                <FormItem>
                                    <FormLabel>Текст года (для совместимости)</FormLabel>
                                    <FormControl>
                                        <Input
                                            placeholder="2025-2026"
                                            {...field}
                                        />
                                    </FormControl>
                                    <FormMessage />
                                </FormItem>
                            )}
                        />

                        <FormField
                            control={form.control}
                            name="capacity"
                            render={({ field }) => (
                                <FormItem>
                                    <FormLabel>Вместимость</FormLabel>
                                    <FormControl>
                                        <Input
                                            type="number"
                                            min="1"
                                            max="100"
                                            {...field}
                                            onChange={(e) =>
                                                field.onChange(
                                                    parseInt(e.target.value)
                                                )
                                            }
                                        />
                                    </FormControl>
                                    <FormMessage />
                                </FormItem>
                            )}
                        />

                        <div className="flex gap-2 justify-end pt-4">
                            <Button
                                type="button"
                                variant="outline"
                                onClick={() => setOpen(false)}
                            >
                                Отмена
                            </Button>
                            <Button type="submit" disabled={loading}>
                                {loading && (
                                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                )}
                                {mode === "create"
                                    ? "Создать"
                                    : "Сохранить"}
                            </Button>
                        </div>
                    </form>
                </Form>
            </DialogContent>
        </Dialog>
    );
}
