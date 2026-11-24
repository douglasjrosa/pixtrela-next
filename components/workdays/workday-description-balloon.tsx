"use client";

import {
  useState,
  type MouseEvent,
  type ReactElement,
  type ReactNode,
} from "react";
import { createPortal } from "react-dom";

const BALLOON_MAX_WIDTH_VW = 40;
const CURSOR_GAP_PX = 12;

type BalloonPosition = {
  x: number;
  y: number;
  viewportWidth: number;
  placeLeft: boolean;
};

function balloonStyle(position: BalloonPosition) {
  const thresholdPx =
    (position.viewportWidth * BALLOON_MAX_WIDTH_VW) / 100;
  const placeLeft =
    position.placeLeft ||
    position.x >= position.viewportWidth - thresholdPx;
  if (placeLeft) {
    return {
      top: position.y + CURSOR_GAP_PX,
      right: position.viewportWidth - position.x + CURSOR_GAP_PX,
      maxWidth: `${BALLOON_MAX_WIDTH_VW}vw`,
    };
  }
  return {
    top: position.y + CURSOR_GAP_PX,
    left: position.x + CURSOR_GAP_PX,
    maxWidth: `${BALLOON_MAX_WIDTH_VW}vw`,
  };
}

export function WorkdayDescriptionBalloon({
  description,
  children,
}: {
  description: string | null;
  children: (handlers: {
    onMouseMove: (event: MouseEvent<HTMLElement>) => void;
    onMouseLeave: () => void;
  }) => ReactNode;
}): ReactElement {
  const [position, setPosition] = useState<BalloonPosition | null>(null);
  const text = description?.trim() ?? "";

  function onMouseMove(event: MouseEvent<HTMLElement>): void {
    if (!text) return;
    const viewportWidth = window.innerWidth;
    const thresholdPx = (viewportWidth * BALLOON_MAX_WIDTH_VW) / 100;
    setPosition({
      x: event.clientX,
      y: event.clientY,
      viewportWidth,
      placeLeft: event.clientX >= viewportWidth - thresholdPx,
    });
  }

  function onMouseLeave(): void {
    setPosition(null);
  }

  const tooltip =
    position && text && typeof document !== "undefined"
      ? createPortal(
          <div
            role="tooltip"
            className="pointer-events-none fixed z-50 rounded-md border bg-popover px-3 py-2 text-sm text-popover-foreground shadow-md"
            style={balloonStyle(position)}
          >
            {text}
          </div>,
          document.body,
        )
      : null;

  return (
    <>
      {children({ onMouseMove, onMouseLeave })}
      {tooltip}
    </>
  );
}
