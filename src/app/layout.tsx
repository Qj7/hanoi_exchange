import type { Metadata, Viewport } from "next";
import { Inter, JetBrains_Mono } from "next/font/google";
import Script from "next/script";
import "./globals.css";
import { TelegramProvider } from "@/lib/telegram/TelegramProvider";
import { config } from "@/lib/config";

const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin", "cyrillic"],
  display: "swap",
});

const jetbrainsMono = JetBrains_Mono({
  variable: "--font-jetbrains-mono",
  subsets: ["latin"],
  display: "swap",
});

export const metadata: Metadata = {
  metadataBase: new URL(config.app.miniAppUrl),
  title: `${config.app.name} — обмен валют`,
  description:
    "Профессиональный обмен валют RUB / THB / USD. Выгодный курс, безопасные сделки, поддержка 24/7.",
  openGraph: {
    title: `${config.app.name} — обмен валют`,
    description: "Безопасный обмен валют через Telegram Mini App.",
    url: config.app.miniAppUrl,
    siteName: config.app.name,
    type: "website",
  },
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
  themeColor: "#0a0f1c",
  viewportFit: "cover",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="ru"
      suppressHydrationWarning
      className={`${inter.variable} ${jetbrainsMono.variable} h-full antialiased`}
    >
      <head>
        <Script
          src="https://telegram.org/js/telegram-web-app.js"
          strategy="beforeInteractive"
        />
      </head>
      <body className="min-h-full flex flex-col bg-[var(--bg)] text-[var(--text)]">
        <TelegramProvider>{children}</TelegramProvider>
      </body>
    </html>
  );
}
