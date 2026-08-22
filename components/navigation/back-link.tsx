import type { ReactNode } from "react";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import type { VariantProps } from "class-variance-authority";

import { buttonVariants } from "@/components/ui/button";
import { cn } from "@/lib/utils";

type BackLinkProps = {
  href: string;
  children: ReactNode;
  className?: string;
} & Pick<VariantProps<typeof buttonVariants>, "variant" | "size">;

export function BackLink({
  href,
  children,
  className,
  variant = "outline",
  size = "lg",
}: BackLinkProps) {
  return (
    <Link
      href={href}
      className={cn(buttonVariants({ variant, size }), "w-fit", className)}
    >
      <ArrowLeft aria-hidden />
      {children}
    </Link>
  );
}
