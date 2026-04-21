"use client";

import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/browser";
import { LogOut } from "lucide-react";

export function SignOutButton() {
  const router = useRouter();

  async function signOut() {
    const supabase = createClient();
    await supabase.auth.signOut();
    router.push("/admin/login");
    router.refresh();
  }

  return (
    <button
      onClick={signOut}
      className="inline-flex items-center gap-1.5 text-xs text-gray-500 hover:text-rose-600 transition-colors"
    >
      <LogOut className="h-3.5 w-3.5" />
      로그아웃
    </button>
  );
}
