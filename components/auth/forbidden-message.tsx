import Link from "next/link";
import { getTranslations } from "next-intl/server";

import { auth } from "@/auth";
import { buttonVariants } from "@/components/ui/button";
import { homeHrefForRole, type Role } from "@/lib/auth/nav";
import { cn } from "@/lib/utils";

export async function ForbiddenMessage() {
  const t = await getTranslations("errors");
  const session = await auth();
  const role = (session?.user?.role ?? "colaborator") as Role;
  const homeHref = homeHrefForRole(role, session?.user?.id);

  return (
    <section className="mx-auto flex max-w-lg flex-col gap-4 p-6">
      <h1 className="text-xl font-semibold">{t("forbiddenTitle")}</h1>
      <p className="text-destructive">{t("forbidden")}</p>
      <Link
        href={homeHref}
        className={cn(buttonVariants({ variant: "outline" }), "w-fit")}
      >
        {t("backHome")}
      </Link>
    </section>
  );
}
