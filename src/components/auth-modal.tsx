"use client";
import { useState } from "react";
import { signIn } from "next-auth/react";

export function AuthModal({ open, onClose }: { open: boolean; onClose: () => void }) {
  const [email, setEmail] = useState("");
  const [sent, setSent] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  if (!open) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.trim()) return;
    setLoading(true);
    setError("");

    const deviceUUID = localStorage.getItem("sl_device_uuid") ?? undefined;
    const callbackUrl = deviceUUID
      ? `/journal?bind=1&uuid=${encodeURIComponent(deviceUUID)}`
      : "/journal";

    try {
      const result = await signIn("resend", {
        email: email.trim(),
        callbackUrl,
        redirect: false,
      });
      if (result?.error) {
        setError("Something went wrong. Try again.");
      } else {
        setSent(true);
      }
    } catch {
      setError("Something went wrong. Try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-4"
      onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}
    >
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={onClose} />
      <div className="relative w-full max-w-sm bg-[#111110] border border-zinc-800 rounded-2xl p-6 shadow-2xl">
        <button
          onClick={onClose}
          className="absolute top-4 right-4 text-zinc-500 hover:text-zinc-300 transition-colors text-xl leading-none"
          aria-label="Close"
        >
          ×
        </button>

        {sent ? (
          <div className="py-4 text-center">
            <div className="w-12 h-12 rounded-full bg-accent/10 flex items-center justify-center mx-auto mb-4">
              <svg className="w-6 h-6 text-accent" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
              </svg>
            </div>
            <p className="font-heading text-base font-bold text-text-primary mb-2">Check your inbox</p>
            <p className="text-sm text-text-secondary leading-relaxed">
              We sent a sign-in link to <span className="text-text-primary font-medium">{email}</span>.
              Click it to save your grades.
            </p>
          </div>
        ) : (
          <>
            <p className="font-heading text-base font-bold text-text-primary mb-1">Save to your account</p>
            <p className="text-sm text-text-secondary mb-5 leading-relaxed">
              Enter your email — we&apos;ll send a magic link. No password.
            </p>
            <form onSubmit={handleSubmit} className="space-y-3">
              <input
                type="email"
                required
                // eslint-disable-next-line jsx-a11y/no-autofocus
                autoFocus
                placeholder="your@email.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full bg-zinc-900 border border-zinc-700 rounded-xl px-4 py-3 text-sm text-text-primary placeholder-zinc-500 focus:outline-none focus:border-accent/60 transition-colors"
              />
              {error && <p className="text-xs text-red-400">{error}</p>}
              <button
                type="submit"
                disabled={loading}
                className="w-full bg-accent hover:brightness-110 disabled:opacity-60 text-stone-950 font-bold text-sm rounded-xl py-3 transition-all"
              >
                {loading ? "Sending…" : "Send sign-in link"}
              </button>
            </form>
            <p className="text-[11px] text-zinc-500 text-center mt-4 leading-relaxed">
              Your existing grades will be linked to this account automatically.
            </p>
          </>
        )}
      </div>
    </div>
  );
}
