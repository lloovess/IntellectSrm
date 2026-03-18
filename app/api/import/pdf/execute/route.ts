import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/server";
import { importBatch } from "@/lib/services/import.service";
import { type ValidatedRow } from "@/lib/import/csv";
import { pdfParsedDataSchema } from "@/lib/import/pdf";
import { z } from "zod";

const executeSchema = z.object({
    branchId: z.string(),
    classId: z.string(),
    academicYearId: z.string(),
    parsedData: pdfParsedDataSchema
});

export async function POST(req: NextRequest) {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    try {
        const body = await req.json();
        const parsedBody = executeSchema.safeParse(body);

        if (!parsedBody.success) {
            console.error("[import pdf execute] Validation failed:", parsedBody.error.format());
            return NextResponse.json({ error: "Неверные данные для импорта", details: parsedBody.error }, { status: 400 });
        }

        const { branchId, classId, academicYearId, parsedData } = parsedBody.data;

        // Look up class name (grade) and academic year string from database
        const admin = await createAdminClient();
        
        const { data: classData, error: classError } = await admin
            .from("classes")
            .select("name, academic_year")
            .eq("id", classId)
            .single();

        if (classError || !classData) {
            return NextResponse.json(
                { error: "Класс не найден" },
                { status: 400 }
            );
        }

        let academicYear = classData.academic_year;
        
        // If class has no academicYear, look up from academic_years table
        if (!academicYear) {
            const { data: yearData } = await admin
                .from("academic_years")
                .select("name")
                .eq("id", academicYearId)
                .single();
            academicYear = yearData?.name || "";
        }

        const grade = classData.name; // e.g., "5А"

        // Map PdfParsedData to the ParsedStudentRow expected by importBatch
        const validRow: ValidatedRow = {
            rowIndex: 0,
            raw: {}, // not needed for the actual DB insertion since it uses parsed
            valid: true,
            errors: [],
            parsed: {
                fullName: parsedData.fullName,
                parentName: parsedData.parentName,
                phone: parsedData.phone,
                contractNumber: parsedData.contractNumber,
                basePrice: parsedData.basePrice,
                monthlyAmount: parsedData.monthlyAmount,
                prepayment: parsedData.prepayment,
                monthPayments: parsedData.monthPayments,
            }
        };

        const result = await importBatch([validRow], branchId, grade, academicYear, user.email ?? "system");
        return NextResponse.json(result);

    } catch (err) {
        console.error("[import pdf execute] Error:", err);
        return NextResponse.json(
            { error: err instanceof Error ? err.message : "Неизвестная ошибка" },
            { status: 500 }
        );
    }
}
