import { NextResponse } from "next/server";
import { isSupabaseConfigured, safeNextPath } from "@/lib/env";
import { getServerClient } from "@/lib/supabase/server";

export async function GET(request: Request) {
  const { searchParams, origin } = new URL(request.url);
  const code = searchParams.get("code");
  // Only same-origin paths: prevents an open redirect via ?next=.
  const next = safeNextPath(searchParams.get("next"));

  if (code && isSupabaseConfigured()) {
    const supabase = await getServerClient();
    const { error } = await supabase.auth.exchangeCodeForSession(code);
    if (error) return NextResponse.redirect(`${origin}/login?error=link`);
  }
  return NextResponse.redirect(`${origin}${next}`);
}
