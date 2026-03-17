import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';

dotenv.config({ path: '.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

const supabase = createClient(supabaseUrl, supabaseKey);

async function check() {
    const { data: searchStu } = await supabase.from('students').select('*').ilike('full_name', '%Мусаилов Эмир%');
    if (!searchStu || searchStu.length === 0) {
        console.log('Student not found');
        return;
    }
    const stu = searchStu[0];
    console.log('Student ID:', stu.id);

    const { data: enr } = await supabase.from('enrollments').select('id').eq('student_id', stu.id);
    const { data: contracts } = await supabase.from('contracts').select('*').in('enrollment_id', (enr || []).map(e => e.id)).order('created_at', { ascending: false });
    console.log('Contracts:', contracts?.map(c => ({ id: c.id, num: c.contract_number, prev: c.previous_contract_id })));

    if (contracts && contracts.length > 1) {
        const prevContract = contracts.find(c => c.id === contracts[0].previous_contract_id);
        console.log('Prev Contract ID:', prevContract?.id);
        if (prevContract) {
            const { data: items } = await supabase.from('payment_items').select('*').eq('contract_id', prevContract.id);
            console.log('All Prev Items:', items?.map(i => ({ due_date: i.due_date, amount: i.amount, paid_amount: i.paid_amount, status: i.status })));

            const startDateStr = new Date("2026-09-01T00:00:00.000Z").toISOString();
            const { data: dbFiltered, error: itemsErr } = await supabase
                .from("payment_items")
                .select("amount, paid_amount, due_date, status")
                .eq("contract_id", prevContract.id)
                .in("status", ["planned", "overdue", "partially_paid"])
                .lt("due_date", startDateStr);

            console.log('DB Filtered Result lt startDateStr:', dbFiltered);
        }
    }
}
check();
