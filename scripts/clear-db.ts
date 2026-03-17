import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';

dotenv.config({ path: '.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

const supabase = createClient(supabaseUrl, supabaseKey);

async function clearDatabase() {
    console.log('Clearing database...');

    const tablesToClear = [
        'payment_transactions',
        'collection_tasks',
        'payment_items',
        'contracts',
        'withdrawal_cases',
        'enrollments',
        'guardians',
        'student_interactions',
        'audit_logs',
        'classes',
        'students',
    ];

    for (const table of tablesToClear) {
        console.log(`Clearing table: ${table}`);
        const { error } = await supabase
            .from(table)
            .delete()
            .neq('id', '00000000-0000-0000-0000-000000000000'); // Delete all records

        if (error) {
            console.error(`Error clearing ${table}:`, error.message);
        } else {
            console.log(`Successfully cleared ${table}`);
        }
    }

    console.log('Database cleanup complete.');
}

clearDatabase().catch(console.error);
