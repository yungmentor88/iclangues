import Link from "next/link";
import { Compass, ArrowLeft } from "lucide-react";

/**
 * Catch-all for any /admin/* URL without a page.
 *
 * A raw 404 inside the owner's own admin panel reads as "the site is
 * broken" rather than "that screen isn't built yet". This boundary means no
 * admin URL can ever show one — including routes nobody has thought of.
 */
export default function AdminNotFound() {
  return (
    <div className="mx-auto max-w-md py-10 text-center">
      <span className="mx-auto grid h-14 w-14 place-items-center rounded-2xl bg-primary/15 text-primary">
        <Compass className="h-7 w-7" />
      </span>
      <h1 className="mt-4 font-display text-2xl font-bold">This screen isn&rsquo;t ready yet</h1>
      <p className="mt-2 text-muted-foreground">
        Either it&rsquo;s still being built, or the address is slightly off. Nothing is broken and
        none of your content is affected.
      </p>
      <Link
        href="/admin"
        className="mt-6 inline-flex items-center gap-2 rounded-full bg-primary px-5 py-2.5 text-sm font-semibold text-primary-foreground transition hover:brightness-105"
      >
        <ArrowLeft className="h-4 w-4" /> Back to dashboard
      </Link>
    </div>
  );
}
