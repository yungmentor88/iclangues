import type { Metadata } from "next";
import { Outfit, Fraunces } from "next/font/google";
import "./globals.css";
import { SiteNav } from "@/components/site-nav";
import { SiteFooter } from "@/components/site-footer";
import { SmoothScroll } from "@/components/smooth-scroll";
import { LanguageProvider } from "@/lib/i18n";
import { getUser } from "@/lib/supabase/server";

const outfit = Outfit({ subsets: ["latin"], variable: "--font-outfit", display: "swap" });
const fraunces = Fraunces({ subsets: ["latin"], variable: "--font-fraunces", display: "swap", style: ["normal", "italic"] });

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
    <html lang="en" className={`${outfit.variable} ${fraunces.variable}`}>
      <body className="font-sans">
        <LanguageProvider>
          <SmoothScroll />
          <SiteNav userEmail={user?.email ?? null} />
          {children}
          <SiteFooter />
        </LanguageProvider>
      </body>
    </html>
  );
}
