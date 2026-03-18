import { desc, eq, and } from "drizzle-orm";
import { db } from "../index";
import { enrollments, type Enrollment, type NewEnrollment } from "../schema/enrollments";
import { BaseRepository } from "./base.repo";

export class EnrollmentRepository extends BaseRepository<typeof enrollments, Enrollment, NewEnrollment> {
    constructor() {
        super(enrollments);
    }

    async findByStudentId(studentId: string): Promise<Enrollment[]> {
        return db
            .select()
            .from(enrollments)
            .where(eq(enrollments.studentId, studentId))
            .orderBy(desc(enrollments.createdAt));
    }

    /**
     * Find active enrollments for a student in a specific academic year
     */
    async findActiveByStudentAndYear(
        studentId: string,
        academicYear: string
    ): Promise<Enrollment | null> {
        const result = await db
            .select()
            .from(enrollments)
            .where(
                and(
                    eq(enrollments.studentId, studentId),
                    eq(enrollments.academicYear, academicYear),
                    eq(enrollments.status, "active")
                )
            );
        return result[0] || null;
    }

    /**
     * Find enrollments by class ID
     */
    async findByClassId(classId: string): Promise<Enrollment[]> {
        return db
            .select()
            .from(enrollments)
            .where(eq(enrollments.classId, classId))
            .orderBy(desc(enrollments.createdAt));
    }

    /**
     * Find active enrollments for a class
     */
    async findActiveByClassId(classId: string): Promise<Enrollment[]> {
        return db
            .select()
            .from(enrollments)
            .where(
                and(
                    eq(enrollments.classId, classId),
                    eq(enrollments.status, "active")
                )
            )
            .orderBy(desc(enrollments.createdAt));
    }

    /**
     * Find enrollments by branch and academic year
     */
    async findByBranchAndYear(
        branchId: string,
        academicYear: string
    ): Promise<Enrollment[]> {
        return db
            .select()
            .from(enrollments)
            .where(
                and(
                    eq(enrollments.branchId, branchId),
                    eq(enrollments.academicYear, academicYear)
                )
            )
            .orderBy(desc(enrollments.createdAt));
    }
}

export const enrollmentRepository = new EnrollmentRepository();
