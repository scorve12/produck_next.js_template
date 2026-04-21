import { createServerClient as createSSRClient } from "@supabase/ssr";
import { createClient as createSupabaseClient } from "@supabase/supabase-js";
import { cookies } from "next/headers";
import { TENANT_ID } from "./tenant";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

/**
 * Anonymous server client for public reads.
 * Sets x-tenant-id so the articles_select_published RLS policy matches.
 * Does not read/write cookies — safe to use in generateStaticParams / ISR.
 */
export function createServerClient() {
  return createSupabaseClient(supabaseUrl, supabaseAnonKey, {
    auth: {
      persistSession: false,
      autoRefreshToken: false,
    },
    global: {
      headers: {
        "x-tenant-id": TENANT_ID,
      },
    },
  });
}

/**
 * Authenticated server client bound to the user's session cookies.
 * Use this for admin reads/writes so RLS policies see the user's role.
 */
// Route Handler용 alias — createAuthServerClient의 단축 이름
export const createClient = createAuthServerClient;

export async function createAuthServerClient() {
  const cookieStore = await cookies();

  return createSSRClient(supabaseUrl, supabaseAnonKey, {
    cookies: {
      getAll() {
        return cookieStore.getAll();
      },
      setAll(cookiesToSet: { name: string; value: string; options?: Record<string, unknown> }[]) {
        try {
          cookiesToSet.forEach(({ name, value, options }) =>
            cookieStore.set(name, value, options),
          );
        } catch {
          // Called from a Server Component — no-op.
        }
      },
    },
    global: {
      headers: {
        "x-tenant-id": TENANT_ID,
      },
    },
  });
}
