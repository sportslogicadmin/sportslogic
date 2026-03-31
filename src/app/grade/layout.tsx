import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Grade Your Bet — SportsLogic",
  description: "Get an instant grade on any bet. Expected value, line comparison, and AI-powered swap suggestions across 30+ sportsbooks.",
};

export default function GradeLayout({ children }: { children: React.ReactNode }) {
  return children;
}
