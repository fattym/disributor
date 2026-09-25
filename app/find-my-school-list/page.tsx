"use client";

import { FormEvent, useState } from "react";
import Link from "next/link";
import GlobalHeader from "@/components/GlobalHeader";
import GlobalFooter from "@/components/GlobalFooter";
import { shopApi } from "@/lib/api";
import "./school-list.css";

const schools = [
  "Kigwa Ridge School",
  "Lukenya International School",
  "Brighton International School",
  "Makini School Ngong Road",
  "Makini School Runda",
  "Crawford International School",
  "Shadel International School",
  "Mountain View School",
  "Nova Pioneer Tatu International",
  "Busy Bee School",
  "Chantilly School",
  "The Marion School",
  "All Saints Cathedral School",
  "Thika Road Academy",
  "Safari Brooks Academy",
  "Kiota School",
  "Regis School",
  "The Children’s House School",
  "The Learning Academy",
  "School of the Nations",
  "Noblegate International Academy",
];

const levelOptions = {
  "Pre-primary": {
    classes: ["PP1", "PP2"],
    subjects: [
      "Language activities",
      "Mathematical activities",
      "Environmental activities",
      "Creative activities",
    ],
  },
  Primary: {
    classes: ["Grade 1", "Grade 2", "Grade 3", "Grade 4", "Grade 5", "Grade 6"],
    subjects: [
      "Languages",
      "Mathematics",
      "Environmental activities",
      "Creative arts",
      "Religious education",
    ],
  },
  "Junior secondary": {
    classes: ["Grade 7", "Grade 8", "Grade 9"],
    subjects: [
      "STEM pathway",
      "Social sciences pathway",
      "Arts and sports pathway",
    ],
  },
  "Senior secondary": {
    classes: ["Grade 10", "Grade 11", "Grade 12"],
    subjects: [
      "STEM pathway",
      "Social sciences pathway",
      "Arts and sports science pathway",
    ],
  },
  University: {
    classes: ["Year 1", "Year 2", "Year 3", "Year 4", "Year 5", "Year 6"],
    subjects: [
      "Business and economics",
      "Computing and technology",
      "Education",
      "Engineering",
      "Health sciences",
      "Humanities and social sciences",
    ],
  },
} as const;

type EducationLevel = keyof typeof levelOptions;

export default function FindMySchoolListPage() {
  const [selection, setSelection] = useState<{
    school: string;
    level: string;
    className: string;
    subject: string;
  } | null>(null);
  const [submitted, setSubmitted] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [level, setLevel] = useState<EducationLevel | "">("");
  const [className, setClassName] = useState("");
  const [subject, setSubject] = useState("");

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setLoading(true);
    setError("");

    const data = new FormData(event.currentTarget);
    const formData = {
      school: String(data.get("school")),
      level: String(data.get("level")),
      className: String(data.get("className") || ""),
      subject: String(data.get("subject") || ""),
    };

    try {
      await shopApi.submitForm({ form_type: "find_school_list", data: formData });
      setSelection(formData);
      setSubmitted(true);
    } catch (err) {
      setError("Failed to submit your selection. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const selectedLevel = level ? levelOptions[level] : null;

  return (
    <>
      <GlobalHeader />
      <main className="school-list-page" id="main">
        <div className="school-list-shell">
          <div className="school-list-copy">
            <p className="crumbs">
              <Link href="/">Home</Link> / Find my school list
            </p>
            <p className="school-list-kicker">Start with your school</p>
            <h1>Find your school list</h1>
            <p>
              Choose your child&apos;s school and grade to find the supplies
              they need for the school year.
            </p>
            <div className="school-list-points">
              <span>Complete school supplies</span>
              <span>One simple order</span>
              <span>Delivery to your door</span>
            </div>
          </div>

          <div className="school-list-card">
            <form onSubmit={handleSubmit}>
              <label htmlFor="school">School</label>
              <select id="school" name="school" required defaultValue="">
                <option value="" disabled>
                  Select your school
                </option>
                {schools.map((school) => (
                  <option key={school}>{school}</option>
                ))}
              </select>

              <label htmlFor="level">Education level</label>
              <select
                id="level"
                name="level"
                required
                value={level}
                onChange={(event) => {
                  setLevel(event.target.value as EducationLevel);
                  setClassName("");
                  setSubject("");
                }}
              >
                <option value="" disabled>
                  Select level
                </option>
                {Object.keys(levelOptions).map((option) => (
                  <option key={option}>{option}</option>
                ))}
              </select>

              {selectedLevel && (
                <>
                  <label htmlFor="className">
                    {level === "University"
                      ? "Year of study"
                      : "Grade or class"}
                  </label>
                  <select
                    id="className"
                    name="className"
                    required
                    value={className}
                    onChange={(event) => setClassName(event.target.value)}
                  >
                    <option value="" disabled>
                      {level === "University"
                        ? "Select year"
                        : "Select grade or class"}
                    </option>
                    {selectedLevel.classes.map((option) => (
                      <option key={option}>{option}</option>
                    ))}
                  </select>

                  <label htmlFor="subject">
                    {level === "University"
                      ? "Course or study area"
                      : "Pathway or subject focus"}
                  </label>
                  <select
                    id="subject"
                    name="subject"
                    required
                    value={subject}
                    onChange={(event) => setSubject(event.target.value)}
                  >
                    <option value="" disabled>
                      {level === "University"
                        ? "Select study area"
                        : "Select pathway or subject"}
                    </option>
                    {selectedLevel.subjects.map((option) => (
                      <option key={option}>{option}</option>
                    ))}
                  </select>
                </>
              )}

              <button className="btn" type="submit" disabled={loading}>
                {loading ? "Saving..." : "Show my list"}
              </button>
              {error && (
                <p className="school-list-error" role="alert">
                  {error}
                </p>
              )}
            </form>

            {selection && (
              <div className="school-list-result" role="status">
                <h2>Your selection</h2>
                <p>
                  {selection.school} · {selection.level} · {selection.className}
                </p>
                <p>{selection.subject}</p>
                <p className="school-list-result-note">
                  Browse our ready-made school packs while we prepare the full
                  list for your school.
                </p>
                <Link className="btn" href="/product-category/student-boxes/">
                  View school packs
                </Link>
              </div>
            )}
          </div>
        </div>
      </main>
      <GlobalFooter />
    </>
  );
}
