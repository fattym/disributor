import Link from "next/link";
import type { GradeClass, GradeGroup } from "@/lib/gradeClasses";

const GROUPS: GradeGroup[] = ["Pre-primary", "Grade", "Form"];

/** One button per class, in rows by school stage. Numbers sit under "Grade" and "Form" so the rows stay short. */
export default function GradePicker({ classes }: { classes: GradeClass[] }) {
  return (
    <nav className="grades" id="grades" aria-label="Shop by grade">
      <p className="grades__title">Shop by grade</p>
      {GROUPS.map((group) => {
        const rows = classes.filter((c) => c.group === group);
        if (!rows.length) return null;
        return (
          <div className="grades__row" data-group={group} key={group}>
            <span className="grades__group" aria-hidden="true">{group}</span>
            <ul>
              {rows.map((c) => (
                <li key={c.slug}>
                  <Link href={`/shop/?class=${c.slug}`} aria-label={c.label}>{c.short}</Link>
                </li>
              ))}
            </ul>
          </div>
        );
      })}
    </nav>
  );
}
