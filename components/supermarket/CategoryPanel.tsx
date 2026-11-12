'use client';

import { useState } from 'react';
import { navigationData } from '@/lib/shopCategories';
import { useSupermarketStore } from '@/lib/store/supermarketStore';

const ICONS: Record<string, string> = {
  'Educational & CBC Books': '📚',
  'School Supplies & Stationery': '✏️',
  'Art, Craft & Practical Learning': '🎨',
  'Toys, Board Games & ECDE Aids': '🧩',
  'Reference Books & Atlases': '📖',
  'Bags & School Gear': '🎒',
};

const DEPARTMENT_COLORS: Record<string, string> = {
  'educational-cbc-books': '#E63B00',
  'school-supplies-stationery': '#2563EB',
  'art-craft-practical-learning': '#7C3AED',
  'toys-board-games-ecde-aids': '#0F766E',
  'reference-books-atlases': '#FBBF24',
  'bags-school-gear': '#059669',
};

interface CategoryButtonProps {
  cat: (typeof navigationData)[number];
  active: boolean;
  onSelect: (slug: string) => void;
}

function CategoryButton({ cat, active, onSelect }: CategoryButtonProps) {
  const color = (DEPARTMENT_COLORS[cat.slug] || '#E63B00');
  return (
    <button
      type="button"
      className={`lp-cat-btn ${active ? 'lp-cat-btn--active' : ''}`}
      onClick={() => onSelect(cat.slug)}
      aria-pressed={active}
      style={{ '--dept-accent': color } as Record<string, string>}
    >
      <span className="lp-cat-icon">{ICONS[cat.label] || '🛒'}</span>
      <span className="lp-cat-label">{cat.label}</span>
      {active && <span className="lp-cat-dot" aria-hidden="true"></span>}
    </button>
  );
}

export function CategoryPanel({ onSelectDepartment }: { onSelectDepartment: (slug: string | null) => void }) {
  const [collapsed, setCollapsed] = useState(false);
  const [activeSlug, setActiveSlug] = useState<string | null>(null);
  const [activeItem, setActiveItem] = useState<string | null>(null);
  const [expandedSlug, setExpandedSlug] = useState<string | null>(null);
  const { setSelectedBooklist, setCategoryFilter } = useSupermarketStore();

  const selectDepartment = (slug: string, label: string) => {
    setActiveSlug(slug);
    setActiveItem(null);
    setExpandedSlug((current) => current === slug ? null : slug);
    setSelectedBooklist(null);
    setCategoryFilter(label);
    onSelectDepartment(slug);
  };

  const selectSubcategory = (slug: string, label: string, filter: string) => {
    setActiveSlug(slug);
    setActiveItem(filter);
    setSelectedBooklist(null);
    setCategoryFilter(filter);
    onSelectDepartment(slug);
  };

  return (
    <aside className={`lp-category-panel ${collapsed ? 'lp-category-panel--collapsed' : ''}`} aria-label="Store categories">
      <button
        type="button"
        className="lp-collapse-toggle"
        onClick={() => setCollapsed((c) => !c)}
        aria-label={collapsed ? 'Expand categories' : 'Collapse categories'}
        aria-expanded={!collapsed}
      >
        {collapsed ? '▸' : '◂'}
      </button>

      {collapsed ? null : (
        <>
          <div className="lp-panel-header">
            <h2 className="lp-panel-title">Departments</h2>
          </div>

          <nav className="lp-cat-list" role="navigation" aria-label="Departments and shop subcategories">
            {navigationData.map((cat) => (
              <div className="lp-department" key={cat.slug}>
                <CategoryButton
                  cat={cat}
                  active={activeSlug === cat.slug}
                  onSelect={(slug) => selectDepartment(slug, cat.label)}
                />
                {expandedSlug === cat.slug && (
                  <div className="lp-department-subcategories">
                    {cat.groups.map((group) => (
                      <div className="lp-subcategory-group" key={group.label}>
                        <div className="lp-subcategory-heading">{group.label}</div>
                        {group.items.map((item) => {
                          const filterKey = `${cat.label} › ${group.label} › ${item.label}`;
                          return (
                            <button
                              type="button"
                              key={`${cat.slug}-${item.label}`}
                              className={`lp-subcategory-btn ${activeItem === filterKey ? 'lp-subcategory-btn--active' : ''}`}
                              onClick={() => selectSubcategory(cat.slug, cat.label, filterKey)}
                            >
                              {item.label}
                            </button>
                          );
                        })}
                      </div>
                    ))}
                  </div>
                )}
              </div>
            ))}
          </nav>

          <div className="lp-panel-spacer" />

          <div className="lp-panel-footer">
            <p className="lp-panel-note">Tap a department to go straight to that aisle.</p>
          </div>
        </>
      )}
    </aside>
  );
}
