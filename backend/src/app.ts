import express from "express";
import cors from "cors";
import helmet from "helmet";
import morgan from "morgan";
import { ZodError } from "zod";
import { env } from "./config/env";
import { createAuthRouter } from "./api/routes/authRoutes";
import { createPagesRouter } from "./api/routes/pagesRoutes";
import { createMediaRouter } from "./api/routes/mediaRoutes";
import { createPublicPagesRouter } from "./api/routes/publicPagesRoutes";

export function createApp() {
  const app = express();

  app.use(helmet());
  app.use(morgan("dev"));

  app.use(
    cors({
      origin: env.FRONTEND_ORIGIN,
      credentials: true
    })
  );

  app.use(express.json({ limit: "2mb" }));

  app.get("/api/health", (_req, res) => {
    res.json({ ok: true });
  });

  app.use("/api/auth", createAuthRouter());
  app.use("/api/pages", createPagesRouter());
  app.use("/api/media", createMediaRouter());
  app.use("/api/public/pages", createPublicPagesRouter());

  // Centralized error mapping: validation/known domain errors -> clean HTTP responses.
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  app.use((err: unknown, _req: express.Request, res: express.Response, _next: express.NextFunction) => {
    if (err instanceof ZodError) {
      return res.status(400).json({
        error: "Ошибка валидации",
        details: err.issues.map((issue) => ({
          path: issue.path.join("."),
          message: issue.message
        }))
      });
    }

    if (err && typeof err === "object" && "status" in err && typeof (err as { status?: unknown }).status === "number") {
      const status = (err as { status: number }).status;
      const maybeMessage = (err as { message?: unknown }).message;
      const message = typeof maybeMessage === "string" ? maybeMessage : "Request failed";
      return res.status(status).json({ error: message });
    }

    console.error(err);
    res.status(500).json({ error: "Internal server error" });
  });

  return app;
}

