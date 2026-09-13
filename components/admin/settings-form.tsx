"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Check, CircleAlert, Loader2, Mail, Phone, MessageCircle, MapPin, Instagram, Facebook, Youtube, Building2 } from "lucide-react";
import { cn } from "@/lib/utils";
import { saveSiteSettings } from "@/app/admin/collections";

export interface SiteSettingsRow {
  school_name: string;
  contact_email: string | null;
  contact_phone: string | null;
  whatsapp_number: string | null;
  address: Record<string, string> | null;
  social_instagram: string | null;
  social_facebook: string | null;
  social_youtube: string | null;
}

const LANGS = ["en", "pt", "fr", "es", "kr"] as const;

type Notice = { kind: "ok" | "error"; message: string } | null;

export function SettingsForm({ settings }: { settings: SiteSettingsRow }) {
  const router = useRouter();
  const [schoolName, setSchoolName] = useState(settings.school_name ?? "");
  const [email, setEmail] = useState(settings.contact_email ?? "");
  const [phone, setPhone] = useState(settings.contact_phone ?? "");
  const [whatsapp, setWhatsapp] = useState(settings.whatsapp_number ?? "");
  const [address, setAddress] = useState<Record<string, string>>({ ...(settings.address ?? { en: "" }) });
  const [addressLang, setAddressLang] = useState<string>("en");
  const [instagram, setInstagram] = useState(settings.social_instagram ?? "");
  const [facebook, setFacebook] = useState(settings.social_facebook ?? "");
  const [youtube, setYoutube] = useState(settings.social_youtube ?? "");
  const [notice, setNotice] = useState<Notice>(null);
  const [busy, startTransition] = useTransition();

  function save() {
    setNotice(null);
    startTransition(async () => {
      const r = await saveSiteSettings({
        school_name: schoolName,
        contact_email: email,
        contact_phone: phone,
        whatsapp_number: whatsapp,
        address,
        social_instagram: instagram,
        social_facebook: facebook,
        social_youtube: youtube,
      });
      if (r.ok) {
        setNotice({ kind: "ok", message: "Settings saved." });
        router.refresh();
      } else {
        setNotice({ kind: "error", message: r.error ?? "Could not save." });
      }
    });
  }

  const field =
    "w-full rounded-xl border border-border bg-background px-3.5 py-2.5 text-sm outline-none transition focus:border-primary";

  return (
    <div className="space-y-4">
      <section className="rounded-[22px] border border-border bg-card p-5">
        <h2 className="mb-4 flex items-center gap-2 font-display text-lg font-bold">
          <Building2 className="h-[1.15rem] w-[1.15rem] text-primary" /> School
        </h2>
        <label className="mb-1.5 block text-sm font-semibold">School name</label>
        <input value={schoolName} onChange={(e) => setSchoolName(e.target.value)} className={field} />
      </section>

      <section className="rounded-[22px] border border-border bg-card p-5">
        <h2 className="mb-4 flex items-center gap-2 font-display text-lg font-bold">
          <Mail className="h-[1.15rem] w-[1.15rem] text-primary" /> Contact
        </h2>

        <div className="grid gap-4 sm:grid-cols-2">
          <div>
            <label className="mb-1.5 flex items-center gap-1.5 text-sm font-semibold">
              <Mail className="h-3.5 w-3.5 text-muted-foreground" /> Email
            </label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className={field}
            />
          </div>
          <div>
            <label className="mb-1.5 flex items-center gap-1.5 text-sm font-semibold">
              <Phone className="h-3.5 w-3.5 text-muted-foreground" /> Phone
            </label>
            <input value={phone} onChange={(e) => setPhone(e.target.value)} className={field} />
          </div>
        </div>

        <div className="mt-4">
          <label className="mb-1.5 flex items-center gap-1.5 text-sm font-semibold">
            <MessageCircle className="h-3.5 w-3.5 text-muted-foreground" /> WhatsApp number
            <span className="font-normal text-muted-foreground">
              Digits only, with country code — e.g. 2389521329
            </span>
          </label>
          <input
            value={whatsapp}
            onChange={(e) => setWhatsapp(e.target.value)}
            className={field}
          />
        </div>

        <div className="mt-4">
          <div className="mb-1.5 flex flex-wrap items-center justify-between gap-2">
            <label className="flex items-center gap-1.5 text-sm font-semibold">
              <MapPin className="h-3.5 w-3.5 text-muted-foreground" /> Location
            </label>
            <div className="flex gap-1">
              {LANGS.map((l) => (
                <button
                  key={l}
                  onClick={() => setAddressLang(l)}
                  className={cn(
                    "rounded-md px-2 py-0.5 text-[0.7rem] font-bold uppercase transition",
                    addressLang === l
                      ? "bg-primary text-primary-foreground"
                      : address[l]?.trim()
                        ? "bg-muted text-muted-foreground"
                        : "bg-muted/50 text-muted-foreground/50"
                  )}
                >
                  {l}
                </button>
              ))}
            </div>
          </div>
          <input
            value={address[addressLang] ?? ""}
            onChange={(e) => setAddress({ ...address, [addressLang]: e.target.value })}
            className={field}
          />
          {addressLang !== "en" && !address[addressLang]?.trim() && (
            <p className="mt-1 text-xs text-muted-foreground">
              Leave blank to show the English text in this language.
            </p>
          )}
        </div>
      </section>

      <section className="rounded-[22px] border border-border bg-card p-5">
        <h2 className="mb-1 font-display text-lg font-bold">Social links</h2>
        <p className="mb-4 text-sm text-muted-foreground">
          Full web addresses. Leave blank to hide that icon in the footer.
        </p>

        <div className="space-y-3.5">
          {[
            { label: "Instagram", icon: Instagram, value: instagram, set: setInstagram },
            { label: "Facebook", icon: Facebook, value: facebook, set: setFacebook },
            { label: "YouTube", icon: Youtube, value: youtube, set: setYoutube },
          ].map((s) => (
            <div key={s.label}>
              <label className="mb-1.5 flex items-center gap-1.5 text-sm font-semibold">
                <s.icon className="h-3.5 w-3.5 text-muted-foreground" /> {s.label}
              </label>
              <input
                value={s.value}
                onChange={(e) => s.set(e.target.value)}
                placeholder="https://…"
                className={field}
              />
            </div>
          ))}
        </div>
      </section>

      {notice && (
        <p
          className={cn(
            "flex items-start gap-2 rounded-[22px] border p-4 text-sm",
            notice.kind === "ok"
              ? "border-primary/30 bg-primary/5 text-primary"
              : "border-destructive/30 bg-destructive/5 text-destructive"
          )}
        >
          {notice.kind === "ok" ? (
            <Check className="mt-0.5 h-4 w-4 flex-none" />
          ) : (
            <CircleAlert className="mt-0.5 h-4 w-4 flex-none" />
          )}
          {notice.message}
        </p>
      )}

      <button
        onClick={save}
        disabled={busy}
        className="inline-flex items-center gap-2 rounded-full bg-primary px-6 py-3 text-sm font-semibold text-primary-foreground transition hover:brightness-105 disabled:opacity-60"
      >
        {busy ? <Loader2 className="h-4 w-4 animate-spin" /> : <Check className="h-4 w-4" />}
        Save settings
      </button>
    </div>
  );
}
