import { db } from './lib/db';
import { sql } from 'drizzle-orm';
import { guardians } from './lib/db/schema/guardians';
import { students } from './lib/db/schema/students';

async function test() {
    try {
        console.log("Applying column default constraint...");
        await db.execute(sql`ALTER TABLE "public"."guardians" ALTER COLUMN "id" SET DEFAULT gen_random_uuid();`);
        console.log("Constraint applied.");

        const uniquePhone = "+996555" + Math.floor(100000 + Math.random() * 900000);
        const newStudentId = crypto.randomUUID();

        // First create a mock student so foreign key constraint passes
        await db.insert(students).values({
            id: newStudentId,
            fullName: "Test Student " + Date.now(),
            phone: uniquePhone,
            gender: "male",
            status: "active",
        });

        console.log("Mock student created:", newStudentId);

        // Now insert a guardian without explicit ID
        await db.insert(guardians).values({
            studentId: newStudentId,
            fullName: "Азатыков Азат",
            phone: "+996555555555",
            relationship: "Папа"
        });
        console.log("Guardian inserted successfully without explicit ID!");
    } catch (err: unknown) {
        const errMsg = err instanceof Error ? err.message : "Unknown error";
        console.error("DB Error:", errMsg);
        if (err instanceof Error && err.cause) console.error("Cause:", err.cause);
    }
    process.exit(0);
}

test();
