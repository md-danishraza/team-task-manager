import jwt from "jsonwebtoken";
import type { User } from "../../prisma/generated/client/index.js";

const JWT_SECRET = process.env.JWT_SECRET!;
const JWT_EXPIRES_IN = "7d";
const COOKIE_MAX_AGE = 7 * 24 * 60 * 60 * 1000; // 7 days in ms

export interface TokenPayload {
  id: string;
  email: string;
  role: string;
}

export function generateToken(
  user: Pick<User, "id" | "email" | "role">
): string {
  const payload: TokenPayload = {
    id: user.id,
    email: user.email,
    role: user.role,
  };

  // In production, use stronger signing
  return jwt.sign(payload, JWT_SECRET, { expiresIn: JWT_EXPIRES_IN });
}

export function verifyToken(token: string): TokenPayload | null {
  try {
    return jwt.verify(token, JWT_SECRET) as TokenPayload;
  } catch (error) {
    return null;
  }
}

export function getCookieOptions() {
  return {
    httpOnly: true,
    // MUST be true if sameSite is "none"
    secure: process.env.NODE_ENV === "production",
    // "none" allows the cookie to be sent across different domains
    sameSite: process.env.NODE_ENV === "production" ? "none" : "lax",
    maxAge: COOKIE_MAX_AGE,
    path: "/",
  };
}
