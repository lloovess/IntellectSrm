import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { withdrawalRepository } from "@/lib/db/repositories/withdrawal.repo";

export async function GET(req: NextRequest) {
    // Auth check
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const enrollmentId = req.nextUrl.searchParams.get("enrollmentId");
    if (!enrollmentId) return NextResponse.json({ error: "enrollmentId required" }, { status: 400 });

    try {
        const settlement = await withdrawalRepository.calculateSettlement(enrollmentId);
        return NextResponse.json(settlement);
    } catch (err) {
        return NextResponse.json({ error: err instanceof Error ? err.message : "Error" }, { status: 500 });
    }
}
