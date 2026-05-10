import { NextResponse } from "next/server";
import { runSupabaseHealthCheck } from "@/lib/server/supabase-health";

export async function GET() {
  const result = await runSupabaseHealthCheck();
  if (!result.ok) {
    return NextResponse.json(
      { ok: false, error: result.error },
      { status: result.httpStatus },
    );
  }
  return NextResponse.json({ ok: true });
}
