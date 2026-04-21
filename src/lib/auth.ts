import { redirect } from "next/navigation";
import { createAuthServerClient } from "@/lib/supabase/server";
import { TENANT_ID } from "@/lib/supabase/tenant";

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

  if (!membership) return null;

  return {
    userId: user.id,
    email: user.email ?? "",
    role: membership.role as AdminSession["role"],
  };
}

export async function requireAdmin(minRole: AdminSession["role"] = "editor") {
  const session = await getAdminSession();
  if (!session) redirect("/admin/login");

  const rank: Record<AdminSession["role"], number> = {
    viewer: 0,
    editor: 1,
    admin: 2,
    super_admin: 3,
  };
  if (rank[session.role] < rank[minRole]) redirect("/admin/login");

  return session;
}
