import Link from "next/link";

const levels = [
  { title: "Pre-Primary & ECDE", sub: "Playgroup · PP1 · PP2" },
  { title: "CBC Primary", sub: "Grade 1 - Grade 6" },
  { title: "CBC Junior Secondary", sub: "Grade 7 - Grade 9" },
  { title: "CBC Senior Secondary", sub: "Grade 10 - Grade 12" },
  { title: "Secondary & KCSE", sub: "Form 1 - Form 4 · Set Books" },
  { title: "Stationery & Supplies", sub: "Books · Pens · Math Sets" },
];

const products = [
  { cat: "CBC Primary", title: "English Activity Book Grade 3", pub: "KLB", price: "KSh 450", old: "KSh 550", save: "KSh 100", grade: "Grade 3" },
  { cat: "CBC Junior", title: "Mathematics Learner's Book Grade 7", pub: "Longhorn", price: "KSh 680", old: "KSh 780", save: "KSh 100", grade: "Grade 7" },
  { cat: "Set Books", title: "The River and the Source", pub: "Oxford", price: "KSh 950", old: "KSh 1,100", save: "KSh 150", grade: "Form 2" },
  { cat: "Stationery", title: "Math Set + Geometry Box", pub: "Mentor", price: "KSh 320", old: "KSh 400", save: "KSh 80", grade: "All" },
];

const testimonials = [
  { name: "Wanjiku M.", role: "Parent, Nairobi", text: "Found every book on my daughter's list in one place. Delivery was fast and the books were genuine." },
  { name: "Mr. Otieno", role: "Head Teacher, Kisumu", text: "Bulk ordering for our school is now painless. Quotes arrive quickly and delivery is always on schedule." },
  { name: "Amina H.", role: "Teacher, Mombasa", text: "Great prices on CBC titles and the WhatsApp support is incredibly responsive." },
];

const publishers = ["Kenya Literature Bureau (KLB)", "Longhorn Publishers", "Oxford University Press", "Moran Publishers", "Spotlight Publishers", "Mentor Publishers", "Cambridge University Press"];

