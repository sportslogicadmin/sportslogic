import type { Metadata, Viewport } from "next";
import { Inter } from "next/font/google";
import { ClerkProvider } from "@clerk/nextjs";
import "./globals.css";

const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin"],
  weight: ["400", "500", "600"],
});

export const viewport: Viewport = {
  themeColor: "#0C0E14",
  width: "device-width",
  initialScale: 1,
};

export const metadata: Metadata = {
  title: {
    default: "SportsLogic — Grade any bet in seconds",
    template: "%s | SportsLogic",
  },
  description:
    "AI-powered bet grading for parlays, straight bets, props, and more. Expected value, line comparison, and smarter alternatives — see your edge before you place it.",
  keywords: ["sports betting", "bet grading", "expected value", "EV calculator", "parlay grader", "sports analytics", "betting tools"],
  authors: [{ name: "SportsLogic" }],
  creator: "SportsLogic",
  metadataBase: new URL("https://sportslogic.ai"),
  openGraph: {
    title: "SportsLogic — Know Your Edge Before You Bet",
    description: "AI-powered bet grading for every sport. Grade any bet in seconds.",
    url: "https://sportslogic.ai",
    siteName: "SportsLogic",
    locale: "en_US",
    type: "website",
    images: [{ url: "/og-image.png", width: 1200, height: 630, alt: "SportsLogic — Know Your Edge Before You Bet" }],
  },
  twitter: {
    card: "summary_large_image",
    title: "SportsLogic — Know Your Edge Before You Bet",
    description: "AI-powered bet grading for every sport. Grade any bet in seconds.",
    creator: "@sportslogicai",
    images: ["/og-image.png"],
  },
  icons: {
    icon: "/favicon.ico",
    apple: "/icon-180.png",
  },
  robots: {
    index: true,
    follow: true,
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <ClerkProvider>
      <html lang="en" className={`${inter.variable} antialiased scroll-smooth`}>
        <head>
          <link href="https://api.fontshare.com/v2/css?f[]=satoshi@700,900&display=swap" rel="stylesheet" />
        </head>
        <body className="min-h-screen bg-bg text-text-primary font-sans">
          {children}
        </body>
      </html>
    </ClerkProvider>
  );
}
