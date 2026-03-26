import { SignJWT, jwtVerify, type JWTPayload } from "jose";

export interface SessionPayload extends JWTPayload {
  sub: string;
  email: string;
  role: "user" | "admin";
  name: string;
}

function getJwtSecret() {
  const secret = process.env.JWT_SECRET;

  if (!secret) {
    throw new Error("Missing required environment variable: JWT_SECRET");
  }

  return new TextEncoder().encode(secret);
}

export async function createSessionToken(payload: SessionPayload) {
  return new SignJWT(payload)
    .setProtectedHeader({ alg: "HS256" })
    .setSubject(payload.sub)
    .setIssuedAt()
    .setExpirationTime("7d")
    .sign(getJwtSecret());
}

export async function verifySessionToken(token: string) {
  const { payload } = await jwtVerify(token, getJwtSecret());

  return {
    sub: String(payload.sub),
    email: String(payload.email),
    role: payload.role === "admin" ? "admin" : "user",
    name: String(payload.name ?? ""),
  } satisfies SessionPayload;
}
