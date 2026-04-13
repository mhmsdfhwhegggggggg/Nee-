import { Link } from "wouter";
import { motion, AnimatePresence, useScroll, useTransform } from "framer-motion";
import {
  BookOpen, HeartPulse, ChevronRight, ChevronLeft,
  GraduationCap, Stethoscope, ArrowLeft, CheckCircle2, Star,
} from "lucide-react";
import { useGetStats, useListNews, useListPartners, useListSlides } from "@workspace/api-client-react";
import { useState, useEffect, useRef } from "react";

/* ── Animated counter ──────────────────────────────────────── */
function CountUp({ target, delay = 0 }: { target: number; delay?: number }) {
  const [count, setCount] = useState(0);
  const ref = useRef<HTMLDivElement>(null);
  const started = useRef(false);
  useEffect(() => {
    const observer = new IntersectionObserver(([e]) => {
      if (e.isIntersecting && !started.current) {
        started.current = true;
        const steps = 60;
        let i = 0;
        setTimeout(() => {
          const iv = setInterval(() => {
            i++;
            setCount(Math.min(Math.round((target / steps) * i), target));
            if (i >= steps) clearInterval(iv);
          }, 2000 / steps);
        }, delay);
      }
    }, { threshold: 0.3 });
    if (ref.current) observer.observe(ref.current);
    return () => observer.disconnect();
  }, [target, delay]);
  return <div ref={ref}>{count.toLocaleString("ar-EG")}</div>;
}

/* ── Slide indicator ───────────────────────────────────────── */
function SlideDots({ total, current, onChange }: { total: number; current: number; onChange: (i: number) => void }) {
  return (
    <div className="flex gap-2 items-center">
      {Array.from({ length: total }).map((_, i) => (
        <button key={i} onClick={() => onChange(i)}
          className={`transition-all duration-300 rounded-full ${i === current ? "w-7 h-2.5 bg-white" : "w-2.5 h-2.5 bg-white/40 hover:bg-white/60"}`} />
      ))}
    </div>
  );
}

