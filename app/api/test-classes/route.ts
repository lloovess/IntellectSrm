import { NextResponse } from "next/server";
import { classRepository } from "@/lib/db/repositories/class.repo";

export const dynamic = 'force-dynamic';

export async function GET() {
    try {
        const classes = await classRepository.findAllActive();
        return NextResponse.json({ data: classes });
    } catch (err: unknown) {
        const errMsg = err instanceof Error ? err.message : "Unknown error";
        return NextResponse.json({ error: errMsg }, { status: 500 });
    }
}
