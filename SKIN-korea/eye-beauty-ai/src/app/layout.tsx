import type { Metadata, Viewport } from "next";
import { Noto_Sans_JP } from "next/font/google";
import "./globals.css";
import { Providers } from "./providers";

const notoSansJP = Noto_Sans_JP({
  variable: "--font-noto-sans-jp",
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
});

export const metadata: Metadata = {
  title: "Eye Beauty AI Diagnosis | 目元映え度診断",
  description: "AIが目元映え度を診断 - セルフまつげパーマ利用者向けの目元スキンケア診断ツール",
  keywords: ["目元診断", "スキンケア", "AI診断", "韓国コスメ", "K-Beauty", "アイケア"],
  openGraph: {
    title: "Eye Beauty AI Diagnosis",
    description: "AIが目元映え度を診断 - あなたの目元の魅力を最大限に引き出す",
    type: "website",
    locale: "ja_JP",
    siteName: "Eye Beauty AI",
  },
  twitter: {
    card: "summary_large_image",
    title: "Eye Beauty AI Diagnosis",
    description: "AIが目元映え度を診断",
  },
  robots: {
    index: true,
    follow: true,
  },
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
  viewportFit: "cover",
  themeColor: "#fdf2f8",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="ja" className="scroll-smooth">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <meta name="apple-mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-status-bar-style" content="default" />
      </head>
      <body className={`${notoSansJP.variable} antialiased min-h-screen`}>
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
