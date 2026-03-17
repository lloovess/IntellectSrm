import fs from "node:fs";
import postgres from "postgres";

function readDatabaseUrl() {
  if (process.env.DATABASE_URL) return process.env.DATABASE_URL;

  const envPath = ".env.local";
  if (!fs.existsSync(envPath)) {
    throw new Error("Не найден .env.local и не задан DATABASE_URL");
  }

  const envContent = fs.readFileSync(envPath, "utf8");
  const match = envContent.match(/^DATABASE_URL=(.+)$/m);
  if (!match?.[1]) {
    throw new Error("DATABASE_URL не найден в .env.local");
  }

  return match[1].trim().replace(/^"(.*)"$/, "$1");
}

async function clearStudents() {
  const connectionString = readDatabaseUrl();
  const client = postgres(connectionString, { prepare: false });

  try {
    console.log("Удаляю всех студентов и связанные данные...");
    await client`TRUNCATE TABLE students CASCADE;`;
    console.log("Готово: таблица students очищена (с каскадом зависимых данных).");
  } finally {
    await client.end({ timeout: 5 });
  }
}

clearStudents().catch((error) => {
  console.error("Ошибка очистки:", error instanceof Error ? error.message : error);
  process.exit(1);
});
