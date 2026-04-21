import { redirect } from "next/navigation";
import { createAuthServerClient } from "@/lib/supabase/server";
import { TENANT_ID } from "@/lib/supabase/tenant";

export class AuthError extends Error {
  constructor(public code: "UNAUTHORIZED" | "FORBIDDEN") {
    super(code);
    this.name = "AuthError";
  }
}

export type AdminSession = {
  userId: string;
  email: string;
  role: "super_admin" | "admin" | "editor" | "viewer";
};

export async function getAdminSession(): Promise<AdminSession | null> {
  const supabase = await createAuthServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) return null;

  const { data: membership } = await supabase
    .from("tenant_memberships")
    .select("role")
    .eq("tenant_id", TENANT_ID)
    .eq("user_id", user.id)
    .maybeSingle();

  return {
    userId: user.id,
    email: user.email ?? "",
    role: (membership?.role as AdminSession["role"]) ?? "admin",
  };
}

// Route Handler용: redirect 대신 AuthError throw
export async function requireRole(minRole: AdminSession["role"] = "editor") {
  const session = await getAdminSession();
  if (!session) throw new AuthError("UNAUTHORIZED");

  const rank: Record<AdminSession["role"], number> = {
    viewer: 0,
    editor: 1,
    admin: 2,
    super_admin: 3,
  };
  if (rank[session.role] < rank[minRole]) throw new AuthError("FORBIDDEN");

  return session;
}

export async function requireAdmin(minRole: AdminSession["role"] = "editor") {
  const session = await getAdminSession();
  if (!session) redirect("/");

  const rank: Record<AdminSession["role"], number> = {
    viewer: 0,
    editor: 1,
    admin: 2,
    super_admin: 3,
  };
  if (rank[session.role] < rank[minRole]) redirect("/");

  return session;
}
