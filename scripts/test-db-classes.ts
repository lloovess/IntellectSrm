import * as dotenv from 'dotenv';
dotenv.config({ path: '.env.local' });
import { db } from '../lib/db/index';
import { classes } from '../lib/db/schema/classes';

async function run() {
    try {
        const cls = await db.select().from(classes);
        console.log("SUCCESS:", cls);
    } catch (e: unknown) {
        const errMsg = e instanceof Error ? e.message : "Unknown error";
        console.error("DB ERROR MESSAGE:", errMsg);
        console.error("DB ERROR DETAILS:", e);
    }
}
run();
