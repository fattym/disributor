'use client';

import React, { useState, useEffect, useRef, useCallback } from 'react';
import { shopApi, ShopProduct } from '@/lib/api';
import './hero-showcase.css';

interface HeroShowcaseCarouselProps {
  initialItems?: ShopProduct[];
  onSelectItem?: (item: ShopProduct) => void;
}

interface StaticSlide {
  title: string;
  label: string;
  description: string;
  badge: string;
  icon: string;
  items: Array<{ title: string; image: string; tag: string }>;
}

const FALLBACK_HERO_SLIDES: StaticSlide[] = [
  {
    title: 'Books and resources your learner unlocks',
    label: 'Inside Elimu Pepe',
    description: 'CBC-aligned textbooks, activity workbooks, and comprehensive revision guides.',
    badge: '30+',
    icon: '📚',
    items: [
      { title: 'Mathematics Grade 5', image: '/assets/profile/kids.png', tag: 'KLB' },
      { title: 'English Activities Gr 5', image: '/assets/profile/kids.png', tag: 'Oxford' },
      { title: 'Integrated Science Gr 5', image: '/assets/profile/kids.png', tag: 'Longhorn' },
      { title: 'Kiswahili Kitabu Gr 5', image: '/assets/profile/kids.png', tag: 'Moran' },
    ],
  },
  {
    title: 'Essential stationery & creative sets',
    label: 'Back to School Ready',
    description: 'Everything your child needs for classwork, homework, and art projects.',
    badge: '20+',
    icon: '✏️',
    items: [
      { title: 'Staedtler HB Pencils', image: '/assets/profile/kids.png', tag: '12-pack' },
      { title: 'Bic Cristal Blue Pens', image: '/assets/profile/kids.png', tag: '10-pack' },
      { title: 'Helix Geometry Set', image: '/assets/profile/kids.png', tag: 'Instruments' },
      { title: 'Crayola 24 Colours', image: '/assets/profile/kids.png', tag: 'Washable' },
    ],
  },
];

