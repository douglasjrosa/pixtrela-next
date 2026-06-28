"use client";

import { Toaster as Sonner } from "sonner";

export function Toaster() {
  return (
    <Sonner
      richColors
      closeButton
      position="top-center"
      toastOptions={{
        duration: 4000,
      }}
    />
  );
}
