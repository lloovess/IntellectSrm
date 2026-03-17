import { NextRequest, NextResponse } from "next/server";
import { requireAuth } from "@/lib/auth/session";
import { paymentService } from "@/lib/services/payment.service";

export async function GET(req: NextRequest) {
    try {
        const { role } = await requireAuth();
        const itemId = req.nextUrl.searchParams.get("itemId");
        if (!itemId) {
            return NextResponse.json({ error: "itemId required" }, { status: 400 });
        }

        const transactions = await paymentService.getTransactionsByItem(itemId, role);
        return NextResponse.json(transactions);
    } catch {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
}
