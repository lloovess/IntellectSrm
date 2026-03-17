"use client";

import { Download } from "lucide-react";
import { formatMoney } from "@/lib/format";
import type { DebtorRow } from "@/lib/finance-store";

interface ExportDebtorsBtnProps {
    debtors: DebtorRow[];
}

export function ExportDebtorsBtn({ debtors }: ExportDebtorsBtnProps) {
    const handleExport = () => {
        // 1. Prepare CSV headers
        const headers = ["ФИО Ученика", "Филиал", "Телефон", "Месяц / Назначение", "Дедлайн (YYYY-MM-DD)", "Общая Сумма", "Оплачено", "Сумма Долга"];

        // 2. Prepare CSV rows
        const rows = debtors.map(d => [
            `"${d.studentName ?? ""}"`,
            `"${d.branchName ?? ""}"`,
            `"${d.phone ?? ""}"`,
            `"${d.label ?? ""}"`,
            `"${d.dueDate}"`,
            d.amount,
            d.paidAmount,
            d.debtAmount
        ]);

        // 3. Construct CSV content
        const csvContent = [
            headers.join(","),
            ...rows.map(r => r.join(","))
        ].join("\n");

        // 4. Create and trigger download
        const blob = new Blob(["\ufeff" + csvContent], { type: "text/csv;charset=utf-8;" });
        const url = URL.createObjectURL(blob);
        const a = document.createElement("a");
        a.href = url;
        a.download = `debtors_report_${new Date().toISOString().slice(0, 10)}.csv`;
        a.click();
        URL.revokeObjectURL(url);
    };

    return (
        <button onClick={handleExport} className="btn primary flex items-center gap-2">
            <Download className="w-4 h-4" />
            Экспорт в CSV
        </button>
    );
}
