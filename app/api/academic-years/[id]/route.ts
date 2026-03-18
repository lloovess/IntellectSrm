import { NextRequest, NextResponse } from "next/server";
import { requireAuth } from "@/lib/auth/session";
import { checkPermission } from "@/lib/auth/guard";
import { AcademicYearService } from "@/lib/services/academic-year.service";
import { updateAcademicYearSchema } from "@/lib/validators/academic-year.schema";

export async function GET(
    _request: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const { role } = await requireAuth();
        if (!checkPermission(role, "settings.manage")) {
            return NextResponse.json(
                { error: "Forbidden" },
                { status: 403 }
            );
        }

        const resolvedParams = await params;
        const academicYear = await AcademicYearService.getAcademicYearById(
            resolvedParams.id
        );

        return NextResponse.json({ data: academicYear });
    } catch (error) {
        const message =
            error instanceof Error ? error.message : "Unknown error";
        return NextResponse.json(
            { error: message },
            { status: 400 }
        );
    }
}

export async function PATCH(
    request: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const { role } = await requireAuth();
        if (!checkPermission(role, "settings.manage")) {
            return NextResponse.json(
                { error: "Forbidden" },
                { status: 403 }
            );
        }

        const body = await request.json();
        const data = updateAcademicYearSchema.parse(body);

        const resolvedParams = await params;
        const academicYear =
            await AcademicYearService.updateAcademicYear(resolvedParams.id, data);

        return NextResponse.json({ data: academicYear });
    } catch (error) {
        const message =
            error instanceof Error ? error.message : "Unknown error";
        return NextResponse.json(
            { error: message },
            { status: 400 }
        );
    }
}

export async function DELETE(
    _request: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const { role } = await requireAuth();
        if (!checkPermission(role, "settings.manage")) {
            return NextResponse.json(
                { error: "Forbidden" },
                { status: 403 }
            );
        }

        const resolvedParams = await params;
        await AcademicYearService.deleteAcademicYear(resolvedParams.id);

        return NextResponse.json({ data: null });
    } catch (error) {
        const message =
            error instanceof Error ? error.message : "Unknown error";
        return NextResponse.json(
            { error: message },
            { status: 400 }
        );
    }
}
