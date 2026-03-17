import { NextResponse } from "next/server";
import { classRepository } from "@/lib/db/repositories/class.repo";
import { requireAuth } from "@/lib/auth/session";

export async function GET(request: Request) {
    try {
        await requireAuth();
        const classes = await classRepository.findAllActive();

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
