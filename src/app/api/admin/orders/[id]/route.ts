import { cookies } from "next/headers";
import { NextResponse } from "next/server";
import {
  ADMIN_SESSION_COOKIE,
  verifyAdminSessionToken,
} from "@/lib/server/admin-session";
import { hasOrdersDatabase } from "@/lib/server/supabase-health";
import {
  adminTransitionOrderStatus,
  type AdminOrderStatusAction,
} from "@/lib/server/orders-repository";

export const dynamic = "force-dynamic";

const UUID_RE =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

function parseStatus(body: unknown): AdminOrderStatusAction | null {
  if (!body || typeof body !== "object") return null;
  const s = (body as { status?: unknown }).status;
  if (s === "in_progress" || s === "completed") return s;
  return null;
}

export async function PATCH(
  req: Request,
  ctx: { params: Promise<{ id: string }> }
) {
  const jar = await cookies();
  const token = jar.get(ADMIN_SESSION_COOKIE)?.value;
  if (!verifyAdminSessionToken(token)) {
    return NextResponse.json({ error: "Нет доступа" }, { status: 401 });
  }

  if (!hasOrdersDatabase()) {
    return NextResponse.json(
      { error: "База заявок не настроена" },
      { status: 503 }
    );
  }

  const { id } = await ctx.params;
  if (!id || !UUID_RE.test(id)) {
    return NextResponse.json({ error: "Некорректный идентификатор" }, { status: 400 });
  }

  let json: unknown;
  try {
    json = await req.json();
  } catch {
    return NextResponse.json({ error: "Ожидался JSON" }, { status: 400 });
  }

  const status = parseStatus(json);
  if (!status) {
    return NextResponse.json(
      { error: "Ожидалось поле status: in_progress | completed" },
      { status: 400 }
    );
  }

  const result = await adminTransitionOrderStatus(id, status);
  if (!result.ok) {
    return NextResponse.json({ error: result.error }, { status: 409 });
  }

  return NextResponse.json({ ok: true });
}
