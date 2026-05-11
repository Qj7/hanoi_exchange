import { NextResponse } from "next/server";
import {
  ADMIN_SESSION_COOKIE,
  adminCredentialsMatch,
  signAdminSession,
} from "@/lib/server/admin-session";

export async function POST(request: Request) {
  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Ожидался JSON" }, { status: 400 });
  }
  if (!body || typeof body !== "object") {
    return NextResponse.json({ error: "Некорректное тело" }, { status: 400 });
  }
  const u = (body as Record<string, unknown>).username;
  const p = (body as Record<string, unknown>).password;
  if (typeof u !== "string" || typeof p !== "string") {
    return NextResponse.json({ error: "Логин и пароль обязательны" }, { status: 400 });
  }

  if (!adminCredentialsMatch(u, p)) {
    return NextResponse.json({ error: "Неверный логин или пароль" }, { status: 401 });
  }

  let token: string;
  try {
    token = signAdminSession();
  } catch {
    return NextResponse.json(
      { error: "ADMIN_SESSION_SECRET не настроен (минимум 16 символов)" },
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
