"use client";

import { createBrowserClient } from "@supabase/ssr";
import { TENANT_ID } from "./tenant";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

export function createClient() {
  return createBrowserClient(supabaseUrl, supabaseAnonKey, {
    global: {
      headers: {
        "x-tenant-id": TENANT_ID,
      },
    },
  });
}
