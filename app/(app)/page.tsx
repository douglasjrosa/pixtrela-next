import { getTranslations } from "next-intl/server";

import { auth } from "@/auth";

export default async function DashboardPage() {
  const t = await getTranslations("app");
  const session = await auth();

  return (
    <section className="space-y-2 p-6">
      <h1 className="text-2xl font-bold">{t("name")}</h1>
      <p className="text-muted-foreground">{t("slogan")}</p>
      {session?.user?.name ? <p className="pt-4">{session.user.name}</p> : null}
    </section>
  );
}
