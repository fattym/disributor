"use client";

import { useEffect, useMemo, useState, Suspense } from "react";
import Link from "next/link";
import { useSearchParams, useRouter } from "next/navigation";
import GlobalHeader from "@/components/GlobalHeader";
import GlobalFooter from "@/components/GlobalFooter";
import ShopNavBar from "@/components/ShopNavBar";
import { shopApi, ShopProduct, Grade } from "@/lib/api";
import { useCart } from "@/lib/cart";
import { getFlatTaxonomy, FlatTaxonomyItem } from "@/lib/shopCategories";
import "./shop-page.css";

const CBC_SUBJECTS = [
  "Mathematics",
  "English",
  "Kiswahili",
  "Integrated Science",
  "Agriculture",
  "Creative Arts",
  "Social Studies",
  "CRE/IRE",
  "Computer (ICT)",
  "Home Science",
];

const KENYAN_PUBLISHERS = ["KLB", "Longhorn", "Oxford", "Moran", "Storymoja", "Spotlight"];

const WHATSAPP_NUMBER = "254798734442";

type SortOption = "popularity" | "latest" | "rating" | "price-asc" | "price-desc";

function ShopContent() {
  const { addItem } = useCart();
  const searchParams = useSearchParams();
  const router = useRouter();

  const [products, setProducts] = useState<ShopProduct[]>([]);
  const [grades, setGrades] = useState<Grade[]>([]);
  const [loading, setLoading] = useState(true);

  const [filtersOpen, setFiltersOpen] = useState(false);

  const [audience, setAudience] = useState<string>("all");
  const [selectedGrades, setSelectedGrades] = useState<number[]>([]);
  const [selectedSubjects, setSelectedSubjects] = useState<string[]>([]);
  const [selectedPublishers, setSelectedPublishers] = useState<string[]>([]);
  const [minPrice, setMinPrice] = useState(0);
  const [maxPrice, setMaxPrice] = useState(50000);
  const [selectedTags, setSelectedTags] = useState<string[]>([]);
  const [sort, setSort] = useState<SortOption>("popularity");
  const [currentPage, setCurrentPage] = useState(1);
  const [addedIds, setAddedIds] = useState<Record<number, boolean>>({});

  const itemsPerPage = 12;
  const flatTaxonomy = useMemo(() => getFlatTaxonomy(), []);

  // Match active taxonomy leaf from URL query parameters (e.g. ?category=reference&sub=atlases or ?level=junior-secondary&grade=7)
  const activeNavLeaf = useMemo<FlatTaxonomyItem | null>(() => {
    if (!searchParams || Array.from(searchParams.keys()).length === 0) return null;

    const currentParams = new Map<string, string>();
    searchParams.forEach((val, key) => {
      currentParams.set(key, val);
    });

    // 1. Check exact match with all parameters in item href
    for (const item of flatTaxonomy) {
      const url = new URL(item.href, "http://dummy");
      let exact = true;
      let count = 0;
      url.searchParams.forEach((val, key) => {
        count++;
        if (currentParams.get(key) !== val) {
          exact = false;
        }
      });
      if (exact && count === currentParams.size) {
        return item;
      }
    }

    // 2. Check subset match: all URL parameters in item.href match current searchParams
    for (const item of flatTaxonomy) {
      const url = new URL(item.href, "http://dummy");
      let subset = true;
      let count = 0;
      url.searchParams.forEach((val, key) => {
        count++;
        if (currentParams.get(key) !== val) {
          subset = false;
        }
      });
      if (subset && count > 0) {
        return item;
      }
    }

    // 3. Fallback: match by category / level / sub parameters
    const catParam = searchParams.get("category");
    const lvlParam = searchParams.get("level");
    const subParam = searchParams.get("sub");
    const gradeParam = searchParams.get("grade");

    if (catParam || lvlParam || subParam || gradeParam) {
      const found = flatTaxonomy.find((item) => {
        const u = new URL(item.href, "http://dummy");
        if (catParam && u.searchParams.get("category") === catParam) {
          if (!subParam || u.searchParams.get("sub") === subParam) return true;
        }
        if (lvlParam && u.searchParams.get("level") === lvlParam) {
          if (gradeParam && u.searchParams.get("grade") === gradeParam) return true;
          if (subParam && u.searchParams.get("sub") === subParam) return true;
          if (!gradeParam && !subParam) return true;
        }
        return false;
      });
      if (found) return found;
    }

    return null;
  }, [searchParams, flatTaxonomy]);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [prodData, gradeData] = await Promise.all([
          shopApi.getPublicProducts({}).catch(() => []),
          shopApi.getPublicGrades().catch(() => []),
        ]);
        const prodList = Array.isArray(prodData)
          ? prodData
          : (prodData as { results?: ShopProduct[] })?.results || [];
        const gradeList = Array.isArray(gradeData)
          ? gradeData
          : (gradeData as { results?: Grade[] })?.results || [];
        setProducts(prodList);
        setGrades(gradeList);
        const prices = prodList.map((p: ShopProduct) => parseFloat(p.effective_price || p.price || "0"));
        if (prices.length > 0) {
          setMinPrice(Math.floor(Math.min(...prices) / 100) * 100 || 0);
          setMaxPrice(Math.ceil(Math.max(...prices) / 100) * 100 || 50000);
        }
      } catch (err) {
        console.error("Failed to load shop:", err);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  const gradeMap = useMemo(() => {
    const map = new Map<number, Grade>();
    grades.forEach((g) => map.set(g.id, g));
    return map;
  }, [grades]);

  const brandNames = useMemo(() => {
    const brands = new Set<string>();
    products.forEach((p) => {
      const brand = p.brand || p.distributor_name;
      if (brand) brands.add(brand.trim());
    });
    const combined = Array.from(new Set([...brands, ...KENYAN_PUBLISHERS]));
    return combined.sort((a, b) => a.localeCompare(b));
  }, [products]);

  const priceBounds = useMemo(() => {
    if (products.length === 0) return { min: 0, max: 50000 };
    const prices = products.map((p) => parseFloat(p.effective_price || p.price || "0"));
    return {
      min: Math.floor(Math.min(...prices) / 100) * 100 || 0,
      max: Math.ceil(Math.max(...prices) / 100) * 100 || 50000,
    };
  }, [products]);

  const filtered = useMemo(() => {
    let list = products;

    // 1. Taxonomy Category / Sub-category filter from URL
    if (activeNavLeaf) {
      const tagsLower = (activeNavLeaf.tags || []).map((t) => t.toLowerCase());
      const labelLower = activeNavLeaf.itemLabel.toLowerCase();
      const groupLower = activeNavLeaf.groupLabel.toLowerCase();
      const catLower = activeNavLeaf.categoryLabel.toLowerCase();

      list = list.filter((p) => {
        // Tag match
        const pTags = (p.tags || []).map((t) => (t?.name || "").toLowerCase());
        const hasTag = tagsLower.some((t) => pTags.some((pt) => pt.includes(t) || t.includes(pt)));
        if (hasTag) return true;

        // Name and category string matches
        const pName = (p.name || "").toLowerCase();
        const pCat = (p.category_name || "").toLowerCase();
        if (
          pName.includes(labelLower) ||
          pCat.includes(labelLower) ||
          pCat.includes(groupLower) ||
          pCat.includes(catLower)
        ) {
          return true;
        }

        // Keywords from taxonomy
        const keyWords = tagsLower.filter((w) => w.length >= 4);
        if (keyWords.some((kw) => pName.includes(kw) || pCat.includes(kw))) {
          return true;
        }

        // Check applicable level IDs
        if (
          activeNavLeaf.defaultGrades &&
          activeNavLeaf.defaultGrades.length > 0 &&
          (p.applicable_levels || []).some((l) => activeNavLeaf.defaultGrades?.includes(l))
        ) {
          return true;
        }

        return false;
      });
    } else {
      // General URL search query if activeNavLeaf not matched
      const q = (searchParams?.get("q") || searchParams?.get("search") || "").trim().toLowerCase();
      if (q) {
        list = list.filter((p) => {
          const name = (p.name || "").toLowerCase();
          const brand = (p.brand || p.distributor_name || "").toLowerCase();
          const pTags = (p.tags || []).map((t) => (t?.name || "").toLowerCase());
          return name.includes(q) || brand.includes(q) || pTags.some((t) => t.includes(q));
        });
      }
    }

    // 2. Selected Grades filter
    if (selectedGrades.length > 0) {
      list = list.filter((p) =>
        (p.applicable_levels || []).some((l) => selectedGrades.includes(l))
      );
    }

    // 3. Selected Publishers filter
    if (selectedPublishers.length > 0) {
      list = list.filter((p) => {
        const brand = p.brand || p.distributor_name || "";
        return selectedPublishers.includes(brand.trim());
      });
    }

    // 4. Tag badges filter
    if (selectedTags.length > 0) {
      list = list.filter((p) => {
        const pTags = (p.tags || []).map((t) => (t?.name || "").toLowerCase());
        const pName = (p.name || "").toLowerCase();
        return selectedTags.every((st) => {
          if (st === "kicd") return pTags.some((t) => t.includes("kicd")) || pName.includes("kicd");
          if (st === "bestseller") return pTags.some((t) => t.includes("bestseller"));
          if (st === "new") return pTags.some((t) => t.includes("new syllabus") || t.includes("cbc"));
          if (st === "set") return pTags.some((t) => t.includes("set") || t.includes("literature") || t.includes("fasihi"));
          return pTags.includes(st.toLowerCase());
        });
      });
    }

    // 5. Selected Subjects filter
    if (selectedSubjects.length > 0) {
      list = list.filter((p) => {
        const tags = (p.tags || []).map((t) => (t?.name || "").toLowerCase());
        const name = p.name.toLowerCase();
        return selectedSubjects.some((s) => {
          const sl = s.toLowerCase();
          if (sl.includes("mathematics") && (tags.includes("math") || name.includes("math"))) return true;
          if (sl.includes("science") && (tags.includes("science") || name.includes("science") || tags.includes("stem"))) return true;
          if (sl.includes("english") && (name.includes("english") || tags.includes("english"))) return true;
          if (sl.includes("kiswahili") && (name.includes("kiswahili") || tags.includes("kiswahili"))) return true;
          return tags.some((t) => t.includes(sl.split(" ")[0])) || name.includes(sl.split(" ")[0]);
        });
      });
    }

    // 6. Target Audience filter
    if (audience !== "all") {
      list = list.filter((p) => {
        const cats = p.institution_categories || [];
        if (audience === "school") {
          return cats.some((c: string) => c.includes("School") || c.includes("Institution") || c.includes("TVET") || c.includes("Club"));
        }
        if (audience === "parent") {
          return cats.some((c: string) => c.includes("Parent") || c.includes("Home")) || true;
        }
        if (audience === "student") {
          return cats.some((c: string) => c.includes("Student")) || true;
        }
        return true;
      });
    }

    // 7. Price Range filter
    list = list.filter((p) => {
      const price = parseFloat(p.effective_price || p.price || "0");
      return price >= minPrice && price <= maxPrice;
    });

    return list;
  }, [
    products,
    activeNavLeaf,
    searchParams,
    selectedGrades,
    selectedPublishers,
    selectedTags,
    selectedSubjects,
    audience,
    minPrice,
    maxPrice,
  ]);

  const sorted = useMemo(() => {
    const arr = [...filtered];
    const price = (p: ShopProduct) => parseFloat(p.effective_price || p.price || "0");
    if (sort === "price-asc") arr.sort((a, b) => price(a) - price(b));
    else if (sort === "price-desc") arr.sort((a, b) => price(b) - price(a));
    else if (sort === "latest") arr.sort((a, b) => b.id - a.id);
    return arr;
  }, [filtered, sort]);

  const totalPages = Math.max(1, Math.ceil(sorted.length / itemsPerPage));
  const validPage = Math.min(currentPage, totalPages);
  const paginated = sorted.slice((validPage - 1) * itemsPerPage, validPage * itemsPerPage);

  const formatPrice = (value: string | null | undefined) =>
    `KSh ${parseFloat(value || "0").toLocaleString("en-KE")}`;

  const getGradeLabel = (levelIds: number[] = []) => {
    const labels = (levelIds || [])
      .map((id) => gradeMap.get(id)?.name)
      .filter(Boolean);
    if (labels.length === 0) return null;
    if (labels.length === 1) return labels[0];
    return labels.slice(0, 2).join(", ");
  };

  const handleAdd = (product: ShopProduct) => {
    const variant = product.variants && product.variants.length > 0 ? product.variants[0] : null;
    if (variant) {
      addItem({
        product_id: product.id,
        product_name: product.name,
        variant_id: variant.id,
        variant_label: variant.label,
        quantity: 1,
        unit_price: parseFloat(variant.effective_price || product.effective_price || product.price || "0"),
        image_url: product.image_url || null,
        stock_quantity: variant.stock_quantity,
      });
    } else {
      addItem({
        product_id: product.id,
        product_name: product.name,
        variant_id: 0,
        variant_label: "Default",
        quantity: 1,
        unit_price: parseFloat(product.effective_price || product.price || "0"),
        image_url: product.image_url || null,
        stock_quantity: 0,
      });
    }
    setAddedIds((prev) => ({ ...prev, [product.id]: true }));
    setTimeout(() => setAddedIds((prev) => ({ ...prev, [product.id]: false })), 1400);
  };

  const buyViaWhatsApp = (product: ShopProduct) => {
    const grade = getGradeLabel(product.applicable_levels || []) || "Grade unspecified";
    const message = `Hello Learning Pack! I'd like to order: ${product.name} (Grade: ${grade}). Price: ${formatPrice(product.effective_price || product.price)}`;
    const url = `https://wa.me/${WHATSAPP_NUMBER}?text=${encodeURIComponent(message)}`;
    window.open(url, "_blank", "noopener,noreferrer");
  };

  const toggleArray = <T,>(arr: T[], value: T) => {
    return arr.includes(value) ? arr.filter((v) => v !== value) : [...arr, value];
  };

  const handleAudienceToggle = (val: string) => {
    setAudience((prev) => (prev === val ? "all" : val));
    setCurrentPage(1);
  };

  const handleGradeToggle = (id: number) => {
    setSelectedGrades((prev) => toggleArray(prev, id));
    setCurrentPage(1);
  };

  const handleSubjectToggle = (subj: string) => {
    setSelectedSubjects((prev) => toggleArray(prev, subj));
    setCurrentPage(1);
  };

  const handlePublisherToggle = (pub: string) => {
    setSelectedPublishers((prev) => toggleArray(prev, pub));
    setCurrentPage(1);
  };

  const handleTagToggle = (tag: string) => {
    setSelectedTags((prev) => toggleArray(prev, tag));
    setCurrentPage(1);
  };

  const clearCategory = () => {
    router.push("/shop");
  };

  const clearFilters = () => {
    setSelectedGrades([]);
    setSelectedSubjects([]);
    setSelectedPublishers([]);
    setSelectedTags([]);
    setAudience("all");
    setMinPrice(priceBounds.min);
    setMaxPrice(priceBounds.max);
    setCurrentPage(1);
    if (activeNavLeaf || (searchParams && searchParams.size > 0)) {
      router.push("/shop");
    }
  };

  const hasActiveFilters =
    Boolean(activeNavLeaf) ||
    selectedGrades.length > 0 ||
    selectedSubjects.length > 0 ||
    selectedPublishers.length > 0 ||
    selectedTags.length > 0 ||
    audience !== "all" ||
    minPrice > priceBounds.min ||
    maxPrice < priceBounds.max;

  const activeBreadcrumb = useMemo(() => {
    if (activeNavLeaf) {
      return null;
    }
    if (selectedGrades.length === 1) {
      return gradeMap.get(selectedGrades[0])?.name || null;
    }
    if (selectedSubjects.length === 1) {
      return selectedSubjects[0];
    }
    if (selectedPublishers.length === 1) {
      return selectedPublishers[0];
    }
    if (audience !== "all") {
      return audience === "school" ? "School / Club" : audience === "parent" ? "Parents" : "Students";
    }
    if (hasActiveFilters) {
      return "Filtered Products";
    }
    return null;
  }, [activeNavLeaf, selectedGrades, selectedSubjects, selectedPublishers, audience, hasActiveFilters, gradeMap]);

  return (
    <>
      <GlobalHeader />
      <ShopNavBar />
      <main id="main" className="shop-layout">
        <div className="wrap">
          <nav className="shop-breadcrumb" aria-label="Breadcrumb">
            <Link href="/">Home</Link>
            <span className="separator">/</span>
            <Link href="/shop">Shop</Link>
            {activeNavLeaf ? (
              <>
                <span className="separator">/</span>
                <span className="category-dept">{activeNavLeaf.categoryLabel}</span>
                <span className="separator">/</span>
                <span className="current">{activeNavLeaf.itemLabel}</span>
              </>
            ) : activeBreadcrumb ? (
              <>
                <span className="separator">/</span>
                <span className="current">{activeBreadcrumb}</span>
              </>
            ) : null}
          </nav>

          <header className="shop-hero">
            <div className="shop-hero__text">
              <p className="shop-hero__eyebrow">
                {activeNavLeaf ? activeNavLeaf.categoryLabel : "Learning Pack Store"}
              </p>
              <h1 className="shop-hero__title">
                {activeNavLeaf ? activeNavLeaf.itemLabel : "Shop all products"}
              </h1>
              <p className="shop-hero__subtitle">
                {activeNavLeaf
                  ? `${activeNavLeaf.groupLabel} — curated CBC & curriculum titles.`
                  : "Textbooks, stationery, ECDE aids and reference materials — delivered across Kenya."}
              </p>
            </div>
            {activeNavLeaf && (
              <button
                type="button"
                className="shop-hero__clear"
                onClick={clearCategory}
              >
                <span aria-hidden="true">✕</span> View all products
              </button>
            )}
          </header>

          <div className="shop-content">
            <aside className="shop-sidebar" aria-label="Product filters">
              <button
                type="button"
                className="shop-filters-toggle"
                onClick={() => setFiltersOpen(!filtersOpen)}
                aria-expanded={filtersOpen}
              >
                <span>Filter Products</span>
                <span>{filtersOpen ? "▲" : "▼"}</span>
              </button>

              <div className={`shop-filters-panel ${filtersOpen ? "is-open" : ""}`}>
                <div className="shop-filter__body">
                  <h3>Target Audience</h3>
                  <div className="shop-audience">
                    <button
                      type="button"
                      className={audience === "school" ? "is-active" : ""}
                      onClick={() => handleAudienceToggle("school")}
                    >
                      School/Club
                    </button>
                    <button
                      type="button"
                      className={audience === "parent" ? "is-active" : ""}
                      onClick={() => handleAudienceToggle("parent")}
                    >
                      Parent
                    </button>
                    <button
                      type="button"
                      className={audience === "student" ? "is-active" : ""}
                      onClick={() => handleAudienceToggle("student")}
                    >
                      Student
                    </button>
                  </div>
                </div>

                <div className="shop-filter__body">
                  <h3>Grade & Level</h3>
                  <div className="shop-checklist">
                    {grades
                      .filter((g) => g.order >= 1)
                      .map((g) => (
                        <label key={g.id}>
                          <input
                            type="checkbox"
                            checked={selectedGrades.includes(g.id)}
                            onChange={() => handleGradeToggle(g.id)}
                          />
                          <span>{g.name}</span>
                        </label>
                      ))}
                  </div>
                </div>

                <div className="shop-filter__body">
                  <h3>Subject</h3>
                  <div className="shop-checklist">
                    {CBC_SUBJECTS.map((s) => (
                      <label key={s}>
                        <input
                          type="checkbox"
                          checked={selectedSubjects.includes(s)}
                          onChange={() => handleSubjectToggle(s)}
                        />
                        <span>{s}</span>
                      </label>
                    ))}
                  </div>
                </div>

                <div className="shop-filter__body">
                  <h3>Publisher</h3>
                  <div className="shop-checklist">
                    {brandNames.slice(0, 12).map((b) => (
                      <label key={b}>
                        <input
                          type="checkbox"
                          checked={selectedPublishers.includes(b)}
                          onChange={() => handlePublisherToggle(b)}
                        />
                        <span>{b}</span>
                      </label>
                    ))}
                  </div>
                </div>

                <div className="shop-filter__body">
                  <h3>Price Range (KSh)</h3>
                  <div className="shop-price-inputs">
                    <span className="money">KSh</span>
                    <input
                      type="number"
                      value={minPrice}
                      onChange={(e) => {
                        setMinPrice(Number(e.target.value) || 0);
                        setCurrentPage(1);
                      }}
                    />
                    <span className="money">-</span>
                    <input
                      type="number"
                      value={maxPrice}
                      onChange={(e) => {
                        setMaxPrice(Number(e.target.value) || priceBounds.max);
                        setCurrentPage(1);
                      }}
                    />
                  </div>
                  <input
                    type="range"
                    className="shop-price-slider"
                    min={priceBounds.min}
                    max={priceBounds.max}
                    step={100}
                    value={maxPrice}
                    onChange={(e) => {
                      setMaxPrice(Number(e.target.value));
                      setCurrentPage(1);
                    }}
                  />
                </div>

                <div className="shop-filter__body">
                  <h3>Tag Badges</h3>
                  <div className="shop-tags">
                    <button
                      type="button"
                      className={`shop-tag tag-kicd ${selectedTags.includes("kicd") ? "is-active" : ""}`}
                      onClick={() => handleTagToggle("kicd")}
                    >
                      KICD Approved
                    </button>
                    <button
                      type="button"
                      className={`shop-tag tag-bestseller ${selectedTags.includes("bestseller") ? "is-active" : ""}`}
                      onClick={() => handleTagToggle("bestseller")}
                    >
                      Bestseller
                    </button>
                    <button
                      type="button"
                      className={`shop-tag tag-new-syllabus ${selectedTags.includes("new") ? "is-active" : ""}`}
                      onClick={() => handleTagToggle("new")}
                    >
                      New Syllabus
                    </button>
                    <button
                      type="button"
                      className={`shop-tag tag-set-books ${selectedTags.includes("set") ? "is-active" : ""}`}
                      onClick={() => handleTagToggle("set")}
                    >
                      Set Books
                    </button>
                  </div>
                </div>
              </div>
            </aside>

            <section className="shop-main">
              {hasActiveFilters && (
                <div className="shop-active-filters">
                  {activeNavLeaf && (
                    <span className="shop-active-filter shop-active-filter--cat">
                      <span>{activeNavLeaf.categoryIcon} {activeNavLeaf.itemLabel}</span>
                      <button
                        type="button"
                        className="remove"
                        onClick={clearCategory}
                        aria-label="Remove category filter"
                      >
                        ×
                      </button>
                    </span>
                  )}
                  {selectedGrades.map((gid) => {
                    const g = gradeMap.get(gid);
                    return (
                      <span key={gid} className="shop-active-filter">
                        {g?.name}
                        <button
                          type="button"
                          className="remove"
                          onClick={() => handleGradeToggle(gid)}
                          aria-label="Remove grade filter"
                        >
                          ×
                        </button>
                      </span>
                    );
                  })}
                  {selectedPublishers.map((p) => (
                    <span key={p} className="shop-active-filter">
                      {p}
                      <button
                        type="button"
                        className="remove"
                        onClick={() => handlePublisherToggle(p)}
                        aria-label="Remove publisher filter"
                      >
                        ×
                      </button>
                    </span>
                  ))}
                  {selectedTags.map((t) => (
                    <span key={t} className="shop-active-filter">
                      {t === "kicd" ? "KICD Approved" : t === "bestseller" ? "Bestseller" : t === "new" ? "New Syllabus" : "Set Books"}
                      <button
                        type="button"
                        className="remove"
                        onClick={() => handleTagToggle(t)}
                        aria-label="Remove tag filter"
                      >
                        ×
                      </button>
                    </span>
                  ))}
                  <button
                    type="button"
                    onClick={clearFilters}
                    className="shop-active-filter shop-active-filter--clear"
                  >
                    Clear all filters
                  </button>
                </div>
              )}

              <div className="shop-sort-bar">
                <span className="count">
                  {loading ? "Loading..." : `${sorted.length} product${sorted.length === 1 ? "" : "s"} found`}
                </span>
                <div style={{ display: "flex", alignItems: "center", gap: "0.6rem" }}>
                  <label htmlFor="sort">Sort by</label>
                  <select
                    id="sort"
                    value={sort}
                    onChange={(e) => {
                      setSort(e.target.value as SortOption);
                      setCurrentPage(1);
                    }}
                  >
                    <option value="popularity">Popularity</option>
                    <option value="latest">Latest</option>
                    <option value="rating">Rating</option>
                    <option value="price-asc">Price (Low to High)</option>
                    <option value="price-desc">Price (High to Low)</option>
                  </select>
                </div>
              </div>

              {loading ? (
                <div className="shop-grid">
                  <div className="shop-empty">
                    <p>Loading products...</p>
                  </div>
                </div>
              ) : paginated.length === 0 ? (
                <div className="shop-grid">
                  <div className="shop-empty">
                    <h3>No products found</h3>
                    <p>
                      {activeNavLeaf
                        ? `No products currently match "${activeNavLeaf.itemLabel}". Check back soon or try clearing filters.`
                        : "Try adjusting your search filters or browse other categories."}
                    </p>
                    {activeNavLeaf && (
                      <button
                        type="button"
                        onClick={clearCategory}
                        className="shop-card__btn shop-card__btn--cart"
                        style={{ marginTop: "1rem", display: "inline-flex", width: "auto", padding: "0.5rem 1.25rem" }}
                      >
                        View All Products
                      </button>
                    )}
                  </div>
                </div>
              ) : (
                <div className="shop-grid">
                  {paginated.map((product) => {
                    const isAdded = addedIds[product.id];
                    const price = parseFloat(product.effective_price || product.price || "0");
                    const gradeLabel = getGradeLabel(product.applicable_levels || []);
                    const brand = product.brand || product.distributor_name;
                    const hasTextbook = (product.tags || []).some((t) => t?.name === "Textbook");
                    const hasScience = (product.tags || []).some((t) => t?.name === "Science" || t?.name === "STEM");
                    const hasLaboratory = (product.tags || []).some((t) => t?.name === "Laboratory" || t?.name === "Lab");

                    return (
                      <article key={product.id} className="shop-card">
                        <Link href={`/shop/${product.id}`} className="shop-card__img" aria-label={product.name}>
                          {(hasTextbook || hasScience) && <span className="shop-card__badge">New Syllabus</span>}
                          {product.image_url ? (
                            <img src={product.image_url} alt={product.name} loading="lazy" />
                          ) : (
                            <div className="shop-card__img-placeholder">No image available</div>
                          )}
                        </Link>
                        <div className="shop-card__body">
                          {product.category_name && (
                            <div className="shop-card__category">{product.category_name}</div>
                          )}
                          <Link href={`/shop/${product.id}`} className="shop-card__title">
                            {product.name}
                          </Link>
                          <div className="shop-card__meta">
                            {gradeLabel && <span className="shop-card__grade">{gradeLabel}</span>}
                            {brand && <span className="shop-card__publisher">{brand}</span>}
                          </div>
                          <div className="shop-card__price">{formatPrice(price.toString())}</div>
                          <div className="shop-card__actions">
                            <button
                              className="shop-card__btn shop-card__btn--cart"
                              onClick={() => handleAdd(product)}
                              type="button"
                            >
                              <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                                <circle cx="9" cy="21" r="1" />
                                <circle cx="20" cy="21" r="1" />
                                <path d="M1 1h4l2.68 13.39a2 2 0 0 0 2 1.61h9.72a2 2 0 0 0 2-1.61L23 6H6" />
                              </svg>
                              <span>{isAdded ? "Added ✓" : "Add to Cart"}</span>
                            </button>
                            <button
                              className="shop-card__btn shop-card__btn--whatsapp"
                              onClick={() => buyViaWhatsApp(product)}
                              type="button"
                            >
                              <svg width="15" height="15" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
                                <path d="M.057 24l1.687-6.163c-1.041-1.804-1.588-3.849-1.587-5.946.003-6.556 5.338-11.891 11.893-11.891 3.181.001 6.167 1.24 8.413 3.488 2.245 2.248 3.481 5.236 3.48 8.414-.003 6.557-5.338 11.892-11.893 11.892-1.99-.001-3.951-.5-5.688-1.448l-6.305 1.654zm6.597-3.807c1.676.995 3.276 1.591 5.392 1.592 5.448 0 9.886-4.434 9.889-9.885.002-5.462-4.415-9.89-9.881-9.892-5.452 0-9.887 4.434-9.889 9.884-.001 2.225.651 3.891 1.746 5.634l-.999 3.648 3.742-.981zm11.387-5.464c-.074-.124-.272-.198-.57-.347-.297-.149-1.758-.868-2.031-.967-.272-.099-.47-.149-.669.149-.198.297-.768.967-.941 1.165-.173.198-.347.223-.644.074-.297-.149-1.255-.462-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.297-.347.446-.521.151-.172.2-.296.3-.495.099-.198.05-.372-.025-.521-.075-.148-.669-1.611-.916-2.206-.242-.579-.487-.501-.669-.51l-.57-.01c-.198 0-.52.074-.792.372s-1.04 1.016-1.04 2.479 1.065 2.876 1.213 3.074c.149.198 2.095 3.2 5.076 4.487.709.306 1.263.489 1.694.626.712.226 1.36.194 1.872.118.571-.085 1.758-.719 2.006-1.413.248-.695.248-1.29.173-1.414z" />
                              </svg>
                              <span>Buy via WhatsApp</span>
                            </button>
                          </div>
                        </div>
                        <div className="shop-card__tags">
                          {hasTextbook && <span className="shop-card__tag card-tag-set">Set Books</span>}
                          {hasLaboratory && <span className="shop-card__tag card-tag-kicd">KICD Approved</span>}
                          {hasScience && <span className="shop-card__tag card-tag-bestseller">Bestseller</span>}
                        </div>
                      </article>
                    );
                  })}
                </div>
              )}

              {totalPages > 1 && (
                <nav className="shop-pagination" aria-label="Shop pagination">
                  <button
                    type="button"
                    disabled={validPage === 1}
                    onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                    className="nav-arrow"
                    aria-label="Previous page"
                  >
                    ←
                  </button>
                  {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                    const pageNum = i + 1;
                    if (totalPages > 5 && pageNum === 5) {
                      return (
                        <span key="ellipsis" className="ellipsis">
                          ...
                        </span>
                      );
                    }
                    return (
                      <button
                        key={pageNum}
                        type="button"
                        className={validPage === pageNum ? "is-current" : ""}
                        onClick={() => setCurrentPage(pageNum)}
                      >
                        {pageNum}
                      </button>
                    );
                  })}
                  {totalPages > 5 && (
                    <button
                      type="button"
                      onClick={() => setCurrentPage(totalPages)}
                      className={validPage === totalPages ? "is-current" : ""}
                    >
                      {totalPages}
                    </button>
                  )}
                  <button
                    type="button"
                    disabled={validPage === totalPages}
                    onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
                    className="nav-arrow"
                    aria-label="Next page"
                  >
                    →
                  </button>
                </nav>
              )}
            </section>
          </div>
        </div>
      </main>
      <GlobalFooter />
    </>
  );
}

export default function ShopPage() {
  return (
    <Suspense
      fallback={
        <>
          <GlobalHeader />
          <ShopNavBar />
          <main id="main" className="shop-layout">
            <div className="wrap">
              <div style={{ padding: "4rem 1rem", textAlign: "center", color: "#64748b" }}>
                <p style={{ font: "600 1.1rem sans-serif", margin: 0 }}>Loading store catalog...</p>
              </div>
            </div>
          </main>
          <GlobalFooter />
        </>
      }
    >
      <ShopContent />
    </Suspense>
  );
}
