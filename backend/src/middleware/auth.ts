import { Request, Response, NextFunction } from "express";
import { verifyAccessToken } from "../lib/jwt";

declare global {
  namespace Express {
    // Поле заполняется middleware `requireAuth`
    // eslint-disable-next-line @typescript-eslint/consistent-type-definitions
    interface Request {
      user?: { id: string; email: string };
    }
  }
}

export type AuthedRequest = Request & { user: { id: string; email: string } };

export function requireAuth(req: Request, res: Response, next: NextFunction) {
  const auth = req.header("authorization");
  const token = auth?.startsWith("Bearer ") ? auth.slice("Bearer ".length) : null;
  if (!token) {
    return res.status(401).json({ error: "Unauthorized" });
  }

  try {
    const payload = verifyAccessToken(token);
    req.user = { id: payload.sub, email: payload.email };
    return next();
  } catch {
    return res.status(401).json({ error: "Unauthorized" });
  }
}

