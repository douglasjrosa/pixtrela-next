import type { MetadataRoute } from "next";

import {
  APP_APPLE_TOUCH_ICON,
  APP_FAVICON_PNG,
  APP_ICON_192,
  APP_ICON_512,
} from "@/lib/assets/branding";

type PixtrelaManifest = MetadataRoute.Manifest & {
  handle_links?: "preferred" | "not-preferred";
};

export default function manifest(): MetadataRoute.Manifest {
  const manifestData: PixtrelaManifest = {
    id: "/",
    name: "Pixtrela",
    short_name: "Pixtrela",
    description:
      "Plataforma de gamificação industrial: você produz, você ganha, você brilha.",
    start_url: "/",
    scope: "/",
    display: "standalone",
    orientation: "portrait",
    background_color: "#ffffff",
    theme_color: "#0a0a0a",
    launch_handler: {
      client_mode: "navigate-existing",
    },
    handle_links: "preferred",
    icons: [
      {
        src: APP_FAVICON_PNG,
        sizes: "64x64",
        type: "image/png",
        purpose: "any",
      },
      {
        src: APP_ICON_192,
        sizes: "192x192",
        type: "image/png",
        purpose: "maskable",
      },
      {
        src: APP_ICON_512,
        sizes: "512x512",
        type: "image/png",
      },
      {
        src: APP_APPLE_TOUCH_ICON,
        sizes: "180x180",
        type: "image/png",
        purpose: "any",
      },
    ],
  };

  return manifestData;
}
