import { pgTable, uuid, text, timestamp } from "drizzle-orm/pg-core";

export const userRoles = pgTable("user_roles", {
    id: uuid("id").primaryKey().defaultRandom(),
    userId: uuid("user_id").notNull().unique(), // References auth.users from Supabase
    role: text("role").notNull().default('assistant'), // assistant, call_center, accountant, finance_manager, admin
    createdAt: timestamp("created_at").defaultNow().notNull(),
    updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

export type UserRole = typeof userRoles.$inferSelect;
export type NewUserRole = typeof userRoles.$inferInsert;
