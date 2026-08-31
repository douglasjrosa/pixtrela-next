import { listTrustedMediaPublicOrigins } from "@/lib/media/trusted-public-origin";

type RemotePattern = {
  protocol: "http" | "https";
  hostname: string;
  pathname: string;
};

export function buildNextImageRemotePatterns(): RemotePattern[] {
  const patterns: RemotePattern[] = [];

  for (const origin of listTrustedMediaPublicOrigins()) {
    try {
      const url = new URL(origin);
      const protocol = url.protocol.replace(":", "") as "http" | "https";
      patterns.push({
        protocol,
        hostname: url.hostname,
        pathname: "/**",
      });
    } catch {
      continue;
    }
  }

  return patterns;
}
