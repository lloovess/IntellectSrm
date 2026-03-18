import { db } from "@/lib/db";
import { academicYears } from "@/lib/db/schema";
import { eq, desc } from "drizzle-orm";

export class AcademicYearRepository {
    /**
     * Find all academic years
     */
    static async findAll() {
        return db
            .select()
            .from(academicYears)
            .orderBy(desc(academicYears.name));
    }

    /**
     * Find all active academic years
     */
    static async findActive() {
        return db
            .select()
            .from(academicYears)
            .where(eq(academicYears.status, "active"))
            .orderBy(desc(academicYears.name));
    }

    /**
     * Find academic year by ID
     */
    static async findById(id: string) {
        const result = await db
            .select()
            .from(academicYears)
            .where(eq(academicYears.id, id));
        return result[0] || null;
    }

    /**
     * Find academic year by name
     */
    static async findByName(name: string) {
        const result = await db
            .select()
            .from(academicYears)
            .where(eq(academicYears.name, name));
        return result[0] || null;
    }

    /**
     * Find current academic year (active, most recent)
     */
    static async findCurrent() {
        const result = await db
            .select()
            .from(academicYears)
            .where(eq(academicYears.status, "active"))
            .orderBy(desc(academicYears.name))
            .limit(1);
        return result[0] || null;
    }

    /**
     * Create new academic year
     */
    static async create(data: {
        name: string;
        startDate: Date;
        endDate: Date;
        status?: string;
    }) {
        const result = await db
            .insert(academicYears)
            .values({
                name: data.name,
                startDate: data.startDate,
                endDate: data.endDate,
                status: data.status || "active",
                createdAt: new Date(),
                updatedAt: new Date(),
            } as any)
            .returning();
        return result[0];
    }

    /**
     * Update academic year
     */
    static async update(
        id: string,
        data: Partial<{
            name: string;
            startDate: Date;
            endDate: Date;
            status: string;
        }>
    ) {
        const result = await db
            .update(academicYears)
            .set({ ...data, updatedAt: new Date() } as any)
            .where(eq(academicYears.id, id))
            .returning();
        return result[0];
    }

    /**
     * Archive academic year
     */
    static async archive(id: string) {
        return this.update(id, { status: "archived" });
    }

    /**
     * Delete academic year
     */
    static async delete(id: string) {
        await db.delete(academicYears).where(eq(academicYears.id, id));
    }
}
