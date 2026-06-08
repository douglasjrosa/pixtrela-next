"use client";

import Link from "next/link";
import { useSession, signOut } from "next-auth/react";
import { useTranslations } from "next-intl";

import { Button } from "@/components/ui/button";
import { navItemsForRole, type Role } from "@/lib/auth/nav";

export function AppNav() {
  const t = useTranslations();
  const { data: session } = useSession();
  const role = (session?.user?.role ?? "colaborator") as Role;
  const items = navItemsForRole(role);

  return (
    <nav className="flex items-center gap-4 border-b px-4 py-3">
      <Link href="/" className="font-bold">
        {t("app.name")}
      </Link>
      <ul className="flex flex-1 gap-3 text-sm">
        {items.map((item) => (
          <li key={item.href}>
            <Link href={item.href} className="hover:underline">
              {t(`nav.${item.labelKey}`)}
            </Link>
          </li>
        ))}
      </ul>
      <Button variant="outline" size="sm" onClick={() => signOut({ callbackUrl: "/login" })}>
        {t("auth.signOut")}
      </Button>
    </nav>
  );
}
