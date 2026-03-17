import { createAdminClient } from "@/lib/supabase/server";
import { type TransferStudentInput } from "@/lib/validators/transfer.schema";


export const transferService = {
    async transferStudent(data: TransferStudentInput & { createdBy: string; userId: string }) {
        const admin = await createAdminClient();

        // 1. Get current enrollment and contract
        const { data: currentEnrollment, error: enrError } = await admin
            .from("enrollments")
            .select("id, student_id, class_id, grade, branch_id, academic_year")
            .eq("id", data.enrollmentId)
            .single();

        if (enrError || !currentEnrollment) {
            throw new Error(enrError?.message ?? "Current enrollment not found");
        }

        const { data: activeContract } = await admin
            .from("contracts")
            .select("id, base_price, discount_amount, status")
            .eq("enrollment_id", data.enrollmentId)
            .eq("status", "active")
            .single();

        // 2. Fetch missing fields like class details if classId is provided
        let finalGrade = data.newGrade || currentEnrollment.grade;
        let finalYear = data.newAcademicYear || currentEnrollment.academic_year;
        let finalBranchId = data.newBranchId || currentEnrollment.branch_id;

        if (data.newClassId) {
            const { data: cls } = await admin
                .from("classes")
                .select("name, academic_year, branch_id")
                .eq("id", data.newClassId)
                .single();

            if (cls) {
                finalGrade = cls.name;
                finalYear = cls.academic_year;
                if (!data.newBranchId) finalBranchId = cls.branch_id;
            }
        }

        // 3. Mark current enrollment as dropped/transferred
        await admin
            .from("enrollments")
            .update({ status: "withdrawn" })
            .eq("id", data.enrollmentId);

        // 4. Create new enrollment
        const { data: newEnrollment, error: insertError } = await admin
            .from("enrollments")
            .insert({
                student_id: data.studentId,
                branch_id: finalBranchId,
                class_id: data.newClassId || null,
                grade: finalGrade,
                academic_year: finalYear,
                status: "active",
            })
            .select("id")
            .single();

        if (insertError) throw new Error(insertError.message);

        // 5. If there's an active contract, update its enrollment (or close it and require a new one)
        // For transfer we assume they keep the same contract terms but move to a new class
        if (activeContract) {
            await admin
                .from("contracts")
                .update({ enrollment_id: newEnrollment.id })
                .eq("id", activeContract.id);
        }

        // 6. Log interaction
        await admin.from("student_interactions").insert({
            student_id: data.studentId,
            type: "note",
            notes: `Перевод в другой класс/филиал. Причина: ${data.reason}`,
            created_by: data.createdBy,
            user_id: data.userId,
        });

        return { enrollmentId: newEnrollment.id };
    }
};
