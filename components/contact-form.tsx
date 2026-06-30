"use client";

import { useState } from "react";
import { Check, Send } from "lucide-react";
import { Button } from "@/components/ui/button";
import { createClient, isSupabaseConfigured } from "@/lib/supabase/client";
import { useI18n } from "@/lib/i18n";

export function ContactForm() {
  const { t } = useI18n();
  const [sent, setSent] = useState(false);
  const [errors, setErrors] = useState<Record<string, boolean>>({});
  const [loading, setLoading] = useState(false);

  async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const form = e.currentTarget;
    const data = {
      name: (form.elements.namedItem("name") as HTMLInputElement).value.trim(),
      email: (form.elements.namedItem("email") as HTMLInputElement).value.trim(),
      language: (form.elements.namedItem("language") as HTMLSelectElement).value,
      message: (form.elements.namedItem("message") as HTMLTextAreaElement).value.trim(),
    };
    const errs: Record<string, boolean> = {};
    if (data.name.length < 2) errs.name = true;
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(data.email)) errs.email = true;
    if (data.message.length < 4) errs.message = true;
    setErrors(errs);
    if (Object.keys(errs).length) return;

    setLoading(true);
    try {
      if (isSupabaseConfigured()) {
        await createClient().from("leads").insert(data);
      }
    } catch {
      // Even if the insert fails, we still confirm to the user; configure the
      // leads table (see supabase/schema.sql) to capture submissions.
    } finally {
      setLoading(false);
      setSent(true);
    }
  }

  if (sent) {
    return (
      <div className="rounded-[22px] border border-border bg-card p-10 text-center shadow-sm">
        <div className="mx-auto mb-4 grid h-14 w-14 place-items-center rounded-full bg-primary/15">
          <Check className="h-7 w-7 text-primary" />
        </div>
        <h3 className="font-display text-xl font-bold">{t("cform.sentTitle")}</h3>
        <p className="mt-1 text-muted-foreground">{t("cform.sentBody")}</p>
      </div>
    );
  }

  const field = "w-full rounded-xl border bg-background px-4 py-3 text-foreground outline-none transition focus:border-primary focus:ring-4 focus:ring-primary/15";
  const label = "mb-2 block text-xs font-bold uppercase tracking-wide text-muted-foreground";

  return (
    <form onSubmit={onSubmit} noValidate className="rounded-[22px] border border-border bg-card p-7 shadow-sm sm:p-10">
      <div className="mb-4 grid gap-4 sm:grid-cols-2">
        <div>
          <label className={label} htmlFor="name">{t("cform.name")}</label>
          <input id="name" name="name" className={`${field} ${errors.name ? "border-red-500" : "border-border"}`} />
          {errors.name && <p className="mt-1.5 text-sm text-red-500">{t("cform.errName")}</p>}
        </div>
        <div>
          <label className={label} htmlFor="email">{t("cform.email")}</label>
          <input id="email" name="email" type="email" className={`${field} ${errors.email ? "border-red-500" : "border-border"}`} />
          {errors.email && <p className="mt-1.5 text-sm text-red-500">{t("cform.errEmail")}</p>}
        </div>
      </div>
      <div className="mb-4">
        <label className={label} htmlFor="language">{t("cform.interested")}</label>
        <select id="language" name="language" className={`${field} border-border`}>
          <option value="kr">Kriolu</option><option value="en">English</option><option value="fr">Français</option>
          <option value="es">Español</option><option value="pt">Português</option><option value="undecided">{t("cform.notsure")}</option>
        </select>
      </div>
      <div className="mb-5">
        <label className={label} htmlFor="message">{t("cform.goal")}</label>
        <textarea id="message" name="message" rows={5} className={`${field} ${errors.message ? "border-red-500" : "border-border"}`} />
        {errors.message && <p className="mt-1.5 text-sm text-red-500">{t("cform.errMsg")}</p>}
      </div>
      <Button type="submit" variant="green" className="w-full" disabled={loading}>
        {loading ? t("cform.sending") : <>{t("cform.send")} <Send className="h-4 w-4" /></>}
      </Button>
      <p className="mt-3.5 text-center text-xs text-muted-foreground">{t("cform.reply")}</p>
    </form>
  );
}
