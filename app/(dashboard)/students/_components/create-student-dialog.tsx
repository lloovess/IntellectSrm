"use client";

import { useState, useTransition } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import {
    Dialog,
    DialogContent,
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
import { Button } from "@/components/ui/button";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import { createStudentSchema, type CreateStudentInput } from "@/lib/validators/student.schema";
import { createStudentAction } from "@/lib/actions/student.actions";
import { UserPlus, Loader2 } from "lucide-react";

const GRADES = [
    "5А", "5Б", "6А", "6Б", "7А", "7Б",
    "8А", "8Б", "9А", "9Б", "10А", "10Б", "11А", "11Б",
];

export function CreateStudentDialog() {
    const [open, setOpen] = useState(false);
    const [isPending, startTransition] = useTransition();
    const [serverError, setServerError] = useState<string | null>(null);

    // Явный generic CreateStudentInput решает конфликт типов RHF + zodResolver
    const form = useForm<CreateStudentInput>({
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        resolver: zodResolver(createStudentSchema) as any,
        defaultValues: {
            fullName: "",
            phone: "",
            email: "",
            notes: "",
            status: "active",
            grade: "",
            academicYear: "2025-2026",
        },
    });

    const onSubmit = (data: CreateStudentInput) => {
        setServerError(null);
        startTransition(async () => {
            const result = await createStudentAction(data);
            if (result.success) {
                form.reset();
                setOpen(false);
            } else {
                setServerError(result.error);
            }
        });
    };

    return (
        <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
                <Button>
                    <UserPlus className="mr-2 h-4 w-4" />
                    Добавить студента
                </Button>
            </DialogTrigger>

            <DialogContent className="sm:max-w-md">
                <DialogHeader>
                    <DialogTitle>Новый студент</DialogTitle>
                </DialogHeader>

                <Form {...form}>
                    <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                        {/* ФИО */}
                        <FormField
                            control={form.control}
                            name="fullName"
                            render={({ field }) => (
                                <FormItem>
                                    <FormLabel>ФИО *</FormLabel>
                                    <FormControl>
                                        <Input placeholder="Иванов Иван Иванович" {...field} />
                                    </FormControl>
                                    <FormMessage />
                                </FormItem>
                            )}
                        />

                        {/* Телефон */}
                        <FormField
                            control={form.control}
                            name="phone"
                            render={({ field }) => (
                                <FormItem>
                                    <FormLabel>Телефон</FormLabel>
                                    <FormControl>
                                        <Input placeholder="+7 777 000 00 00" {...field} />
                                    </FormControl>
                                    <FormMessage />
                                </FormItem>
                            )}
                        />

                        {/* Класс */}
                        <FormField
                            control={form.control}
                            name="grade"
                            render={({ field }) => (
                                <FormItem>
                                    <FormLabel>Класс *</FormLabel>
                                    <Select onValueChange={field.onChange} defaultValue={field.value}>
                                        <FormControl>
                                            <SelectTrigger>
                                                <SelectValue placeholder="Выберите класс" />
                                            </SelectTrigger>
                                        </FormControl>
                                        <SelectContent>
                                            {GRADES.map((g) => (
                                                <SelectItem key={g} value={g}>{g}</SelectItem>
                                            ))}
                                        </SelectContent>
                                    </Select>
                                    <FormMessage />
                                </FormItem>
                            )}
                        />

                        {/* Email */}
                        <FormField
                            control={form.control}
                            name="email"
                            render={({ field }) => (
                                <FormItem>
                                    <FormLabel>Email</FormLabel>
                                    <FormControl>
                                        <Input type="email" placeholder="student@example.com" {...field} />
                                    </FormControl>
                                    <FormMessage />
                                </FormItem>
                            )}
                        />

                        {/* Серверная ошибка */}
                        {serverError && (
                            <p className="rounded-md bg-red-50 px-3 py-2 text-sm text-red-600 dark:bg-red-900/20 dark:text-red-400">
                                {serverError}
                            </p>
                        )}

                        <div className="flex justify-end gap-2 pt-2">
                            <Button
                                type="button"
                                variant="outline"
                                onClick={() => setOpen(false)}
                                disabled={isPending}
                            >
                                Отмена
                            </Button>
                            <Button type="submit" disabled={isPending}>
                                {isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                                Сохранить
                            </Button>
                        </div>
                    </form>
                </Form>
            </DialogContent>
        </Dialog>
    );
}
