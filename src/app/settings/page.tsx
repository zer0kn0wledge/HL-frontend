"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAppStore } from "@/store";

// Settings page - redirects to home and opens settings modal
export default function SettingsPage() {
  const router = useRouter();
  const { setSettingsOpen } = useAppStore();

  useEffect(() => {
    // Open settings modal and redirect to home
    setSettingsOpen(true);
    router.replace("/");
  }, [router, setSettingsOpen]);

  return (
    <div className="min-h-screen bg-background flex items-center justify-center">
      <div className="text-center">
        <div className="h-8 w-8 rounded-lg bg-gradient-to-br from-green-500 to-emerald-600 animate-pulse mx-auto mb-4" />
        <p className="text-sm text-muted-foreground">Opening settings...</p>
      </div>
    </div>
  );
}
