"use server";

import { revalidatePath } from "next/cache";
import { requireAuth } from "@/lib/auth/session";
import { checkPermission } from "@/lib/auth/guard";
import { ClassManagementService } from "@/lib/services/class-management.service";
import {
    createClassSchema,
    updateClassSchema,
    bulkCreateClassesSchema,
} from "@/lib/validators/class.schema";
import { ActionResult } from "@/lib/types/action";

export async function createClassAction(
    formData: unknown
): Promise<ActionResult> {
    try {
        const { role } = await requireAuth();
        if (!checkPermission(role, "classes.write")) {
            throw new Error("Нет прав на создание класса");
        }

        const data = createClassSchema.parse(formData);
        const classData = await ClassManagementService.createClass(data);

        revalidatePath("/admin/classes");

        return {
            ok: true,
            message: "Класс успешно создан",
            data: classData,
        };
    } catch (error) {
        const message =
            error instanceof Error ? error.message : "Неизвестная ошибка";
        return {
            ok: false,
            message,
        };
    }
}

export async function updateClassAction(
    id: string,
    formData: unknown
): Promise<ActionResult> {
    try {
        const { role } = await requireAuth();
        if (!checkPermission(role, "classes.write")) {
            throw new Error("Нет прав на изменение класса");
        }

        const data = updateClassSchema.parse(formData);
        const classData = await ClassManagementService.updateClass(id, data);

        revalidatePath("/admin/classes");

        return {
            ok: true,
            message: "Класс успешно обновлен",
            data: classData,
        };
    } catch (error) {
        const message =
            error instanceof Error ? error.message : "Неизвестная ошибка";
        return {
            ok: false,
            message,
        };
    }
}

export async function bulkCreateClassesAction(
    formData: unknown
): Promise<ActionResult> {
    try {
        const { role } = await requireAuth();
        if (!checkPermission(role, "classes.write")) {
            throw new Error("Нет прав на создание классов");
        }

        const data = bulkCreateClassesSchema.parse(formData);
        const classes =
            await ClassManagementService.bulkCreateClasses(data);

        revalidatePath("/admin/classes");

        return {
            ok: true,
            message: `Успешно создано ${classes.length} классов`,
            data: classes,
        };
    } catch (error) {
        const message =
            error instanceof Error ? error.message : "Неизвестная ошибка";
        return {
            ok: false,
            message,
        };
    }
}

export async function deleteClassAction(id: string): Promise<ActionResult> {
    try {
        const { role } = await requireAuth();
        if (!checkPermission(role, "classes.write")) {
            throw new Error("Нет прав на удаление класса");
        }

        await ClassManagementService.deleteClass(id);

        revalidatePath("/admin/classes");

        return {
            ok: true,
            message: "Класс успешно удален",
        };
    } catch (error) {
        const message =
            error instanceof Error ? error.message : "Неизвестная ошибка";
        return {
            ok: false,
            message,
        };
    }
}

export async function archiveClassAction(
    id: string
): Promise<ActionResult> {
    try {
        const { role } = await requireAuth();
        if (!checkPermission(role, "classes.write")) {
            throw new Error("Нет прав на архивирование класса");
        }

        const classData =
            await ClassManagementService.archiveClass(id);

        revalidatePath("/admin/classes");

        return {
            ok: true,
            message: "Класс успешно архивирован",
            data: classData,
        };
    } catch (error) {
        const message =
            error instanceof Error ? error.message : "Неизвестная ошибка";
        return {
            ok: false,
            message,
        };
    }
}
