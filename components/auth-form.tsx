"use client";

import { useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { createClient, isSupabaseConfigured } from "@/lib/supabase/client";

export function AuthForm({ mode }: { mode: "login" | "register" }) {
  const router = useRouter();
  const isRegister = mode === "register";
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);

  const configured = isSupabaseConfigured();

  async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError(null);
    setNotice(null);
    const form = e.currentTarget;
    const name = (form.elements.namedItem("name") as HTMLInputElement | null)?.value.trim() ?? "";
    const email = (form.elements.namedItem("email") as HTMLInputElement).value.trim();
    const password = (form.elements.namedItem("password") as HTMLInputElement).value;

    if (!configured) {
      setError("Sign-in isn't connected yet. Add your Supabase keys to .env.local (see README) to enable accounts.");
      return;
    }

    setLoading(true);
    try {
      const supabase = createClient();
      if (isRegister) {
        const { error } = await supabase.auth.signUp({
          email,
          password,
          options: { data: { full_name: name }, emailRedirectTo: `${location.origin}/auth/callback` },
        });
        if (error) throw error;
        setNotice("Account created! Check your email to confirm, then log in.");
      } else {
        const { error } = await supabase.auth.signInWithPassword({ email, password });
        if (error) throw error;
        router.push("/account");
        router.refresh();
      }
    } catch (err: any) {
      setError(err?.message ?? "Something went wrong. Please try again.");
    } finally {
      setLoading(false);
    }
  }

  const field = "w-full rounded-xl border border-border bg-background px-4 py-3 outline-none transition focus:border-primary focus:ring-4 focus:ring-primary/15";

  return (
    <main className="container flex min-h-[88vh] items-center justify-center py-28">
      <div className="w-full max-w-md rounded-[28px] border border-border bg-card p-8 shadow-sm sm:p-10">
        <Link href="/" className="mb-6 inline-flex"><Image src="/images/logo.png" alt="IClangues" width={120} height={34} className="h-9 w-auto" /></Link>
        <h1 className="font-display text-3xl font-bold">{isRegister ? "Create your account" : "Welcome back"}</h1>
        <p className="mt-1.5 text-muted-foreground">
          {isRegister ? "Start learning with native speakers." : "Log in to your IClangues dashboard."}
        </p>

        {!configured && (
          <p className="mt-5 rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-800">
            Accounts aren&rsquo;t connected yet. Add Supabase keys to <code>.env.local</code> to enable login (see README).
          </p>
        )}

        <form onSubmit={onSubmit} className="mt-6 space-y-4" noValidate>
          {isRegister && (
            <div>
              <label className="mb-1.5 block text-sm font-medium" htmlFor="name">Full name</label>
              <input id="name" name="name" className={field} />
            </div>
          )}
          <div>
            <label className="mb-1.5 block text-sm font-medium" htmlFor="email">Email</label>
            <input id="email" name="email" type="email" required className={field} />
          </div>
          <div>
            <label className="mb-1.5 block text-sm font-medium" htmlFor="password">Password</label>
            <input id="password" name="password" type="password" required minLength={6} className={field} />
          </div>

          {error && <p className="rounded-xl bg-red-50 px-4 py-3 text-sm text-red-600">{error}</p>}
          {notice && <p className="rounded-xl bg-emerald-50 px-4 py-3 text-sm text-emerald-700">{notice}</p>}

          <Button type="submit" variant="green" className="w-full" disabled={loading}>
            {loading ? "Please wait…" : isRegister ? "Create account" : "Log in"}
          </Button>
        </form>

        <p className="mt-6 text-center text-sm text-muted-foreground">
          {isRegister ? (
            <>Already have an account? <Link href="/login" className="font-semibold text-primary">Log in</Link></>
          ) : (
            <>New to IClangues? <Link href="/register" className="font-semibold text-primary">Create an account</Link></>
          )}
        </p>
      </div>
    </main>
  );
}
