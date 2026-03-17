"use server";

import { revalidatePath, revalidateTag } from "next/cache";
import { requireAuth } from "@/lib/auth/session";
// createAdminClient is no longer used directly for creation
import { studentRepository } from "@/lib/db/repositories/student.repo";
import {
    createStudentSchema,
    updateStudentSchema,
    type CreateStudentInput,
    type UpdateStudentInput,
} from "@/lib/validators/student.schema";

// Тип возвращаемого состояния Server Action (совместим с useActionState)
export type ActionResult = { success: true } | { success: false; error: string };

// ─── create ──────────────────────────────────────────────────────────────────

export async function createStudentAction(
    input: CreateStudentInput
): Promise<ActionResult> {
    await requireAuth();

    // 1. Валидация входных данных через Zod
    const parsed = createStudentSchema.safeParse(input);
    if (!parsed.success) {
        return {
            success: false,
            error: parsed.error.issues.map((e: { message: string }) => e.message).join(", "),
        };
    }

    const { grade, branchId, academicYear, classId, iin, dateOfBirth, gender, address, guardianName, guardianPhone, guardianRelationship, ...studentData } = parsed.data;

    const finalGrade = grade;
    const finalYear = academicYear ?? "2025-2026";
    const finalBranchId = branchId;

    // Загружать данные класса больше не нужно в `student.actions.ts`, 
    // так как это инкапсулировано внутри `createWithEnrollment` транзакции.
    // Оставим переменные для fallback-значений с UI.

    // 2. Создаём студента и зачисление через новую Drizzle ORM транзакцию
    try {
        await studentRepository.createWithEnrollment(
            {
                fullName: studentData.fullName,
                phone: studentData.phone || null,
                email: studentData.email || null,
                notes: studentData.notes || null,
                status: studentData.status,
                iin: iin || null,
                dateOfBirth: dateOfBirth || null,
                gender: gender || null,
                address: address || null,
            },
            {
                branchId: finalBranchId ?? null,
                grade: finalGrade,
                academicYear: finalYear,
                status: "active",
            },
            {
                fullName: guardianName,
                phone: guardianPhone,
                relationship: guardianRelationship || null,
            },
            classId || null
        );

        revalidatePath("/students");
        revalidateTag('dashboard_metrics');
        return { success: true };
    } catch (e: unknown) {
        const errMsg = e instanceof Error ? (e.message || "Unknown error") : "Unknown error";
        console.error("Student creation failed:", e);
        return {
            success: false,
            error: errMsg || "Не удалось создать ученика. Проверьте правильность введенных данных или обратитесь в поддержку."
        };
    }
}

// ─── update ──────────────────────────────────────────────────────────────────

export async function updateStudentAction(
    id: string,
    input: UpdateStudentInput
): Promise<ActionResult> {
    await requireAuth();

    const parsed = updateStudentSchema.safeParse(input);
    if (!parsed.success) {
        return {
            success: false,
            error: parsed.error.issues.map((e: { message: string }) => e.message).join(", "),
        };
    }

    const { grade: _grade, branchId: _branchId, academicYear: _year, classId: _cls, iin, dateOfBirth, gender, address, ...studentData } = parsed.data;

    await studentRepository.update(id, {
        ...studentData,
        iin: iin || null,
        dateOfBirth: dateOfBirth || null,
        gender: gender || null,
        address: address || null,
    });

    revalidatePath("/students");
    revalidateTag('dashboard_metrics');
    return { success: true };
}
