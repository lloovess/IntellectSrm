import { NextRequest, NextResponse } from "next/server";
import { requireAuth } from "@/lib/auth/session";
import { checkPermission } from "@/lib/auth/guard";
import { ClassManagementService } from "@/lib/services/class-management.service";
import { createClassSchema } from "@/lib/validators/class.schema";

export async function GET(request: NextRequest) {
    try {
        await requireAuth();

        // Query parameters: branchId, academicYearId
        const branchId = request.nextUrl.searchParams.get("branchId");
        const academicYearId = request.nextUrl.searchParams.get("academicYearId");

        let classes;

        if (branchId && academicYearId) {
            // Get classes for specific branch and year with availability info
            classes =
                await ClassManagementService.getClassesWithAvailability(
                    branchId,
                    academicYearId
                );
        } else {
            // Get all active classes
            classes = await ClassManagementService.getAllClasses();
        }

        return NextResponse.json({ data: classes });
    } catch (err: unknown) {
        const errMsg = err instanceof Error ? err.message : "Unknown error";
        console.error("API CLASSES ERROR:", err);
        return NextResponse.json(
            { error: errMsg || "Ошибка при получении классов" },
            { status: 500 }
        );
    }
}

export async function POST(request: NextRequest) {
    try {
        const { role } = await requireAuth();
        if (!checkPermission(role, "classes.write")) {
            return NextResponse.json(
                { error: "Forbidden" },
                { status: 403 }
            );
        }

        const body = await request.json();
        const data = createClassSchema.parse(body);

        const classData = await ClassManagementService.createClass(data);

        return NextResponse.json(
            { data: classData },
            { status: 201 }
        );
    } catch (error) {
        const message =
            error instanceof Error ? error.message : "Unknown error";
        return NextResponse.json(
            { error: message },
            { status: 400 }
        );
    }
}
