import fs from "fs";
import { drizzle } from "drizzle-orm/postgres-js";
import postgres from "postgres";
import { sql } from "drizzle-orm";

async function clearStudents() {
    try {
        const envContent = fs.readFileSync(".env.local", "utf8");
        const dbUrlMatch = envContent.match(/DATABASE_URL=(.+)/);
        let connectionString = process.env.DATABASE_URL || (dbUrlMatch ? dbUrlMatch[1].trim() : "");

        if (connectionString.startsWith('"') && connectionString.endsWith('"')) {
            connectionString = connectionString.slice(1, -1);
        }

        console.log("Emptying students table...");
        const client = postgres(connectionString, { prepare: false });
        const db = drizzle(client);

        await db.execute(sql`TRUNCATE TABLE students CASCADE;`);
        console.log("Successfully deleted all students and related records.");
        await client.end();
    } catch (error) {
        console.error("Error deleting students:", error);
    } finally {
        process.exit(0);
    }
}

clearStudents();
