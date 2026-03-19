import { createAdminClient } from "@/lib/supabase/server";
import { db } from "@/lib/db";
import { academicYears } from "@/lib/db/schema";
import { eq, desc } from "drizzle-orm";

export class AcademicYearRepository {
    /**
     * Find all academic years
     * Uses admin client to bypass RLS (Drizzle has auth.role() = anon)
     */
    static async findAll() {
        const admin = await createAdminClient();
        const { data, error } = await admin
            .from("academic_years")
            .select("*")
            .order("name", { ascending: false });
        if (error) throw error;
        return data ?? [];
    }

    /**
     * Find all active academic years
     */
    static async findActive() {
        const admin = await createAdminClient();
        const { data, error } = await admin
            .from("academic_years")
            .select("*")
            .eq("status", "active")
            .order("name", { ascending: false });
        if (error) throw error;
        return data ?? [];
    }

    /**
     * Find academic year by ID
     */
    static async findById(id: string) {
        const admin = await createAdminClient();
        const { data, error } = await admin
            .from("academic_years")
            .select("*")
            .eq("id", id)
            .single();
        if (error && error.code !== "PGRST116") throw error;
        return data || null;
    }

    /**
     * Find academic year by name
     */
    static async findByName(name: string) {
        const admin = await createAdminClient();
        const { data, error } = await admin
            .from("academic_years")
            .select("*")
            .eq("name", name)
            .single();
        if (error && error.code !== "PGRST116") throw error;
        return data || null;
    }

    /**
     * Find current academic year (active, most recent)
     */
    static async findCurrent() {
        const admin = await createAdminClient();
        const { data, error } = await admin
            .from("academic_years")
            .select("*")
            .eq("status", "active")
            .order("name", { ascending: false })
            .limit(1)
            .single();
        if (error && error.code !== "PGRST116") throw error;
        return data || null;
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
                // eslint-disable-next-line @typescript-eslint/no-explicit-any
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
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
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