export default function Home() {
  const { data: stats } = useGetStats();
  const { data: newsList } = useListNews({ limit: 3 });
  const { data: partnersList } = useListPartners();
  const { data: slides } = useListSlides();

  const [heroSlide, setHeroSlide] = useState(0);
  const heroRef = useRef<HTMLElement>(null);
  const { scrollYProgress } = useScroll({ target: heroRef, offset: ["start start", "end start"] });
  const heroY = useTransform(scrollYProgress, [0, 1], ["0%", "30%"]);

  const defaultSlides = [
    {
      url: "https://images.unsplash.com/photo-1541339907198-e08756dedf3f?auto=format&fit=crop&q=80&w=1920",
      title: "نبني الإنسان",
      title2: "لنعمر الأوطان",
      subtitle: "المؤسسة الوطنية للتنمية الشاملة — خدمات تعليمية وصحية لكل يمني",
    },
    {
      url: "https://images.unsplash.com/photo-1523050854058-8df90110c9f1?auto=format&fit=crop&q=80&w=1920",
      title: "التعليم",
      title2: "أساس النهضة",
      subtitle: "منح دراسية وتخفيضات جامعية حصرية لأبناء اليمن",
    },
    {
      url: "https://images.unsplash.com/photo-1576091160399-112ba8d25d1d?auto=format&fit=crop&q=80&w=1920",
      title: "صحتكم",
      title2: "أمانة في أعناقنا",
      subtitle: "تأمين صحي شامل وخدمات طبية متكاملة بأسعار ميسورة",
    },
  ];

  const heroItems = (slides && slides.filter(s => s.type === "image").length > 0)
    ? slides.filter(s => s.type === "image").map(s => ({
        url: s.url,
        title: s.title,
        title2: "",
        subtitle: s.subtitle ?? "",
      }))
    : defaultSlides;

  useEffect(() => {
    if (heroItems.length <= 1) return;
    const t = setInterval(() => setHeroSlide(p => (p + 1) % heroItems.length), 6000);
    return () => clearInterval(t);
  }, [heroItems.length]);

  const statsData = [
    { value: stats?.yearsExperience ?? 12, suffix: "+", label: "سنة من العطاء" },
    { value: stats?.beneficiaries ?? 15000, suffix: "+", label: "مستفيد ومستفيدة" },
    { value: stats?.universities ?? 35, suffix: "", label: "جامعة ومعهد شريك" },
    { value: stats?.partners ?? 48, suffix: "+", label: "شريك نجاح" },
  ];

  return (
    <div className="flex flex-col bg-[#F8F5F0]" dir="rtl">

      {/* ═══════════════════════════════════════════════════════════
          1 · HERO — cinematic full-screen slider
      ═══════════════════════════════════════════════════════════ */}
      <section ref={heroRef} className="relative h-screen min-h-[600px] max-h-[920px] overflow-hidden">
        {/* Parallax image */}
        <AnimatePresence mode="wait">
          <motion.div key={heroSlide} className="absolute inset-0 z-0"
            initial={{ opacity: 0, scale: 1.08 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 1.2, ease: "easeInOut" }}
          >
            <motion.img
              src={heroItems[heroSlide]?.url}
              alt=""
              className="w-full h-full object-cover"
              style={{ y: heroY }}
            />
          </motion.div>
        </AnimatePresence>

        {/* Multi-layer overlays for depth */}
        <div className="absolute inset-0 z-[1]" style={{
          background: "linear-gradient(to bottom, rgba(0,0,0,0.35) 0%, rgba(0,0,0,0.15) 40%, rgba(0,0,0,0.65) 100%)"
        }} />
        <div className="absolute inset-0 z-[2]" style={{
          background: "linear-gradient(to left, rgba(196,30,36,0.45) 0%, transparent 65%)"
        }} />

        {/* Vertical text side accent */}
        <div className="absolute right-8 top-1/2 -translate-y-1/2 z-[15] hidden xl:flex flex-col items-center gap-3 opacity-40">
          <div className="w-px h-16 bg-white" />
          <span className="text-white text-[10px] tracking-[0.3em] writing-mode-vertical rotate-180" style={{ writingMode: "vertical-rl" }}>
            المؤسسة الوطنية ٢٠٢٦
          </span>
          <div className="w-px h-16 bg-white" />
        </div>

        {/* Hero content */}
        <div className="absolute inset-0 z-10 flex flex-col justify-center md:justify-end md:pb-28">
          <div className="container mx-auto px-6 md:px-10">
            <AnimatePresence mode="wait">
              <motion.div key={heroSlide}
                initial={{ opacity: 0, y: 50 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                transition={{ duration: 0.7, ease: [0.22, 1, 0.36, 1] }}
                className="max-w-3xl"
              >
                {/* Tag */}
                <motion.div
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.1 }}
                  className="inline-flex items-center gap-2 bg-white/10 backdrop-blur-sm border border-white/20 rounded-full px-4 py-1.5 mb-6"
                >
                  <div className="w-2 h-2 rounded-full bg-red-400 animate-pulse" />
                  <span className="text-white/90 text-xs font-semibold tracking-wider">المؤسسة الوطنية للتنمية الشاملة</span>
                </motion.div>

                {/* Main title */}
                <motion.h1
                  initial={{ opacity: 0, y: 30 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.2 }}
                  className="text-5xl sm:text-6xl md:text-7xl lg:text-8xl font-black text-white leading-[1.05] mb-2 drop-shadow-2xl"
                >
                  {heroItems[heroSlide]?.title}
                </motion.h1>
                {heroItems[heroSlide]?.title2 && (
                  <motion.h1
                    initial={{ opacity: 0, y: 30 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.32 }}
                    className="text-5xl sm:text-6xl md:text-7xl lg:text-8xl font-black leading-[1.05] mb-6 drop-shadow-2xl"
                    style={{ color: "#FFD700" }}
                  >
                    {heroItems[heroSlide]?.title2}
                  </motion.h1>
                )}

                {/* Sub */}
                <motion.p
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ delay: 0.45 }}
                  className="text-white/80 text-lg md:text-xl mb-10 max-w-xl leading-relaxed"
                >
                  {heroItems[heroSlide]?.subtitle}
                </motion.p>

                {/* Buttons */}
                <motion.div
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.55 }}
                  className="flex flex-wrap gap-4"
                >
                  <Link href="/register">
                    <button className="group bg-[#C41E24] hover:bg-[#700000] text-white font-black text-base px-9 h-14 rounded-full shadow-2xl shadow-red-900/40 hover:shadow-red-900/60 transition-all hover:scale-[1.02] active:scale-95">
                      سجّل الآن
                      <span className="inline-block mr-2 group-hover:translate-x-[-3px] transition-transform">←</span>
                    </button>
                  </Link>
                  <Link href="/about">
                    <button className="bg-white/10 hover:bg-white/20 backdrop-blur-sm border border-white/30 text-white font-semibold text-base px-9 h-14 rounded-full transition-all hover:scale-[1.02]">
                      اكتشف المؤسسة
                    </button>
                  </Link>
                </motion.div>
              </motion.div>
            </AnimatePresence>
          </div>
        </div>

        {/* Bottom controls */}
        <div className="absolute bottom-8 left-0 right-0 z-20 container mx-auto px-10 flex justify-between items-center">
          <SlideDots total={heroItems.length} current={heroSlide} onChange={setHeroSlide} />
          {heroItems.length > 1 && (
            <div className="flex gap-2">
              <button onClick={() => setHeroSlide(p => (p - 1 + heroItems.length) % heroItems.length)}
                className="w-11 h-11 rounded-full bg-white/10 hover:bg-white/25 border border-white/20 text-white flex items-center justify-center transition-all backdrop-blur-sm">
                <ChevronRight size={20} />
              </button>
              <button onClick={() => setHeroSlide(p => (p + 1) % heroItems.length)}
                className="w-11 h-11 rounded-full bg-white/10 hover:bg-white/25 border border-white/20 text-white flex items-center justify-center transition-all backdrop-blur-sm">
                <ChevronLeft size={20} />
              </button>
            </div>
          )}
        </div>
      </section>

      {/* ═══════════════════════════════════════════════════════════
          2 · QUICK STATS STRIP
      ═══════════════════════════════════════════════════════════ */}
      <section className="bg-[#C41E24] text-white">
        <div className="container mx-auto px-6">
          <div className="grid grid-cols-2 md:grid-cols-4 divide-x divide-x-reverse divide-white/10">
            {statsData.map((s, i) => (
              <motion.div key={i}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.1 }}
                className="py-8 px-6 text-center"
              >
                <div className="text-4xl md:text-5xl font-black tabular-nums flex items-end justify-center gap-0.5 leading-none mb-2">
                  <CountUp target={s.value} delay={i * 100} />
                  <span className="text-yellow-300 text-3xl">{s.suffix}</span>
                </div>
                <div className="text-white/70 text-sm font-medium">{s.label}</div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* ═══════════════════════════════════════════════════════════
          3 · TWO SERVICES — Education & Health Insurance
      ═══════════════════════════════════════════════════════════ */}
      <section className="py-24 bg-[#F8F5F0]">
        <div className="container mx-auto px-6">
          {/* Section header */}
          <div className="text-center mb-16">
            <motion.span
              initial={{ opacity: 0 }}
              whileInView={{ opacity: 1 }}
              viewport={{ once: true }}
              className="inline-block text-[#C41E24] font-bold text-xs tracking-[0.25em] uppercase mb-4 border border-[#C41E24]/30 rounded-full px-4 py-1"
            >
              ماذا نقدم
            </motion.span>
            <motion.h2
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: 0.1 }}
              className="text-4xl md:text-5xl font-black text-gray-900 leading-tight"
            >
              خدماتنا الرئيسية
            </motion.h2>
            <motion.div
              initial={{ scaleX: 0 }}
              whileInView={{ scaleX: 1 }}
              viewport={{ once: true }}
              transition={{ delay: 0.3 }}
              className="w-16 h-1 bg-[#C41E24] mx-auto rounded-full mt-5 origin-center"
            />
          </div>

          {/* Two service pillars */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">

            {/* Service 1 — Education */}
            <motion.div
              initial={{ opacity: 0, y: 40 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.7, ease: [0.22, 1, 0.36, 1] }}
              className="group relative rounded-3xl overflow-hidden min-h-[520px] flex flex-col justify-end cursor-pointer"
            >
              {/* Background image */}
              <div className="absolute inset-0">
                <img
                  src="https://images.unsplash.com/photo-1523050854058-8df90110c9f1?auto=format&fit=crop&q=80&w=900"
                  alt="الخدمات التعليمية"
                  className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-[#1a0000] via-[#3a0000]/60 to-transparent" />
              </div>

              {/* Content */}
              <div className="relative z-10 p-9">
                <div className="w-14 h-14 rounded-2xl bg-white/15 backdrop-blur-sm border border-white/20 flex items-center justify-center mb-6 group-hover:bg-[#C41E24] transition-colors duration-300">
                  <GraduationCap size={28} className="text-white" />
                </div>
                <div className="text-white/60 text-xs font-bold tracking-widest uppercase mb-2">الخدمة الأولى</div>
                <h3 className="text-3xl md:text-4xl font-black text-white mb-4 leading-tight">
                  الخدمات<br />التعليمية
                </h3>
                <p className="text-white/75 text-base leading-relaxed mb-7 max-w-sm">
                  منح دراسية وتخفيضات جامعية حصرية بالشراكة مع أكثر من ٣٥ جامعة ومعهداً معتمداً، لتمكين أبناء اليمن من مواصلة مسيرتهم التعليمية.
                </p>
                <div className="flex flex-col gap-2.5 mb-8">
                  {["منح دراسية كاملة وجزئية", "تخفيضات حتى 70% على الرسوم الجامعية", "شراكات مع جامعات حكومية وخاصة"].map(f => (
                    <div key={f} className="flex items-center gap-2 text-white/80 text-sm">
                      <CheckCircle2 size={15} className="text-yellow-400 shrink-0" />
                      {f}
                    </div>
                  ))}
                </div>
                <Link href="/services#education">
                  <button className="group/btn flex items-center gap-2 bg-white text-[#C41E24] font-black text-sm px-7 h-11 rounded-full hover:bg-yellow-400 hover:text-gray-900 transition-all duration-200">
                    اعرف التفاصيل
                    <ArrowLeft size={15} className="group-hover/btn:translate-x-[-3px] transition-transform" />
                  </button>
                </Link>
              </div>
            </motion.div>

            {/* Service 2 — Health Insurance */}
            <motion.div
              initial={{ opacity: 0, y: 40 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.7, delay: 0.15, ease: [0.22, 1, 0.36, 1] }}
              className="group relative rounded-3xl overflow-hidden min-h-[520px] flex flex-col justify-end cursor-pointer"
            >
              {/* Background image */}
              <div className="absolute inset-0">
                <img
                  src="https://images.unsplash.com/photo-1576091160399-112ba8d25d1d?auto=format&fit=crop&q=80&w=900"
                  alt="التأمين الصحي"
                  className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-[#001a0d] via-[#003a1a]/60 to-transparent" />
              </div>

              {/* Content */}
              <div className="relative z-10 p-9">
                <div className="w-14 h-14 rounded-2xl bg-white/15 backdrop-blur-sm border border-white/20 flex items-center justify-center mb-6 group-hover:bg-[#1B7A3D] transition-colors duration-300">
                  <Stethoscope size={28} className="text-white" />
                </div>
                <div className="text-white/60 text-xs font-bold tracking-widest uppercase mb-2">الخدمة الثانية</div>
                <h3 className="text-3xl md:text-4xl font-black text-white mb-4 leading-tight">
                  التأمين<br />الصحي
                </h3>
                <p className="text-white/75 text-base leading-relaxed mb-7 max-w-sm">
                  بطاقة تأمين صحي شاملة تمنحك وأسرتك خصومات معتمدة في المستشفيات والمراكز الطبية والصيدليات المعتمدة في اليمن.
                </p>
                <div className="flex flex-col gap-2.5 mb-8">
                  {["تغطية شاملة للفرد والأسرة", "شبكة مستشفيات ومراكز طبية معتمدة", "خصومات على الأدوية والفحوصات"].map(f => (
                    <div key={f} className="flex items-center gap-2 text-white/80 text-sm">
                      <CheckCircle2 size={15} className="text-emerald-400 shrink-0" />
                      {f}
                    </div>
                  ))}
                </div>
                <Link href="/services#medical">
                  <button className="group/btn flex items-center gap-2 bg-white text-[#1B7A3D] font-black text-sm px-7 h-11 rounded-full hover:bg-emerald-400 hover:text-gray-900 transition-all duration-200">
                    اعرف التفاصيل
                    <ArrowLeft size={15} className="group-hover/btn:translate-x-[-3px] transition-transform" />
                  </button>
                </Link>
              </div>
            </motion.div>
          </div>
        </div>
      </section>

      {/* ═══════════════════════════════════════════════════════════
          4 · ABOUT — editorial split
      ═══════════════════════════════════════════════════════════ */}
      <section className="py-24 bg-white overflow-hidden">
        <div className="container mx-auto px-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-16 items-center">

            {/* Image collage */}
            <motion.div
              initial={{ opacity: 0, x: -40 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.8 }}
              className="relative order-2 lg:order-1"
            >
              {/* Large image */}
              <div className="rounded-3xl overflow-hidden aspect-[4/5] shadow-2xl">
                <img
                  src="https://images.unsplash.com/photo-1541339907198-e08756dedf3f?auto=format&fit=crop&q=80&w=800"
                  alt="المؤسسة الوطنية"
                  className="w-full h-full object-cover"
                />
              </div>
              {/* Floating card — top right */}
              <div className="absolute -top-6 -left-6 bg-[#C41E24] text-white rounded-2xl p-5 shadow-xl shadow-red-900/30">
                <div className="text-4xl font-black">{stats?.yearsExperience ?? 12}+</div>
                <div className="text-xs text-white/80 font-medium mt-1">سنة من العطاء</div>
              </div>
              {/* Floating card — bottom left */}
              <div className="absolute -bottom-5 -right-5 bg-white border border-gray-100 rounded-2xl p-5 shadow-xl flex items-center gap-3">
                <div className="w-10 h-10 bg-[#1B7A3D]/10 rounded-xl flex items-center justify-center">
                  <Star size={20} className="text-[#1B7A3D]" fill="#1B7A3D" />
                </div>
                <div>
                  <div className="text-xl font-black text-gray-900">{(stats?.beneficiaries ?? 15000).toLocaleString("ar-EG")}+</div>
                  <div className="text-xs text-gray-500">مستفيد ومستفيدة</div>
                </div>
              </div>
              {/* Green accent block */}
              <div className="absolute top-1/2 -right-8 -translate-y-1/2 w-14 h-40 bg-[#1B7A3D] rounded-2xl hidden lg:block" />
            </motion.div>

            {/* Text */}
            <motion.div
              initial={{ opacity: 0, x: 40 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.8 }}
              className="order-1 lg:order-2"
            >
              <span className="inline-block text-[#C41E24] font-bold text-xs tracking-[0.25em] uppercase mb-4 border border-[#C41E24]/30 rounded-full px-4 py-1">
                تعرّف علينا
              </span>
              <h2 className="text-4xl md:text-5xl font-black text-gray-900 leading-tight mb-6">
                المؤسسة الوطنية<br />
                <span className="text-[#C41E24]">للتنمية الشاملة</span>
              </h2>
              <p className="text-gray-600 text-lg leading-[1.9] mb-5">
                مؤسسة يمنية وطنية رائدة، تأسست لتكون جسراً حقيقياً يربط أبناء اليمن بفرص التعليم والرعاية الصحية الجيدة، من خلال شراكات استراتيجية مع أفضل الجامعات والمستشفيات.
              </p>
              <p className="text-gray-500 leading-[1.9] mb-8">
                نؤمن أن الاستثمار في الإنسان هو أنبل الاستثمارات، ونسعى دائماً لتقديم خدمات تعليمية وصحية بمستوى عالمي، بأسعار في متناول كل يمني.
              </p>
              {/* Feature bullets */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-10">
                {[
                  { icon: <GraduationCap size={16} />, text: "منح دراسية لآلاف الطلاب" },
                  { icon: <HeartPulse size={16} />, text: "تأمين صحي للفرد والأسرة" },
                  { icon: <BookOpen size={16} />, text: "شراكات مع ٣٥+ جامعة" },
                  { icon: <CheckCircle2 size={16} />, text: "معتمدون رسمياً من الجهات المختصة" },
                ].map(({ icon, text }) => (
                  <div key={text} className="flex items-center gap-3 bg-gray-50 rounded-xl px-4 py-3">
                    <div className="w-8 h-8 bg-[#C41E24]/10 rounded-lg flex items-center justify-center text-[#C41E24]">{icon}</div>
                    <span className="text-sm text-gray-700 font-medium">{text}</span>
                  </div>
                ))}
              </div>
              <div className="flex flex-wrap gap-4">
                <Link href="/about">
                  <button className="bg-[#C41E24] hover:bg-[#700000] text-white font-bold px-8 h-12 rounded-full transition-all hover:shadow-lg hover:shadow-red-900/20">
                    اقرأ المزيد عنّا
                  </button>
                </Link>
                <Link href="/services">
                  <button className="border-2 border-[#C41E24] text-[#C41E24] hover:bg-[#C41E24] hover:text-white font-bold px-8 h-12 rounded-full transition-all">
                    تصفح خدماتنا
                  </button>
                </Link>
              </div>
            </motion.div>
          </div>
        </div>
      </section>

      {/* ═══════════════════════════════════════════════════════════
          5 · FULL-WIDTH DIVIDER BANNER
      ═══════════════════════════════════════════════════════════ */}
      <section className="relative h-[280px] overflow-hidden">
        <img
          src="https://images.unsplash.com/photo-1540575467063-178a50c2df87?auto=format&fit=crop&q=80&w=1920"
          alt=""
          className="w-full h-full object-cover"
        />
        <div className="absolute inset-0" style={{ background: "linear-gradient(135deg, rgba(196,30,36,0.88) 0%, rgba(27,122,61,0.82) 100%)" }} />
        <div className="absolute inset-0 flex items-center justify-center text-center px-6">
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            whileInView={{ opacity: 1, scale: 1 }}
            viewport={{ once: true }}
            transition={{ duration: 0.7 }}
          >
            <div className="text-white/60 text-sm tracking-[0.3em] font-semibold mb-3 uppercase">رسالتنا</div>
            <blockquote className="text-white text-2xl md:text-4xl font-black max-w-3xl leading-snug">
              "نسعى لمجتمع يمني متعلم، معافى، قادر على بناء مستقبله بثقة."
            </blockquote>
          </motion.div>
        </div>
      </section>

      {/* ═══════════════════════════════════════════════════════════
          6 · NEWS — magazine layout
      ═══════════════════════════════════════════════════════════ */}
      <section className="py-24 bg-[#F8F5F0]">
        <div className="container mx-auto px-6">
          <div className="flex justify-between items-end mb-14">
            <div>
              <span className="inline-block text-[#C41E24] font-bold text-xs tracking-[0.25em] uppercase mb-3 border border-[#C41E24]/30 rounded-full px-4 py-1">
                آخر المستجدات
              </span>
              <h2 className="text-4xl font-black text-gray-900">أحدث الأخبار</h2>
            </div>
            <Link href="/media/news">
              <button className="text-[#C41E24] font-semibold text-sm flex items-center gap-2 hover:gap-3 transition-all hidden md:flex">
                عرض الكل <ArrowLeft size={16} />
              </button>
            </Link>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {newsList?.items?.length ? newsList.items.map((news, i) => (
              <motion.article key={news.id}
                initial={{ opacity: 0, y: 25 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.12 }}
                className={`group bg-white rounded-3xl overflow-hidden border border-gray-100 hover:shadow-xl hover:shadow-black/[0.07] transition-all duration-300 ${i === 0 ? "md:row-span-2 flex flex-col" : ""}`}
              >
                <div className={`overflow-hidden bg-gray-100 ${i === 0 ? "h-64 md:h-72 flex-shrink-0" : "h-52"}`}>
                  <img
                    src={news.imageUrl || "https://images.unsplash.com/photo-1585776245991-cf89dd7fc73a?auto=format&fit=crop&q=80&w=800"}
                    alt={news.title}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-600"
                    onError={e => { e.currentTarget.src = "https://images.unsplash.com/photo-1585776245991-cf89dd7fc73a?auto=format&fit=crop&q=80&w=800"; }}
                  />
                </div>
                <div className={`p-6 ${i === 0 ? "flex-1 flex flex-col" : ""}`}>
                  <div className="flex items-center gap-2 mb-3">
                    <div className="w-1.5 h-1.5 rounded-full bg-[#C41E24]" />
                    <span className="text-xs text-gray-400">{new Date(news.createdAt).toLocaleDateString("ar-EG")}</span>
                  </div>
                  <h3 className={`font-bold text-gray-900 mb-2 ${i === 0 ? "text-xl" : "text-base"} line-clamp-2`}>{news.title}</h3>
                  <p className="text-gray-500 text-sm line-clamp-3 mb-4 leading-relaxed">{news.excerpt}</p>
                  <span className="text-[#C41E24] text-sm font-bold group-hover:gap-2 flex items-center gap-1 transition-all mt-auto cursor-pointer">
                    اقرأ المزيد <ArrowLeft size={14} />
                  </span>
                </div>
              </motion.article>
            )) : (
              /* Placeholder cards */
              [0,1,2].map(i => (
                <div key={i} className="bg-white rounded-3xl overflow-hidden border border-gray-100">
                  <div className="h-52 bg-gray-100 animate-pulse" />
                  <div className="p-6 space-y-3">
                    <div className="h-3 bg-gray-100 rounded w-24 animate-pulse" />
                    <div className="h-5 bg-gray-100 rounded animate-pulse" />
                    <div className="h-4 bg-gray-100 rounded w-5/6 animate-pulse" />
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </section>

      {/* ═══════════════════════════════════════════════════════════
          7 · PARTNERS MARQUEE
      ═══════════════════════════════════════════════════════════ */}
      <section className="py-16 bg-white overflow-hidden border-y border-gray-100">
        <div className="container mx-auto px-6 text-center mb-10">
          <span className="text-gray-400 text-xs tracking-[0.3em] font-semibold uppercase">شركاء النجاح</span>
          <h2 className="text-2xl font-black text-gray-900 mt-2">مؤسساتنا الشريكة</h2>
        </div>
        <div className="relative flex overflow-hidden py-2">
          <div className="flex gap-5 animate-[marquee_28s_linear_infinite] shrink-0">
            {[...(partnersList ?? []), ...(partnersList ?? [])].map((p, i) => (
              <div key={`ma-${p.id}-${i}`}
                className="shrink-0 w-44 h-22 bg-gray-50 hover:bg-white border border-gray-100 hover:border-gray-200 rounded-2xl flex items-center justify-center p-4 grayscale hover:grayscale-0 hover:shadow-md transition-all opacity-60 hover:opacity-100 cursor-pointer"
                style={{ height: "88px" }}
              >
                <img src={p.logoUrl} alt={p.name} className="max-w-full max-h-full object-contain"
                  onError={e => {
                    e.currentTarget.style.display = "none";
                    const el = e.currentTarget.parentElement;
                    if (el) el.innerHTML = `<span class="text-xs font-bold text-gray-500 text-center">${p.name}</span>`;
                  }} />
              </div>
            ))}
          </div>
          <div className="flex gap-5 animate-[marquee_28s_linear_infinite] shrink-0" aria-hidden>
            {[...(partnersList ?? []), ...(partnersList ?? [])].map((p, i) => (
              <div key={`mb-${p.id}-${i}`}
                className="shrink-0 w-44 bg-gray-50 hover:bg-white border border-gray-100 hover:border-gray-200 rounded-2xl flex items-center justify-center p-4 grayscale hover:grayscale-0 hover:shadow-md transition-all opacity-60 hover:opacity-100 cursor-pointer"
                style={{ height: "88px" }}
              >
                <img src={p.logoUrl} alt={p.name} className="max-w-full max-h-full object-contain"
                  onError={e => {
                    e.currentTarget.style.display = "none";
                    const el = e.currentTarget.parentElement;
                    if (el) el.innerHTML = `<span class="text-xs font-bold text-gray-500 text-center">${p.name}</span>`;
                  }} />
              </div>
            ))}
          </div>
        </div>
        <div className="text-center mt-10">
          <Link href="/partners-success">
            <button className="border-2 border-gray-200 hover:border-[#C41E24] text-gray-600 hover:text-[#C41E24] font-semibold text-sm px-8 h-11 rounded-full transition-all">
              تعرف على جميع شركائنا
            </button>
          </Link>
        </div>
      </section>

      {/* ═══════════════════════════════════════════════════════════
          8 · CTA — final call to action
      ═══════════════════════════════════════════════════════════ */}
      <section className="relative py-28 overflow-hidden">
        <div className="absolute inset-0">
          <img
            src="https://images.unsplash.com/photo-1523580846011-d3a5bc25702b?auto=format&fit=crop&q=80&w=1920"
            alt=""
            className="w-full h-full object-cover"
          />
          <div className="absolute inset-0" style={{
            background: "linear-gradient(135deg, rgba(196,30,36,0.92) 0%, rgba(140,20,24,0.88) 60%, rgba(27,122,61,0.80) 100%)"
          }} />
          {/* Geometric pattern overlay */}
          <div className="absolute inset-0 opacity-[0.04]" style={{
            backgroundImage: `repeating-linear-gradient(45deg, white 0, white 1px, transparent 0, transparent 50%)`,
            backgroundSize: "20px 20px"
          }} />
        </div>
        <div className="relative z-10 container mx-auto px-6 text-center">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.8 }}
          >
            <div className="inline-flex items-center gap-2 bg-white/10 border border-white/20 rounded-full px-5 py-2 mb-8">
              <div className="w-2 h-2 rounded-full bg-yellow-400 animate-pulse" />
              <span className="text-white/80 text-xs font-semibold tracking-wider">انضم إلينا اليوم</span>
            </div>
            <h2 className="text-4xl md:text-6xl font-black text-white mb-6 leading-tight max-w-3xl mx-auto">
              ابدأ رحلتك نحو<br />
              <span className="text-yellow-300">مستقبل أفضل</span>
            </h2>
            <p className="text-white/75 text-lg md:text-xl mb-12 max-w-xl mx-auto leading-relaxed">
              آلاف اليمنيين استفادوا من خدماتنا التعليمية والصحية. حان دورك الآن.
            </p>
            <div className="flex flex-wrap gap-4 justify-center">
              <Link href="/register">
                <button className="bg-white text-[#C41E24] hover:bg-yellow-300 hover:text-gray-900 font-black text-lg px-12 h-14 rounded-full shadow-2xl transition-all hover:scale-[1.02] active:scale-95">
                  سجّل الآن مجاناً
                </button>
              </Link>
              <Link href="/contact">
                <button className="bg-white/10 hover:bg-white/20 border border-white/30 text-white font-semibold text-base px-9 h-14 rounded-full transition-all">
                  تواصل معنا
                </button>
              </Link>
            </div>
          </motion.div>
        </div>
      </section>
    </div>
  );
}
