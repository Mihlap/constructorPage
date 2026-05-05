import jwt from "jsonwebtoken";
import { env } from "../config/env";

export type JwtPayload = {
  sub: string; // userId
  email: string;
};

export function signAccessToken(payload: JwtPayload) {
  return jwt.sign(payload, env.JWT_SECRET, { expiresIn: "7d" });
}

export function verifyAccessToken(token: string): JwtPayload {
  const decoded = jwt.verify(token, env.JWT_SECRET);
  if (!decoded || typeof decoded !== "object") {
    throw new Error("Invalid token");
  }
  const maybe = decoded as Partial<JwtPayload>;
  if (typeof maybe.sub !== "string" || typeof maybe.email !== "string") {
    throw new Error("Invalid token payload");
  }
  return { sub: maybe.sub, email: maybe.email };
}

