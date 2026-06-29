/**
 * Content / data layer (client-safe: no server-only imports here).
 * Local seed data used as a fallback so the site is fully rendered even before
 * Supabase is configured. The server-only `getCourses()` lives in
 * `lib/get-courses.ts` so this file can be imported by client components too.
 */

export type LangCode = "kr" | "en" | "fr" | "es" | "pt";

export const LANGUAGES: Record<LangCode, { name: string; badge: string; color: string; native: string; tagline: string }> = {
  kr: { name: "Kriolu", badge: "CV", color: "#EE4B3C", native: "Tu te papia Kriolu?", tagline: "The soul of Cabo Verde." },
  en: { name: "English", badge: "GB", color: "#2D6BE0", native: "Speak with confidence", tagline: "From travel to business." },
  fr: { name: "Français", badge: "FR", color: "#7C3AED", native: "Parlons ensemble", tagline: "Elegant & enjoyable." },
  es: { name: "Español", badge: "ES", color: "#D8930B", native: "¿Cómo se habla?", tagline: "Vibrant & worldwide." },
  pt: { name: "Português", badge: "PT", color: "#12C58E", native: "Vamos conversar", tagline: "Lusophone connection." },
};

export interface Course {
  id?: string;
  lang: LangCode;
  level: "A1" | "A2" | "B1" | "B2" | "C1" | "C2";
  title: string;
  description: string;
  duration: string;
  format: string;
  price: string;
}

export const SEED_COURSES: Course[] = [
  { lang: "kr", level: "A1", title: "Kriolu pa kuriosos", description: "Your first words in the language of Cabo Verde — greetings, music and everyday chat.", duration: "8 weeks", format: "Group", price: "€89" },
  { lang: "kr", level: "B1", title: "Konbersu di Rua", description: "Hold real conversations with locals. Slang, expressions and island stories.", duration: "10 weeks", format: "Group", price: "€129" },
  { lang: "kr", level: "B2", title: "Kriolu Terra Terra", description: "Deep, traditional Kriolu from the countryside — the most preserved form.", duration: "10 weeks", format: "Group", price: "€139" },
  { lang: "kr", level: "C1", title: "Mestre di Kriolu", description: "Advanced fluency through morna lyrics, films and literature.", duration: "12 weeks", format: "Private", price: "€249" },
  { lang: "en", level: "A2", title: "Everyday English", description: "Travel, ordering, directions and small talk — confidently.", duration: "8 weeks", format: "Group", price: "€99" },
  { lang: "en", level: "B2", title: "Business English", description: "Emails, meetings and presentations for global professionals.", duration: "10 weeks", format: "Private", price: "€199" },
  { lang: "en", level: "C2", title: "Mastery & Idioms", description: "Native-level expression, idioms, debate and writing.", duration: "12 weeks", format: "Self-paced", price: "€149" },
  { lang: "fr", level: "A1", title: "Bonjour Français", description: "A friendly intro to French sounds, greetings and survival phrases.", duration: "8 weeks", format: "Group", price: "€99" },
  { lang: "fr", level: "B1", title: "Conversation Quotidienne", description: "Express opinions, share stories, navigate cultural moments.", duration: "10 weeks", format: "Group", price: "€129" },
  { lang: "es", level: "A1", title: "Hola, Español", description: "Your first steps in Spanish — greetings, food, travel and music.", duration: "8 weeks", format: "Group", price: "€99" },
  { lang: "es", level: "B1", title: "Conversación Diaria", description: "Lively conversations on culture, work and travel across Spain & Latin America.", duration: "10 weeks", format: "Group", price: "€129" },
  { lang: "pt", level: "A2", title: "Português do Dia-a-Dia", description: "From café orders to phone calls — get fluent in daily Portuguese.", duration: "8 weeks", format: "Group", price: "€99" },
  { lang: "pt", level: "B2", title: "Português Profissional", description: "For work, study or moving to a Lusophone country.", duration: "10 weeks", format: "Private", price: "€199" },
];

export const FAQ = [
  { q: "How does IClangues teaching work?", a: "Every class is live with a native speaker — online over Zoom or in person in Cabo Verde. We focus on real conversation from day one, not grammar drills, and weave in culture, music and everyday expressions." },
  { q: "Which languages can I learn?", a: "Kriolu (Cape Verdean Creole), English, French, Spanish and Portuguese — all levels from absolute beginner (A1) to near-native (C2)." },
  { q: "Do I get a certificate?", a: "Yes. You receive a certificate at the completion of each level, mapped to the CEFR framework (A1–C2)." },
  { q: "Can I try before I commit?", a: "Absolutely. Take the free placement test and a free trial group lesson — no card required, no commitment." },
  { q: "Do I need an account?", a: "You can browse freely. Create a free account to save courses, track progress and book lessons from your dashboard." },
];
