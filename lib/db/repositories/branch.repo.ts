import { desc } from "drizzle-orm";
import { db } from "../index";
import { branches, type Branch, type NewBranch } from "../schema/branches";
import { BaseRepository } from "./base.repo";

export class BranchRepository extends BaseRepository<typeof branches, Branch, NewBranch> {
    constructor() {
        super(branches);
    }

    async findAllActive(): Promise<Branch[]> {
        return db
            .select()
            .from(branches)
            .orderBy(desc(branches.createdAt)); // In real scenario, filter by isActive
    }
}

export const branchRepository = new BranchRepository();
