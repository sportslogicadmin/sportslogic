import Link from "next/link";

export function AffiliateDisclosure() {
  return (
    <p className="text-[11px] text-text-secondary leading-relaxed">
      We may earn a commission when you sign up through our links.{" "}
      <Link
        href="/affiliate-disclosure"
        className="text-accent hover:brightness-110 transition-all underline underline-offset-2"
      >
        Affiliate disclosure
      </Link>
    </p>
  );
}
