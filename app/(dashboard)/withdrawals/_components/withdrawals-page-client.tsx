"use client";

import { useState } from "react";
import { WithdrawalList } from "./withdrawal-list";
import { CreateWithdrawalDialog } from "./create-withdrawal-dialog";

interface Enrollment {
    id: string;
    grade: string;
    academicYear: string;
    branchName: string;
    studentName: string;
    studentPhone: string;
}

interface WithdrawalsPageClientProps {
    list: Parameters<typeof WithdrawalList>[0]["list"];
    canApprove: boolean;
    enrollments: Enrollment[];
}

export function WithdrawalsPageClient({ list, canApprove, enrollments }: WithdrawalsPageClientProps) {
    const [showCreate, setShowCreate] = useState(false);

    return (
        <>
            <WithdrawalList
                list={list}
                canApprove={canApprove}
                onNew={() => setShowCreate(true)}
            />
            {showCreate && (
                <CreateWithdrawalDialog
                    enrollments={enrollments}
                    onClose={() => setShowCreate(false)}
                />
            )}
        </>
    );
}
