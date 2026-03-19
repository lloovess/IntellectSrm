import { createAdminClient } from "@/lib/supabase/server";
import { type Class, type NewClass } from "../schema/classes";

export class ClassRepository {
    async findById(id: string): Promise<Class | undefined> {
        const admin = await createAdminClient();
        const { data, error } = await admin
            .from("classes")
            .select("*")
            .eq("id", id)
            .single();
        if (error && error.code !== "PGRST116") throw error;
        return data ? this.mapKeys(data) : undefined;
    }

    async create(data: NewClass): Promise<Class> {
        const admin = await createAdminClient();
        const { data: inserted, error } = await admin
            .from("classes")
            .insert({
                branch_id: data.branchId,
                academic_year_id: data.academicYearId,
                name: data.name,
                academic_year: data.academicYear,
                capacity: data.capacity,
                status: data.status || "active",
            })
            .select("*")
            .single();
        if (error) throw error;
        return this.mapKeys(inserted);
    }

    async update(
        id: string,
        data: Partial<NewClass>
    ): Promise<Class | undefined> {
        const admin = await createAdminClient();
        
        // Map camelCase to snake_case for DB
        const updateData: Record<string, unknown> = { updated_at: new Date().toISOString() };
        if (data.branchId) updateData.branch_id = data.branchId;
        if (data.academicYearId) updateData.academic_year_id = data.academicYearId;
        if (data.name) updateData.name = data.name;
        if (data.academicYear) updateData.academic_year = data.academicYear;
        if (data.capacity !== undefined) updateData.capacity = data.capacity;
        if (data.currentEnrollment !== undefined) updateData.current_enrollment = data.currentEnrollment;
        if (data.status) updateData.status = data.status;

        const { data: updated, error } = await admin
            .from("classes")
            .update(updateData)
            .eq("id", id)
            .select("*")
            .single();
        if (error) throw error;
        return updated ? this.mapKeys(updated) : undefined;
    }

    async delete(id: string): Promise<Class | undefined> {
        const admin = await createAdminClient();
        const { data, error } = await admin
            .from("classes")
            .delete()
            .eq("id", id)
            .select("*")
            .single();
        if (error) throw error;
        return data ? this.mapKeys(data) : undefined;
    }

    async findAllActive(): Promise<Class[]> {
        const admin = await createAdminClient();
        const { data, error } = await admin
            .from("classes")
            .select("*")
            .eq("status", "active")
            .order("created_at", { ascending: false });
        if (error) throw error;
        return data ? data.map(this.mapKeys) : [];
    }

    async findByBranchAndYear(
        branchId: string,
        academicYearId: string
    ): Promise<Class[]> {
        const admin = await createAdminClient();
        const { data, error } = await admin
            .from("classes")
            .select("*")
            .eq("branch_id", branchId)
            .eq("academic_year_id", academicYearId)
            .eq("status", "active")
            .order("name", { ascending: true });
        if (error) throw error;
        return data ? data.map(this.mapKeys) : [];
    }

    async findByIdWithCapacity(id: string): Promise<Class | null> {
        const result = await this.findById(id);
        return result || null;
    }

    async hasAvailableCapacity(classId: string): Promise<boolean> {
        const classData = await this.findById(classId);
        if (!classData) return false;
        return classData.currentEnrollment < classData.capacity;
    }

    async getAvailableSeats(classId: string): Promise<number | null> {
        const classData = await this.findById(classId);
        if (!classData) return null;
        return Math.max(0, classData.capacity - classData.currentEnrollment);
    }

    async findByBranchAndYearWithAvailability(
        branchId: string,
        academicYearId: string
    ): Promise<Array<Class & { availableSeats: number; isFull: boolean }>> {
        const classesList = await this.findByBranchAndYear(branchId, academicYearId);
        return classesList.map((cls) => ({
            ...cls,
            availableSeats: Math.max(0, cls.capacity - cls.currentEnrollment),
            isFull: cls.currentEnrollment >= cls.capacity,
        }));
    }

    async findByAcademicYearId(academicYearId: string): Promise<Class[]> {
        const admin = await createAdminClient();
        const { data, error } = await admin
            .from("classes")
            .select("*")
            .eq("academic_year_id", academicYearId)
            .eq("status", "active")
            .order("name", { ascending: true });
        if (error) throw error;
        return data ? data.map(this.mapKeys) : [];
    }

    // Helper to map snake_case from Supabase DB to camelCase for TS
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    private mapKeys(dbRecord: any): Class {
        return {
            id: dbRecord.id,
            branchId: dbRecord.branch_id,
            academicYearId: dbRecord.academic_year_id,
            name: dbRecord.name,
            academicYear: dbRecord.academic_year,
            capacity: dbRecord.capacity,
            currentEnrollment: dbRecord.current_enrollment,
            status: dbRecord.status,
            createdAt: new Date(dbRecord.created_at),
            updatedAt: new Date(dbRecord.updated_at),
        };
    }
}

export const classRepository = new ClassRepository();
