import fs from "node:fs/promises";
import { env } from "../src/config/env";
import { prisma } from "../src/lib/prisma";

beforeAll(async () => {
  try {
    // Пингуем БД — достаточно одного запроса.
    await prisma.$queryRawUnsafe("SELECT 1");
    (globalThis as any).__PB_DB_AVAILABLE__ = true;
  } catch {
    (globalThis as any).__PB_DB_AVAILABLE__ = false;
    // Не валим весь test suite, чтобы unit-тесты и сборка проходили локально.
    console.warn("[tests] PostgreSQL недоступна — интеграционные тесты будут пропущены.");
  }
});

beforeEach(async () => {
  if (!(globalThis as any).__PB_DB_AVAILABLE__) return;
  // Очистка таблиц, чтобы интеграционные тесты были изолированы.
  await prisma.mediaAsset.deleteMany();
  await prisma.pageVersion.deleteMany();
  await prisma.page.deleteMany();
  await prisma.user.deleteMany();

  // Очистка файлового хранилища.
  await fs.rm(env.UPLOAD_DIR, { recursive: true, force: true });
  await fs.mkdir(env.UPLOAD_DIR, { recursive: true });
});

afterAll(async () => {
  await prisma.$disconnect().catch(() => {});
});

