import { SignJWT, jwtVerify } from "jose";
import type { Role } from "@prisma/client";

// Helpers JWT purs — utilisables côté Edge (middleware) comme côté Node.
// Aucune dépendance à next/headers ni à Prisma ici.

export const SESSION_COOKIE = "2sdp_session";
export const SESSION_MAX_AGE = 60 * 60 * 24 * 30; // 30 jours

export type SessionPayload = {
  userId: string;
  role: Role;
};

function secret() {
  const s = process.env.AUTH_SECRET;
  if (!s || s.length < 16) {
    throw new Error("AUTH_SECRET manquant ou trop court (32 octets recommandés).");
  }
  return new TextEncoder().encode(s);
}

export function signSession(payload: SessionPayload) {
  return new SignJWT(payload)
    .setProtectedHeader({ alg: "HS256" })
    .setIssuedAt()
    .setExpirationTime(`${SESSION_MAX_AGE}s`)
    .sign(secret());
}

export async function verifyToken(token: string): Promise<SessionPayload | null> {
  try {
    const { payload } = await jwtVerify(token, secret());
    return { userId: String(payload.userId), role: payload.role as Role };
  } catch {
    return null;
  }
}
