import {useState,useEffect,useRef,useCallback} from "react";
import {useShop} from "../store/useShop.js";
import {resolveImageUrl,fetchHeroItems} from "../api.js";

const FALLBACK_SLIDES = [
  {
    title: "Books and resources your learner unlocks",
    label: "Inside Elimu Pepe",
    description: "CBC aligned textbooks, practice guides, and revision resources.",
    badge: "30+",
    items: [
      { id: 0, title: "Mathematics Textbook Gr 5", cover_image: "/assets/profile/kids.png", brand: "KLB", category: 0 },
      { id: 1, title: "English Activities Gr 5", cover_image: "/assets/profile/kids.png", brand: "Oxford", category: 0 },
      { id: 2, title: "Integrated Science Gr 5", cover_image: "/assets/profile/kids.png", brand: "Longhorn", category: 0 },
      { id: 3, title: "Kiswahili Kitabu Gr 5", cover_image: "/assets/profile/kids.png", brand: "Moran", category: 0 },
    ]
  },
  {
    title: "Essential stationery and geometry kits",
    label: "Back to School Ready",
    description: "Everything your child needs for classwork, homework, and creative arts.",
    badge: "20+",
    items: [
      { id: 4, title: "Exercise Books 96pg A5", cover_image: "/assets/profile/kids.png", brand: "Kenafric", category: 1 },
      { id: 8, title: "Staedtler HB Pencils (12)", cover_image: "/assets/profile/kids.png", brand: "Staedtler", category: 2 },
      { id: 12, title: "Helix Oxford Geometry Set", cover_image: "/assets/profile/kids.png", brand: "Helix", category: 3 },
      { id: 16, title: "Crayola 24 Washable Crayons", cover_image: "/assets/profile/kids.png", brand: "Crayola", category: 4 },
    ]
  }
];

