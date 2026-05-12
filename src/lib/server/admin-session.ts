import { createHmac, timingSafeEqual } from "crypto";

export const ADMIN_SESSION_COOKIE = "hx_admin";

export function signAdminSession(): string {
  const secret = process.env.ADMIN_SESSION_SECRET?.trim();
  if (!secret || secret.length < 16) {
    throw new Error("ADMIN_SESSION_SECRET must be at least 16 characters");
  }
  const exp = Math.floor(Date.now() / 1000) + 7 * 24 * 3600;
  const payload = Buffer.from(JSON.stringify({ exp }), "utf8").toString(
    "base64url"
  );
  const sig = createHmac("sha256", secret).update(payload).digest("base64url");
  return `${payload}.${sig}`;
}

export function verifyAdminSessionToken(token: string | undefined): boolean {
  if (!token?.includes(".")) return false;
  const secret = process.env.ADMIN_SESSION_SECRET?.trim();
  if (!secret || secret.length < 16) return false;

  const dot = token.lastIndexOf(".");
  const payload = token.slice(0, dot);
  const sig = token.slice(dot + 1);
  const expected = createHmac("sha256", secret).update(payload).digest("base64url");

  try {
    const sigBuf = Buffer.from(sig, "utf8");
    const expBuf = Buffer.from(expected, "utf8");
    if (sigBuf.length !== expBuf.length || !timingSafeEqual(sigBuf, expBuf)) {
      return false;
    }
  } catch {
    return false;
  }

  try {
    const json = JSON.parse(
      Buffer.from(payload, "base64url").toString("utf8")
    ) as { exp?: number };
    if (typeof json.exp !== "number") return false;
    return Math.floor(Date.now() / 1000) <= json.exp;
  } catch {
    return false;
  }
}

/** Все три значения нужны для входа и cookie на проде. */
export function isAdminEnvConfigured(): boolean {
  const secret = process.env.ADMIN_SESSION_SECRET?.trim() ?? "";
  return Boolean(
    process.env.ADMIN_USERNAME?.trim() &&
      process.env.ADMIN_PASSWORD?.trim() &&
      secret.length >= 16
  );
}

export function adminCredentialsMatch(username: string, password: string): boolean {
  const u = process.env.ADMIN_USERNAME?.trim();
  const p = process.env.ADMIN_PASSWORD?.trim();
  if (!u || !p) return false;
  return safeEqual(username, u) && safeEqual(password, p);
}

function safeEqual(a: string, b: string): boolean {
  const ba = Buffer.from(a, "utf8");
  const bb = Buffer.from(b, "utf8");
  if (ba.length !== bb.length) return false;
  return timingSafeEqual(ba, bb);
}
