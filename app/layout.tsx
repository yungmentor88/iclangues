import type { Metadata } from "next";
import { Plus_Jakarta_Sans, Bricolage_Grotesque } from "next/font/google";
import "./globals.css";
import { SiteNav } from "@/components/site-nav";
import { SiteFooter } from "@/components/site-footer";
import { SmoothScroll } from "@/components/smooth-scroll";
import { getUser } from "@/lib/supabase/server";

const jakarta = Plus_Jakarta_Sans({ subsets: ["latin"], variable: "--font-jakarta", display: "swap" });
const bricolage = Bricolage_Grotesque({ subsets: ["latin"], variable: "--font-bricolage", display: "swap" });

export const metadata: Metadata = {
  title: "IClangues — Learn Languages with Native Speakers | Cabo Verde",
  description:
    "IClangues is a Cabo Verde language school teaching Kriolu, English, French, Spanish and Portuguese with native speakers — online and in person, A1–C2.",
  metadataBase: new URL("https://iclangues.com"),
  openGraph: {
    title: "IClangues — Learn Languages with Native Speakers",
    description: "Kriolu, English, French, Spanish & Portuguese — taught by native speakers from Cabo Verde.",
    type: "website",
  },
};

export default async function RootLayout({ children }: { children: React.ReactNode }) {
  const user = await getUser();
  return (
    <html lang="en" className={`${jakarta.variable} ${bricolage.variable}`}>
      <body className="font-sans">
        <SmoothScroll />
        <SiteNav userEmail={user?.email ?? null} />
        {children}
        <SiteFooter />
      </body>
    </html>
  );
}
