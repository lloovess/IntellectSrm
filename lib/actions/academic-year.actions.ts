"use server";

import { revalidatePath } from "next/cache";
import { AcademicYearService } from "@/lib/services/academic-year.service";
import {
    createAcademicYearSchema,
    updateAcademicYearSchema,
} from "@/lib/validators/academic-year.schema";
import { ActionResult } from "@/lib/types/action";

export async function createAcademicYearAction(
    formData: unknown
): Promise<ActionResult> {
    try {
        const data = createAcademicYearSchema.parse(formData);
        const academicYear =
            await AcademicYearService.createAcademicYear(data);

        revalidatePath("/admin/academic-years");
        revalidatePath("/admin/classes");

        return {
            ok: true,
            message: "Academic year created successfully",
            data: academicYear,
        };
    } catch (error) {
        const message =
            error instanceof Error ? error.message : "Unknown error";
        return {
            ok: false,
            message,
        };
    }
}

export async function updateAcademicYearAction(
    id: string,
    formData: unknown
): Promise<ActionResult> {
    try {
        const data = updateAcademicYearSchema.parse(formData);
        const academicYear = await AcademicYearService.updateAcademicYear(
            id,
            data
        );

        revalidatePath("/admin/academic-years");

        return {
            ok: true,
            message: "Academic year updated successfully",
            data: academicYear,
        };
    } catch (error) {
        const message =
            error instanceof Error ? error.message : "Unknown error";
        return {
            ok: false,
            message,
        };
    }
}

export async function archiveAcademicYearAction(
    id: string
): Promise<ActionResult> {
    try {
        const academicYear =
            await AcademicYearService.archiveAcademicYear(id);

        revalidatePath("/admin/academic-years");

        return {
            ok: true,
            message: "Academic year archived successfully",
            data: academicYear,
        };
    } catch (error) {
        const message =
            error instanceof Error ? error.message : "Unknown error";
        return {
            ok: false,
            message,
        };
    }
}

export async function deleteAcademicYearAction(
    id: string
): Promise<ActionResult> {
    try {
        await AcademicYearService.deleteAcademicYear(id);

        revalidatePath("/admin/academic-years");

        return {
            ok: true,
            message: "Academic year deleted successfully",
        };
    } catch (error) {
        const message =
            error instanceof Error ? error.message : "Unknown error";
        return {
            ok: false,
            message,
        };
    }
}
