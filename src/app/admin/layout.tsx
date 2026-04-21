import Link from "next/link";
import { createClient } from "@supabase/supabase-js";
import { getAdminSession } from "@/lib/supabase/auth";
import { TENANT_ID } from "@/lib/supabase/tenant";
import { SignOutButton } from "@/components/admin/SignOutButton";
import { LayoutDashboard, FolderKanban, Newspaper } from "lucide-react";

export const dynamic = "force-dynamic";

export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await getAdminSession();

  // Unauthenticated (login page, or middleware about to redirect):
  // render children without the admin chrome.
  if (!session) return <>{children}</>;

  // Ensure tenant_memberships record exists for email-login users.
  // OAuth callback already creates it, but email login bypasses that route.
  const adminDb = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
  );
  await adminDb.from("tenant_memberships").upsert(
    { tenant_id: TENANT_ID, user_id: session.userId, role: "admin" },
    { onConflict: "tenant_id,user_id", ignoreDuplicates: true },
  );

  return (
    <div className="min-h-screen bg-[#FAF9F6]">
      <div className="flex">
        <aside className="hidden md:flex w-60 min-h-screen bg-white border-r border-stone-100 flex-col">
          <div className="px-6 py-6 border-b border-stone-100">
            <Link href="/admin" className="text-lg font-extrabold text-gray-900">
              프로덕 관리자
            </Link>
          </div>
          <nav className="flex-1 px-3 py-4 space-y-1">
            <NavLink href="/admin" icon={<LayoutDashboard className="h-4 w-4" />}>
              대시보드
            </NavLink>
            <NavLink
              href="/admin/portfolio"
              icon={<FolderKanban className="h-4 w-4" />}
            >
              포트폴리오
            </NavLink>
            <NavLink
              href="/admin/feed"
              icon={<Newspaper className="h-4 w-4" />}
            >
              피드
            </NavLink>
          </nav>
          <div className="px-4 py-4 border-t border-stone-100">
            <p className="text-xs text-gray-500 mb-1 truncate">{session.email}</p>
            <p className="text-[11px] text-gray-700 font-semibold mb-3">
              {session.role}
            </p>
            <SignOutButton />
          </div>
        </aside>

        <main className="flex-1 min-h-screen">
          <div className="md:hidden bg-white border-b border-stone-100 px-4 py-3 flex items-center justify-between">
            <Link href="/admin" className="font-bold text-gray-900">
              프로덕 관리자
            </Link>
            <SignOutButton />
          </div>
          <div className="px-6 md:px-10 py-8 md:py-12 max-w-[1400px]">
            {children}
          </div>
        </main>
      </div>
    </div>
  );
}

function NavLink({
  href,
  icon,
  children,
}: {
  href: string;
  icon: React.ReactNode;
  children: React.ReactNode;
}) {
  return (
    <Link
      href={href}
      className="flex items-center gap-2.5 px-3 py-2 rounded-lg text-sm text-gray-600 hover:bg-stone-100 hover:text-gray-900 transition-colors"
    >
      {icon}
      {children}
    </Link>
  );
}
