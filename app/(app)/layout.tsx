import type { ReactNode } from "react";

import { AppNav } from "@/components/app-nav";

export default function AppLayout({ children }: { children: ReactNode }) {
  return (
    <div className="flex min-h-screen flex-col">
      <AppNav />
      <main className="flex-1">{children}</main>
    </div>
  );
}
