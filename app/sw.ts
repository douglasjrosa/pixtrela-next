/// <reference lib="webworker" />
import { defaultCache } from "@serwist/turbopack/worker";
import type { PrecacheEntry, SerwistGlobalConfig } from "serwist";
import { CacheFirst, ExpirationPlugin, Serwist } from "serwist";

declare global {
  interface WorkerGlobalScope extends SerwistGlobalConfig {
    __SW_MANIFEST: (PrecacheEntry | string)[] | undefined;
  }
}

declare const self: ServiceWorkerGlobalScope;

const FACE_API_MODEL_CACHE = "face-api-models";
const FACE_API_MODEL_MAX_ENTRIES = 12;
const FACE_API_MODEL_MAX_AGE_SECONDS = 60 * 60 * 24 * 30;

const serwist = new Serwist({
  precacheEntries: self.__SW_MANIFEST,
  skipWaiting: true,
  clientsClaim: true,
  navigationPreload: true,
  runtimeCaching: [
    {
      matcher: ({ url }) => url.pathname.startsWith("/models/face-api/"),
      handler: new CacheFirst({
        cacheName: FACE_API_MODEL_CACHE,
        plugins: [
          new ExpirationPlugin({
            maxEntries: FACE_API_MODEL_MAX_ENTRIES,
            maxAgeSeconds: FACE_API_MODEL_MAX_AGE_SECONDS,
          }),
        ],
      }),
    },
    ...defaultCache,
  ],
});

serwist.addEventListeners();
