import { studentRepository, type StudentProfile } from "@/lib/db/repositories/student.repo";
import type { Role } from "@/lib/auth/config";
import { checkPermission } from "@/lib/auth/guard";

export type { StudentProfile };

export class StudentProfileService {
    /**
     * Получает полный профиль студента.
     * Finance data (contract, paymentItems) включается только для ролей с payments.read.
     */
    async getProfile(id: string, role: Role): Promise<StudentProfile | null> {
        const profile = await studentRepository.getById(id);
        if (!profile) return null;

        const canViewFinance = checkPermission(role, "payments.read");

        // Скрываем финансовые данные для ролей без payments.read
        if (!canViewFinance) {
            return {
                ...profile,
                contract: null,
                paymentItems: [],
            };
        }

        return profile;
    }
}

export const studentProfileService = new StudentProfileService();
