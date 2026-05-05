import path from "node:path";

process.env.NODE_ENV = process.env.NODE_ENV ?? "test";
process.env.JWT_SECRET = process.env.JWT_SECRET ?? "test_secret_change_me_please";
process.env.DATABASE_URL =
  process.env.DATABASE_URL ?? "postgresql://pagebuilder:pagebuilder@localhost:5432/pagebuilder?schema=public";
process.env.FRONTEND_ORIGIN = process.env.FRONTEND_ORIGIN ?? "http://localhost:5173";
process.env.PUBLIC_BASE_URL = process.env.PUBLIC_BASE_URL ?? "http://localhost:4000";
process.env.UPLOAD_DIR = process.env.UPLOAD_DIR ?? path.join(__dirname, "..", "uploads-test");
process.env.MEDIA_ROUTE_PREFIX = process.env.MEDIA_ROUTE_PREFIX ?? "/api/media";

