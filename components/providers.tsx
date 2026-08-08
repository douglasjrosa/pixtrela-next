"use client";

import { useState, type ReactNode } from "react";
import { SessionProvider } from "next-auth/react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";

import { Toaster } from "@/components/ui/sonner";
import { WelcomeOverlayHost } from "@/components/welcome/welcome-overlay-host";

export function Providers({ children }: { children: ReactNode }) {
  const [queryClient] = useState(() => new QueryClient());

  return (
    <SessionProvider>
      <QueryClientProvider client={queryClient}>
        {children}
        <WelcomeOverlayHost />
        <Toaster />
      </QueryClientProvider>
    </SessionProvider>
  );
}
