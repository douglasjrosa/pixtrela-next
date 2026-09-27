"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

import {
  SECTION_TABS_NAV_CLASS,
  sectionTabLinkClass,
} from "@/lib/ui/section-tab-styles";
import { cn } from "@/lib/utils";

export interface SectionTabItem {
  href: string;
  label: string;
  activePrefix?: string;
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
      className={cn(SECTION_TABS_NAV_CLASS, className)}
      aria-label={ariaLabel}
    >
      {items.map((item) => {
        const activePath = item.activePrefix ?? item.href;
        const isActive =
          pathname === activePath || pathname.startsWith(`${activePath}/`);

        return (
          <Link
            key={item.href}
            href={item.href}
            aria-current={isActive ? "page" : undefined}
            className={sectionTabLinkClass(isActive)}
          >
            {item.label}
          </Link>
        );
      })}
    </nav>
  );
}
