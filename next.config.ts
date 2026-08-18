import type { NextConfig } from "next";
import createNextIntlPlugin from "next-intl/plugin";
import { withSerwist } from "@serwist/turbopack";

const withNextIntl = createNextIntlPlugin("./i18n/request.ts");

const nextConfig: NextConfig = {
  async redirects() {
    return [
      {
        source: "/settings/subtasks",
        destination: "/settings/subtasks/categories",
        permanent: false,
      },
    ];
  },
};

export default withSerwist(withNextIntl(nextConfig));
