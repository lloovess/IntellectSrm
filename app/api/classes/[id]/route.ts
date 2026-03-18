import { NextRequest, NextResponse } from "next/server";
import { requireAuth } from "@/lib/auth/session";
import { checkPermission } from "@/lib/auth/guard";
import { ClassManagementService } from "@/lib/services/class-management.service";
import { updateClassSchema } from "@/lib/validators/class.schema";

export async function GET(
    _request: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        await requireAuth();

        const resolvedParams = await params;
        const classData = await ClassManagementService.getClassById(resolvedParams.id);

        return NextResponse.json({ data: classData });
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
        if (!checkPermission(role, "classes.write")) {
            return NextResponse.json(
                { error: "Forbidden" },
                { status: 403 }
            );
        }

        const body = await request.json();
        const data = updateClassSchema.parse(body);

        const resolvedParams = await params;
        const classData = await ClassManagementService.updateClass(
            resolvedParams.id,
            data
        );

        return NextResponse.json({ data: classData });
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
        if (!checkPermission(role, "classes.write")) {
            return NextResponse.json(
                { error: "Forbidden" },
                { status: 403 }
            );
        }

        const resolvedParams = await params;
        await ClassManagementService.deleteClass(resolvedParams.id);

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
