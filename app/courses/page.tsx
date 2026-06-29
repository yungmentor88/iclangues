import { CoursesExplorer } from "@/components/courses-explorer";
import { getCourses } from "@/lib/get-courses";

export const metadata = {
  title: "Courses — IClangues",
  description: "Browse IClangues courses by language and level (A1–C2): Kriolu, English, French, Spanish and Portuguese.",
};

export default async function CoursesPage() {
  const courses = await getCourses();
  return (
    <main className="pb-24">
      <section className="bg-gradient-to-b from-primary/10 to-background pb-10 pt-32">
        <div className="container">
          <span className="inline-flex items-center gap-2 text-xs font-bold uppercase tracking-[0.16em] text-primary">
            <span className="h-2 w-2 rounded-full bg-primary" /> Course catalogue
          </span>
          <h1 className="mt-3 max-w-2xl font-display text-5xl font-bold tracking-tight">
            Find your <span className="text-primary">level</span>. Find your language.
          </h1>
          <p className="mt-4 max-w-xl text-lg text-muted-foreground">
            Every course is led by native speakers and built around real conversation. Filter by language and level.
          </p>
        </div>
      </section>
      <section className="container pt-10">
        <CoursesExplorer courses={courses} />
      </section>
    </main>
  );
}
