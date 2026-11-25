'use client';

import { useCallback, useEffect, useRef, useState, useSyncExternalStore } from 'react';
import slides from '@/lib/heroSlides.json';

const DELAY = 6000;
const WIDTHS = [480, 960, 1600];
// Phones crop the 16:9 picture to 3:4, so it is drawn about 960 CSS px wide.
const SIZES = '(max-width: 640px) 960px, (max-width: 1200px) 100vw, 1200px';
const srcSet = (n: number, ext: string) => WIDTHS.map((w) => `/carousel/${n}-${w}.${ext} ${w}w`).join(', ');

const QUERY = '(prefers-reduced-motion: reduce)';
const subscribe = (notify: () => void) => {
  const media = window.matchMedia(QUERY);
  media.addEventListener('change', notify);
  return () => media.removeEventListener('change', notify);
};

export default function HeroCarousel({ children }: { children: React.ReactNode }) {
  const [index, setIndex] = useState(0);
  const [seen, setSeen] = useState<number[]>([0]);
  const [warm, setWarm] = useState(false);
  // null = no choice yet: autoplay unless the visitor prefers reduced motion.
  const [choice, setChoice] = useState<boolean | null>(null);
  const [hover, setHover] = useState(false);
  const [focus, setFocus] = useState(false);
  const touchX = useRef<number | null>(null);
  const reduced = useSyncExternalStore(subscribe, () => window.matchMedia(QUERY).matches, () => true);
  const playing = choice ?? !reduced;
  // Pressing Play overrides the hover/focus pause that the press itself causes.
  const running = playing && (choice === true || (!hover && !focus));
  const total = slides.length;

  const go = useCallback((to: number) => {
    const next = (to + total) % total;
    setSeen((list) => (list.includes(next) ? list : [...list, next]));
    setIndex(next);
  }, [total]);
  const pauseOnAttention = () => setChoice((c) => (c === true ? null : c));

  useEffect(() => {
    const timer = setTimeout(() => setWarm(true), 3000);
    return () => clearTimeout(timer);
  }, []);

  useEffect(() => {
    if (!running) return;
    const timer = setTimeout(() => go(index + 1), DELAY);
    return () => clearTimeout(timer);
  }, [running, index, go]);

  return (
    <div
      className="hero-carousel"
      role="group"
      aria-roledescription="carousel"
      aria-label="Learning Pack highlights"
      onPointerEnter={(e) => { if (e.pointerType === 'mouse') { setHover(true); pauseOnAttention(); } }}
      onPointerLeave={(e) => { if (e.pointerType === 'mouse') setHover(false); }}
      onFocus={(e) => { if (!e.currentTarget.contains(e.relatedTarget)) { setFocus(true); pauseOnAttention(); } }}
      onBlur={(e) => { if (!e.currentTarget.contains(e.relatedTarget)) setFocus(false); }}
      onKeyDown={(e) => {
        if (e.key !== 'ArrowLeft' && e.key !== 'ArrowRight') return;
        e.preventDefault();
        go(index + (e.key === 'ArrowRight' ? 1 : -1));
      }}
    >
      <link rel="preload" as="image" type="image/avif" imageSrcSet={srcSet(slides[0].n, 'avif')} imageSizes={SIZES} fetchPriority="high" />
      <div
        className="hero-carousel__frame"
        tabIndex={0}
        aria-label="Slides: use the left and right arrow keys"
        onTouchStart={(e) => { touchX.current = e.touches[0].clientX; setChoice(false); }}
        onTouchEnd={(e) => {
          const start = touchX.current;
          touchX.current = null;
          if (start === null) return;
          const moved = e.changedTouches[0].clientX - start;
          if (Math.abs(moved) > 40) go(index + (moved < 0 ? 1 : -1));
        }}
      >
        <div className="hero-carousel__slides" aria-live={running ? 'off' : 'polite'}>
          {slides.map((slide, i) => (
            <div
              key={slide.n}
              className="hero-carousel__slide"
              role="group"
              aria-roledescription="slide"
              aria-label={`${i + 1} of ${total}`}
              aria-hidden={i !== index}
              data-active={i === index}
            >
              {(seen.includes(i) || (warm && i === (index + 1) % total)) && (
                <picture>
                  <source type="image/avif" srcSet={srcSet(slide.n, 'avif')} sizes={SIZES} />
                  <source type="image/webp" srcSet={srcSet(slide.n, 'webp')} sizes={SIZES} />
                  <img
                    src={`/carousel/${slide.n}-960.jpg`}
                    srcSet={srcSet(slide.n, 'jpg')}
                    sizes={SIZES}
                    width={1600}
                    height={900}
                    alt={slide.alt}
                    loading={i === 0 ? 'eager' : 'lazy'}
                    fetchPriority={i === 0 ? 'high' : 'auto'}
                    style={{ '--focus': slide.focus } as React.CSSProperties}
                  />
                </picture>
              )}
            </div>
          ))}
        </div>
        <div className="hero-carousel__content">{children}</div>
      </div>
      <div className="hero-carousel__controls">
        <button type="button" className="hero-carousel__button" aria-label="Previous slide" onClick={() => go(index - 1)}>‹</button>
        <div className="hero-carousel__dots">
          {slides.map((slide, i) => (
            <button
              key={slide.n}
              type="button"
              className="hero-carousel__dot"
              aria-label={`Show slide ${i + 1} of ${total}`}
              aria-current={i === index}
              onClick={() => go(i)}
            />
          ))}
        </div>
        <button type="button" className="hero-carousel__button" aria-label="Next slide" onClick={() => go(index + 1)}>›</button>
        <button
          type="button"
          className="hero-carousel__button hero-carousel__pause"
          aria-label={playing ? 'Pause slideshow' : 'Play slideshow'}
          onClick={() => setChoice(!playing)}
        >
          {playing ? 'Pause' : 'Play'}
        </button>
      </div>
    </div>
  );
}
