import type { Metadata, Viewport } from "next";
import { Inter } from "next/font/google";
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
    title: "SportsLogic — Grade any bet in seconds",
    description: "AI-powered bet grading. Expected value, line comparison, and smarter alternatives for every bet.",
    url: "https://sportslogic.ai",
    siteName: "SportsLogic",
    locale: "en_US",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "SportsLogic — Grade any bet in seconds",
    description: "AI-powered bet grading. See your edge before you place it.",
    creator: "@sportslogicai",
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
    <html lang="en" className={`${inter.variable} antialiased scroll-smooth`}>
      <head>
        <link href="https://api.fontshare.com/v2/css?f[]=satoshi@700,900&display=swap" rel="stylesheet" />
      </head>
      <body className="min-h-screen bg-bg text-text-primary font-sans">
        {children}
      </body>
    </html>
  );
}
