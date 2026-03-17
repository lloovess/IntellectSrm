import postgres from 'postgres';
const str1 = 'postgresql://postgres.jgmjkwepqvpxgcwngutl:0700799410Evbh@aws-0-ap-northeast-1.pooler.supabase.com:6543/postgres';
const sql = postgres(str1, { prepare: false });
sql`SELECT 1`.then(res => console.log('success', res)).catch(e => console.error('error', e)).finally(() => sql.end());