export default function ShowcaseCarousel() {
  const {showcaseOpen,setShowcaseOpen,products,goToProduct,select,say}=useShop();
  const [heroItems,setHeroItems]=useState([]);
  const [currentSlide,setCurrentSlide]=useState(0);
  const [isHovered,setIsHovered]=useState(false);
  const autoplayRef=useRef(null);

  useEffect(()=>{
    let mounted=true;
    fetchHeroItems().then(items=>{
      if(mounted&&Array.isArray(items)&&items.length>0){
        setHeroItems(items);
      }
    });
    return()=>{mounted=false;};
  },[]);

  // Source items: prefer heroItems from API, then products from store, then fallback
  const allItems = heroItems.length > 0
    ? heroItems
    : (products && products.length > 0 ? products : []);

  const perSlide = 4;
  const maxSlides = 5;

  const visibleItems = allItems.slice(0, perSlide * maxSlides);
  const hiddenCount = Math.max(0, allItems.length - visibleItems.length);

  const itemSlides = [];
  for (let i = 0; i < visibleItems.length; i += perSlide) {
    itemSlides.push(visibleItems.slice(i, i + perSlide));
  }

  const useItemSlides = itemSlides.length > 0;
  const slideCount = useItemSlides ? itemSlides.length : FALLBACK_SLIDES.length;

  const nextSlide = useCallback(() => {
    setCurrentSlide(prev => (prev + 1) % Math.max(1, slideCount));
  }, [slideCount]);

  const prevSlide = useCallback(() => {
    setCurrentSlide(prev => (prev - 1 + slideCount) % Math.max(1, slideCount));
  }, [slideCount]);

  useEffect(() => {
    if (!showcaseOpen || slideCount <= 1 || isHovered) {
      if (autoplayRef.current) clearInterval(autoplayRef.current);
      return;
    }
    autoplayRef.current = setInterval(nextSlide, 5000);
    return () => {
      if (autoplayRef.current) clearInterval(autoplayRef.current);
    };
  }, [showcaseOpen, slideCount, isHovered, nextSlide]);

  const handleItemClick = (item) => {
    const matched = products.find(p => (p.backendId && p.backendId === item.id) || p.id === item.id || p.name === (item.title || item.name)) || item;
    select(matched);
    if (typeof matched.category === 'number') {
      goToProduct(matched);
      say(`Walking to Aisle ${matched.category + 1} for ${matched.name || matched.title}`);
    }
    setShowcaseOpen(false);
  };

  // Minimized pill button inside 3D store
  if (!showcaseOpen) {
    return (
      <button
        className="showcase-pill-btn glass"
        onClick={() => setShowcaseOpen(true)}
        aria-label="Open Books Showcase"
      >
        <span className="sparkle">✨</span>
        <b>Inside Elimu Pepe</b>
        <span className="pill-badge">{allItems.length > 0 ? `${allItems.length}+` : "Showcase"}</span>
      </button>
    );
  }

  return (
    <div className="showcase-overlay" role="dialog" aria-modal="true" aria-label="Inside Elimu Pepe Showcase">
      <div
        id="subscription-hero-carousel"
        className="hero-showcase-carousel showcase-in-store glass"
        onMouseEnter={() => setIsHovered(true)}
        onMouseLeave={() => setIsHovered(false)}
      >
        <button
          className="showcase-close-btn"
          onClick={() => setShowcaseOpen(false)}
          aria-label="Close Showcase"
        >
          ✕
        </button>

        <div className="hero-carousel-slides-wrapper">
          {useItemSlides ? (
            itemSlides.map((group, slideIndex) => {
              const isActive = slideIndex === currentSlide;
              const isLastSlide = slideIndex === itemSlides.length - 1;

              return (
                <article
                  key={`slide-${slideIndex}`}
                  className={`hero-carousel-slide ${isActive ? "active" : ""}`}
                >
                  <div className="hero-carousel-visual">
                    <span className="hero-carousel-visual__badge">
                      {String(slideIndex + 1).padStart(2, "0")}/{String(slideCount).padStart(2, "0")}
                    </span>
                    <div className="hero-carousel-visual__glow hero-carousel-visual__glow--one" />
                    <div className="hero-carousel-visual__glow hero-carousel-visual__glow--two" />

                    <div className={`hero-items-grid hero-items-grid--${group.length}`}>
                      {group.map((item, itemIdx) => {
                        const isLastInGroup = itemIdx === group.length - 1;
                        const showMore = isLastSlide && isLastInGroup && hiddenCount > 0;
                        const imgSrc = resolveImageUrl(item.cover_image || item.image_url || item.image);

                        return (
                          <figure
                            key={`item-${item.id || itemIdx}`}
                            className="hero-item"
                            onClick={() => handleItemClick(item)}
                            title={`${item.title || item.name} (Click to inspect in 3D store)`}
                          >
                            <img
                              src={imgSrc}
                              alt={item.title || item.name}
                              loading="lazy"
                              onError={(e) => {
                                e.currentTarget.onerror = null;
                                e.currentTarget.src = "/assets/profile/kids.png";
                              }}
                            />
                            <figcaption>
                              {(item.title || item.name || "").length > 28
                                ? (item.title || item.name || "").substring(0, 28) + "…"
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
                      <p className="hero-showcase-sub">
                        Click any cover to teleport directly to that aisle and shelf inside the 3D bookshop.
                      </p>
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
          ) : (
            FALLBACK_SLIDES.map((slide, slideIndex) => {
              const isActive = slideIndex === currentSlide;

              return (
                <article
                  key={`fallback-slide-${slideIndex}`}
                  className={`hero-carousel-slide ${isActive ? "active" : ""}`}
                >
                  <div className="hero-carousel-visual">
                    <span className="hero-carousel-visual__badge">
                      {String(slideIndex + 1).padStart(2, "0")}/{String(slideCount).padStart(2, "0")}
                    </span>
                    <div className="hero-carousel-visual__glow hero-carousel-visual__glow--one" />
                    <div className="hero-carousel-visual__glow hero-carousel-visual__glow--two" />

                    <div className="hero-items-grid hero-items-grid--4">
                      {slide.items.map((it, idx) => (
                        <figure
                          key={`fallback-item-${idx}`}
                          className="hero-item"
                          onClick={() => handleItemClick(it)}
                        >
                          <img
                            src={it.cover_image}
                            alt={it.title}
                            loading="lazy"
                            onError={(e) => {
                              e.currentTarget.onerror = null;
                              e.currentTarget.src = "/assets/profile/kids.png";
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
                      <p className="hero-showcase-sub">{slide.description}</p>
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
                className={`hero-carousel-dot ${idx === currentSlide ? "active" : ""}`}
                onClick={() => setCurrentSlide(idx)}
                aria-label={`Go to slide ${idx + 1}`}
              />
            ))}
          </div>

          <div className="hero-carousel-controls">
            <span className="hero-carousel-counter">
              {String(currentSlide + 1).padStart(2, "0")} /{" "}
              <span id="hero-carousel-total">{String(slideCount).padStart(2, "0")}</span>
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
    </div>
  );
}
