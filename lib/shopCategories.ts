// Central Store Taxonomy & Category Definitions
// Shared between Store Navigation (ShopNavBar), Storefront (/shop), and Distributor Dashboard (/dashboard/products)

export interface NavLeaf {
  label: string;
  href: string;
  defaultGrades?: number[]; // IDs matching DEFAULT_CBC_GRADES (e.g. 10 for Grade 7, 11 for Grade 8)
  tags?: string[];
  audience?: string[]; // 'School', 'Parent', 'Student'
}

export interface NavGroup {
  label: string;
  items: NavLeaf[];
}

export interface NavCategory {
  label: string;
  slug: string;
  icon: string;
  groups: NavGroup[];
}

export const navigationData: NavCategory[] = [
  {
    label: "Educational & CBC Books",
    slug: "educational-cbc-books",
    icon: "📚",
    groups: [
      {
        label: "CBC Pre-Primary & ECDE",
        items: [
          {
            label: "Playgroup activity books",
            href: "/shop?level=pre-primary&sub=playgroup",
            defaultGrades: [1], // Playgroup
            tags: ["Playgroup", "Pre-Primary", "Activity Books", "ECDE"],
            audience: ["School", "Parent"],
          },
          {
            label: "PP1 pre-literacy materials",
            href: "/shop?level=pre-primary&sub=pp1",
            defaultGrades: [2], // PP1
            tags: ["PP1", "Pre-Primary", "Literacy", "ECDE"],
            audience: ["School", "Parent"],
          },
          {
            label: "PP2 numeracy materials",
            href: "/shop?level=pre-primary&sub=pp2",
            defaultGrades: [3], // PP2
            tags: ["PP2", "Pre-Primary", "Numeracy", "ECDE"],
            audience: ["School", "Parent"],
          },
        ],
      },
      {
        label: "CBC Primary",
        items: [
          {
            label: "Grade 1–3 learner's books",
            href: "/shop?level=primary&grade=lower",
            defaultGrades: [4, 5, 6], // Grade 1, 2, 3
            tags: ["Grade 1", "Grade 2", "Grade 3", "Lower Primary", "Learner's Book"],
            audience: ["School", "Parent", "Student"],
          },
          {
            label: "Grade 4–6 learner's books",
            href: "/shop?level=primary&grade=upper",
            defaultGrades: [7, 8, 9], // Grade 4, 5, 6
            tags: ["Grade 4", "Grade 5", "Grade 6", "Upper Primary", "Learner's Book"],
            audience: ["School", "Parent", "Student"],
          },
          {
            label: "Teacher guides",
            href: "/shop?level=primary&sub=teacher-guides",
            tags: ["Teacher Guide", "Curriculum", "CBC", "Instructional Material"],
            audience: ["School"],
          },
          {
            label: "Assessment workbooks",
            href: "/shop?level=primary&sub=assessments",
            tags: ["Assessment", "Workbook", "Revision", "Exams"],
            audience: ["School", "Parent", "Student"],
          },
        ],
      },
      {
        label: "CBC Junior Secondary",
        items: [
          {
            label: "Grade 7 coursebooks",
            href: "/shop?level=junior-secondary&grade=7",
            defaultGrades: [10], // Grade 7
            tags: ["Grade 7", "Junior Secondary", "JSS", "Coursebook", "Textbook"],
            audience: ["School", "Parent", "Student"],
          },
          {
            label: "Grade 8 coursebooks",
            href: "/shop?level=junior-secondary&grade=8",
            defaultGrades: [11], // Grade 8
            tags: ["Grade 8", "Junior Secondary", "JSS", "Coursebook", "Textbook"],
            audience: ["School", "Parent", "Student"],
          },
          {
            label: "Grade 9 coursebooks",
            href: "/shop?level=junior-secondary&grade=9",
            defaultGrades: [12], // Grade 9
            tags: ["Grade 9", "Junior Secondary", "JSS", "Coursebook", "Textbook"],
            audience: ["School", "Parent", "Student"],
          },
          {
            label: "KJSEA preparation materials",
            href: "/shop?level=junior-secondary&sub=kjsea",
            defaultGrades: [10, 11, 12],
            tags: ["KJSEA", "Junior Secondary", "Assessment", "National Exam", "Revision"],
            audience: ["School", "Parent", "Student"],
          },
        ],
      },
      {
        label: "CBC Senior Secondary & KCSE",
        items: [
          {
            label: "Grade 10–12 pathway texts",
            href: "/shop?level=senior-secondary&grades=10-12",
            defaultGrades: [13, 14, 15],
            tags: ["Grade 10", "Grade 11", "Grade 12", "Senior Secondary", "Pathways"],
            audience: ["School", "Student"],
          },
          {
            label: "Form 1–4 texts",
            href: "/shop?level=senior-secondary&form=1-4",
            defaultGrades: [16, 17, 18, 19],
            tags: ["Form 1", "Form 2", "Form 3", "Form 4", "KCSE", "Secondary"],
            audience: ["School", "Parent", "Student"],
          },
          {
            label: "Literature / Fasihi",
            href: "/shop?level=senior-secondary&sub=literature",
            tags: ["Literature", "Fasihi", "Set Books", "English", "Kiswahili"],
            audience: ["School", "Parent", "Student"],
          },
          {
            label: "Set books",
            href: "/shop?level=senior-secondary&sub=set-books",
            tags: ["Set Books", "set", "KNEC", "Literature", "Fasihi ya Kiswahili"],
            audience: ["School", "Parent", "Student"],
          },
        ],
      },
      {
        label: "International & Higher Ed",
        items: [
          {
            label: "Cambridge curriculum",
            href: "/shop?level=international&exam=cambridge",
            tags: ["Cambridge", "IGCSE", "O-Level", "A-Level", "International"],
            audience: ["School", "Parent", "Student"],
          },
          {
            label: "Pearson Edexcel",
            href: "/shop?level=international&exam=edexcel",
            tags: ["Pearson", "Edexcel", "International GCSE", "Curriculum"],
            audience: ["School", "Parent", "Student"],
          },
          {
            label: "Tertiary / college texts",
            href: "/shop?level=higher-ed",
            tags: ["Tertiary", "College", "TVET", "University", "Higher Education"],
            audience: ["School", "Student"],
          },
        ],
      },
    ],
  },
  {
    label: "School Supplies & Stationery",
    slug: "school-supplies-stationery",
    icon: "✏️",
    groups: [
      {
        label: "Exercise Books & Writing Pads",
        items: [
          {
            label: "Single-lined books",
            href: "/shop?category=exercise-books&lines=single",
            tags: ["Exercise Books", "Single-lined", "Stationery", "Writing"],
            audience: ["School", "Parent", "Student"],
          },
          {
            label: "Double-lined books",
            href: "/shop?category=exercise-books&lines=double",
            tags: ["Exercise Books", "Double-lined", "Handwriting", "Lower Primary"],
            audience: ["School", "Parent", "Student"],
          },
          {
            label: "Squared books",
            href: "/shop?category=exercise-books&lines=squared",
            tags: ["Exercise Books", "Squared", "Mathematics", "Science"],
            audience: ["School", "Parent", "Student"],
          },
          {
            label: "Counter books",
            href: "/shop?category=exercise-books&sub=counter",
            tags: ["Counter Book", "Hardcover", "Stationery", "Office"],
            audience: ["School", "Parent", "Student"],
          },
          {
            label: "Drawing books",
            href: "/shop?category=exercise-books&sub=drawing",
            tags: ["Drawing Book", "Art", "Sketching", "Cartridge Paper"],
            audience: ["School", "Parent", "Student"],
          },
        ],
      },
      {
        label: "Writing & Drawing Instruments",
        items: [
          {
            label: "Pens",
            href: "/shop?category=instruments&sub=pens",
            tags: ["Ballpoint Pens", "Blue Pens", "Red Pens", "Black Pens", "Writing"],
            audience: ["School", "Parent", "Student"],
          },
          {
            label: "HB pencils",
            href: "/shop?category=instruments&sub=hb-pencils",
            tags: ["HB Pencils", "Pencils", "Exam Pencils", "Writing"],
            audience: ["School", "Parent", "Student"],
          },
          {
            label: "Colored pencils",
            href: "/shop?category=instruments&sub=colored-pencils",
            tags: ["Colored Pencils", "Coloring", "Art", "Drawing"],
            audience: ["School", "Parent", "Student"],
          },
          {
            label: "Markers",
            href: "/shop?category=instruments&sub=markers",
            tags: ["Markers", "Highlighters", "Whiteboard Markers"],
            audience: ["School", "Parent"],
          },
          {
            label: "Sharpeners",
            href: "/shop?category=instruments&sub=sharpeners",
            tags: ["Sharpener", "Stationery"],
            audience: ["School", "Parent", "Student"],
          },
          {
            label: "Erasers",
            href: "/shop?category=instruments&sub=erasers",
            tags: ["Eraser", "Rubber", "Stationery"],
            audience: ["School", "Parent", "Student"],
          },
        ],
      },
      {
        label: "Technical & Desk Items",
        items: [
          {
            label: "Mathematical sets",
            href: "/shop?category=technical&sub=math-sets",
            tags: ["Mathematical Set", "Geometrical Set", "Compass", "Protractor"],
            audience: ["School", "Parent", "Student"],
          },
          {
            label: "SMP tables",
            href: "/shop?category=technical&sub=smp-tables",
            tags: ["SMP Tables", "Math Tables", "Four Figure Tables"],
            audience: ["School", "Parent", "Student"],
          },
          {
            label: "Scientific calculators",
            href: "/shop?category=technical&sub=scientific-calculators",
            tags: ["Calculator", "Scientific Calculator", "Casio", "Mathematics"],
            audience: ["School", "Parent", "Student"],
          },
          {
            label: "KNEC tables",
            href: "/shop?category=technical&sub=knec-tables",
            tags: ["KNEC Mathematical Tables", "Exam Approved"],
            audience: ["School", "Parent", "Student"],
          },
          {
            label: "Rulers",
            href: "/shop?category=technical&sub=rulers",
            tags: ["Ruler", "30cm Ruler", "Measuring"],
            audience: ["School", "Parent", "Student"],
          },
          {
            label: "Geometric sets",
            href: "/shop?category=technical&sub=geometric-sets",
            tags: ["Geometric Set", "Technical Drawing", "Geometry"],
            audience: ["School", "Parent", "Student"],
          },
        ],
      },
    ],
  },
  {
    label: "Art, Craft & Practical Learning",
    slug: "art-craft-practical",
    icon: "🎨",
    groups: [
      {
        label: "Materials & Kits",
        items: [
          {
            label: "CBC project kits",
            href: "/shop?category=art-craft&sub=project-kits",
            tags: ["Project Kit", "CBC Practical", "Craft Kit", "STEM"],
            audience: ["School", "Parent", "Student"],
          },
          {
            label: "Modeling clay",
            href: "/shop?category=art-craft&sub=modeling-clay",
            tags: ["Modeling Clay", "Plasticine", "Pottery", "Creative Arts"],
            audience: ["School", "Parent", "Student"],
          },
          {
            label: "Paints",
            href: "/shop?category=art-craft&sub=paints",
            tags: ["Paints", "Watercolors", "Poster Colors", "Acrylics"],
            audience: ["School", "Parent", "Student"],
          },
          {
            label: "Brushes",
            href: "/shop?category=art-craft&sub=brushes",
            tags: ["Paint Brushes", "Brushes", "Art Supplies"],
            audience: ["School", "Parent", "Student"],
          },
          {
            label: "Canvas",
            href: "/shop?category=art-craft&sub=canvas",
            tags: ["Canvas Board", "Painting Canvas", "Fine Art"],
            audience: ["School", "Parent", "Student"],
          },
          {
            label: "Sketchbooks",
            href: "/shop?category=art-craft&sub=sketchbooks",
            tags: ["Sketchbook", "Drawing Pad", "Art Paper"],
            audience: ["School", "Parent", "Student"],
          },
          {
            label: "Craft paper",
            href: "/shop?category=art-craft&sub=craft-paper",
            tags: ["Craft Paper", "Sugar Paper", "Origami", "Manila Paper"],
            audience: ["School", "Parent", "Student"],
          },
        ],
      },
    ],
  },
  {
    label: "Toys, Board Games & ECDE Aids",
    slug: "toys-games-ecde",
    icon: "🧩",
    groups: [
      {
        label: "Learning Aids",
        items: [
          {
            label: "Educational puzzles",
            href: "/shop?category=toys-games&sub=puzzles",
            tags: ["Puzzles", "Jigsaw", "Educational Games", "Problem Solving"],
            audience: ["School", "Parent"],
          },
          {
            label: "Building blocks",
            href: "/shop?category=toys-games&sub=building-blocks",
            tags: ["Building Blocks", "Lego", "Motor Skills", "STEM"],
            audience: ["School", "Parent"],
          },
          {
            label: "Flashcards",
            href: "/shop?category=toys-games&sub=flashcards",
            tags: ["Flashcards", "Alphabet", "Numbers", "Phonics", "ECDE"],
            audience: ["School", "Parent"],
          },
          {
            label: "Counting frames",
            href: "/shop?category=toys-games&sub=counting-frames",
            tags: ["Counting Frame", "Math Aids", "Numeracy"],
            audience: ["School", "Parent"],
          },
          {
            label: "Abacus",
            href: "/shop?category=toys-games&sub=abacus",
            tags: ["Abacus", "Math Calculations", "Arithmetic"],
            audience: ["School", "Parent"],
          },
          {
            label: "Interactive learning toys",
            href: "/shop?category=toys-games&sub=interactive-toys",
            tags: ["Interactive Toys", "ECDE", "Early Learning"],
            audience: ["School", "Parent"],
          },
        ],
      },
    ],
  },
  {
    label: "Reference Books & Atlases",
    slug: "reference-books-atlases",
    icon: "📖",
    groups: [
      {
        label: "Reference",
        items: [
          {
            label: "Dictionaries",
            href: "/shop?category=reference&sub=dictionaries",
            tags: ["Dictionary", "Oxford Dictionary", "English Dictionary", "Reference"],
            audience: ["School", "Parent", "Student"],
          },
          {
            label: "Kamusi (Swahili-English)",
            href: "/shop?category=reference&sub=kamusi",
            tags: ["Kamusi", "Kamusi ya Kiswahili", "Swahili-English Dictionary"],
            audience: ["School", "Parent", "Student"],
          },
          {
            label: "Atlases",
            href: "/shop?category=reference&sub=atlases",
            tags: ["Atlas", "Kenya Atlas", "Social Studies", "Geography", "Maps"],
            audience: ["School", "Parent", "Student"],
          },
          {
            label: "Encyclopedias",
            href: "/shop?category=reference&sub=encyclopedias",
            tags: ["Encyclopedia", "General Knowledge", "Research", "Library"],
            audience: ["School", "Parent", "Student"],
          },
          {
            label: "Subject revision companions",
            href: "/shop?category=reference&sub=revision-companions",
            tags: ["Revision", "Quick Reading", "Exam Companion", "Summary Notes"],
            audience: ["School", "Parent", "Student"],
          },
        ],
      },
    ],
  },
  {
    label: "Bags & School Gear",
    slug: "bags-school-gear",
    icon: "🎒",
    groups: [
      {
        label: "School Gear",
        items: [
          {
            label: "School backpacks",
            href: "/shop?category=bags-gear&sub=backpacks",
            tags: ["Backpack", "School Bag", "Heavy Duty", "Gear"],
            audience: ["School", "Parent", "Student"],
          },
          {
            label: "Lunch bags",
            href: "/shop?category=bags-gear&sub=lunch-bags",
            tags: ["Lunch Bag", "Insulated Lunchbox", "Meal Container"],
            audience: ["Parent", "Student"],
          },
          {
            label: "Water bottles",
            href: "/shop?category=bags-gear&sub=water-bottles",
            tags: ["Water Bottle", "BPA Free", "Hydration", "Student Bottle"],
            audience: ["Parent", "Student"],
          },
          {
            label: "Rainwear",
            href: "/shop?category=bags-gear&sub=rainwear",
            tags: ["Raincoat", "Rain Jacket", "Umbrella", "Weather Gear"],
            audience: ["Parent", "Student"],
          },
        ],
      },
    ],
  },
];

export interface FlatTaxonomyItem {
  categoryLabel: string;
  categorySlug: string;
  categoryIcon: string;
  groupLabel: string;
  itemLabel: string;
  href: string;
  defaultGrades?: number[];
  tags?: string[];
  audience?: string[];
  fullPath: string;
}

export function getFlatTaxonomy(): FlatTaxonomyItem[] {
  const result: FlatTaxonomyItem[] = [];
  navigationData.forEach((cat) => {
    cat.groups.forEach((grp) => {
      grp.items.forEach((item) => {
        result.push({
          categoryLabel: cat.label,
          categorySlug: cat.slug,
          categoryIcon: cat.icon,
          groupLabel: grp.label,
          itemLabel: item.label,
          href: item.href,
          defaultGrades: item.defaultGrades,
          tags: item.tags,
          audience: item.audience,
          fullPath: `${cat.label} › ${grp.label} › ${item.label}`,
        });
      });
    });
  });
  return result;
}
