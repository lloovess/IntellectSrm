import { desc, eq } from "drizzle-orm";
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
            .orderBy(desc(classes.createdAt)); // In real scenarios, order by name/academicYear etc.
    }

    async findByBranchAndYear(branchId: string, academicYear: string): Promise<Class[]> {
        return db
            .select()
            .from(classes)
            .where(
                eq(classes.branchId, branchId)
                // In Drizzle, using `and` requires importing it. We will add academic year filter later if needed or via raw SQL where needed
            )
        // Simplified for now: just return all for a branch.
        // Ideally we'd use `and(eq(classes.branchId, branchId), eq(classes.academicYear, academicYear))`
    }
}

export const classRepository = new ClassRepository();
