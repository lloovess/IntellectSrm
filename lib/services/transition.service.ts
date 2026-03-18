import { createAdminClient } from "@/lib/supabase/server";

export type PromotionCandidate = {
    enrollmentId: string;
    studentId: string;
    studentName: string;
    currentClassId: string;
    currentClassName: string;
    currentGrade: string;
    branchId: string;
    academicYear: string;
    proposedClassId?: string;
    proposedClassName?: string;
    proposedGrade?: string;
    proposedAcademicYear?: string;
    status: "ready" | "no_target_class" | "already_completed";
};

export const transitionService = {
    async getPromotionPreview(sourceYear: string, branchId?: string): Promise<PromotionCandidate[]> {
        const admin = await createAdminClient();

        let query = admin
            .from("enrollments")
            .select(`
                id, student_id, class_id, grade, branch_id, academic_year, status,
                students ( full_name ),
                classes ( name )
            `)
            .eq("academic_year", sourceYear)
            .eq("status", "active");

        if (branchId) {
            query = query.eq("branch_id", branchId);
        }

        const { data: enrollments, error } = await query;
        if (error) throw new Error(error.message);

        // Find target classes for the next academic year
        // Format of academic_year is usually "2023-2024"
        const nextYearStart = parseInt(sourceYear.substring(0, 4)) + 1;
        const nextYear = `${nextYearStart}-${nextYearStart + 1}`;

        const { data: targetClasses } = await admin
            .from("classes")
            .select("id, name, branch_id, academic_year")
            .eq("academic_year", nextYear);

        const candidates: PromotionCandidate[] = enrollments.map(enr => {
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            const student = enr.students as any;
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            const currentClass = enr.classes as any;

            // Try to find a matching target class based on grade logic.
            // Simplified logic: If class name is "1A", next year it should be "2A".
            let proposedClassId: string | undefined;
            let proposedClassName: string | undefined;
            let proposedGrade: string | undefined;

            if (currentClass?.name) {
                const match = currentClass.name.match(/^(\d+)(.*)$/);
                if (match) {
                    const nextGradeNum = parseInt(match[1]) + 1;
                    const suffix = match[2];
                    proposedClassName = `${nextGradeNum}${suffix}`;
                    proposedGrade = `${nextGradeNum}`;

                    const target = targetClasses?.find(
                        c => c.name === proposedClassName && c.branch_id === enr.branch_id
                    );
                    if (target) {
                        proposedClassId = target.id;
                    }
                }
            } else if (enr.grade) {
                // If no class but grade exists
                const gradeNum = parseInt(enr.grade);
                if (!isNaN(gradeNum)) {
                    proposedGrade = `${gradeNum + 1}`;
                    proposedClassName = proposedGrade;
                }
            }

            return {
                enrollmentId: enr.id,
                studentId: enr.student_id,
                studentName: student?.full_name || "Неизвестно",
                currentClassId: enr.class_id,
                currentClassName: currentClass?.name || enr.grade || "Нет класса",
                currentGrade: enr.grade,
                branchId: enr.branch_id,
                academicYear: enr.academic_year,
                proposedClassId,
                proposedClassName,
                proposedGrade,
                proposedAcademicYear: nextYear,
                status: proposedClassId ? "ready" : "no_target_class"
            };
        });

        return candidates;
    },

    async promoteStudents(
        promotions: { enrollmentId: string; studentId: string; targetClassId?: string; targetGrade?: string; targetYear: string, branchId: string }[],
        dryRun: boolean,
        context: { userId: string, createdBy: string }
    ) {
        if (dryRun) {
            // In a dry run, we just return the count of what would happen
            return {
                ok: true,
                message: `Готово к переводу ${promotions.length} учеников.`,
                count: promotions.length
            };
        }

        const admin = await createAdminClient();

        let successCount = 0;
        const errors = [];

        // Loop through promotions and apply them
        // Note: For a true atomic transaction across many records, we'd need a stored procedure
        // or edge function if using Supabase standard APIs, but we'll do sequential promises here
        // as a simple MVP. Ensure we don't hit rate limits on large batches.
        for (const promo of promotions) {
            try {
                // 1. Close current enrollment
                await admin
                    .from("enrollments")
                    .update({ status: "completed" })
                    .eq("id", promo.enrollmentId);

                // 2. Create new enrollment
                const { error: insErr } = await admin
                    .from("enrollments")
                    .insert({
                        student_id: promo.studentId,
                        class_id: promo.targetClassId || null,
                        grade: promo.targetGrade || null,
                        branch_id: promo.branchId,
                        academic_year: promo.targetYear,
                        status: "active"
                    })
                    .select("id")
                    .single();

                if (insErr) throw insErr;

                // 3. Optional: update contract's enrollment_id, or status etc. 
                // Given "Contract Renewal" is a separate manual step often, 
                // we might just let the UI handle contracts via the contract renew wizard.

                // 4. Log interaction
                await admin.from("student_interactions").insert({
                    student_id: promo.studentId,
                    type: "note",
                    notes: `Массовый перевод в следующий год. Новый класс: ${promo.targetClassId || promo.targetGrade}`,
                    created_by: context.createdBy,
                    user_id: context.userId
                });

                successCount++;
            } catch (err: unknown) {
                const errMsg = err instanceof Error ? err.message : "Unknown error";
                errors.push({ enrollmentId: promo.enrollmentId, error: errMsg });
            }
        }

        if (errors.length > 0) {
            return {
                ok: false,
                message: `Переведено ${successCount}, ошибок ${errors.length}`,
                errors
            };
        }

        return {
            ok: true,
            message: `Успешно переведено ${successCount} учеников.`,
            count: successCount
        };
    }
};
