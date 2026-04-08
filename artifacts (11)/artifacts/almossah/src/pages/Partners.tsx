import { useState } from "react";
import { useListPartners, useListSlides } from "@workspace/api-client-react";
import { motion, AnimatePresence } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Play, ExternalLink } from "lucide-react";

export default function Partners() {
  const { data: partnersList } = useListPartners();
  const { data: slides } = useListSlides();
  const [filter, setFilter] = useState<string>("all");

  const filters = [
    { id: "all", label: "الكل" },
    { id: "university", label: "جامعات" },
    { id: "institute", label: "معاهد" },
    { id: "company", label: "شركات" },
    { id: "organization", label: "منظمات" },
  ];

  const filteredPartners = filter === "all"
    ? (partnersList || [])
    : (partnersList || []).filter((p) => p.type === filter);

  const videoSlides = slides?.filter(s => s.type === "video") ?? [];
  const imageSlides = slides?.filter(s => s.type === "image") ?? [];

  return (
    <div className="flex flex-col min-h-screen" dir="rtl">

      {/* ── Hero ─────────────────────────────────────────────── */}
      <section className="relative bg-gradient-to-br from-[#8B0000] via-[#7A0000] to-[#2D5A27] text-white py-24 overflow-hidden">
        <div className="absolute inset-0 opacity-5"
          style={{ backgroundImage: "url('https://www.transparenttextures.com/patterns/arabesque.png')" }} />
        <div className="absolute inset-0 opacity-[0.07]" style={{
          backgroundImage: `repeating-linear-gradient(90deg, transparent 0, transparent 59px, rgba(255,255,255,0.4) 59px, rgba(255,255,255,0.4) 60px),
            repeating-linear-gradient(0deg, transparent 0, transparent 29px, rgba(255,255,255,0.4) 29px, rgba(255,255,255,0.4) 30px)`,
          backgroundSize: "60px 30px",
        }} />
        <div className="relative z-10 container mx-auto px-4 text-center">
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.6 }}>
            <div className="w-14 h-1 bg-white/50 mx-auto mb-6 rounded" />
            <h1 className="text-4xl md:text-5xl font-black mb-5">شركاء النجاح</h1>
            <p className="text-xl text-white/85 max-w-2xl mx-auto leading-relaxed">
              نعتز بشراكاتنا الاستراتيجية مع نخبة من المؤسسات الأكاديمية والطبية والتجارية التي تساهم معنا في تقديم أفضل الخدمات.
            </p>
          </motion.div>
        </div>
        {/* Wave bottom */}
        <div className="absolute bottom-0 left-0 right-0">
          <svg viewBox="0 0 1440 50" className="w-full" preserveAspectRatio="none" style={{ height: 40, display: "block" }}>
            <path d="M0,0 C480,50 960,50 1440,0 L1440,50 L0,50 Z" fill="white" />
          </svg>
        </div>
      </section>

      {/* ── Animated Logo Marquee (two rows) ─────────────────── */}
      <section className="py-16 bg-white overflow-hidden">
        <div className="container mx-auto px-4 text-center mb-10">
          <h2 className="text-2xl font-black text-gray-900 mb-2">شعارات شركائنا</h2>
          <div className="w-12 h-1 bg-primary mx-auto rounded" />
        </div>

        {/* Row 1 — left to right */}
        <div className="relative flex overflow-hidden mb-4 py-2">
          <div className="flex gap-5 animate-[marquee_22s_linear_infinite] shrink-0">
            {[...(partnersList || []), ...(partnersList || []), ...(partnersList || [])].slice(0, 20).map((p, i) => (
              <PartnerCard key={`row1a-${i}`} partner={p} />
            ))}
          </div>
          <div className="flex gap-5 animate-[marquee_22s_linear_infinite] shrink-0" aria-hidden>
            {[...(partnersList || []), ...(partnersList || []), ...(partnersList || [])].slice(0, 20).map((p, i) => (
              <PartnerCard key={`row1b-${i}`} partner={p} />
            ))}
          </div>
        </div>

        {/* Row 2 — right to left (reverse) */}
        <div className="relative flex overflow-hidden py-2">
          <div className="flex gap-5 animate-[marqueeReverse_28s_linear_infinite] shrink-0">
            {[...(partnersList || []), ...(partnersList || []), ...(partnersList || [])].slice(0, 20).reverse().map((p, i) => (
              <PartnerCard key={`row2a-${i}`} partner={p} />
            ))}
          </div>
          <div className="flex gap-5 animate-[marqueeReverse_28s_linear_infinite] shrink-0" aria-hidden>
            {[...(partnersList || []), ...(partnersList || []), ...(partnersList || [])].slice(0, 20).reverse().map((p, i) => (
              <PartnerCard key={`row2b-${i}`} partner={p} />
            ))}
          </div>
        </div>
      </section>

      {/* ── Video / Image Gallery ─────────────────────────────── */}
      {(videoSlides.length > 0 || imageSlides.length > 0) && (
        <section className="py-16 bg-gray-50 border-y border-gray-100">
          <div className="container mx-auto px-4">
            <div className="text-center mb-12">
              <h2 className="text-3xl font-black text-gray-900 mb-3">قصص نجاح وإنجازات</h2>
              <div className="w-14 h-1 bg-primary mx-auto rounded" />
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {videoSlides.map((slide, i) => (
                <motion.div key={slide.id}
                  initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }} transition={{ delay: i * 0.1 }}
                  className="rounded-2xl overflow-hidden shadow-sm border border-gray-100 bg-white group"
                >
                  <div className="relative" style={{ aspectRatio: "16/9" }}>
                    <iframe src={slide.url} className="w-full h-full" allowFullScreen title={slide.title}
                      allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture" />
                  </div>
                  <div className="p-4">
                    <h3 className="font-bold text-gray-900">{slide.title}</h3>
                    {slide.subtitle && <p className="text-gray-500 text-sm mt-1">{slide.subtitle}</p>}
                  </div>
                </motion.div>
              ))}
              {imageSlides.map((slide, i) => (
                <motion.div key={slide.id}
                  initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }} transition={{ delay: (videoSlides.length + i) * 0.1 }}
                  className="rounded-2xl overflow-hidden shadow-sm border border-gray-100 group cursor-pointer"
                >
                  <div className="relative" style={{ aspectRatio: "16/9" }}>
                    <img src={slide.url} alt={slide.title} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
                    <div className="absolute bottom-0 p-4 text-white opacity-0 group-hover:opacity-100 transition-opacity">
                      <h3 className="font-bold">{slide.title}</h3>
                    </div>
                  </div>
                </motion.div>
              ))}

              {/* Default video if no admin slides */}
              {videoSlides.length === 0 && imageSlides.length === 0 && (
                <div className="md:col-span-2 lg:col-span-3">
                  <div className="relative rounded-2xl overflow-hidden shadow-lg group cursor-pointer h-96">
                    <img src="https://images.unsplash.com/photo-1517245386807-bb43f82c33c4?auto=format&fit=crop&q=80" alt="" className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700" />
                    <div className="absolute inset-0 bg-black/40 flex items-center justify-center">
                      <div className="w-20 h-20 rounded-full bg-primary/90 text-white flex items-center justify-center group-hover:scale-110 transition-transform shadow-lg">
                        <Play size={36} className="mr-1" />
                      </div>
                    </div>
                    <div className="absolute bottom-0 p-6 bg-gradient-to-t from-black/80 to-transparent text-white w-full">
                      <h3 className="text-xl font-bold mb-1">فيلم وثائقي: مسيرة المؤسسة الوطنية</h3>
                      <p className="text-white/75 text-sm">شاهد أهم إنجازات المؤسسة وشراكاتها الاستراتيجية</p>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
        </section>
      )}

      {/* ── Partners Grid with filter ─────────────────────────── */}
      <section className="py-16 bg-white">
        <div className="container mx-auto px-4">
          <div className="text-center mb-10">
            <h2 className="text-3xl font-black text-gray-900 mb-3">جميع شركاء النجاح</h2>
            <div className="w-14 h-1 bg-primary mx-auto rounded" />
          </div>

          {/* Filter tabs */}
          <div className="flex flex-wrap justify-center gap-2 mb-10">
            {filters.map(f => (
              <button key={f.id}
                onClick={() => setFilter(f.id)}
                className={`px-5 py-2 rounded-full font-semibold text-sm transition-all ${filter === f.id
                  ? "bg-primary text-white shadow-lg shadow-primary/20"
                  : "bg-gray-100 text-gray-600 hover:bg-gray-200"
                }`}
              >
                {f.label}
              </button>
            ))}
          </div>

          <AnimatePresence mode="wait">
            <motion.div key={filter}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.3 }}
              className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-5"
            >
              {filteredPartners?.map((partner, idx) => (
                <motion.div key={partner.id}
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ delay: idx * 0.04 }}
                  className="bg-white border border-gray-100 rounded-2xl p-5 flex flex-col items-center justify-center hover:shadow-lg hover:border-primary/20 transition-all group cursor-pointer"
                >
                  <div className="h-20 w-full flex items-center justify-center mb-3 overflow-hidden">
                    <img
                      src={partner.logoUrl}
                      alt={partner.name}
                      className="max-h-full max-w-full object-contain grayscale group-hover:grayscale-0 transition-all duration-300 group-hover:scale-110"
                      onError={(e) => {
                        e.currentTarget.style.display = "none";
                        const el = e.currentTarget.parentElement;
                        if (el) el.innerHTML = `<span class="text-xs font-bold text-gray-400 text-center leading-tight">${partner.name}</span>`;
                      }}
                    />
                  </div>
                  <h3 className="text-center font-bold text-gray-700 text-xs leading-tight line-clamp-2">{partner.name}</h3>
                  {partner.website && (
                    <a href={partner.website} target="_blank" rel="noopener noreferrer"
                      className="mt-2 text-primary opacity-0 group-hover:opacity-100 transition-opacity"
                      onClick={e => e.stopPropagation()}>
                      <ExternalLink size={14} />
                    </a>
                  )}
                </motion.div>
              ))}
              {(!filteredPartners || filteredPartners.length === 0) && (
                <div className="col-span-full text-center py-20 text-gray-400">
                  لا يوجد شركاء في هذا التصنيف حالياً
                </div>
              )}
            </motion.div>
          </AnimatePresence>
        </div>
      </section>
    </div>
  );
}

function PartnerCard({ partner }: { partner: { id: number; name: string; logoUrl: string } }) {
  return (
    <div className="shrink-0 w-44 h-24 bg-white rounded-xl shadow-sm border border-gray-100 flex items-center justify-center p-4 grayscale hover:grayscale-0 hover:shadow-md hover:scale-105 transition-all opacity-70 hover:opacity-100 cursor-pointer">
      <img
        src={partner.logoUrl}
        alt={partner.name}
        className="max-w-full max-h-full object-contain"
        onError={(e) => {
          e.currentTarget.style.display = "none";
          const el = e.currentTarget.parentElement;
          if (el) el.innerHTML = `<span class="text-xs font-bold text-gray-400 text-center leading-tight">${partner.name}</span>`;
        }}
      />
    </div>
  );
}
