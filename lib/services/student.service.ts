import { studentRepository, type RegistryFilters, type RegistryResult, type GradeGroup, type AssistantStats } from "@/lib/db/repositories/student.repo";

export type { AssistantStats };

/**
 * StudentService — слой бизнес-логики.
 * Вызывает studentRepo (Supabase Admin Client), не содержит HTTP/UI логики.
 */
export const studentService = {
    /**
     * Получить плоский список студентов для табличного view.
     */
    async getRegistry(filters: RegistryFilters): Promise<RegistryResult> {
        return studentRepository.getRegistry(filters);
    },

    /**
     * Получить студентов, сгруппированных по классу — для ассистента.
     */
    async getGroupedByGrade(branchId?: string): Promise<GradeGroup[]> {
        return studentRepository.getGroupedByGrade(branchId);
    },

    /**
     * Статистика рабочего места ассистента директора.
     */
    async getAssistantStats(): Promise<AssistantStats> {
        return studentRepository.getAssistantStats();
    },
};
