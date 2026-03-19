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
import { Input } from "@/components/ui/input";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import {
    createAcademicYearSchema,
    updateAcademicYearSchema,
} from "@/lib/validators/academic-year.schema";
import {
    createAcademicYearAction,
    updateAcademicYearAction,
} from "@/lib/actions/academic-year.actions";
import { useToast } from "@/hooks/use-toast";
import { Loader2, Plus, Pencil } from "lucide-react";

type AcademicYearDialogProps = {
    mode: "create" | "edit";
    data?: {
        id: string;
        name: string;
        startDate: Date;
        endDate: Date;
        status: string;
    };
    onSuccess?: () => void;
};

export function AcademicYearDialog({
    mode,
    data,
    onSuccess,
}: AcademicYearDialogProps) {
    const [open, setOpen] = useState(false);
    const [loading, setLoading] = useState(false);
    const { toast } = useToast();

    const schema =
        mode === "create" ? createAcademicYearSchema : updateAcademicYearSchema;

    const form = useForm({
        resolver: zodResolver(schema),
        defaultValues: {
            name: data?.name || "",
            startDate: data?.startDate || new Date(),
            endDate: data?.endDate || new Date(),
            status: (data?.status as "active" | "archived") || "active",
        },
    });

    const onSubmit = async (formData: unknown) => {
        setLoading(true);
        try {
            let result;
            if (mode === "create") {
                result = await createAcademicYearAction(formData);
            } else {
                result = await updateAcademicYearAction(data?.id || "", formData);
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
                            Новый год
                        </>
                    ) : (
                        <>
                            <Pencil className="mr-2 h-4 w-4" />
                            Редактировать
                        </>
                    )}
                </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-[425px]">
                <DialogHeader>
                    <DialogTitle>
                        {mode === "create"
                            ? "Создать учебный год"
                            : "Редактировать учебный год"}
                    </DialogTitle>
                    <DialogDescription>
                        {mode === "create"
                            ? "Добавьте новый учебный год"
                            : "Обновите информацию об учебном годе"}
                    </DialogDescription>
                </DialogHeader>

                <Form {...form}>
                    <form
                        onSubmit={form.handleSubmit(onSubmit)}
                        className="space-y-4"
                    >
                        <FormField
                            control={form.control}
                            name="name"
                            render={({ field }) => (
                                <FormItem>
                                    <FormLabel>Название (YYYY-YYYY)</FormLabel>
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
                            name="startDate"
                            render={({ field }) => (
                                <FormItem>
                                    <FormLabel>Дата начала</FormLabel>
                                    <FormControl>
                                        <Input
                                            type="date"
                                            {...field}
                                            value={
                                                field.value instanceof Date
                                                    ? field.value
                                                          .toISOString()
                                                          .split("T")[0]
                                                    : ""
                                            }
                                            onChange={(e) =>
                                                field.onChange(
                                                    new Date(e.target.value)
                                                )
                                            }
                                        />
                                    </FormControl>
                                    <FormMessage />
                                </FormItem>
                            )}
                        />

                        <FormField
                            control={form.control}
                            name="endDate"
                            render={({ field }) => (
                                <FormItem>
                                    <FormLabel>Дата окончания</FormLabel>
                                    <FormControl>
                                        <Input
                                            type="date"
                                            {...field}
                                            value={
                                                field.value instanceof Date
                                                    ? field.value
                                                          .toISOString()
                                                          .split("T")[0]
                                                    : ""
                                            }
                                            onChange={(e) =>
                                                field.onChange(
                                                    new Date(e.target.value)
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
                            <Button
                                type="submit"
                                disabled={loading}
                            >
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
