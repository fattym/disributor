"use client";

import { useEffect, useRef } from "react";

const GAP = 8;
// Things the bubble must never sit on: everything tappable, the slide picture and the hero words.
const KEEP_CLEAR = "a[href], button, input, select, textarea, .hero-carousel__frame, .home-hero h1, .home-hero p, .grades__title, .grades__group";

/** Floating WhatsApp link: stays in the corner, moves up past anything tappable, hides if there is no free spot. */
export default function WhatsAppBubble() {
  const ref = useRef<HTMLAnchorElement>(null);

  useEffect(() => {
    const bubble = ref.current;
    if (!bubble) return;
    let frame = 0;
    const place = () => {
      frame = 0;
      bubble.style.transform = "";
      bubble.style.visibility = "";
      const home = bubble.getBoundingClientRect();
      const boxes = [...document.querySelectorAll(KEEP_CLEAR)]
        .filter((el) => el !== bubble && getComputedStyle(el).visibility !== "hidden")
        .map((el) => el.getBoundingClientRect())
        .filter((b) => b.width > 0 && b.right > home.left - GAP && b.left < home.right + GAP)
        .sort((a, b) => b.bottom - a.bottom); // lowest first, so one upward pass is enough
      let top = home.top;
      for (const b of boxes) {
        if (b.top < top + home.height + GAP && b.bottom > top - GAP) top = b.top - GAP - home.height;
      }
      if (top < window.innerHeight / 2) bubble.style.visibility = "hidden";
      else if (top < home.top) bubble.style.transform = `translateY(${top - home.top}px)`;
    };
    const schedule = () => { if (!frame) frame = requestAnimationFrame(place); };
    const resized = new ResizeObserver(schedule);
    resized.observe(document.body);
    window.addEventListener("scroll", schedule, { passive: true });
    window.addEventListener("resize", schedule);
    schedule();
    return () => {
      cancelAnimationFrame(frame);
      resized.disconnect();
      window.removeEventListener("scroll", schedule);
      window.removeEventListener("resize", schedule);
    };
  }, []);

  return (
    <a ref={ref} className="home-whatsapp" href="https://wa.me/254716815025" target="_blank" rel="noopener noreferrer" aria-label="Chat with us on WhatsApp">
      <svg viewBox="0 0 32 32" aria-hidden="true">
        <path d="M16.02 3.2a12.5 12.5 0 0 0-10.7 18.96L3.7 28.8l6.8-1.78A12.5 12.5 0 1 0 16.02 3.2Z" />
        <path d="M12.18 9.7c-.38-.84-.78-.85-1.15-.87h-.98c-.34 0-.9.13-1.38.66-.48.53-1.82 1.78-1.82 4.34s1.86 5.03 2.12 5.38c.27.35 3.6 5.77 8.9 7.86 4.4 1.73 5.3 1.39 6.25 1.3.96-.09 3.1-1.26 3.54-2.47.43-1.22.43-2.27.3-2.49-.13-.22-.48-.35-1-.62-.53-.26-3.1-1.53-3.58-1.7-.48-.18-.83-.27-1.18.26-.35.52-1.35 1.7-1.66 2.05-.3.35-.61.4-1.13.13-.53-.26-2.22-.82-4.24-2.62-1.57-1.4-2.63-3.13-2.94-3.66-.3-.52-.03-.81.23-1.07.23-.23.53-.61.79-.92.26-.31.35-.53.53-.88.17-.35.08-.66-.05-.92-.13-.27-1.15-2.84-1.55-3.87Z" />
      </svg>
      <span className="home-whatsapp__badge" aria-hidden="true" />
    </a>
  );
}
