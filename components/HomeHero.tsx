import Link from "next/link";
import HeroCarousel from "./HeroCarousel";
import GradePicker from "./GradePicker";
import type { GradeClass } from "@/lib/gradeClasses";
import "./home-hero.css";

/**
 * Words and the main action on the left, pictures on the right (stacked in that order on phones).
 * No school has a published booklist: the main action is picking a class.
 * At least one has: the main action is picking a school, and the classes move to a bar underneath.
 */
export default function HomeHero({ classes, schools }: { classes: GradeClass[]; schools: { id: number; name: string }[] }) {
  const hasLists = schools.length > 0;
  return (
    <>
      <section className="home-hero">
        <div className="wrap home-hero__split">
          <div className="home-hero__copy">
            <h1>CBC textbooks, set books and stationery for your child&apos;s class</h1>
            <p className="home-hero__lead">Order online and we deliver to your child&apos;s school, your shop or your home.</p>
            {hasLists ? (
              <form className="home-hero__finder" action="/find-my-school-list/" method="get">
                <select name="school" aria-label="Select your school" required defaultValue="">
                  <option value="" disabled>Select your school</option>
                  {schools.map((s) => <option key={s.id} value={s.id}>{s.name}</option>)}
                </select>
                <button type="submit">Find my school list</button>
              </form>
            ) : (
              <>
                <GradePicker classes={classes} />
                <p className="home-hero__upload">
                  Have a printed list? <Link href="/upload-my-list/">Upload it</Link>
                </p>
              </>
            )}
          </div>
          <HeroCarousel />
        </div>
      </section>
      {hasLists && (
        <div className="grade-bar">
          <div className="wrap">
            <GradePicker classes={classes} />
          </div>
        </div>
      )}
    </>
  );
}
