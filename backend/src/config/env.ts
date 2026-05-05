import dotenv from "dotenv";
import { z } from "zod";

dotenv.config();

const EnvSchema = z.object({
  NODE_ENV: z.enum(["development", "test", "production"]).default("development"),
  PORT: z.coerce.number().default(4000),

  DATABASE_URL: z.string().min(1),
  JWT_SECRET: z.string().min(8),

  FRONTEND_ORIGIN: z.string().min(1).optional(),
  UPLOAD_DIR: z.string().min(1).default("./uploads"),
  PUBLIC_BASE_URL: z.string().min(1).default("http://localhost:4000"),
  MEDIA_ROUTE_PREFIX: z.string().min(1).default("/api/media")
});

export type Env = z.infer<typeof EnvSchema>;
export const env: Env = EnvSchema.parse(process.env);