export default function HomeCBCSections() {
  return (
    <>
      {/* Section A: Shop By Level */}
      <section className="py-16 bg-white">
        <div className="mx-auto max-w-[1180px] px-4">
          <div className="flex items-center justify-between mb-8">
            <div>
              <p className="text-xs font-semibold text-gray-400 tracking-widest uppercase">Shop By Level</p>
              <h2 className="text-2xl md:text-3xl font-bold">Built around Kenya's CBC structure</h2>
            </div>
            <Link href="/shop" className="rounded-full border border-gray-300 px-4 py-2 text-sm font-medium hover:bg-gray-50">View all categories →</Link>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {levels.map((l) => (
              <a key={l.title} href="/shop" className="rounded-xl border border-gray-200 p-5 hover:shadow-md transition">
                <h3 className="font-semibold text-[#0F172A]">{l.title}</h3>
                <p className="text-sm text-gray-500 mt-1">{l.sub}</p>
              </a>
            ))}
          </div>
        </div>
      </section>

      {/* Section B: Bestsellers */}
      <section className="py-16 bg-[#F8FAFC]">
        <div className="mx-auto max-w-[1180px] px-4">
          <div className="flex items-center justify-between mb-8">
            <div>
              <p className="text-xs font-semibold text-gray-400 tracking-widest uppercase">Bestsellers</p>
              <h2 className="text-2xl md:text-3xl font-bold">Most loved by parents & teachers</h2>
            </div>
            <Link href="/shop" className="text-sm font-medium text-[#E53900]">View all products</Link>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {products.map((p) => (
              <div key={p.title} className="bg-white rounded-xl border border-gray-200 p-4 relative">
                <button className="absolute top-3 right-3 w-8 h-8 rounded-full bg-white shadow flex items-center justify-center">♡</button>
                <div className="flex gap-2 mb-3">
                  <span className="text-xs bg-gray-100 rounded px-2 py-1">{p.grade}</span>
                  <span className="text-xs bg-[#FDB813] text-black rounded px-2 py-1 font-semibold">Save {p.save}</span>
                </div>
                <p className="text-xs text-gray-500">{p.cat}</p>
                <h3 className="font-semibold text-sm mt-1">{p.title}</h3>
                <p className="text-xs text-gray-500">{p.pub}</p>
                <div className="mt-2 flex items-center gap-2">
                  <span className="font-bold text-[#E53900]">{p.price}</span>
                  <span className="text-xs text-gray-400 line-through">{p.old}</span>
                </div>
                <div className="mt-3 flex gap-2">
                  <button className="flex-1 bg-[#0F172A] text-white text-sm rounded-lg py-2">Add to cart</button>
                  <a href="https://wa.me/254716815025" className="w-10 h-10 rounded-lg bg-[#25D366] flex items-center justify-center text-white">W</a>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Section D: Trusted Publishers */}
      <section className="py-10 bg-white">
        <div className="mx-auto max-w-[1180px] px-4 text-center">
          <p className="text-xs font-semibold text-gray-400 tracking-widest uppercase mb-4">Trusted Publishers We Stock</p>
          <div className="flex flex-wrap justify-center gap-x-6 gap-y-2 text-sm text-gray-600">
            {publishers.map((p) => <span key={p}>{p}</span>)}
          </div>
        </div>
      </section>

      {/* Section E: Testimonials */}
      <section className="py-16 bg-[#F8FAFC]">
        <div className="mx-auto max-w-[1180px] px-4">
          <div className="text-center mb-8">
            <p className="text-xs font-semibold text-gray-400 tracking-widest uppercase">Loved By Families & Schools</p>
            <h2 className="text-2xl md:text-3xl font-bold">What our customers say</h2>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {testimonials.map((t) => (
              <div key={t.name} className="rounded-xl border border-gray-200 bg-white p-6">
                <div className="text-[#FDB813] mb-3">★★★★★</div>
                <p className="text-sm text-gray-700 mb-4">"{t.text}"</p>
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-[#0F172A] text-white flex items-center justify-center font-bold">{t.name[0]}</div>
                  <div>
                    <div className="font-semibold text-sm">{t.name}</div>
                    <div className="text-xs text-gray-500">{t.role}</div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Section C: Bulk orders */}
      <section className="py-16 bg-white">
        <div className="mx-auto max-w-[1180px] px-4">
          <div className="rounded-2xl p-8 md:p-12 text-white grid md:grid-cols-2 gap-8" style={{ background: "#0F172A", borderRadius: 16 }}>
            <div>
              <span className="inline-block bg-white/10 rounded-full px-3 py-1 text-xs mb-4">🏫 SCHOOLS & TEACHERS</span>
              <h2 className="text-2xl md:text-3xl font-bold mb-3">Bulk school orders, made simple</h2>
              <p className="text-white/80 mb-6">Send us your school booklist and we'll prepare a quote, source every title and deliver on schedule — term after term.</p>
              <div className="flex flex-wrap gap-3">
                <a href="https://wa.me/254716815025" className="bg-[#25D366] text-white px-5 py-3 rounded-lg font-semibold">Request a Quote on WhatsApp</a>
                <span className="border border-white/30 px-5 py-3 rounded-lg">+254 716 815 025</span>
              </div>
            </div>
            <div className="grid grid-cols-3 gap-4">
              {[
                { v: "10,000+", l: "Titles stocked" },
                { v: "48hrs", l: "Nairobi delivery" },
                { v: "300+", l: "Schools served" },
              ].map((s) => (
                <div key={s.l} className="bg-white/10 backdrop-blur rounded-xl p-4 text-center">
                  <div className="text-xl font-bold">{s.v}</div>
                  <div className="text-xs text-white/70 mt-1">{s.l}</div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>
    </>
  );
}
