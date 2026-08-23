import type { NextConfig } from "next";
import createNextIntlPlugin from "next-intl/plugin";
import { withSerwist } from "@serwist/turbopack";

const withNextIntl = createNextIntlPlugin("./i18n/request.ts");

const nextConfig: NextConfig = {
  // pdfkit reads AFM font files from its package dir; bundling remaps that
  // path to /ROOT/... and the route 500s. Keep it as a Node external.
  serverExternalPackages: ["pdfkit", "fontkit"],
  outputFileTracingIncludes: {
    "/exchanges/*/pdf": ["./node_modules/pdfkit/js/data/**/*"],
  },
  async redirects() {
    return [
      {
        source: "/settings/subtasks",
        destination: "/settings/subtasks/categories",
        permanent: false,
      },
      {
        source: "/settings/themes",
        destination: "/settings/themes/colors",
        permanent: false,
      },
      {
        source: "/settings/themes/files",
        destination: "/settings/files",
        permanent: false,
      },
    ];
  },
};

export default withSerwist(withNextIntl(nextConfig));
