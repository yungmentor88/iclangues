import Link from "next/link";
import { redirect } from "next/navigation";
import { GraduationCap, BookOpen, Award, ArrowRight } from "lucide-react";
import { getUser } from "@/lib/supabase/server";
import { Button } from "@/components/ui/button";

export const metadata = { title: "My account — IClangues" };

export default async function AccountPage() {
  const user = await getUser();
  if (!user) redirect("/login");

  const name = (user.user_metadata?.full_name as string) || user.email?.split("@")[0] || "there";

  return (
    <main className="container min-h-[80vh] pb-24 pt-32">
      <div className="mb-10">
        <p className="text-sm font-semibold uppercase tracking-wider text-primary">Your dashboard</p>
        <h1 className="mt-2 font-display text-4xl font-bold">Olá, {name} 👋</h1>
        <p className="mt-2 text-muted-foreground">{user.email}</p>
      </div>

      <div className="grid gap-4 sm:grid-cols-3">
        {[
          { icon: GraduationCap, label: "Current level", value: "—", note: "Take the placement test" },
          { icon: BookOpen, label: "Enrolled courses", value: "0", note: "Browse the catalogue" },
          { icon: Award, label: "Certificates", value: "0", note: "Complete a level to earn one" },
        ].map((c, i) => (
          <div key={i} className="rounded-[22px] border border-border bg-card p-6">
            <span className="grid h-11 w-11 place-items-center rounded-xl bg-primary/15 text-primary"><c.icon className="h-5 w-5" /></span>
            <p className="mt-4 text-sm text-muted-foreground">{c.label}</p>
            <p className="font-display text-3xl font-bold">{c.value}</p>
            <p className="mt-1 text-sm text-muted-foreground">{c.note}</p>
          </div>
        ))}
      </div>

      <div className="mt-6 rounded-[22px] border border-border bg-card p-8">
        <h2 className="font-display text-2xl font-bold">Start learning</h2>
        <p className="mt-2 max-w-lg text-muted-foreground">
          You&rsquo;re all set up. Explore courses, take the placement test, or book your first class with a native teacher.
        </p>
        <div className="mt-5 flex flex-wrap gap-3">
          <Button asChild variant="green"><Link href="/courses">Browse courses <ArrowRight className="h-4 w-4" /></Link></Button>
          <Button asChild variant="outline"><Link href="/contact">Book a class</Link></Button>
        </div>
      </div>
    </main>
  );
}
