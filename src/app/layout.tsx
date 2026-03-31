import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";

const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin"],
  weight: ["400", "500", "600"],
});

export const metadata: Metadata = {
  title: "SportsLogic — Grade any bet in seconds",
  description:
    "AI-powered bet grading for parlays, straight bets, props, and more. See your edge before you place it.",
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
