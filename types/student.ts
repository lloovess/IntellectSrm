import { Student, NewStudent } from "@/lib/db/schema/students";

export type { Student, NewStudent };

export type StudentFilters = {
    status?: string;
    program?: string;
    branch?: string;
};
