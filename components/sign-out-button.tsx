"use client";

import { useState } from "react";
import { LogOut } from "lucide-react";
import { Button } from "@/components/ui/button";
import { createClient, isSupabaseConfigured } from "@/lib/supabase/client";

/**
 * Ends the current session and returns to the homepage.
 *
 * Uses a full page navigation rather than router.push so the server layout
 * re-evaluates the session — otherwise the nav would still show "Account".
 */
export function SignOutButton({ className }: { className?: string }) {
  const [loading, setLoading] = useState(false);

  async function signOut() {
    setLoading(true);
    try {
      if (isSupabaseConfigured()) {
        await createClient().auth.signOut();
      }
    } finally {
      window.location.href = "/";
    }
  }

  return (
    <Button variant="outline" onClick={signOut} disabled={loading} className={className}>
      <LogOut className="h-4 w-4" />
      {loading ? "Signing out…" : "Sign out"}
    </Button>
  );
}
