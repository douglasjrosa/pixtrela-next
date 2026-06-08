import { createSerwistRoute } from "@serwist/turbopack";

const revision = process.env.NEXT_PUBLIC_BUILD_ID ?? "dev";

export const { dynamic, dynamicParams, revalidate, generateStaticParams, GET } =
  createSerwistRoute({
    swSrc: "app/sw.ts",
    additionalPrecacheEntries: [{ url: "/", revision }],
    useNativeEsbuild: true,
  });
