"use client";

import { createContext, useContext, useEffect, useState, useCallback } from "react";

export type Lang = "en" | "pt" | "fr" | "es" | "kr";
export const LANGS: Lang[] = ["en", "pt", "fr", "es", "kr"];

export const LANG_NAMES: Record<Lang, string> = {
  en: "🇬🇧 English",
  pt: "🇵🇹 Português",
  fr: "🇫🇷 Français",
  es: "🇪🇸 Español",
  kr: "🇨🇻 Kriolu",
};
export const LANG_LABEL: Record<Lang, string> = { en: "EN", pt: "PT", fr: "FR", es: "ES", kr: "KR" };

/* ── Every translatable string. Key → per-language value. ── */
const S: Record<string, Record<Lang, string>> = {
  // ---- Nav ----
  "nav.about":   { en: "About", pt: "Sobre", fr: "À propos", es: "Nosotros", kr: "Sobri" },
  "nav.contact": { en: "Contact", pt: "Contacto", fr: "Contact", es: "Contacto", kr: "Kontaktu" },
  "nav.book":    { en: "Book a Class", pt: "Marcar Aula", fr: "Réserver", es: "Reservar", kr: "Marka Aula" },
  "nav.language":{ en: "Language", pt: "Idioma", fr: "Langue", es: "Idioma", kr: "Língua" },

  // ---- Hero ----
  "hero.badge":  { en: "Born in Cabo Verde · taught worldwide", pt: "Nascido em Cabo Verde · ensinado em todo o mundo", fr: "Né au Cap-Vert · enseigné dans le monde entier", es: "Nacido en Cabo Verde · enseñado en todo el mundo", kr: "Nasidu na Kabu Verdi · insinadu na mundu interu" },
  "hero.title1": { en: "Speak a language", pt: "Fala uma língua", fr: "Parle une langue", es: "Habla un idioma", kr: "Papia un língua" },
  "hero.title2": { en: "the way", pt: "como um", fr: "comme un", es: "como un", kr: "sima un" },
  "hero.title3": { en: "natives do.", pt: "nativo.", fr: "natif.", es: "nativo.", kr: "nativu." },
  "hero.sub":    { en: "Real conversation, real culture — not grammar drills. Master Kriolu, English, French, Spanish or Portuguese with teachers who live the language.", pt: "Conversa real, cultura real — não exercícios de gramática. Domina Kriolu, Inglês, Francês, Espanhol ou Português com professores que vivem a língua.", fr: "De vraies conversations, une vraie culture — pas des exercices de grammaire. Maîtrise le créole, l'anglais, le français, l'espagnol ou le portugais avec des professeurs qui vivent la langue.", es: "Conversación real, cultura real — no ejercicios de gramática. Domina el criollo, inglés, francés, español o portugués con profesores que viven el idioma.", kr: "Konbersu di verdadi, kultura di verdadi — ka izersísiu di gramátika. Domina Kriolu, Inglês, Fransês, Spanhol ô Portugês ku profesoris ki ta vive língua." },
  "hero.cta1":   { en: "Book a Class", pt: "Marcar Aula", fr: "Réserver un cours", es: "Reservar clase", kr: "Marka Aula" },
  "hero.cta2":   { en: "Explore Courses", pt: "Ver Cursos", fr: "Voir les cours", es: "Ver cursos", kr: "Spia Kursu" },
  "hero.proof":  { en: "Loved by learners worldwide", pt: "Adorado por alunos em todo o mundo", fr: "Apprécié par des élèves du monde entier", es: "Amado por estudiantes de todo el mundo", kr: "Amadu pa alunus na mundu interu" },

  // ---- Manifesto ----
  "man.l1":  { en: "Language isn't just words.", pt: "A língua não é só palavras.", fr: "Une langue, ce n'est pas que des mots.", es: "Un idioma no son solo palabras.", kr: "Língua ka é sô palavra." },
  "man.l2":  { en: "It's a people, a rhythm,", pt: "É um povo, um ritmo,", fr: "C'est un peuple, un rythme,", es: "Es un pueblo, un ritmo,", kr: "É un povu, un ritmu," },
  "man.l3":  { en: "a way of", pt: "uma forma de", fr: "une façon de", es: "una forma de", kr: "un manera di" },
  "man.l3a": { en: "seeing the world.", pt: "ver o mundo.", fr: "voir le monde.", es: "ver el mundo.", kr: "odja mundu." },
  "man.tag": { en: "The IClangues way", pt: "O jeito IClangues", fr: "La méthode IClangues", es: "El estilo IClangues", kr: "Manera IClangues" },

  // ---- How it works ----
  "how.eyebrow": { en: "How it works", pt: "Como funciona", fr: "Comment ça marche", es: "Cómo funciona", kr: "Modi ki ta funsiona" },
  "how.heading": { en: "A simple and smart way to learn", pt: "Uma forma simples e inteligente de aprender", fr: "Une façon simple et intelligente d'apprendre", es: "Una forma simple e inteligente de aprender", kr: "Un manera simplis i inteligenti di aprende" },
  "how.c1.tag":   { en: "Real voices", pt: "Vozes reais", fr: "Voix authentiques", es: "Voces reales", kr: "Vós real" },
  "how.c1.title": { en: "Native speakers only", pt: "Apenas falantes nativos", fr: "Uniquement des natifs", es: "Solo hablantes nativos", kr: "Sô falanti nativu" },
  "how.c1.text":  { en: "Every teacher lives the language they teach.", pt: "Cada professor vive a língua que ensina.", fr: "Chaque professeur vit la langue qu'il enseigne.", es: "Cada profesor vive el idioma que enseña.", kr: "Kada profesor ta vive língua ki e ta insina." },
  "how.c2.tag":   { en: "Conversation first", pt: "Conversa primeiro", fr: "La conversation d'abord", es: "Primero la conversación", kr: "Konbersu na primeru" },
  "how.c2.title": { en: "Talk from day one", pt: "Fala desde o primeiro dia", fr: "Parle dès le premier jour", es: "Habla desde el primer día", kr: "Papia désdi primeru dia" },
  "how.c2.text":  { en: "Less theory, far more real speaking.", pt: "Menos teoria, muito mais fala real.", fr: "Moins de théorie, bien plus de pratique orale.", es: "Menos teoría, mucha más práctica real.", kr: "Menus tioria, txeu más fala real." },
  "how.c3.tag":   { en: "Every level", pt: "Todos os níveis", fr: "Tous les niveaux", es: "Todos los niveles", kr: "Tudu nível" },
  "how.c3.title": { en: "A1 to fluent", pt: "De A1 a fluente", fr: "De A1 à courant", es: "De A1 a fluido", kr: "Di A1 te fluenti" },
  "how.c3.text":  { en: "From your first words to near-native, A1–C2.", pt: "Das primeiras palavras ao quase-nativo, A1–C2.", fr: "De tes premiers mots au quasi-natif, A1–C2.", es: "Desde tus primeras palabras hasta casi-nativo, A1–C2.", kr: "Désdi bu primeru palavra te kuazi-nativu, A1–C2." },
  "how.c4.tag":   { en: "Anywhere", pt: "Em qualquer lugar", fr: "Partout", es: "En cualquier lugar", kr: "Na kalker lugar" },
  "how.c4.title": { en: "Online & in-person", pt: "Online e presencial", fr: "En ligne et en personne", es: "En línea y presencial", kr: "Online i prezensial" },
  "how.c4.text":  { en: "Live on Zoom, or face-to-face in Cabo Verde.", pt: "Ao vivo no Zoom, ou presencial em Cabo Verde.", fr: "En direct sur Zoom, ou en personne au Cap-Vert.", es: "En vivo por Zoom, o en persona en Cabo Verde.", kr: "Ao vivu na Zoom, ô prezensial na Kabu Verdi." },

  // ---- Languages section ----
  "langs.eyebrow": { en: "What you can learn", pt: "O que podes aprender", fr: "Ce que tu peux apprendre", es: "Lo que puedes aprender", kr: "Kuzê ki bu pode aprende" },
  "langs.heading": { en: "Learn up to five languages. Connect with the world.", pt: "Aprende até cinco línguas. Conecta-te com o mundo.", fr: "Apprends jusqu'à cinq langues. Connecte-toi au monde.", es: "Aprende hasta cinco idiomas. Conéctate con el mundo.", kr: "Aprende te sinku língua. Konekta ku mundu." },
  "langs.sub":     { en: "Each taught by someone who lives it — with the slang, the rhythm and the warmth of real Cape Verdean hospitality.", pt: "Cada uma ensinada por alguém que a vive — com a gíria, o ritmo e o calor da verdadeira hospitalidade cabo-verdiana.", fr: "Chacune enseignée par quelqu'un qui la vit — avec l'argot, le rythme et la chaleur de la vraie hospitalité cap-verdienne.", es: "Cada uno enseñado por alguien que lo vive — con la jerga, el ritmo y la calidez de la verdadera hospitalidad caboverdiana.", kr: "Kada un insinadu pa algen ki ta vive-l — ku gíria, ritmu i kalor di verdaderu ospitalidadi kabu-verdianu." },
  "langs.explore": { en: "Explore", pt: "Explorar", fr: "Explorer", es: "Explorar", kr: "Splora" },

  // ---- Feature highlight ----
  "feat.title1":  { en: "Everything you need to", pt: "Tudo o que precisas para", fr: "Tout ce qu'il te faut pour", es: "Todo lo que necesitas para", kr: "Tudu ki bu meste pa" },
  "feat.titleA":  { en: "master a language", pt: "dominar uma língua", fr: "maîtriser une langue", es: "dominar un idioma", kr: "domina un língua" },
  "feat.f1":      { en: "Live classes with native teachers", pt: "Aulas ao vivo com professores nativos", fr: "Cours en direct avec des professeurs natifs", es: "Clases en vivo con profesores nativos", kr: "Aula ao vivu ku profesor nativu" },
  "feat.f2":      { en: "Recorded lessons to replay anytime", pt: "Aulas gravadas para rever quando quiseres", fr: "Leçons enregistrées à revoir à tout moment", es: "Lecciones grabadas para repasar cuando quieras", kr: "Aula gravadu pa odja ki ora ki bu kré" },
  "feat.f3":      { en: "Real conversation & cultural immersion", pt: "Conversa real e imersão cultural", fr: "Vraie conversation et immersion culturelle", es: "Conversación real e inmersión cultural", kr: "Konbersu real i imersãu kultural" },
  "feat.f4":      { en: "Certificates at every level, A1–C2", pt: "Certificados em todos os níveis, A1–C2", fr: "Certificats à chaque niveau, A1–C2", es: "Certificados en cada nivel, A1–C2", kr: "Sertifikadu na kada nível, A1–C2" },
  "feat.btn":     { en: "Browse courses", pt: "Ver cursos", fr: "Voir les cours", es: "Ver cursos", kr: "Spia kursu" },

  // ---- Learn live (dark card) ----
  "live.eyebrow": { en: "Learn live", pt: "Aprende ao vivo", fr: "Apprends en direct", es: "Aprende en vivo", kr: "Aprende ao vivu" },
  "live.heading": { en: "Real teachers, certified levels", pt: "Professores reais, níveis certificados", fr: "De vrais professeurs, des niveaux certifiés", es: "Profesores reales, niveles certificados", kr: "Profesor real, nível sertifikadu" },
  "live.sub":     { en: "Sit across from a native speaker — online or in person — and actually talk. Classes are built around you, your goals and the culture you're stepping into.", pt: "Senta-te frente a um falante nativo — online ou presencial — e fala de verdade. As aulas são feitas à tua volta, dos teus objetivos e da cultura em que estás a entrar.", fr: "Assieds-toi face à un locuteur natif — en ligne ou en personne — et parle vraiment. Les cours sont construits autour de toi, de tes objectifs et de la culture que tu découvres.", es: "Siéntate frente a un hablante nativo — en línea o en persona — y habla de verdad. Las clases se construyen en torno a ti, tus objetivos y la cultura en la que entras.", kr: "Senta na frenti di un falanti nativu — online ô prezensial — i papia di verdadi. Aula é feitu pa bo, pa bu objetivu i pa kultura ki bu sta entra." },
  "live.l1":      { en: "Live 1-on-1 & small groups", pt: "Aulas 1-a-1 e grupos pequenos", fr: "Cours individuels et petits groupes", es: "Clases 1-a-1 y grupos pequeños", kr: "Aula 1-pa-1 i grupu pikinoti" },
  "live.l2":      { en: "Recorded replays", pt: "Repetições gravadas", fr: "Rediffusions enregistrées", es: "Repeticiones grabadas", kr: "Repetisãu gravadu" },
  "live.l3":      { en: "Progress tracking", pt: "Acompanhamento do progresso", fr: "Suivi des progrès", es: "Seguimiento del progreso", kr: "Akompanhamentu di progresu" },
  "live.l4":      { en: "Certificate at each level", pt: "Certificado em cada nível", fr: "Certificat à chaque niveau", es: "Certificado en cada nivel", kr: "Sertifikadu na kada nível" },
  "live.btn":     { en: "Book a free trial", pt: "Marcar aula experimental grátis", fr: "Réserver un essai gratuit", es: "Reservar clase de prueba gratis", kr: "Marka un aula gratis" },

  // ---- Anytime (green card) ----
  "any.heading": { en: "Learn anytime, anywhere", pt: "Aprende a qualquer hora, em qualquer lugar", fr: "Apprends à tout moment, partout", es: "Aprende en cualquier momento, en cualquier lugar", kr: "Aprende ki ora ki bu kré, na kalker lugar" },
  "any.sub":     { en: "Join a class from Praia or Paris. Pick up where you left off on any device, with lessons, vocabulary and culture always in your pocket.", pt: "Entra numa aula desde a Praia ou Paris. Continua de onde paraste em qualquer dispositivo, com lições, vocabulário e cultura sempre no teu bolso.", fr: "Rejoins un cours depuis Praia ou Paris. Reprends où tu t'es arrêté sur n'importe quel appareil, avec leçons, vocabulaire et culture toujours dans ta poche.", es: "Únete a una clase desde Praia o París. Retoma donde lo dejaste en cualquier dispositivo, con lecciones, vocabulario y cultura siempre en tu bolsillo.", kr: "Djunta na un aula désdi Praia ô Paris. Kontinua undi ki bu para na kalker dispozitivu, ku lisãu, vokabuláriu i kultura sénpri na bu bolsu." },
  "any.a1":      { en: "Mobile & desktop", pt: "Telemóvel e computador", fr: "Mobile et ordinateur", es: "Móvil y escritorio", kr: "Telemóvel i komputador" },
  "any.a2":      { en: "Offline replays", pt: "Repetições offline", fr: "Rediffusions hors ligne", es: "Repeticiones sin conexión", kr: "Repetisãu offline" },
  "any.a3":      { en: "Flexible scheduling", pt: "Horários flexíveis", fr: "Horaires flexibles", es: "Horarios flexibles", kr: "Oráriu flexível" },
  "any.a4":      { en: "Local & card payments", pt: "Pagamentos locais e por cartão", fr: "Paiements locaux et par carte", es: "Pagos locales y con tarjeta", kr: "Pagamentu lokal i ku kartãu" },

  // ---- FAQ ----
  "faq.heading": { en: "Frequently asked questions", pt: "Perguntas frequentes", fr: "Questions fréquentes", es: "Preguntas frecuentes", kr: "Pergunta frekuenti" },
  "faq.linkpre": { en: "Still curious?", pt: "Ainda com dúvidas?", fr: "Encore curieux ?", es: "¿Aún con curiosidad?", kr: "Inda ku dúvida?" },
  "faq.linkcta": { en: "Talk to us →", pt: "Fala connosco →", fr: "Parle-nous →", es: "Habla con nosotros →", kr: "Papia ku nos →" },

  // ---- Final CTA ----
  "cta.heading": { en: "Ready to speak?", pt: "Pronto para falar?", fr: "Prêt à parler ?", es: "¿Listo para hablar?", kr: "Prontu pa papia?" },
  "cta.sub":     { en: "Create a free account, take a 60-second placement test, or book a trial class with a native teacher.", pt: "Cria uma conta grátis, faz um teste de nível de 60 segundos, ou marca uma aula experimental com um professor nativo.", fr: "Crée un compte gratuit, passe un test de niveau de 60 secondes, ou réserve un cours d'essai avec un professeur natif.", es: "Crea una cuenta gratis, haz una prueba de nivel de 60 segundos, o reserva una clase de prueba con un profesor nativo.", kr: "Kria un konta gratis, fazi un tésti di nível di 60 segundu, ô marka un aula ku un profesor nativu." },
  "cta.btn1":    { en: "Create free account", pt: "Criar conta grátis", fr: "Créer un compte gratuit", es: "Crear cuenta gratis", kr: "Kria konta gratis" },
  "cta.btn2":    { en: "Book a class", pt: "Marcar aula", fr: "Réserver un cours", es: "Reservar clase", kr: "Marka aula" },

  // ---- Footer ----
  "foot.tagline": { en: "A language school born in Cabo Verde, teaching the world to speak with heart. Learn Kriolu, English, French, Spanish and Portuguese with native speakers — online or in person.", pt: "Uma escola de línguas nascida em Cabo Verde, a ensinar o mundo a falar com o coração. Aprende Kriolu, Inglês, Francês, Espanhol e Português com falantes nativos — online ou presencial.", fr: "Une école de langues née au Cap-Vert, qui apprend au monde à parler avec le cœur. Apprends le créole, l'anglais, le français, l'espagnol et le portugais avec des natifs — en ligne ou en personne.", es: "Una escuela de idiomas nacida en Cabo Verde, que enseña al mundo a hablar con el corazón. Aprende criollo, inglés, francés, español y portugués con hablantes nativos — en línea o en persona.", kr: "Un skola di língua ki nasi na Kabu Verdi, ta insina mundu papia ku korasãu. Aprende Kriolu, Inglês, Fransês, Spanhol i Portugês ku falanti nativu — online ô prezensial." },
  "foot.explore": { en: "Explore", pt: "Explorar", fr: "Explorer", es: "Explorar", kr: "Splora" },
  "foot.touch":   { en: "Get in Touch", pt: "Contacta-nos", fr: "Nous contacter", es: "Contáctanos", kr: "Kontakta-nu" },
  "foot.location":{ en: "Cabo Verde · Worldwide online", pt: "Cabo Verde · Online em todo o mundo", fr: "Cap-Vert · En ligne dans le monde entier", es: "Cabo Verde · En línea en todo el mundo", kr: "Kabu Verdi · Online na mundu interu" },
  "foot.made":    { en: "Made with morabeza in Cabo Verde.", pt: "Feito com morabeza em Cabo Verde.", fr: "Fait avec morabeza au Cap-Vert.", es: "Hecho con morabeza en Cabo Verde.", kr: "Fetu ku morabeza na Kabu Verdi." },
  "foot.design":  { en: "Design by", pt: "Design por", fr: "Conçu par", es: "Diseño por", kr: "Dizain pa" },
};

interface I18nValue {
  lang: Lang;
  setLang: (l: Lang) => void;
  t: (key: string) => string;
}

const I18nContext = createContext<I18nValue | null>(null);

export function LanguageProvider({ children }: { children: React.ReactNode }) {
  const [lang, setLangState] = useState<Lang>("en");

  useEffect(() => {
    try {
      const saved = localStorage.getItem("icl-lang") as Lang | null;
      if (saved && LANGS.includes(saved)) setLangState(saved);
    } catch {}
  }, []);

  useEffect(() => {
    document.documentElement.lang = lang;
  }, [lang]);

  const setLang = useCallback((l: Lang) => {
    setLangState(l);
    try { localStorage.setItem("icl-lang", l); } catch {}
  }, []);

  const t = useCallback((key: string) => S[key]?.[lang] ?? S[key]?.en ?? key, [lang]);

  return <I18nContext.Provider value={{ lang, setLang, t }}>{children}</I18nContext.Provider>;
}

export function useI18n() {
  const ctx = useContext(I18nContext);
  if (!ctx) throw new Error("useI18n must be used within LanguageProvider");
  return ctx;
}
