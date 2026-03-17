import { eq } from "drizzle-orm";
import { db } from "../index";
import { userRoles, type UserRole, type NewUserRole } from "../schema/user-roles";
import { BaseRepository } from "./base.repo";

export class UserRepository extends BaseRepository<typeof userRoles, UserRole, NewUserRole> {
    constructor() {
        super(userRoles);
    }

    async findByUserId(userId: string): Promise<UserRole | undefined> {
        const result = await db
            .select()
            .from(userRoles)
            .where(eq(userRoles.userId, userId));
        return result[0];
    }
}

export const userRepository = new UserRepository();
