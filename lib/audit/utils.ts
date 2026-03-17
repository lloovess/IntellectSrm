export interface AuditDiffItem {
    field: string;
    label: string;
    before: string;
    after: string;
}

const FIELD_LABELS: Record<string, string> = {
    amount: "Сумма",
    amountExpected: "Сумма платежа",
    amountPaid: "Оплачено",
    dueDate: "Срок оплаты",
    status: "Статус",
    label: "Назначение",
    basePrice: "Базовая цена",
    discountAmount: "Скидка",
    prepaymentAmount: "Предоплата",
    paymentMode: "Режим оплаты",
    startedAt: "Дата начала",
    contractNumber: "Номер договора",
    payerName: "Плательщик",
    payerPhone: "Телефон плательщика",
    source: "Источник оплаты",
    contractRemaining: "Остаток по договору",
    studentAdvanceBalance: "Аванс ученика",
};

function formatValue(value: unknown): string {
    if (value === null || value === undefined || value === "") return "—";
    if (typeof value === "number") {
        return value.toLocaleString("ru-RU", { maximumFractionDigits: 2 });
    }
    if (typeof value === "boolean") {
        return value ? "Да" : "Нет";
    }
    if (typeof value === "string") {
        return value;
    }
    return JSON.stringify(value);
}

export function buildAuditDiff(oldValue: unknown, newValue: unknown): AuditDiffItem[] {
    if (!oldValue || !newValue || typeof oldValue !== "object" || typeof newValue !== "object") {
        return [];
    }

    const beforeRecord = oldValue as Record<string, unknown>;
    const afterRecord = newValue as Record<string, unknown>;
    const keys = new Set([...Object.keys(beforeRecord), ...Object.keys(afterRecord)]);

    return [...keys]
        .filter((key) => JSON.stringify(beforeRecord[key]) !== JSON.stringify(afterRecord[key]))
        .map((key) => ({
            field: key,
            label: FIELD_LABELS[key] ?? key,
            before: formatValue(beforeRecord[key]),
            after: formatValue(afterRecord[key]),
        }));
}

export function summarizeAuditDiff(oldValue: unknown, newValue: unknown): string[] {
    return buildAuditDiff(oldValue, newValue).map(
        (item) => `${item.label}: ${item.before} -> ${item.after}`
    );
}
