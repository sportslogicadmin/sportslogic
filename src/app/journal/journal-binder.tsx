"use client";
import { useEffect } from "react";
import { useRouter } from "next/navigation";

export function JournalBinder({ deviceUUID }: { deviceUUID: string }) {
  const router = useRouter();

  useEffect(() => {
    fetch("/api/bind-grades", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ deviceUUID }),
    }).then(() => {
      router.replace("/journal");
    });
  }, [deviceUUID, router]);

  return null;
}
