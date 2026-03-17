import { z } from "zod";
import { KZ_MONTHS } from "./csv";

export const pdfParsedDataSchema = z.object({
    fullName: z.string().catch("").default(""),
    parentName: z.string().catch("").default(""),
    phone: z.string().catch("").default(""),
    contractNumber: z.string().catch("").default(""),
    basePrice: z.number().min(0).catch(0).default(0),
    monthlyAmount: z.number().min(0).catch(0).default(0),
    prepayment: z.number().min(0).catch(0).default(0),
    monthPayments: z.record(z.string(), z.number().min(0).catch(0)).catch({}).default({}),
});

export type PdfParsedData = z.infer<typeof pdfParsedDataSchema>;
