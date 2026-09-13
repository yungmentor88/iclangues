import { ContactContent } from "@/components/contact-content";
import { getSiteSettings } from "@/lib/cms";

export const metadata = {
  title: "Contact — IClangues",
  description:
    "Get in touch with IClangues — book a free trial class, ask about courses, or just say bo dia.",
};

/**
 * Thin server wrapper so the contact cards can read CMS settings.
 * ContactContent is a client component (language switcher + reveal
 * animations), so the fetch has to happen here and be passed down.
 */
export default async function ContactPage() {
  const settings = await getSiteSettings();
  return <ContactContent settings={settings} />;
}
