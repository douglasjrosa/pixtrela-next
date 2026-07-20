"use client";

import { Package } from "lucide-react";
import { useState, useTransition } from "react";
import { useTranslations } from "next-intl";

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { cn } from "@/lib/utils";

import { ExchangeButton } from "./exchange-button";

export interface AwardView {
  id: string;
  title: string;
  description?: string;
  cost: number;
  currency: string;
  imageUrl?: string | null;
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
  const remaining = Math.max(0, award.cost - balance);
  const progress = award.cost > 0 ? Math.min(1, balance / award.cost) : 0;

  function handleRedeem() {
    setMessage(null);
    startTransition(async () => {
      try {
        await onRedeem(award.id, award.currency, 1);
        setMessage(t("redeemCelebration", { award: award.title }));
      } catch {
        setMessage(t("insufficient"));
      }
    });
  }

  return (
    <Card
      className={cn(
        "overflow-hidden rounded-2xl",
        !windowOpen && "opacity-60",
      )}
    >
      <div className="relative flex h-40 items-center justify-center bg-muted">
        {award.imageUrl ? (
          // eslint-disable-next-line @next/next/no-img-element -- Strapi host varies by env
          <img
            src={award.imageUrl}
            alt={t("imageAlt", { title: award.title })}
            className="h-full w-full object-cover"
          />
        ) : (
          <Package className="size-12 text-muted-foreground" aria-hidden />
        )}
      </div>
      <CardHeader>
        <CardTitle className="text-lg">{award.title}</CardTitle>
        {award.description ? (
          <CardDescription>{award.description}</CardDescription>
        ) : null}
      </CardHeader>
      <CardContent className="space-y-3">
        <p className="text-2xl font-bold tabular-nums text-[var(--star-gold-foreground)]">
          {award.cost}
          <span className="ml-1 text-sm font-medium text-muted-foreground">
            {t("cost")}
          </span>
        </p>
        {!affordable && award.cost > 0 ? (
          <div className="space-y-1">
            <div
              className="h-2 overflow-hidden rounded-full bg-muted"
              role="progressbar"
              aria-valuenow={Math.round(progress * 100)}
              aria-valuemin={0}
              aria-valuemax={100}
            >
              <div
                className="h-full rounded-full bg-[var(--star-gold)] transition-all duration-300"
                style={{ width: `${progress * 100}%` }}
              />
            </div>
            <p className="text-sm text-muted-foreground">
              {t("starsRemaining", { count: remaining })}
            </p>
          </div>
        ) : null}
        <ExchangeButton
          windowOpen={windowOpen}
          affordable={affordable && !isPending}
          onRedeem={handleRedeem}
        />
        {message ? (
          <p role="status" className="text-sm font-medium text-[var(--star-gold-foreground)]">
            {message}
          </p>
        ) : null}
      </CardContent>
    </Card>
  );
}
