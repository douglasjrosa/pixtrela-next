import type { ReactNode } from "react";

import { ColaboratorHeader } from "@/components/colaborator/colaborator-header";

export default function ColaboratorPrivateLayout({
  children,
}: {
  children: ReactNode;
}) {
  return (
    <div className="flex min-h-screen flex-col">
      <ColaboratorHeader />
      <main className="flex-1">{children}</main>
    </div>
  );
}
