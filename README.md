# IClangues — full-stack app (Next.js + Supabase)

A modern, dynamic website **and web app** for the IClangues language school:
Next.js (App Router) + TypeScript + Tailwind + shadcn-style UI + framer-motion,
with **Supabase** for the database, **user accounts/login**, and a **CMS** (your
courses live in a Supabase table you can edit).

Built from your ABA-style reference: bright, green-led design, rich animations
(including the `pixel-trail` and `feature-highlight` components you provided),
your real logo and photos, 5 languages, FAQ, and more.

## Tech

- **Next.js 14** (App Router, Server Components) + **TypeScript**
- **Tailwind CSS** + shadcn-style tokens + `tailwindcss-animate`
- **framer-motion** for animation; **lucide-react** icons
- **Supabase** — Postgres database, Auth (email/password), CMS

## Run it locally

> Requires **Node.js 18+** (you have Node 24).

```bash
cd iclangues-app
npm install
npm run dev        # http://localhost:3000
```

The site renders fully **without** Supabase (courses come from local seed data,
and login shows a "connect Supabase" notice). To turn on accounts + the CMS:

## Connect Supabase (accounts + CMS)

1. Create a free project at **supabase.com**.
2. In the project: **Project Settings → API**, copy the **Project URL** and **anon public key**.
3. Copy `.env.example` to **`.env.local`** and paste them in:
   ```
   NEXT_PUBLIC_SUPABASE_URL=https://xxxx.supabase.co
   NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJ...
   ```
4. In Supabase: **SQL Editor → New query**, paste the contents of
   [`supabase/schema.sql`](supabase/schema.sql), and **Run**. This creates the
   `profiles`, `courses` and `leads` tables, security rules, and seeds the 13 courses.
5. Restart `npm run dev`. Now **signup/login works**, the **courses page reads from
   the database**, and **contact submissions** are saved to the `leads` table.

### Where's the CMS / admin?

For now you manage content in the **Supabase dashboard → Table editor → `courses`**
(add/edit/delete rows — the site updates instantly). Contact submissions appear in
the **`leads`** table. A custom in-app `/admin` screen can be added next if you'd
like to edit without opening Supabase.

## What's built

| Area | Status |
|---|---|
| Home (hero + pixel-trail, Simple & Smart, languages, feature-highlight, Learn-Live, Anytime-Anywhere, FAQ, CTA) | ✅ |
| Courses page with language + level filtering (animated) | ✅ (DB-backed when Supabase is on) |
| About page | ✅ |
| Contact page + form (saves to `leads`) | ✅ |
| User accounts: register / login / logout / dashboard | ✅ (needs Supabase keys) |
| Menu: **Courses · About · Contact** only (no pricing) | ✅ |
| Reviews section | ❌ removed (as requested) |
| Footer "Design by 9ja Lda" → tedcanlabs.com | ✅ |
| 5-language interface switcher (nav chrome) | ✅ |

## Deploy to a Hostinger VPS

A full-stack Next.js app needs Node — this runs on a **Hostinger VPS** (not shared/WordPress hosting).

1. SSH into your VPS; install **Node 18+** and **pm2** (`npm i -g pm2`).
2. Copy this folder up (git clone or SFTP), then:
   ```bash
   npm install
   npm run build
   pm2 start "npm run start" --name iclangues   # serves on port 3000
   ```
3. Put **Nginx** in front of port 3000 as a reverse proxy and add SSL (Let's Encrypt / Certbot).
4. Set the env vars on the server (`.env.local` or your process manager's env).

> Tip: the fastest zero-config option is **Vercel** (free) — push to GitHub, import,
> add the two env vars, deploy. You can always point your Hostinger domain at it.

## Customising

- **Design tokens / colours**: `app/globals.css` (`:root`) + `tailwind.config.ts`.
- **Courses / FAQ / languages**: `lib/content.ts` (the local fallback) or the Supabase `courses` table.
- **Photos & logo**: `public/images/` (replace, keep the names).
- **Footer credit / contact details**: `components/site-footer.tsx`.

## Contact details used

- Email: iclangues@outlook.com · Phone/WhatsApp: +238 952 1329
