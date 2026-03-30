"use client";

import { useState } from "react";

export function EmailForm() {
  const [email, setEmail] = useState("");
  const [status, setStatus] = useState<"idle" | "loading" | "success" | "error">("idle");
  const [message, setMessage] = useState("");

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (status === "loading" || status === "success") return;

    setStatus("loading");
    setMessage("");

    try {
      const res = await fetch("https://formspree.io/f/mpqodyda", {
        method: "POST",
        headers: { "Content-Type": "application/json", Accept: "application/json" },
        body: JSON.stringify({ email }),
      });

      if (res.ok) {
        setStatus("success");
      } else {
        const data = await res.json();
        setStatus("error");
        setMessage(data?.errors?.[0]?.message || "Something went wrong.");
      }
    } catch {
      setStatus("error");
      setMessage("Something went wrong. Try again.");
    }
  }

  const succeeded = status === "success";

  return (
    <div className="w-full max-w-[420px] mx-auto">
      <form onSubmit={handleSubmit} className="flex flex-col sm:flex-row gap-3">
        <input
          type="email"
          placeholder="Enter your email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          disabled={succeeded}
          className="flex-1 h-12 px-4 rounded-lg bg-surface border border-border text-text-primary text-sm placeholder:text-text-tertiary outline-none transition-all duration-200 focus:border-accent/50 focus:shadow-[0_0_0_2px_rgba(0,232,123,0.15)] disabled:opacity-50"
        />
        <button
          type="submit"
          disabled={succeeded || status === "loading"}
          className={`h-12 px-6 rounded-lg text-sm font-medium whitespace-nowrap transition-all cursor-pointer disabled:cursor-default ${
            succeeded
              ? "bg-accent/20 text-accent border border-accent/30"
              : "bg-accent text-bg hover:brightness-110"
          }`}
        >
          {status === "loading"
            ? "Submitting..."
            : succeeded
              ? "You're on the list!"
              : "Join waitlist"}
        </button>
      </form>
      {status === "error" && message && (
        <p className="text-xs text-red mt-2 text-center">{message}</p>
      )}
    </div>
  );
}
