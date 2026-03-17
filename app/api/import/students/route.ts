import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { parseCSV, validateRows } from "@/lib/import/csv";
import { importBatch, importConfigSchema } from "@/lib/services/import.service";

export async function POST(req: NextRequest) {
    // Auth check
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    try {
        const formData = await req.formData();
        const file = formData.get("file") as File | null;
        const configRaw = formData.get("config") as string | null;

        if (!file) return NextResponse.json({ error: "Файл не найден" }, { status: 400 });
        if (!configRaw) return NextResponse.json({ error: "Конфигурация импорта не указана" }, { status: 400 });

        const configParsed = importConfigSchema.safeParse(JSON.parse(configRaw));
        if (!configParsed.success) {
            return NextResponse.json({ error: configParsed.error.issues[0].message }, { status: 400 });
        }
        const config = configParsed.data;
        // Cast Zod-inferred mapping months (Record<string,unknown>) to Record<string,string>
        const mapping = {
            ...config.mapping,
            months: config.mapping.months as Record<string, string>,
        };

        const text = await file.text();
        const { rows } = parseCSV(text);
        const validated = validateRows(rows, mapping);
        const result = await importBatch(
            validated,
            config.branchId,
            config.grade,
            config.academicYear,
            user.email ?? "system"
        );

        return NextResponse.json(result);
    } catch (err) {
        console.error("[import] Error:", err);
        return NextResponse.json(
            { error: err instanceof Error ? err.message : "Неизвестная ошибка" },
            { status: 500 }
        );
    }
}
