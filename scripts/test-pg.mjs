import postgres from 'postgres';
console.log('START DIRECT PARAMS TEST 5432');

const sql = postgres({
  host: 'aws-0-ap-northeast-1.pooler.supabase.com',
  port: 5432,
  database: 'postgres',
  username: 'postgres.jgmjkwepqvpxgcwngutl',
  password: '0700799410Evbh',
  ssl: 'require',
  max: 1
});

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