export default function HeroShowcaseCarousel({
  initialItems,
  onSelectItem,
}: HeroShowcaseCarouselProps) {
  const [items, setItems] = useState<ShopProduct[]>(initialItems || []);
  const [currentSlide, setCurrentSlide] = useState(0);
  const [isHovered, setIsHovered] = useState(false);
  const autoplayTimerRef = useRef<NodeJS.Timeout | null>(null);

  const resolveImage = (path?: string | null): string => {
    if (!path) return '/assets/profile/kids.png';
    if (path.startsWith('http://') || path.startsWith('https://')) return path;
    const base = process.env.NEXT_PUBLIC_API_URL
      ? process.env.NEXT_PUBLIC_API_URL.replace(/\/api\/?$/, '')
      : 'http://localhost:8000';
    return `${base}${path.startsWith('/') ? '' : '/'}${path}`;
  };

  useEffect(() => {
    if (!initialItems || initialItems.length === 0) {
      shopApi
        .getHeroItems()
        .then((data) => {
          if (Array.isArray(data) && data.length > 0) {
            setItems(data);
          }
        })
        .catch((err) => {
          console.warn('Failed to load hero items from backend:', err);
        });
    }
  }, [initialItems]);

  // Logic matching the user specification:
  const perSlide = 4;
  const maxSlides = 5;

  const allItems = items;
  const visibleItems = allItems.slice(0, perSlide * maxSlides);
  const hiddenCount = Math.max(0, allItems.length - visibleItems.length);

  // Chunk items into slides of 4
  const itemSlides: ShopProduct[][] = [];
  for (let i = 0; i < visibleItems.length; i += perSlide) {
    itemSlides.push(visibleItems.slice(i, i + perSlide));
  }

  const useItemSlides = itemSlides.length > 0;
  const slideCount = useItemSlides ? itemSlides.length : FALLBACK_HERO_SLIDES.length;

  const nextSlide = useCallback(() => {
    setCurrentSlide((prev) => (prev + 1) % Math.max(1, slideCount));
  }, [slideCount]);

  const prevSlide = useCallback(() => {
    setCurrentSlide((prev) => (prev - 1 + slideCount) % Math.max(1, slideCount));
  }, [slideCount]);

  // Autoplay management
  useEffect(() => {
    if (slideCount <= 1 || isHovered) {
      if (autoplayTimerRef.current) clearInterval(autoplayTimerRef.current);
      return;
    }

    autoplayTimerRef.current = setInterval(() => {
      nextSlide();
    }, 5000);

    return () => {
      if (autoplayTimerRef.current) clearInterval(autoplayTimerRef.current);
    };
  }, [slideCount, isHovered, nextSlide]);

  return (
    <section className="hero-showcase-container" aria-label="Bookshop showcase carousel">
      <div
        id="subscription-hero-carousel"
        className="hero-showcase-carousel"
        onMouseEnter={() => setIsHovered(true)}
        onMouseLeave={() => setIsHovered(false)}
      >
        <div className="hero-carousel-slides-wrapper">
          {useItemSlides ? (
            itemSlides.map((group, slideIndex) => {
              const isActive = slideIndex === currentSlide;
              const isLastSlide = slideIndex === itemSlides.length - 1;

              return (
                <article
                  key={`hero-slide-${slideIndex}`}
                  className={`hero-carousel-slide ${isActive ? 'active' : ''}`}
                  aria-hidden={!isActive}
                >
                  <div className="hero-carousel-visual">
                    <span className="hero-carousel-visual__badge">
                      {String(slideIndex + 1).padStart(2, '0')}/{String(slideCount).padStart(2, '0')}
                    </span>
                    <div className="hero-carousel-visual__glow hero-carousel-visual__glow--one" />
                    <div className="hero-carousel-visual__glow hero-carousel-visual__glow--two" />

                    <div className={`hero-items-grid hero-items-grid--${group.length}`}>
                      {group.map((item, itemIdx) => {
                        const isLastItemInGroup = itemIdx === group.length - 1;
                        const showMore = isLastSlide && isLastItemInGroup && hiddenCount > 0;
                        const coverSrc = resolveImage(item.cover_image || item.image_url || item.image);

                        return (
                          <figure
                            key={`hero-item-${item.id || itemIdx}`}
                            className="hero-item"
                            onClick={() => onSelectItem && onSelectItem(item)}
                            title={item.name || item.title}
                          >
                            <img
                              src={coverSrc}
                              alt={item.title || item.name}
                              loading="lazy"
                              onError={(e) => {
                                const target = e.currentTarget;
                                target.onerror = null;
                                target.src = '/assets/profile/kids.png';
                              }}
                            />
                            <figcaption>
                              {(item.title || item.name || '').length > 28
                                ? (item.title || item.name || '').substring(0, 28) + '…'
                                : item.title || item.name}
                            </figcaption>

                            {showMore && (
                              <span className="hero-item__more">
                                +{hiddenCount} more
                              </span>
                            )}
                          </figure>
                        );
                      })}
                    </div>
                  </div>

                  <div className="hero-showcase-card hero-showcase-card--carousel">
                    <div>
                      <div className="hero-showcase-card__top">
                        <div>
                          <p className="hero-showcase-label">Inside Elimu Pepe</p>
                          <h3>Books and resources your learner unlocks</h3>
                        </div>
                        <div className="hero-showcase-badge">{allItems.length}+</div>
                      </div>

                      <p className="hero-showcase-body">
                        Curriculum-approved textbooks, supplementary reading, exercise books, and
                        approved revision material designed for student success.
                      </p>
                    </div>

                    <div className="hero-showcase-footer">
                      <div className="hero-showcase-chip">
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
                          <path d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z" />
                        </svg>
                        <span>CBC aligned content</span>
                      </div>
                      <div className="hero-showcase-chip">
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
                          <path d="M12 2l2.4 7.2h7.6l-6.2 4.5 2.4 7.3-6.2-4.5-6.2 4.5 2.4-7.3-6.2-4.5h7.6z" />
                        </svg>
                        <span>Updated regularly</span>
                      </div>
                    </div>
                  </div>
                </article>
              );
            })
          ) : (
            FALLBACK_HERO_SLIDES.map((slide, slideIndex) => {
              const isActive = slideIndex === currentSlide;

              return (
                <article
                  key={`hero-static-${slideIndex}`}
                  className={`hero-carousel-slide ${isActive ? 'active' : ''}`}
                  aria-hidden={!isActive}
                >
                  <div className="hero-carousel-visual">
                    <span className="hero-carousel-visual__badge">
                      {String(slideIndex + 1).padStart(2, '0')}/{String(slideCount).padStart(2, '0')}
                    </span>
                    <div className="hero-carousel-visual__glow hero-carousel-visual__glow--one" />
                    <div className="hero-carousel-visual__glow hero-carousel-visual__glow--two" />

                    <div className="hero-items-grid hero-items-grid--4">
                      {slide.items.map((it, idx) => (
                        <figure key={idx} className="hero-item">
                          <img
                            src={it.image}
                            alt={it.title}
                            loading="lazy"
                            onError={(e) => {
                              const target = e.currentTarget;
                              target.onerror = null;
                              target.src = '/assets/profile/kids.png';
                            }}
                          />
                          <figcaption>{it.title}</figcaption>
                        </figure>
                      ))}
                    </div>
                  </div>

                  <div className="hero-showcase-card hero-showcase-card--carousel">
                    <div>
                      <div className="hero-showcase-card__top">
                        <div>
                          <p className="hero-showcase-label">{slide.label}</p>
                          <h3>{slide.title}</h3>
                        </div>
                        <div className="hero-showcase-badge">{slide.badge}</div>
                      </div>

                      <p className="hero-showcase-body">{slide.description}</p>
                    </div>

                    <div className="hero-showcase-footer">
                      <div className="hero-showcase-chip">
                        <span>🛡️ CBC aligned content</span>
                      </div>
                      <div className="hero-showcase-chip">
                        <span>✨ Updated regularly</span>
                      </div>
                    </div>
                  </div>
                </article>
              );
            })
          )}
        </div>

        <div className="hero-carousel-bar">
          <div className="hero-carousel-dots">
            {Array.from({ length: slideCount }).map((_, idx) => (
              <button
                key={`dot-${idx}`}
                type="button"
                className={`hero-carousel-dot ${idx === currentSlide ? 'active' : ''}`}
                onClick={() => setCurrentSlide(idx)}
                aria-label={`Go to slide ${idx + 1}`}
              />
            ))}
          </div>

          <div className="hero-carousel-controls">
            <span className="hero-carousel-counter">
              {String(currentSlide + 1).padStart(2, '0')} /{' '}
              <span id="hero-carousel-total">{String(slideCount).padStart(2, '0')}</span>
            </span>
            <button
              type="button"
              className="hero-carousel-btn"
              onClick={prevSlide}
              aria-label="Previous slide"
            >
              ‹
            </button>
            <button
              type="button"
              className="hero-carousel-btn"
              onClick={nextSlide}
              aria-label="Next slide"
            >
              ›
            </button>
          </div>
        </div>
      </div>
    </section>
  );
}
