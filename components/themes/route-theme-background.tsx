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
  DEFAULT_PARALLAX_DIRECTION,
  DEFAULT_PARALLAX_INTENSITY,
  matchRouteTheme,
  maxParallaxTravelPx,
  parallaxLayerPixelGeometry,
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

type ParallaxLayerBox = {
  topPx: number;
  heightPx: number;
};

/**
 * Client-only background layer. Does not wrap page content.
 *
 * - scroll: paints with the document (absolute, full page height)
 * - fixed: locked to the viewport
 * - parallax: fixed viewport layer shifted by window.scrollY
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
  const [parallaxOffset, setParallaxOffset] = useState(0);
  const [layerBox, setLayerBox] = useState<ParallaxLayerBox>({
    topPx: 0,
    heightPx: 0,
  });

  useEffect(() => {
    if (!useParallax) {
      return;
    }

    function syncParallax(): void {
      const viewportHeight = window.innerHeight;
      const scrollRange = Math.max(
        0,
        document.documentElement.scrollHeight - viewportHeight,
      );
      const maxTravel = maxParallaxTravelPx(scrollRange, intensity);
      setLayerBox(
        parallaxLayerPixelGeometry({
          viewportHeight,
          maxTravelPx: maxTravel,
        }),
      );
      setParallaxOffset(
        computeParallaxOffset(window.scrollY, intensity, direction),
      );
    }

    syncParallax();
    window.addEventListener("scroll", syncParallax, { passive: true });
    window.addEventListener("resize", syncParallax, { passive: true });
    return () => {
      window.removeEventListener("scroll", syncParallax);
      window.removeEventListener("resize", syncParallax);
    };
  }, [useParallax, intensity, direction]);

  if (useParallax && theme) {
    const imageStyle = routeThemeImageOnlyStyle(theme) as CSSProperties;
    const overlayRgba = routeThemeColorOverlayRgba(theme);

    return (
      <div
        aria-hidden
        className={cn(
          "pointer-events-none fixed inset-0 z-0 overflow-hidden",
          className,
        )}
      >
        <div
          className="absolute inset-x-0 will-change-transform"
          style={{
            ...imageStyle,
            top: `${layerBox.topPx}px`,
            height: `${layerBox.heightPx}px`,
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
        useFixed ? "fixed inset-0" : "absolute inset-0 min-h-full",
        !hasCustom && fallbackClassName,
        className,
      )}
      style={hasCustom ? layered : undefined}
    />
  );
}
