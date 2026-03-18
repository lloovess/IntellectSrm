import { ClassRepository } from "@/lib/db/repositories/class.repo";
import { AcademicYearRepository } from "@/lib/db/repositories/academic-year.repo";
import {
    CreateClassInput,
    UpdateClassInput,
    BulkCreateClassesInput,
} from "@/lib/validators/class.schema";

export class ClassManagementService {
    /**
     * Get all active classes
     */
    static async getAllClasses() {
        return ClassRepository.findAllActive();
    }

    /**
     * Get classes by branch and academic year
     */
    static async getClassesByBranchAndYear(
        branchId: string,
        academicYearId: string
    ) {
        return ClassRepository.findByBranchAndYear(branchId, academicYearId);
    }

    /**
     * Get classes with availability info
     */
    static async getClassesWithAvailability(
        branchId: string,
        academicYearId: string
    ) {
        return ClassRepository.findByBranchAndYearWithAvailability(
            branchId,
            academicYearId
        );
    }

    /**
     * Get class by ID
     */
    static async getClassById(id: string) {
        const classData = await ClassRepository.findByIdWithCapacity(id);
        if (!classData) {
            throw new Error("Class not found");
        }
        return classData;
    }

    /**
     * Check if class has available capacity
     */
    static async checkCapacity(classId: string) {
        return ClassRepository.hasAvailableCapacity(classId);
    }

    /**
     * Get available seats in a class
     */
    static async getAvailableSeats(classId: string) {
        return ClassRepository.getAvailableSeats(classId);
    }

    /**
     * Create new class
     */
    static async createClass(data: CreateClassInput) {
        // Verify academic year exists
        const academicYear = await AcademicYearRepository.findById(
            data.academicYearId
        );
        if (!academicYear) {
            throw new Error("Academic year not found");
        }

        const classData = await ClassRepository.create({
            branchId: data.branchId,
            academicYearId: data.academicYearId,
            name: data.name,
            academicYear: data.academicYear,
            capacity: data.capacity,
            status: data.status || "active",
        });

        return classData;
    }

    /**
     * Update class
     */
    static async updateClass(id: string, data: UpdateClassInput) {
        // Verify class exists
        await this.getClassById(id);

        // Validate capacity - cannot be less than current enrollment
        if (data.capacity !== undefined) {
            const currentClass = await this.getClassById(id);
            if (data.capacity < currentClass.currentEnrollment) {
                throw new Error(
                    `Capacity cannot be less than current enrollment (${currentClass.currentEnrollment})`
                );
            }
        }

        return ClassRepository.update(id, data);
    }

    /**
     * Bulk create classes
     */
    static async bulkCreateClasses(data: BulkCreateClassesInput) {
        // Verify academic year exists
        const academicYear = await AcademicYearRepository.findById(
            data.academicYearId
        );
        if (!academicYear) {
            throw new Error("Academic year not found");
        }

        const createdClasses = [];

        for (const classData of data.classes) {
            try {
                const newClass = await ClassRepository.create({
                    branchId: data.branchId,
                    academicYearId: data.academicYearId,
                    name: classData.name,
                    academicYear: data.academicYear,
                    capacity: classData.capacity,
                    status: "active",
                });
                createdClasses.push(newClass);
            } catch (error) {
                // Continue creating other classes even if one fails
                console.error(
                    `Failed to create class ${classData.name}:`,
                    error
                );
            }
        }

        return createdClasses;
    }

    /**
     * Delete class (only if no active enrollments)
     */
    static async deleteClass(id: string) {
        // Verify class exists
        const classData = await this.getClassById(id);

        // Check if class has active enrollments
        if (classData.currentEnrollment > 0) {
            throw new Error(
                `Cannot delete class with active enrollments (${classData.currentEnrollment})`
            );
        }

        await ClassRepository.delete(id);
    }

    /**
     * Get classes by academic year
     */
    static async getClassesByAcademicYear(academicYearId: string) {
        return ClassRepository.findByAcademicYearId(academicYearId);
    }

    /**
     * Archive class instead of deleting
     */
    static async archiveClass(id: string) {
        // Verify class exists
        await this.getClassById(id);

        return ClassRepository.update(id, { status: "archived" });
    }

    /**
     * Get class statistics
     */
    static async getClassStatistics(classId: string) {
        const classData = await this.getClassById(classId);

        return {
            id: classData.id,
            name: classData.name,
            capacity: classData.capacity,
            currentEnrollment: classData.currentEnrollment,
            availableSeats: Math.max(0, classData.capacity - classData.currentEnrollment),
            occupancyPercentage: Math.round(
                (classData.currentEnrollment / classData.capacity) * 100
            ),
            isFull: classData.currentEnrollment >= classData.capacity,
        };
    }
}
