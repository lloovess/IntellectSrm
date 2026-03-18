import { NextRequest, NextResponse } from "next/server";
import { requireAuth } from "@/lib/auth/session";
import { ClassManagementService } from "@/lib/services/class-management.service";

export async function GET(request: NextRequest) {
    try {
        await requireAuth();

        const classId = request.nextUrl.searchParams.get("classId");

        if (!classId) {
            return NextResponse.json(
                { error: "classId is required" },
                { status: 400 }
            );
        }

        const stats = await ClassManagementService.getClassStatistics(classId);

        return NextResponse.json({ data: stats });
    } catch (error) {
        const message =
            error instanceof Error ? error.message : "Unknown error";
        return NextResponse.json(
            { error: message },
            { status: 400 }
        );
    }
}
