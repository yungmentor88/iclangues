import Image from "next/image";
import Link from "next/link";
import { Heart, Users, Globe2, MessagesSquare, ArrowRight } from "lucide-react";
import { Reveal } from "@/components/reveal";
import { Button } from "@/components/ui/button";

export const metadata = {
  title: "About — IClangues",
  description: "Born on an island, taught to the world. The story of IClangues, a Cabo Verde language school.",
};

const VALUES = [
  { icon: Heart, title: "Morabeza", text: "Cape Verdean warmth — the way we welcome every learner, from beginner to advanced." },
  { icon: Users, title: "Native voices", text: "Our teachers don't translate culture. They live it." },
  { icon: Globe2, title: "Local & global", text: "Rooted in Cabo Verde, open to the world. Online classes connect islanders and learners everywhere." },
  { icon: MessagesSquare, title: "Real conversation", text: "Forget rote drills. We learn the way people actually speak — with rhythm, slang and feeling." },
];

export default function AboutPage() {
  return (
    <main className="pb-24">
      <section className="bg-gradient-to-b from-primary/10 to-background pb-12 pt-32">
        <div className="container max-w-3xl">
          <span className="inline-flex items-center gap-2 text-xs font-bold uppercase tracking-[0.16em] text-primary">
            <span className="h-2 w-2 rounded-full bg-primary" /> Our story
          </span>
          <h1 className="mt-3 font-display text-5xl font-bold tracking-tight sm:text-6xl">
            Born on an <span className="text-primary">island</span>, taught to the <span className="text-brand-red">world</span>.
          </h1>
          <p className="mt-5 text-lg text-muted-foreground">
            IClangues began with a simple idea: the best way to learn a language is from someone who lives it. From a small
            classroom in Cabo Verde, we now teach learners across continents — keeping every lesson full of culture, music and morabeza.
          </p>
        </div>
      </section>

      {/* Main story image */}
      <section className="container">
        <Reveal>
          <div className="relative aspect-[16/8] overflow-hidden rounded-[32px] shadow-2xl">
            <Image src="/images/story.jpg" alt="An IClangues session — learning the way locals speak" fill className="object-cover object-top" sizes="100vw" priority />
          </div>
        </Reveal>
      </section>

      <section className="container grid items-center gap-12 py-20 lg:grid-cols-2">
        <Reveal>
          <h2 className="font-display text-3xl font-bold sm:text-4xl">Language is connection. We teach the connection.</h2>
          <p className="mt-5 text-lg text-muted-foreground">
            At IClangues we don&rsquo;t just deliver lessons — we share a way of speaking, listening and being. Founded in
            Cabo Verde, our team of native-speaking teachers brings together five languages we love: Kriolu, Português,
            English, Français and Español. Whether you&rsquo;re an expat learning to chat with neighbours or a professional
            preparing for global work, we meet you where you are.
          </p>
        </Reveal>
        <Reveal delay={0.1}>
          <div className="relative aspect-[4/3] overflow-hidden rounded-[28px] shadow-xl">
            <Image src="/images/about.jpg" alt="IClangues — language learning in Cabo Verde" fill className="object-cover" sizes="(max-width:1024px) 90vw, 560px" />
          </div>
        </Reveal>
      </section>

      <section className="bg-card py-20">
        <div className="container">
          <Reveal className="mb-12 max-w-2xl">
            <span className="inline-flex items-center gap-2 text-xs font-bold uppercase tracking-[0.16em] text-brand-red">
              <span className="h-2 w-2 rounded-full bg-brand-red" /> What we believe
            </span>
            <h2 className="mt-3 font-display text-4xl font-bold sm:text-5xl">Our values, in four words</h2>
          </Reveal>
          <div className="grid gap-4 sm:grid-cols-2">
            {VALUES.map((v, i) => (
              <Reveal key={v.title} delay={i * 0.08}>
                <div className="h-full rounded-[22px] border border-border bg-background p-7 transition hover:-translate-y-1 hover:shadow-xl">
                  <span className="grid h-12 w-12 place-items-center rounded-2xl bg-brand-sun text-brand-ink"><v.icon className="h-6 w-6" /></span>
                  <h3 className="mt-4 font-display text-xl font-bold">{v.title}</h3>
                  <p className="mt-2 text-muted-foreground">{v.text}</p>
                </div>
              </Reveal>
            ))}
          </div>
        </div>
      </section>

      <section className="container py-20">
        <Reveal className="mx-auto max-w-2xl text-center">
          <h2 className="font-display text-3xl font-bold sm:text-4xl">People before pedagogy</h2>
          <p className="mt-4 text-muted-foreground">
            Every IClangues teacher is a native speaker — selected for warmth, patience and a love for sharing their culture.
            Kriolu teachers from Santiago and São Vicente, Portuguese teachers trained in CEFR methodology, bilingual French
            teachers, and English and Spanish teachers from across the world.
          </p>
          <div className="mt-8 flex flex-wrap justify-center gap-3">
            <Button asChild variant="green"><Link href="/contact">Meet us &amp; book a class <ArrowRight className="h-4 w-4" /></Link></Button>
            <Button asChild variant="outline"><Link href="/courses">Browse courses</Link></Button>
          </div>
        </Reveal>
      </section>
    </main>
  );
}
