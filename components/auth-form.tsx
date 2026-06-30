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
  const [googleLoading, setGoogleLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);

  const configured = isSupabaseConfigured();

  async function signInWithGoogle() {
    setError(null);
    if (!configured) {
      setError("Connect Supabase first — add your keys to .env.local.");
      return;
    }
    setGoogleLoading(true);
    try {
      const supabase = createClient();
      const { error } = await supabase.auth.signInWithOAuth({
        provider: "google",
        options: { redirectTo: `${location.origin}/auth/callback` },
      });
      if (error) throw error;
    } catch (err: any) {
      setError(err?.message ?? "Google sign-in failed. Please try again.");
      setGoogleLoading(false);
    }
  }

  async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError(null);
    setNotice(null);
    const form = e.currentTarget;
    const name = (form.elements.namedItem("name") as HTMLInputElement | null)?.value.trim() ?? "";
    const email = (form.elements.namedItem("email") as HTMLInputElement).value.trim();
    const password = (form.elements.namedItem("password") as HTMLInputElement).value;

    if (!configured) {
      setError("Accounts aren't connected yet. Add your Supabase keys to .env.local to enable login.");
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

  const field =
    "w-full rounded-xl border border-border bg-background px-4 py-3 outline-none transition focus:border-primary focus:ring-4 focus:ring-primary/15";

  return (
    <main className="container flex min-h-[88vh] items-center justify-center py-28">
      <div className="w-full max-w-md rounded-[28px] border border-border bg-card p-8 shadow-sm sm:p-10">
        <Link href="/" className="mb-6 inline-flex">
          <Image src="/images/logo.png" alt="IClangues" width={120} height={34} className="h-9 w-auto" />
        </Link>

        <h1 className="font-display text-3xl font-bold">
          {isRegister ? "Create your account" : "Welcome back"}
        </h1>
        <p className="mt-1.5 text-muted-foreground">
          {isRegister ? "Start learning with native speakers." : "Log in to your IClangues account."}
        </p>

        {!configured && (
          <p className="mt-5 rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-800">
            Accounts aren&rsquo;t connected yet. Add Supabase keys to <code>.env.local</code> to enable login.
          </p>
        )}

        {/* Google sign-in */}
        <button
          onClick={signInWithGoogle}
          disabled={googleLoading}
          className="mt-6 flex w-full items-center justify-center gap-3 rounded-xl border border-border bg-white px-4 py-3 text-sm font-semibold text-foreground shadow-sm transition hover:bg-muted hover:border-foreground/20 disabled:opacity-60"
        >
          {/* Google G logo SVG */}
          <svg width="18" height="18" viewBox="0 0 18 18" fill="none">
            <path d="M17.64 9.2c0-.637-.057-1.251-.164-1.84H9v3.481h4.844a4.14 4.14 0 0 1-1.796 2.716v2.259h2.908c1.702-1.567 2.684-3.875 2.684-6.615Z" fill="#4285F4"/>
            <path d="M9 18c2.43 0 4.467-.806 5.956-2.18l-2.908-2.259c-.806.54-1.837.86-3.048.86-2.344 0-4.328-1.584-5.036-3.711H.957v2.332A8.997 8.997 0 0 0 9 18Z" fill="#34A853"/>
            <path d="M3.964 10.71A5.41 5.41 0 0 1 3.682 9c0-.593.102-1.17.282-1.71V4.958H.957A8.996 8.996 0 0 0 0 9c0 1.452.348 2.827.957 4.042l3.007-2.332Z" fill="#FBBC05"/>
            <path d="M9 3.58c1.321 0 2.508.454 3.44 1.345l2.582-2.58C13.463.891 11.426 0 9 0A8.997 8.997 0 0 0 .957 4.958L3.964 7.29C4.672 5.163 6.656 3.58 9 3.58Z" fill="#EA4335"/>
          </svg>
          {googleLoading ? "Redirecting…" : `Continue with Google`}
        </button>

        {/* Divider */}
        <div className="my-5 flex items-center gap-3">
          <div className="h-px flex-1 bg-border" />
          <span className="text-xs font-medium text-muted-foreground">or continue with email</span>
          <div className="h-px flex-1 bg-border" />
        </div>

        {/* Email/password form */}
        <form onSubmit={onSubmit} className="space-y-4" noValidate>
          {isRegister && (
            <div>
              <label className="mb-1.5 block text-sm font-medium" htmlFor="name">Full name</label>
              <input id="name" name="name" autoComplete="name" className={field} />
            </div>
          )}
          <div>
            <label className="mb-1.5 block text-sm font-medium" htmlFor="email">Email</label>
            <input id="email" name="email" type="email" required autoComplete="email" className={field} />
          </div>
          <div>
            <label className="mb-1.5 block text-sm font-medium" htmlFor="password">Password</label>
            <input id="password" name="password" type="password" required minLength={6} autoComplete={isRegister ? "new-password" : "current-password"} className={field} />
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
