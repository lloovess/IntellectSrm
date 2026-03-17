console.log('START');
import postgres from 'postgres';
console.log('IMPORTED');
const str1 = 'postgresql://postgres.jgmjkwepqvpxgcwngutl:0700799410Evbh@aws-0-ap-northeast-1.pooler.supabase.com:6543/postgres?pgbouncer=true';
const sql = postgres(str1, { prepare: false });
async function run() {
  console.log('RUNNING');
  try {
    const res = await sql`SELECT 1 as result`;
    console.log('success', res);
  } catch (e) {
    console.error('error', e);
  } finally {
    await sql.end();
  }
}
run().then(() => console.log('done'));
