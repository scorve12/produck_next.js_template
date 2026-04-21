import type { Metadata } from "next";
import "./globals.css";

// Per-site: replace title/description/etc. See TEMPLATE.md §2.1.
export const metadata: Metadata = {
  title: "Site Title",
  description: "Site description.",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="ko">
      <body>{children}</body>
    </html>
  );
}
