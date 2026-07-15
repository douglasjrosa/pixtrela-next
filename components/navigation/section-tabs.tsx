"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

import { cn } from "@/lib/utils";

export interface SectionTabItem {
  href: string;
  label: string;
}

export interface SectionTabsProps {
  items: SectionTabItem[];
  className?: string;
  ariaLabel: string;
}

export function SectionTabs({ items, className, ariaLabel }: SectionTabsProps) {
  const pathname = usePathname();

  return (
    <nav
      className={cn("flex flex-wrap gap-2 border-b", className)}
      aria-label={ariaLabel}
    >
      {items.map((item) => {
        const isActive =
          pathname === item.href || pathname.startsWith(`${item.href}/`);

        return (
          <Link
            key={item.href}
            href={item.href}
            aria-current={isActive ? "page" : undefined}
            className={cn(
              "inline-flex min-h-10 items-center border-b-2 px-3 text-sm font-medium",
              isActive
                ? "border-foreground text-foreground"
                : "border-transparent text-muted-foreground hover:text-foreground",
            )}
          >
            {item.label}
          </Link>
        );
      })}
    </nav>
  );
}
