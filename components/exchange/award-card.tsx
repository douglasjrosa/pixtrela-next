"use client";

import { useState, useTransition } from "react";
import { useTranslations } from "next-intl";

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { ExchangeButton } from "./exchange-button";

export interface AwardView {
  id: string;
  title: string;
  description?: string;
  cost: number;
  currency: string;
}

export interface AwardCardProps {
  award: AwardView;
  windowOpen: boolean;
  balance: number;
  onRedeem: (awardId: string, currency: string, qty: number) => Promise<void>;
}

export function AwardCard({ award, windowOpen, balance, onRedeem }: AwardCardProps) {
  const t = useTranslations("exchange");
  const [isPending, startTransition] = useTransition();
  const [message, setMessage] = useState<string | null>(null);
  const affordable = balance >= award.cost && award.cost > 0;

  function handleRedeem() {
    setMessage(null);
    startTransition(async () => {
      try {
        await onRedeem(award.id, award.currency, 1);
        setMessage(t("success"));
      } catch {
        setMessage(t("insufficient"));
      }
    });
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>{award.title}</CardTitle>
        {award.description ? (
          <CardDescription>{award.description}</CardDescription>
        ) : null}
      </CardHeader>
      <CardContent className="space-y-2">
        <p className="text-sm">
          {t("cost")}: {award.cost}
        </p>
        <ExchangeButton
          windowOpen={windowOpen}
          affordable={affordable && !isPending}
          onRedeem={handleRedeem}
        />
        {message ? (
          <p role="status" className="text-sm">
            {message}
          </p>
        ) : null}
      </CardContent>
    </Card>
  );
}
