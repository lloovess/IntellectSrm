import { AcademicYearRepository } from "@/lib/db/repositories/academic-year.repo";
import {
    CreateAcademicYearInput,
    UpdateAcademicYearInput,
} from "@/lib/validators/academic-year.schema";

export class AcademicYearService {
    /**
     * Get all academic years
     */
    static async getAllAcademicYears() {
        return AcademicYearRepository.findAll();
    }

    /**
     * Get all active academic years
     */
    static async getActiveAcademicYears() {
        return AcademicYearRepository.findActive();
    }

    /**
     * Get academic year by ID
     */
    static async getAcademicYearById(id: string) {
        const academicYear = await AcademicYearRepository.findById(id);
        if (!academicYear) {
            throw new Error("Academic year not found");
        }
        return academicYear;
    }

    /**
     * Get academic year by name
     */
    static async getAcademicYearByName(name: string) {
        const academicYear = await AcademicYearRepository.findByName(name);
        if (!academicYear) {
            throw new Error(`Academic year "${name}" not found`);
        }
        return academicYear;
    }

    /**
     * Get current academic year
     */
    static async getCurrentAcademicYear() {
        const academicYear = await AcademicYearRepository.findCurrent();
        if (!academicYear) {
            throw new Error("No active academic year found");
        }
        return academicYear;
    }

    /**
     * Create new academic year
     */
    static async createAcademicYear(data: CreateAcademicYearInput) {
        // Check if name already exists
        const existing = await AcademicYearRepository.findByName(data.name);
        if (existing) {
            throw new Error(
                `Academic year "${data.name}" already exists`
            );
        }

        // Validate dates
        if (data.startDate >= data.endDate) {
            throw new Error("Start date must be before end date");
        }

        return AcademicYearRepository.create({
            name: data.name,
            startDate: data.startDate,
            endDate: data.endDate,
            status: data.status || "active",
        });
    }

    /**
     * Update academic year
     */
    static async updateAcademicYear(id: string, data: UpdateAcademicYearInput) {
        // Verify academic year exists
        await this.getAcademicYearById(id);

        // Check if updating name and if new name already exists
        if (data.name) {
            const existing = await AcademicYearRepository.findByName(
                data.name
            );
            if (existing && existing.id !== id) {
                throw new Error(
                    `Academic year "${data.name}" already exists`
                );
            }
        }

        // Validate dates if both are provided
        if (data.startDate && data.endDate && data.startDate >= data.endDate) {
            throw new Error("Start date must be before end date");
        }

        return AcademicYearRepository.update(id, data);
    }

    /**
     * Archive academic year
     */
    static async archiveAcademicYear(id: string) {
        // Verify academic year exists
        await this.getAcademicYearById(id);

        return AcademicYearRepository.archive(id);
    }

    /**
     * Delete academic year
     */
    static async deleteAcademicYear(id: string) {
        // Verify academic year exists
        await this.getAcademicYearById(id);

        await AcademicYearRepository.delete(id);
    }
}
