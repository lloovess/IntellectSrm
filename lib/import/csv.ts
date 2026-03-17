export type RawRow = Record<string, string>;

export interface ColumnMapping {
  fullName: string | null;
  phone: string | null;
  contractNumber: string | null;
  basePrice: string | null;
  monthlyAmount: string | null;
  prepayment: string | null;
  months: Record<string, string>;
}

export interface ParsedStudentRow {
  fullName: string;
  parentName?: string;
  phone: string;
  contractNumber: string;
  basePrice: number;
  monthlyAmount: number;
  prepayment: number;
  monthPayments: Record<string, number>;
}

export interface ValidatedRow {
  rowIndex: number;
  raw: RawRow;
  valid: boolean;
  errors: string[];
  parsed?: ParsedStudentRow;
}

export interface ImportResult {
  imported: number;
  skipped: number;
  errors: Array<{ row: number; error: string }>;
}

export const KZ_MONTHS = [
  "Сентябрь",
  "Октябрь",
  "Ноябрь",
  "Декабрь",
  "Январь",
  "Февраль",
  "Март",
  "Апрель",
  "Май",
  "Июнь",
] as const;

function norm(s: string) {
  return s.toLowerCase().replace(/[^a-zа-яё0-9]/gi, "").trim();
}

const MONTH_ALIASES: Record<string, string> = {
  "сентябрь": "Сентябрь",
  "сен": "Сентябрь",
  "sep": "Сентябрь",
  "september": "Сентябрь",
  "октябрь": "Октябрь",
  "окт": "Октябрь",
  "oct": "Октябрь",
  "october": "Октябрь",
  "ноябрь": "Ноябрь",
  "ноя": "Ноябрь",
  "nov": "Ноябрь",
  "november": "Ноябрь",
  "декабрь": "Декабрь",
  "дек": "Декабрь",
  "dec": "Декабрь",
  "december": "Декабрь",
  "январь": "Январь",
  "янв": "Январь",
  "jan": "Январь",
  "january": "Январь",
  "февраль": "Февраль",
  "фев": "Февраль",
  "feb": "Февраль",
  "february": "Февраль",
  "март": "Март",
  "mar": "Март",
  "march": "Март",
  "апрель": "Апрель",
  "апр": "Апрель",
  "apr": "Апрель",
  "april": "Апрель",
  "май": "Май",
  "may": "Май",
  "июнь": "Июнь",
  "июн": "Июнь",
  "jun": "Июнь",
  "june": "Июнь",
};

export function parseCSV(text: string): { headers: string[]; rows: RawRow[] } {
  const lines = text
    .replace(/\r\n/g, "\n")
    .replace(/\r/g, "\n")
    .split("\n")
    .filter((l) => l.trim());
  if (lines.length < 2) return { headers: [], rows: [] };

  const parseRow = (line: string): string[] => {
    const result: string[] = [];
    let cur = "";
    let inQuotes = false;
    for (let i = 0; i < line.length; i++) {
      const ch = line[i];
      if (ch === '"') {
        if (inQuotes && line[i + 1] === '"') {
          cur += '"';
          i++;
        } else {
          inQuotes = !inQuotes;
        }
      } else if (ch === "," && !inQuotes) {
        result.push(cur.trim());
        cur = "";
      } else {
        cur += ch;
      }
    }
    result.push(cur.trim());
    return result;
  };

  const headers = parseRow(lines[0]);
  const rows: RawRow[] = [];
  for (let i = 1; i < lines.length; i++) {
    const vals = parseRow(lines[i]);
    if (vals.every((v) => !v)) continue;
    const row: RawRow = {};
    headers.forEach((h, idx) => {
      row[h] = vals[idx] ?? "";
    });
    rows.push(row);
  }
  return { headers, rows };
}

export function detectColumns(headers: string[]): ColumnMapping {
  const mapping: ColumnMapping = {
    fullName: null,
    phone: null,
    contractNumber: null,
    basePrice: null,
    monthlyAmount: null,
    prepayment: null,
    months: {},
  };

  for (const h of headers) {
    const n = norm(h);
    if (!mapping.fullName && /фио|имя|name|fullname/.test(n)) mapping.fullName = h;
    else if (!mapping.phone && /телефон|phone|тел/.test(n)) mapping.phone = h;
    else if (!mapping.contractNumber && /договор|contract|номер/.test(n)) mapping.contractNumber = h;
    else if (!mapping.basePrice && /скидк|baseprice|суммасоскидкой|оплатасоскидкой/.test(n)) mapping.basePrice = h;
    else if (!mapping.monthlyAmount && /мес|monthly|оплатамес/.test(n)) mapping.monthlyAmount = h;
    else if (!mapping.prepayment && /взнос|prepay|первыйвзнос/.test(n)) mapping.prepayment = h;
    else {
      const monthKey = MONTH_ALIASES[n];
      if (monthKey && !mapping.months[monthKey]) mapping.months[monthKey] = h;
    }
  }

  return mapping;
}

export function autoDetectScore(mapping: ColumnMapping): number {
  const required = [mapping.fullName, mapping.phone, mapping.basePrice, mapping.monthlyAmount];
  const detected = required.filter(Boolean).length;
  const months = Object.keys(mapping.months).length;
  return Math.round(((detected + months) / (4 + 10)) * 100);
}

export function validateRows(rows: RawRow[], mapping: ColumnMapping): ValidatedRow[] {
  return rows.map((raw, idx) => {
    const errors: string[] = [];

    const fullName = mapping.fullName ? raw[mapping.fullName]?.trim() : "";
    const phone = mapping.phone ? raw[mapping.phone]?.trim() : "";
    const basePrice = parseFloat((mapping.basePrice ? raw[mapping.basePrice] : "0")?.replace(/[^\d.]/g, "") || "0");
    const monthlyAmount = parseFloat((mapping.monthlyAmount ? raw[mapping.monthlyAmount] : "0")?.replace(/[^\d.]/g, "") || "0");
    const prepayment = parseFloat((mapping.prepayment ? raw[mapping.prepayment] : "0")?.replace(/[^\d.]/g, "") || "0");
    const contractNumber = mapping.contractNumber ? raw[mapping.contractNumber]?.trim() : "";

    if (!fullName) errors.push("ФИО обязательно");
    if (!phone) errors.push("Телефон обязателен");
    if (isNaN(basePrice) || basePrice <= 0) errors.push("Сумма договора должна быть > 0");

    const monthPayments: Record<string, number> = {};
    for (const [label, col] of Object.entries(mapping.months)) {
      const val = parseFloat(raw[col]?.replace(/[^\d.]/g, "") || "0");
      if (!isNaN(val) && val > 0) monthPayments[label] = val;
    }

    const valid = errors.length === 0;
    const parsed: ParsedStudentRow | undefined = valid
      ? {
        fullName: fullName!,
        phone: phone!,
        contractNumber: contractNumber || "",
        basePrice,
        monthlyAmount: isNaN(monthlyAmount) ? 0 : monthlyAmount,
        prepayment: isNaN(prepayment) ? 0 : prepayment,
        monthPayments,
      }
      : undefined;

    return { rowIndex: idx + 2, raw, valid, errors, parsed };
  });
}
