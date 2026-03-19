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
        // Parent name: try the «Законный представитель» pattern first,
        // then fallback to "ФИО:" in the Родитель/requisites section (nominative case)
        let regexParentName = parentNameRaw ? cleanName(parentNameRaw[1]) : "";
        
        // Better parent name: look for "ФИО:" after "Родитель" section header
        const parentFioMatch = text.match(/Родитель[\s\S]{0,200}ФИО\s*:\s*([\u0410-\u042f\u0401][\u0410-\u042f\u0401\u0430-\u044f\u0451A-Za-z\-]+\s+[\u0410-\u042f\u0401\u0430-\u044f\u0451A-Za-z\-]+(?:\s+[\u0410-\u042f\u0401\u0430-\u044f\u0451A-Za-z\-]+)?)/u);
        if (parentFioMatch) {
            regexParentName = parentFioMatch[1].trim();
        }
        
        const regexContractNumber = contractNumMatch ? contractNumMatch[1].trim() : "";
        const regexPhone = parentPhoneMatch
            ? parentPhoneMatch[1].trim().split(/[,\s]+/)[0].trim()
            : "";

        // === FINANCIAL DATA EXTRACTION ===
        // Helper: extract number from matched text (handles spaces in numbers like "450 000")
        // Requires at least 4 digits to avoid matching section numbers like "3.1" → 31
        function extractNumber(match: RegExpMatchArray | null, groupIndex = 1): number {
            if (!match) return 0;
            const raw = match[groupIndex];
            // Only strip spaces (not dots — dots are used in section numbers like "3.1")
            const cleaned = raw.replace(/\s/g, "").replace(/,/g, "");
            const num = parseInt(cleaned, 10);
            // Minimum 4 digits to be a valid financial amount (>= 1000)
            return isNaN(num) || num < 1000 ? 0 : num;
        }

        // Base price: patterns for total tuition cost
        const basePricePatterns = [
            // "Общий контракт за обучение составляет 450 000" — MAIN pattern for this school
            /контракт[^.]{0,80}обучени\S*\s+составля\S*\s+([\d\s]+)/iu,
            // "Общая стоимость обучения составляет 450 000"
            /(?:общ\S*\s+стоимост\S*|общая\s+сумм\S*)[^.]{0,40}составля\S*\s+([\d\s]+)/iu,
            // "стоимость обучения: 450000" / "стоимость обучения – 450 000"
            /стоимост\S*\s+обучени\S*\s*[:\-–—]?\s*([\d\s]+)/iu,
            // "СТОИМОСТЬ И ПОРЯДОК" section: look for "составляет NUMBER" nearby
            /составля\S*\s+([\d\s]{5,})\s*(?:\([^)]+\))?\s*(?:сом|тенге|тг)/iu,
            // "Базовая сумма" / "Итого стоимость"
            /(?:базов\S*\s+сумм\S*|итого\s+стоимость)\s*:?\s*([\d\s]+)/iu,
            // Fallback: NUMBER followed by currency word "сом" or "тенге"
            /([\d\s]{5,})\s*(?:\([^)]+\))?\s*(?:сом|тенге|тг)\b/iu,
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

        // === PAYMENT SCHEDULE TABLE EXTRACTION ===
        // Parse structured table: rows like "1  5 марта 2026  135 000  Первоначальный взнос"
        // or "2  До 05 сентября 2026  45 000"
        const scheduleRows: Array<{ amount: number; isPrepayment: boolean; monthName: string }> = [];

        // Pattern: table row with date and amount — "До 05 сентября 2026  45 000" or "5 марта 2026  135 000"
        const tableRowMatches = [...text.matchAll(
            /(?:до\s+)?(\d{1,2})\s+([а-яёА-ЯЁ]+)\s+(\d{4})\s+([\d\s]+?)(?:\s|$|[А-Яа-яЁё])/giu
        )];

        const monthNames: Record<string, string> = {
            "январ": "Январь", "февр": "Февраль", "март": "Март", "апрел": "Апрель",
            "май": "Май", "мая": "Май", "июн": "Июнь", "июл": "Июль",
            "август": "Август", "сентябр": "Сентябрь", "октябр": "Октябрь",
            "ноябр": "Ноябрь", "декабр": "Декабрь",
        };

        for (const match of tableRowMatches) {
            const monthWord = match[2].toLowerCase();
            const amountRaw = match[4].replace(/\s/g, "");
            const amount = parseInt(amountRaw, 10);

            if (isNaN(amount) || amount < 1000) continue;

            // Determine month name
            let resolvedMonth = "";
            for (const [prefix, name] of Object.entries(monthNames)) {
                if (monthWord.startsWith(prefix)) {
                    resolvedMonth = name;
                    break;
                }
            }

            // Check if this row is the prepayment (by looking at context after the amount)
            const fullMatchEnd = (match.index ?? 0) + match[0].length;
            const contextAfter = text.substring(fullMatchEnd - 1, fullMatchEnd + 80).toLowerCase();
            const isPrepayment = /первоначальн|взнос|предоплат|задаток/.test(contextAfter);

            scheduleRows.push({ amount, isPrepayment, monthName: resolvedMonth });
        }

        console.log("[SCHEDULE] Parsed rows:", scheduleRows);

        // Extract prepayment from schedule (row marked as prepayment)
        let prepayment = 0;
        const prepaymentRow = scheduleRows.find(r => r.isPrepayment);
        if (prepaymentRow) {
            prepayment = prepaymentRow.amount;
        }

        // If no prepayment found from schedule, try regex patterns
        if (prepayment === 0) {
            const prepaymentPatterns = [
                /(?:первоначальн\S*\s+взнос|первый\s+платеж|авансов\S*\s+платеж)\s*[:\-–—]?\s*([\d\s]+)/iu,
                /(?:взнос\s+за\s+первый\s+месяц|предоплат\S*)\s*[:\-–—]?\s*([\d\s]+)/iu,
                /(?:первый\s+взнос)\s*[:\-–—]?\s*([\d\s]+)/iu,
                /задаток[^.]{0,40}([\d\s]{5,})/iu,
            ];
            for (const pattern of prepaymentPatterns) {
                const match = text.match(pattern);
                const val = extractNumber(match);
                if (val > 0) {
                    prepayment = val;
                    break;
                }
            }
        }

        // Monthly payment: derive from schedule (non-prepayment rows, most common amount)
        const regularRows = scheduleRows.filter(r => !r.isPrepayment);
        let monthlyAmount = 0;
        if (regularRows.length > 0) {
            // Use the most frequent amount as monthly
            const amountCounts = new Map<number, number>();
            for (const row of regularRows) {
                amountCounts.set(row.amount, (amountCounts.get(row.amount) || 0) + 1);
            }
            let maxCount = 0;
            for (const [amount, count] of amountCounts) {
                if (count > maxCount) {
                    maxCount = count;
                    monthlyAmount = amount;
                }
            }
        }

        // If no monthly from schedule, try regex patterns
        if (monthlyAmount === 0) {
            const monthlyPatterns = [
                /ежемесячн\S*\s+платеж\S*\s*[:\-–—]?\s*([\d\s]+)/iu,
                /(?:оплата\s+в\s+месяц|помесячн\S*\s+оплат\S*)\s*[:\-–—]?\s*([\d\s]+)/iu,
                /ежемесячно\s*[:\-–—]?\s*([\d\s]+)/iu,
            ];
            for (const pattern of monthlyPatterns) {
                const match = text.match(pattern);
                const val = extractNumber(match);
                if (val > 0) {
                    monthlyAmount = val;
                    break;
                }
            }
        }

        // Fallback prepayment calculation
        if (prepayment === 0 && basePrice > 0 && monthlyAmount > 0) {
            const calculated = basePrice - (monthlyAmount * regularRows.length);
            prepayment = calculated > 0 ? calculated : 0;
        }

        // === BUILD MONTH PAYMENTS MAP ===
        // Map schedule rows to month label → amount
        const monthPayments: Record<string, number> = {};
        for (const row of regularRows) {
            if (row.monthName) {
                monthPayments[row.monthName] = row.amount;
            }
        }

        // If no schedule found but we have regular monthly payments, generate standard schedule
        if (Object.keys(monthPayments).length === 0 && monthlyAmount > 0) {
            const defaultMonths = ["Сентябрь", "Октябрь", "Ноябрь", "Декабрь", "Январь", "Февраль", "Март", "Апрель", "Май", "Июнь"];
            for (const m of defaultMonths) {
                monthPayments[m] = monthlyAmount;
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
