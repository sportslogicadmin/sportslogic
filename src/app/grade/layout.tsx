import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Grade Your Bet",
  description: "Get an instant grade on any sports bet. Expected value, line comparison across 30+ books, and AI-powered swap suggestions.",
  openGraph: {
    title: "Grade Your Bet — SportsLogic",
    description: "Get an instant grade on any sports bet with live odds from 30+ sportsbooks.",
  },
};

export default function GradeLayout({ children }: { children: React.ReactNode }) {
  return children;
}
