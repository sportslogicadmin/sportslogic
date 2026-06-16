"use client";

import { useEffect, useState } from "react";
import Image from "next/image";

function getCookie(name: string): boolean {
  if (typeof document === "undefined") return false;
  return document.cookie.split(";").some((c) => c.trim().startsWith(`${name}=`));
}

function setAgeCookie() {
  const expires = new Date();
  expires.setFullYear(expires.getFullYear() + 1);
  document.cookie = `sl_age_ok=1; expires=${expires.toUTCString()}; path=/; SameSite=Lax`;
}

export function AgeGate() {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    if (!getCookie("sl_age_ok")) setVisible(true);
  }, []);

  if (!visible) return null;

  const confirm = () => {
    setAgeCookie();
    setVisible(false);
  };

  const exit = () => {
    window.location.href = "https://www.google.com";
  };

  return (
    <div
      className="fixed inset-0 z-[9999] flex items-center justify-center px-5"
      style={{ background: "rgba(12, 14, 20, 0.97)", backdropFilter: "blur(4px)" }}
    >
      <div className="w-full max-w-[400px] text-center">
        <div className="flex justify-center mb-8">
          <Image src="/logo.png" alt="SportsLogic" width={72} height={36} className="h-9 w-auto" />
        </div>

        <p className="font-heading text-[11px] font-bold tracking-[3px] text-text-tertiary uppercase mb-5">
          AGE VERIFICATION
        </p>
        <h1 className="font-heading text-2xl font-bold uppercase text-text-primary mb-4 tracking-tight">
          You must be 21+<br />to enter this site.
        </h1>
        <p className="text-sm text-text-secondary leading-[1.75] mb-10 max-w-[320px] mx-auto">
          SportsLogic provides sports betting analytics. You must be 21 years of age or older and in a jurisdiction where it is legal to access sports betting information.
        </p>

        <button
          onClick={confirm}
          className="w-full h-13 rounded-xl bg-accent text-bg text-[12px] font-bold uppercase tracking-[0.5px] hover:brightness-110 transition-all mb-3"
        >
          YES, I AM 21 OR OLDER
        </button>

        <button
          onClick={exit}
          className="w-full h-10 text-[11px] text-text-tertiary hover:text-text-secondary transition-colors uppercase tracking-wide"
        >
          No, exit site
        </button>

        <p className="text-[10px] text-text-tertiary mt-8 leading-relaxed">
          Gambling problem? Call 1-800-GAMBLER (1-800-426-2537)
        </p>
      </div>
    </div>
  );
}
