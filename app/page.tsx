import { HomeContent } from "@/components/home-content";
import { getFaqs } from "@/lib/cms";

/**
 * Thin server wrapper so the homepage can read CMS content.
 *
 * The page itself is a client component (it uses the language switcher and
 * framer-motion), so the CMS fetch has to happen here and be passed down.
 * getFaqs() returns null on any failure and HomeContent falls back to the
 * hard-coded list, so a CMS outage degrades to today's site rather than an
 * empty FAQ section.
 */
export default async function HomePage() {
  const cmsFaqs = await getFaqs();
  return <HomeContent cmsFaqs={cmsFaqs} />;
}
