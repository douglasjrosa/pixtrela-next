import type { Metadata, Viewport } from "next";
import { Comfortaa, Lilita_One } from "next/font/google";
import { NextIntlClientProvider } from "next-intl";
import { getLocale, getMessages, getTranslations } from "next-intl/server";

import "./globals.css";
import { Providers } from "@/components/providers";
import { SerwistProvider } from "@/components/serwist-provider";
import {
  APP_APPLE_TOUCH_ICON,
  APP_FAVICON_JPG,
  APP_FAVICON_PNG,
  APP_ICON_192,
  APP_ICON_512,
} from "@/lib/assets/branding";

const comfortaa = Comfortaa({
  variable: "--font-comfortaa",
  subsets: ["latin"],
  weight: ["300", "400", "500", "600", "700"],
});

const lilitaOne = Lilita_One({
  variable: "--font-lilita",
  subsets: ["latin"],
  weight: "400",
});

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations("app");
  return {
    applicationName: t("name"),
    title: { default: t("name"), template: `%s | ${t("name")}` },
    description: t("description"),
    appleWebApp: {
      capable: true,
      statusBarStyle: "default",
      title: t("name"),
    },
    icons: {
      icon: [
        { url: APP_FAVICON_PNG, type: "image/png" },
        { url: APP_FAVICON_JPG, type: "image/jpeg" },
        { url: APP_ICON_192, sizes: "192x192", type: "image/png" },
        { url: APP_ICON_512, sizes: "512x512", type: "image/png" },
      ],
      apple: [{ url: APP_APPLE_TOUCH_ICON, sizes: "180x180", type: "image/png" }],
    },
  };
}

export const viewport: Viewport = {
  themeColor: "#0a0a0a",
};

export default async function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  const locale = await getLocale();
  const messages = await getMessages();

  return (
    <html
      lang={locale}
      className={`${comfortaa.variable} ${lilitaOne.variable} h-full antialiased`}
    >
      <body className="flex min-h-full flex-col font-sans">
        <SerwistProvider swUrl="/serwist/sw.js">
          <NextIntlClientProvider locale={locale} messages={messages}>
            <Providers>{children}</Providers>
          </NextIntlClientProvider>
        </SerwistProvider>
      </body>
    </html>
  );
}
