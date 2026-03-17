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

        const studentNameMatch = text.match(/([А-ЯЁа-яёA-Za-z\-]+\s+[А-ЯЁа-яёA-Za-z\-]+(?:\s+[А-ЯЁа-яёA-Za-z\-]+)?)\s*,?\s*именуемого\(ой\)\s+в\s+дальнейшем\s+[«"]Учащийся[»"]/u);
        const parentNameMatch = text.match(/([А-ЯЁа-яёA-Za-z\-]+\s+[А-ЯЁа-яёA-Za-z\-]+(?:\s+[А-ЯЁа-яёA-Za-z\-]+)?)\s*,?\s*именуем\S*\s+в\s+дальнейшем\s+[«"]Законный\s+представитель[»"]/u);
        const contractNumMatch = text.match(/ДОГОВОР\s*№\s*([\w\d\-\/]+)/u);
        // Phone from parent side (the last "Тел:" occurrence, which is in parent/requisites section)
        const allPhoneMatches = [...text.matchAll(/Тел[\s:.]*([0-9][0-9\s,]+)/g)];
        const parentPhoneMatch = allPhoneMatches.length > 0 ? allPhoneMatches[allPhoneMatches.length - 1] : null;

        const regexFullName = studentNameMatch ? studentNameMatch[1].trim() : "";
        const regexParentName = parentNameMatch ? parentNameMatch[1].trim() : "";
        const regexContractNumber = contractNumMatch ? contractNumMatch[1].trim() : "";
        // Take only the FIRST phone number from parent phone block (not the full comma-separated list)
        const regexPhone = parentPhoneMatch
            ? parentPhoneMatch[1].trim().split(/[,\s]+/)[0].trim()
            : "";

        console.log("[REGEX] fullName:", regexFullName);
        console.log("[REGEX] parentName:", regexParentName);
        console.log("[REGEX] contractNumber:", regexContractNumber);
        console.log("[REGEX] phone:", regexPhone);

        // === OLLAMA: Only for financial data (numbers) ===
        const ollamaBaseUrl = process.env.OLLAMA_URL || "http://localhost:11434";
        const model = "qwen2.5:latest";

        const systemPrompt = `You are a strict data extraction assistant. Extract ONLY financial data from the provided contract text.
Return ONLY valid JSON with the exact keys in the schema. If a field is missing, output 0 for numbers.`;

        // Only send the bottom portion with financial info to speed up LLM
        const financialText = text.length > 4000 ? text.substring(text.length - 4000) : text;
        console.log("SENDING TEXT LENGTH TO OLLAMA:", financialText.length);

        const ollamaRes = await fetch(`${ollamaBaseUrl}/api/chat`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
                model,
                messages: [
                    { role: "user", content: `${systemPrompt}\n\nContract financial section:\n\n${financialText}` }
                ],
                format: {
                    type: "object",
                    properties: {
                        basePrice: {
                            type: "number",
                            description: "Total contract price for the whole academic year (look for 'Общий контракт' or 'Стоимость обучения'). Output as a plain number, no spaces or currency symbols."
                        },
                        monthlyAmount: {
                            type: "number",
                            description: "Monthly payment amount. Look for the recurring equal payment amounts in the payment schedule table."
                        },
                        prepayment: {
                            type: "number",
                            description: "First/initial payment (Первоначальный взнос). The first amount in the payment schedule."
                        },
                        monthPayments: {
                            type: "object",
                            description: "A map of month numbers (as string keys '1'-'12') to amounts already paid. Only include months where payment is listed.",
                            additionalProperties: { type: "number" }
                        }
                    },
                    required: ["basePrice", "monthlyAmount", "prepayment", "monthPayments"]
                },
                stream: false,
                options: {
                    temperature: 0.1
                }
            })
        });

        if (!ollamaRes.ok) {
            const errorText = await ollamaRes.text();
            console.error("[Ollama Error]", ollamaRes.status, errorText);
            return NextResponse.json({ error: "Ошибка при работе с ИИ (Ollama)" }, { status: 500 });
        }

        const ollamaData = await ollamaRes.json();
        const messageContent = ollamaData.message?.content || "";
        console.log("OLLAMA RESPONSE:", messageContent);

        // Parse Ollama JSON (financial data only) and merge with regex-extracted fields
        let parsedJson: Record<string, unknown> = {};
        try {
            parsedJson = JSON.parse(messageContent);
        } catch (e) {
            console.error("Ollama returned invalid JSON:", messageContent);
            // Still continue - regex data is reliable, we'll just have 0s for financial
        }

        // Build the final merged payload: regex wins for names/contract/phone; LLM wins for financial
        const mergedData = {
            fullName: regexFullName,
            parentName: regexParentName,
            phone: regexPhone,
            contractNumber: regexContractNumber,
            basePrice: typeof parsedJson.basePrice === 'number' ? parsedJson.basePrice : 0,
            monthlyAmount: typeof parsedJson.monthlyAmount === 'number' ? parsedJson.monthlyAmount : 0,
            prepayment: typeof parsedJson.prepayment === 'number' ? parsedJson.prepayment : 0,
            monthPayments: typeof parsedJson.monthPayments === 'object' && parsedJson.monthPayments !== null ? parsedJson.monthPayments : {},
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
