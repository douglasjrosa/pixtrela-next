import type { ReactNode } from "react";
import Link from "next/link";
import { ArrowDown, ArrowUp } from "lucide-react";

import {
  LIST_SORT_HEADER_LINK_BASE_CLASS,
  listSortHeaderLinkClass,
} from "@/lib/ui/table-head-styles";
import { cn } from "@/lib/utils";

export type ListSortDirection = "asc" | "desc";

export interface ListSortHeaderLinkProps {
  href: string;
  label: ReactNode;
  active: boolean;
  direction?: ListSortDirection;
  align?: "left" | "center";
  className?: string;
  linkClassName?: string;
}

export function ListSortHeaderLink({
  href,
  label,
  active,
  direction,
  align = "left",
  className,
  linkClassName,
}: ListSortHeaderLinkProps) {
  return (
    <th
      className={cn(
        "py-2",
        align === "center" ? "text-center" : "text-left",
        className,
      )}
    >
      <Link
        href={href}
        scroll={false}
        className={cn(
          LIST_SORT_HEADER_LINK_BASE_CLASS,
          listSortHeaderLinkClass(active),
          align === "center" ? "justify-center" : "justify-start",
          linkClassName,
        )}
        aria-sort={
          active ? (direction === "asc" ? "ascending" : "descending") : "none"
        }
      >
        <span className={linkClassName ? "leading-tight" : undefined}>
          {label}
        </span>
        {active ? (
          direction === "asc" ? (
            <ArrowUp className="size-3.5 shrink-0" aria-hidden />
          ) : (
            <ArrowDown className="size-3.5 shrink-0" aria-hidden />
          )
        ) : null}
      </Link>
    </th>
  );
}
