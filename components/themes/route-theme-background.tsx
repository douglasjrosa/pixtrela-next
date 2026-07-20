"use client";

import {
  useEffect,
  useState,
  type CSSProperties,
} from "react";
import { usePathname } from "next/navigation";

import { cn } from "@/lib/utils";
import {
  computeParallaxOffset,
  DEFAULT_PARALLAX_BLEED,
  DEFAULT_PARALLAX_DIRECTION,
  DEFAULT_PARALLAX_INTENSITY,
  matchRouteTheme,
  parallaxLayerGeometry,
  routeThemeColorOverlayRgba,
  routeThemeImageOnlyStyle,
  routeThemeLayeredStyle,
  type RouteThemeView,
} from "@/lib/themes/match-route-theme";

export interface RouteThemeBackgroundProps {
  themes?: RouteThemeView[];
  /** When set, skips pathname matching. */
  theme?: RouteThemeView | null;
  fallbackClassName?: string;
  className?: string;
}

/**
 * Client-only background layer. Does not wrap page content.
 * Supports scroll, fixed, and parallax image motion.
 */
export function RouteThemeBackground({
  themes = [],
  theme: forcedTheme,
  fallbackClassName = "bg-background",
  className,
}: RouteThemeBackgroundProps) {
  const pathname = usePathname() ?? "/";
  const theme =
    forcedTheme !== undefined
      ? forcedTheme
      : matchRouteTheme(pathname, themes);

  const motion = theme?.backgroundMotion ?? "scroll";
  const hasImage = Boolean(theme?.backgroundImageUrl);
  const useParallax = hasImage && motion === "parallax";
  const useFixed = hasImage && motion === "fixed";
  const intensity = theme?.parallaxIntensity ?? DEFAULT_PARALLAX_INTENSITY;
  const direction = theme?.parallaxDirection ?? DEFAULT_PARALLAX_DIRECTION;
  const bleed = theme?.parallaxBleed ?? DEFAULT_PARALLAX_BLEED;
  const [parallaxOffset, setParallaxOffset] = useState(0);

  useEffect(() => {
    if (!useParallax) {
      setParallaxOffset(0);
      return;
    }

    function onScroll(): void {
      setParallaxOffset(
        computeParallaxOffset(window.scrollY, intensity, direction),
      );
    }

    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, [useParallax, intensity, direction]);

  if (useParallax && theme) {
    const imageStyle = routeThemeImageOnlyStyle(theme) as CSSProperties;
    const overlayRgba = routeThemeColorOverlayRgba(theme);
    const geometry = parallaxLayerGeometry(bleed);

    return (
      <div
        aria-hidden
        className={cn(
          "pointer-events-none absolute inset-0 z-0 overflow-hidden",
          className,
        )}
      >
        <div
          className="absolute inset-x-0 will-change-transform"
          style={{
            ...imageStyle,
            top: `${geometry.topPercent}%`,
            height: `${geometry.heightPercent}%`,
            transform: `translate3d(0, ${parallaxOffset}px, 0)`,
          }}
        />
        {overlayRgba ? (
          <div
            className="absolute inset-0"
            style={{ backgroundColor: overlayRgba }}
          />
        ) : null}
      </div>
    );
  }

  const layered = routeThemeLayeredStyle(
    theme
      ? { ...theme, backgroundMotion: useFixed ? "scroll" : motion }
      : theme,
  ) as CSSProperties;
  const hasCustom = Boolean(
    layered.backgroundImage || layered.backgroundColor,
  );

  return (
    <div
      aria-hidden
      className={cn(
        "pointer-events-none z-0",
        useFixed ? "fixed inset-0" : "absolute inset-0",
        !hasCustom && fallbackClassName,
        className,
      )}
      style={hasCustom ? layered : undefined}
    />
  );
}
