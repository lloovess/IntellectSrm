import { pgTable, uuid, text, timestamp } from "drizzle-orm/pg-core";

export const branches = pgTable("branches", {
    id: uuid("id").primaryKey().defaultRandom(),
    name: text("name").notNull(),
    createdAt: timestamp("created_at").defaultNow().notNull(),
});

export type Branch = typeof branches.$inferSelect;
export type NewBranch = typeof branches.$inferInsert;
