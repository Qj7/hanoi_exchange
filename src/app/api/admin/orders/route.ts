import { cookies } from "next/headers";
import { NextResponse } from "next/server";
import {
  ADMIN_SESSION_COOKIE,
  verifyAdminSessionToken,
} from "@/lib/server/admin-session";
import { hasOrdersDatabase } from "@/lib/server/supabase-health";
import { listAllOrdersForAdmin } from "@/lib/server/orders-repository";

export const dynamic = "force-dynamic";

export async function GET() {
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

  const result = await listAllOrdersForAdmin();
  if (!Array.isArray(result)) {
    return NextResponse.json({ error: result.error }, { status: 500 });
  }

  return NextResponse.json(
    { orders: result },
    {
      headers: {
        "Cache-Control": "private, no-store, max-age=0",
      },
    }
  );
}
