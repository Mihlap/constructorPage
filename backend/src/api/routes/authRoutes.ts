import { Router } from "express";
import { z } from "zod";
import bcrypt from "bcryptjs";
import { prisma } from "../../lib/prisma";
import { signAccessToken } from "../../lib/jwt";
import { asyncHandler } from "../../lib/asyncHandler";

const RegisterBodySchema = z.object({
  email: z.string().email().transform((s) => s.toLowerCase()),
  password: z.string().min(8).max(72)
});

const LoginBodySchema = z.object({
  email: z.string().email().transform((s) => s.toLowerCase()),
  password: z.string().min(8).max(72)
});

export function createAuthRouter() {
  const router = Router();

  router.post("/register", asyncHandler(async (req, res) => {
    const body = RegisterBodySchema.parse(req.body);

    const existing = await prisma.user.findUnique({ where: { email: body.email } });
    if (existing) return res.status(409).json({ error: "Email уже используется" });

    const passwordHash = await bcrypt.hash(body.password, 10);
    const user = await prisma.user.create({
      data: { email: body.email, passwordHash }
    });

    const token = signAccessToken({ sub: user.id, email: user.email });
    return res.status(201).json({ token });
  }));

  router.post("/login", asyncHandler(async (req, res) => {
    const body = LoginBodySchema.parse(req.body);

    const user = await prisma.user.findUnique({ where: { email: body.email } });
    if (!user) return res.status(401).json({ error: "Неверные учетные данные" });

    const ok = await bcrypt.compare(body.password, user.passwordHash);
    if (!ok) return res.status(401).json({ error: "Неверные учетные данные" });

    const token = signAccessToken({ sub: user.id, email: user.email });
    return res.json({ token });
  }));

  return router;
}

