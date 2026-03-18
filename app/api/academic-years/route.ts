import { NextRequest, NextResponse } from "next/server";
import { requireAuth } from "@/lib/auth/session";
import { checkPermission } from "@/lib/auth/guard";
import { AcademicYearService } from "@/lib/services/academic-year.service";
import { createAcademicYearSchema } from "@/lib/validators/academic-year.schema";

export async function GET() {
    try {
        const { role } = await requireAuth();
        if (!checkPermission(role, "settings.manage")) {
            return NextResponse.json(
                { error: "Forbidden" },
                { status: 403 }
            );
        }

        const academicYears =
            await AcademicYearService.getAllAcademicYears();

        return NextResponse.json({ data: academicYears });
    } catch (error) {
        const message =
            error instanceof Error ? error.message : "Unknown error";
        return NextResponse.json(
            { error: message },
            { status: 500 }
        );
    }
}

export async function POST(request: NextRequest) {
    try {
        const { role } = await requireAuth();
        if (!checkPermission(role, "settings.manage")) {
            return NextResponse.json(
                { error: "Forbidden" },
                { status: 403 }
            );
        }

        const body = await request.json();
        const data = createAcademicYearSchema.parse(body);

        const academicYear =
            await AcademicYearService.createAcademicYear(data);

        return NextResponse.json(
            { data: academicYear },
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
