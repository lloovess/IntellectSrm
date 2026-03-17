import { desc, eq } from "drizzle-orm";
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
}

export const enrollmentRepository = new EnrollmentRepository();
