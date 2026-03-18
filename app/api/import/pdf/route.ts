import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

// @ts-expect-error - pdf-parse has poor typescript definitions
import pdfParse from "pdf-parse";
import * as mammoth from "mammoth";
import { pdfParsedDataSchema } from "@/lib/import/pdf";

export async function POST(req: NextRequest) {
    console.log("HELLO FROM PDF/DOCX ROUTE");
    // Auth check
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    try {
        const formData = await req.formData();
        const file = formData.get("file") as File | null;

        if (!file) return NextResponse.json({ error: "Файл не найден" }, { status: 400 });

        // Parse text based on file type
        const buffer = Buffer.from(await file.arrayBuffer());
        const fileName = file.name.toLowerCase();

        let text = "";
        try {
            if (fileName.endsWith(".docx") || fileName.endsWith(".doc")) {
                const result = await mammoth.extractRawText({ buffer });
                text = result.value;
            } else {
                const pdfData = await pdfParse(buffer);
                text = pdfData.text;
            }
        } catch (e) {
            console.error("Document Parsing error:", e);
            return NextResponse.json({ error: "Не удалось прочитать файл. " + String(e) }, { status: 400 });
        }

        if (!text || text.trim() === "") {
            return NextResponse.json({ error: "Не удалось извлечь текст из документа" }, { status: 400 });
        }

        console.log("EXTRACTED TEXT LENGTH:", text.length);
        console.log("EXTRACTED TEXT SNAPSHOT:", text.substring(0, 500));

        // === FAST REGEX EXTRACTION for structured, always-identical contract sections ===
        // Student name: comes RIGHT BEFORE "именуемого(ой) в дальнейшем «Учащийся»"
        // Parent name: comes RIGHT BEFORE "именуемый(-ая) в дальнейшем «Законный представитель»"
        // Contract number: comes RIGHT AFTER "ДОГОВОР №"
        // Phone: comes RIGHT AFTER "Тел:" in the parent (right) section

        // === REGEX EXTRACTION: All financial and personal data ===
        // Capture up to 4 words before "именуемого(ой)", then strip known prefixes
        const studentNameRaw = text.match(/([А-ЯЁа-яёA-Za-z\-]+(?:\s+[А-ЯЁа-яёA-Za-z\-]+){1,3})\s*,?\s*именуемого\(ой\)\s+в\s+дальнейшем\s+[«"]Учащийся[»"]/u);
        const parentNameRaw = text.match(/([А-ЯЁа-яёA-Za-z\-]+(?:\s+[А-ЯЁа-яёA-Za-z\-]+){1,3})\s*,?\s*именуем\S*\s+в\s+дальнейшем\s+[«"]Законный\s+представитель[»"]/u);
        const contractNumMatch = text.match(/ДОГОВОР\s*№\s*([\w\d\-\/]+)/u);

        // Phone from parent side (the last "Тел:" occurrence, which is in parent/requisites section)
        const allPhoneMatches = [...text.matchAll(/Тел[\s:.]*([0-9][0-9\s,]+)/g)];
        const parentPhoneMatch = allPhoneMatches.length > 0 ? allPhoneMatches[allPhoneMatches.length - 1] : null;

        // Strip known non-name prefixes (представителем, представителя, представитель, лице, etc.)
        const NON_NAME_PREFIXES = /^(?:представител\S*|законн\S*|лице|уполномоченн\S*)\s+/iu;
        function cleanName(raw: string): string {
            let name = raw.trim();
            // Remove known non-name words from beginning repeatedly
            let prev = "";
            while (prev !== name) {
                prev = name;
                name = name.replace(NON_NAME_PREFIXES, "").trim();
            }
            return name;
        }

        const regexFullName = studentNameRaw ? cleanName(studentNameRaw[1]) : "";
        const regexParentName = parentNameRaw ? cleanName(parentNameRaw[1]) : "";
        const regexContractNumber = contractNumMatch ? contractNumMatch[1].trim() : "";
        const regexPhone = parentPhoneMatch
            ? parentPhoneMatch[1].trim().split(/[,\s]+/)[0].trim()
            : "";

        // === FINANCIAL DATA EXTRACTION ===
        // Helper: extract number from matched text (handles spaces, dots, commas in numbers)
        function extractNumber(match: RegExpMatchArray | null, groupIndex = 1): number {
            if (!match) return 0;
            const raw = match[groupIndex];
            const cleaned = raw.replace(/[\s.,]/g, "");
            const num = parseInt(cleaned, 10);
            return isNaN(num) ? 0 : num;
        }

        // Base price: broader patterns for total tuition cost
        const basePricePatterns = [
            // "Общая стоимость обучения составляет 1 500 000"
            /(?:общ\S*\s+стоимост\S*|стоимость\s+обучени\S*|общая\s+сумм\S*)\s+(?:составля\S*\s+)?([\d\s.,]+)/iu,
            // "СТОИМОСТЬ ОБУЧЕНИЯ: 1500000" or "СТОИМОСТЬ ОБУЧЕНИЯ – 1 500 000"
            /СТОИМОСТ\S*\s+ОБУЧЕНИ\S*\s*[:\-–—]?\s*([\d\s.,]+)/u,
            // "стоимость ... обучения ... 1 500 000 тенге/тг"
            /стоимость[^.]{0,60}обучени\S*\s*[:\-–—]?\s*([\d\s.,]+)/iu,
            // "Базовая сумма: 1500000" or "Итого стоимость: 1500000"
            /(?:базов\S*\s+сумм\S*|итого\s+стоимость)\s*:?\s*([\d\s.,]+)/iu,
            // "стоимость ... услуг ... 1 500 000"
            /стоимость[^.]{0,60}услуг\S*\s*[:\-–—]?\s*([\d\s.,]+)/iu,
            // Fallback: just "1 500 000 (.*тенге)" - a large number followed by currency
            /([\d\s.,]{5,})\s*(?:\(?[а-яё]*тенге|тг|тңг)/iu,
        ];
        let basePrice = 0;
        for (const pattern of basePricePatterns) {
            const match = text.match(pattern);
            const val = extractNumber(match);
            if (val > 0) {
                basePrice = val;
                break;
            }
        }

        // Monthly payment: broader patterns
        const monthlyPatterns = [
            // "ежемесячного платежа ... 150 000"
            /ежемесячн\S*\s+платеж\S*\s*[:\-–—]?\s*([\d\s.,]+)/iu,
            // "оплата в месяц 150000" or "помесячная оплата 150000"
            /(?:оплата\s+в\s+месяц|помесячн\S*\s+оплат\S*)\s*[:\-–—]?\s*([\d\s.,]+)/iu,
            // "сумма ежемесячного ... 150 000"
            /сумм\S*\s+ежемесячн\S*[^.]{0,30}([\d\s.,]+)/iu,
            // "ежемесячно ... 150 000"
            /ежемесячно\s*[:\-–—]?\s*([\d\s.,]+)/iu,
            // "в размере 150 000 ... ежемесячно" (reversed order)
            /в\s+размере\s+([\d\s.,]+)[^.]{0,30}ежемесячно/iu,
        ];
        let monthlyAmount = 0;
        for (const pattern of monthlyPatterns) {
            const match = text.match(pattern);
            const val = extractNumber(match);
            if (val > 0) {
                monthlyAmount = val;
                break;
            }
        }

        // Prepayment: broader patterns
        const prepaymentPatterns = [
            /(?:первоначальн\S*\s+взнос|первый\s+платеж|авансов\S*\s+платеж)\s*[:\-–—]?\s*([\d\s.,]+)/iu,
            /(?:взнос\s+за\s+первый\s+месяц|предоплат\S*)\s*[:\-–—]?\s*([\d\s.,]+)/iu,
            /(?:первый\s+взнос)\s*[:\-–—]?\s*([\d\s.,]+)/iu,
        ];
        let prepayment = 0;
        for (const pattern of prepaymentPatterns) {
            const match = text.match(pattern);
            const val = extractNumber(match);
            if (val > 0) {
                prepayment = val;
                break;
            }
        }
        // Fallback: if we have basePrice and monthly but no prepayment, try to calculate
        if (prepayment === 0 && basePrice > 0 && monthlyAmount > 0) {
            const calculated = basePrice - (monthlyAmount * 11);
            prepayment = calculated > 0 ? calculated : 0;
        }

        // === PAYMENT SCHEDULE EXTRACTION ===
        // Look for payment table: Month | Amount pattern
        // Handles formats like "Сентябрь 150000" or "1 месяц 150000" or "09.2025 150000"
        const monthPayments: Record<string, number> = {};
        const monthNames: Record<string, string> = {
            "январ": "1", "февр": "2", "март": "3", "апрель": "4", "май": "5", "июнь": "6",
            "июль": "7", "август": "8", "сентябр": "9", "октябр": "10", "ноябр": "11", "декабр": "12",
            "янв": "1", "фев": "2", "мар": "3", "апр": "4", "июн": "6",
            "июл": "7", "авг": "8", "сен": "9", "окт": "10", "ноя": "11", "дек": "12"
        };

        // Pattern 1: Month name followed by amount (e.g., "Сентябрь 150000")
        const monthNameMatches = [...text.matchAll(
            /(?:^|\n|Месяц\s+)([А-Яа-яЁё]+)\s+(\d+[\d\s,]*)/gm
        )];
        for (const match of monthNameMatches) {
            const monthName = match[1].toLowerCase();
            for (const [key, num] of Object.entries(monthNames)) {
                if (monthName.includes(key)) {
                    const amount = parseInt(match[2].replace(/\s|,/g, ""));
                    if (amount > 0) monthPayments[num] = amount;
                    break;
                }
            }
        }

        // Pattern 2: Numeric month (1-12) with amount (e.g., "1 150000" or "01. 150000")
        const numericMonthMatches = [...text.matchAll(
            /(?:^|\n|\s)(?:месяц\s+)?(\d{1,2})[.\s]*(?:месяц)?[:\s]+(\d+[\d\s,]*)/gm
        )];
        for (const match of numericMonthMatches) {
            const monthNum = match[1].padStart(1, "");
            const amount = parseInt(match[2].replace(/\s|,/g, ""));
            if (parseInt(monthNum) >= 1 && parseInt(monthNum) <= 12 && amount > 0) {
                monthPayments[monthNum] = amount;
            }
        }

        // If no schedule found but we have regular monthly payments, generate standard schedule
        if (Object.keys(monthPayments).length === 0 && monthlyAmount > 0) {
            for (let i = 1; i <= 12; i++) {
                monthPayments[i.toString()] = monthlyAmount;
            }
        }

        console.log("[REGEX] fullName:", regexFullName);
        console.log("[REGEX] parentName:", regexParentName);
        console.log("[REGEX] contractNumber:", regexContractNumber);
        console.log("[REGEX] phone:", regexPhone);
        console.log("[REGEX] basePrice:", basePrice);
        console.log("[REGEX] monthlyAmount:", monthlyAmount);
        console.log("[REGEX] prepayment:", prepayment);
        console.log("[REGEX] monthPayments:", monthPayments);

        // === PURE REGEX-BASED EXTRACTION ===
        // All data extracted via regex patterns - fast, reliable, and no dependencies on external LLM services
        const mergedData = {
            fullName: regexFullName,
            parentName: regexParentName,
            phone: regexPhone,
            contractNumber: regexContractNumber,
            basePrice,
            monthlyAmount,
            prepayment,
            monthPayments,
        };

        const validation = pdfParsedDataSchema.safeParse(mergedData);
        if (validation.success) {
            return NextResponse.json(validation.data);
        }

        console.error("Zod validation failed:", validation.error.format());
        return NextResponse.json({ error: "Не удалось распознать обязательные поля" }, { status: 500 });
    } catch (err) {
        console.error("[import pdf] Error:", err);
        return NextResponse.json(
            { error: err instanceof Error ? err.message : "Неизвестная ошибка" },
            { status: 500 }
        );
    }
}
