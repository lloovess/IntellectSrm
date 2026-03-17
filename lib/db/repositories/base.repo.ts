import { eq, sql } from "drizzle-orm";
import { db } from "../index";
import { PgTable } from "drizzle-orm/pg-core";

export interface PaginationParams {
    page?: number;
    pageSize?: number;
}

export interface PaginatedResult<T> {
    data: T[];
    total: number;
    page: number;
    pageSize: number;
    totalPages: number;
}

export abstract class BaseRepository<
    TTable extends PgTable,
    TSelect,
    TInsert
> {
    constructor(protected readonly table: TTable) { }

    async findById(id: string): Promise<TSelect | undefined> {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const result = await db.select().from(this.table as any).where(eq((this.table as any).id, id));
        return result[0] as TSelect | undefined;
    }

    async create(data: TInsert): Promise<TSelect> {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const result = await db.insert(this.table as any).values(data as any).returning();
        return result[0] as TSelect;
    }

    async update(id: string, data: Partial<TInsert>): Promise<TSelect | undefined> {
        const result = await db
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            .update(this.table as any)
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            .set({ ...data, updatedAt: new Date() } as any)
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            .where(eq((this.table as any).id, id))
            .returning();
        return result[0] as TSelect | undefined;
    }

    async delete(id: string): Promise<TSelect | undefined> {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const result = await db.delete(this.table as any).where(eq((this.table as any).id, id)).returning();
        return result[0] as TSelect | undefined;
    }

    async count(): Promise<number> {
        const countQuery = sql`count(*)`;
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const result = await db.select({ count: countQuery }).from(this.table as any);
        return Number(result[0].count);
    }
}
