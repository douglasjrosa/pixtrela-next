"use client";

import { useFormStatus } from "react-dom";

import { Button } from "@/components/ui/button";

export function FormSubmitButton({ label }: { label: string }) {
  const { pending } = useFormStatus();
  return (
    <Button type="submit" disabled={pending}>
      {label}
    </Button>
  );
}
