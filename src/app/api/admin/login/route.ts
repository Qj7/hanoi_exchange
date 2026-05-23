import { NextResponse } from "next/server";
import {
  ADMIN_SESSION_COOKIE,
  adminCredentialsMatch,
  isAdminEnvConfigured,
  signAdminSession,
} from "@/lib/server/admin-session";

export async function POST(request: Request) {
  if (!isAdminEnvConfigured()) {
    return NextResponse.json(
      {
        error:
          "На сервері не задано ADMIN_USERNAME, ADMIN_PASSWORD або ADMIN_SESSION_SECRET (≥16 символів). Перевір змінні середовища Production на Vercel і зроби Redeploy.",
      },
      { status: 503 }
    );
  }

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Очікувався JSON" }, { status: 400 });
  }
  if (!body || typeof body !== "object") {
    return NextResponse.json({ error: "Некоректне тіло" }, { status: 400 });
  }
  const u = (body as Record<string, unknown>).username;
  const p = (body as Record<string, unknown>).password;
  if (typeof u !== "string" || typeof p !== "string") {
    return NextResponse.json({ error: "Логін і пароль обов'язкові" }, { status: 400 });
  }

  if (!adminCredentialsMatch(u, p)) {
    return NextResponse.json({ error: "Невірний логін або пароль" }, { status: 401 });
  }

  let token: string;
  try {
    token = signAdminSession();
  } catch {
    return NextResponse.json(
      { error: "ADMIN_SESSION_SECRET не налаштовано (мінімум 16 символів)" },
      { status: 503 }
    );
  }

  const res = NextResponse.json({ ok: true });
  res.cookies.set(ADMIN_SESSION_COOKIE, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: 7 * 24 * 3600,
  });
  return res;
}
