import postgres from 'postgres';

const pool = postgres(`postgresql://postgres.jgmjkwepqvpxgcwngutl:0700799410Evbh@aws-0-ap-northeast-1.pooler.supabase.com:6543/postgres`, {
    prepare: false
});

async function main() {
    try {
        console.log("Connecting...");
        const result = await pool`SELECT 1 as num`;
        console.log("Success:", result);
    } catch (e: unknown) {
        const errMsg = e instanceof Error ? e.message : "Unknown error";
        console.error("Error:", errMsg);
    } finally {
        await pool.end();
    }
}
main();
