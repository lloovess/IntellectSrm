import { desc, eq, and } from "drizzle-orm";
import { db } from "../index";
import { classes, type Class, type NewClass } from "../schema/classes";
import { BaseRepository } from "./base.repo";

export class ClassRepository extends BaseRepository<typeof classes, Class, NewClass> {
    constructor() {
        super(classes);
    }

    async findAllActive(): Promise<Class[]> {
        return db
            .select()
            .from(classes)
            .where(eq(classes.status, "active"))
            .orderBy(desc(classes.createdAt));
    }

    async findByBranchAndYear(
        branchId: string,
        academicYearId: string
    ): Promise<Class[]> {
        return db
            .select()
            .from(classes)
            .where(
                and(
                    eq(classes.branchId, branchId),
                    eq(classes.academicYearId, academicYearId),
                    eq(classes.status, "active")
                )
            )
            .orderBy(classes.name);
    }

    /**
     * Find class by ID with capacity info
     */
    async findByIdWithCapacity(id: string): Promise<Class | null> {
        const result = await db
            .select()
            .from(classes)
            .where(eq(classes.id, id));
        return result[0] || null;
    }

    /**
     * Check if a class has available capacity
     */
    async hasAvailableCapacity(classId: string): Promise<boolean> {
        const result = await db
            .select()
            .from(classes)
            .where(eq(classes.id, classId));

        if (!result[0]) return false;
        const classData = result[0];
        return classData.currentEnrollment < classData.capacity;
    }

    /**
     * Get available seats in a class
     */
    async getAvailableSeats(classId: string): Promise<number | null> {
        const result = await db
            .select()
            .from(classes)
            .where(eq(classes.id, classId));

        if (!result[0]) return null;
        const classData = result[0];
        return Math.max(0, classData.capacity - classData.currentEnrollment);
    }

    /**
     * Get classes with availability info for a branch and year
     */
    async findByBranchAndYearWithAvailability(
        branchId: string,
        academicYearId: string
    ): Promise<
        Array<Class & { availableSeats: number; isFull: boolean }>
    > {
        const classes_list = await this.findByBranchAndYear(
            branchId,
            academicYearId
        );

        return classes_list.map((cls) => ({
            ...cls,
            availableSeats: Math.max(0, cls.capacity - cls.currentEnrollment),
            isFull: cls.currentEnrollment >= cls.capacity,
        }));
    }

    /**
     * Find classes by academic year ID
     */
    async findByAcademicYearId(academicYearId: string): Promise<Class[]> {
        return db
            .select()
            .from(classes)
            .where(
                and(
                    eq(classes.academicYearId, academicYearId),
                    eq(classes.status, "active")
                )
            )
            .orderBy(classes.name);
    }
}

export const classRepository = new ClassRepository();
