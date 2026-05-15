import { SignUp } from "@clerk/nextjs";
import Link from "next/link";
import Image from "next/image";

export default function SignUpPage() {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center px-4">
      <Link href="/" className="flex items-center gap-2 mb-10">
        <Image src="/logo.png" alt="SportsLogic" width={56} height={28} className="h-7 w-auto" />
        <span className="font-heading text-base font-bold text-text-primary tracking-tight">SportsLogic</span>
      </Link>
      <SignUp
        appearance={{
          variables: {
            colorBackground: "#161923",
            colorInputBackground: "#0C0E14",
            colorInputText: "#E2E4EA",
            colorText: "#E2E4EA",
            colorTextSecondary: "#8A8FA3",
            colorPrimary: "#00E87B",
            colorDanger: "#EF4444",
            borderRadius: "12px",
            fontFamily: "Inter, system-ui, sans-serif",
          },
          elements: {
            card: "shadow-none border border-[#252A37]",
            headerTitle: "font-bold uppercase tracking-wide",
            formButtonPrimary:
              "bg-[#00E87B] text-[#0C0E14] font-bold uppercase tracking-wide hover:brightness-110",
            footerAction: "text-[#8A8FA3]",
          },
        }}
      />
    </div>
  );
}
