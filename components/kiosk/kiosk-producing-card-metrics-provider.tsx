"use client";

import { createContext, useContext, type ReactNode } from "react";

export type ProducingCardMetricsVisibility = {
  showStartedAt: boolean;
  showExpectedTime: boolean;
  showElapsed: boolean;
};

export const DEFAULT_PRODUCING_CARD_METRICS_VISIBILITY: ProducingCardMetricsVisibility =
  {
    showStartedAt: true,
    showExpectedTime: true,
    showElapsed: true,
  };

const ProducingCardMetricsContext = createContext(
  DEFAULT_PRODUCING_CARD_METRICS_VISIBILITY,
);

export function KioskProducingCardMetricsProvider({
  value,
  children,
}: {
  value: ProducingCardMetricsVisibility;
  children: ReactNode;
}) {
  return (
    <ProducingCardMetricsContext.Provider value={value}>
      {children}
    </ProducingCardMetricsContext.Provider>
  );
}

export function useProducingCardMetricsVisibility(): ProducingCardMetricsVisibility {
  return useContext(ProducingCardMetricsContext);
}
