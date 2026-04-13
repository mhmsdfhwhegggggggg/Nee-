import { motion } from "framer-motion";
import { Link } from "wouter";
import {
  GraduationCap, Stethoscope, CheckCircle2, ArrowLeft,
  BookOpen, University, Award, HeartPulse, FlaskConical, Hospital,
} from "lucide-react";

export default function Services() {

  return (
    <div className="flex flex-col min-h-screen bg-[#F8F5F0]" dir="rtl">

      {/* ── Hero ──────────────────────────────────────────────────── */}
      <section className="relative h-[380px] flex items-center justify-center overflow-hidden">
        <img
          src="https://images.unsplash.com/photo-1523050854058-8df90110c9f1?auto=format&fit=crop&q=80&w=1920"
          alt=""
          className="absolute inset-0 w-full h-full object-cover"
        />
        <div className="absolute inset-0" style={{
          background: "linear-gradient(135deg, rgba(196,30,36,0.88) 0%, rgba(27,122,61,0.82) 100%)"
        }} />
        <div className="relative z-10 text-center text-white px-6">
          <motion.div initial={{ opacity: 0, y: 25 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.7 }}>
            <div className="inline-flex items-center gap-2 bg-white/10 border border-white/20 rounded-full px-5 py-2 mb-6 text-xs tracking-wider font-semibold">
              ماذا نقدم
            </div>
            <h1 className="text-5xl md:text-6xl font-black mb-4 drop-shadow-lg">خدماتنا</h1>
            <p className="text-white/80 text-lg max-w-xl mx-auto">
              نختص في مجالين رئيسيين: الخدمات التعليمية والتأمين الصحي — بأعلى معايير الجودة.
            </p>
          </motion.div>
        </div>
        {/* Wave */}
        <div className="absolute bottom-0 left-0 right-0">
          <svg viewBox="0 0 1440 60" className="w-full" preserveAspectRatio="none" style={{ height: 48, display: "block" }}>
            <path d="M0,0 C480,60 960,60 1440,0 L1440,60 L0,60 Z" fill="#F8F5F0" />
          </svg>
        </div>
      </section>

      {/* ── Introduction ──────────────────────────────────────────── */}
      <section className="py-20 bg-[#F8F5F0]">
        <div className="container mx-auto px-6">
          <div className="max-w-3xl mx-auto text-center">
            <motion.h2
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              className="text-3xl md:text-4xl font-black text-gray-900 mb-5 leading-tight"
            >
              مجالا تخصصنا الأساسيان
            </motion.h2>
            <motion.p
              initial={{ opacity: 0 }}
              whileInView={{ opacity: 1 }}
              viewport={{ once: true }}
              transition={{ delay: 0.15 }}
              className="text-gray-500 text-lg leading-relaxed"
            >
              تعمل المؤسسة الوطنية للتنمية الشاملة في مجالين محوريين، تربطهما رؤية واحدة: تمكين المواطن اليمني وتحسين جودة حياته.
            </motion.p>
          </div>
        </div>
      </section>

      {/* ── Service 1 — Education ─────────────────────────────────── */}
      <section id="education" className="py-16 bg-white">
        <div className="container mx-auto px-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-16 items-center">

            {/* Image */}
            <motion.div
              initial={{ opacity: 0, x: -40 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.8 }}
              className="relative"
            >
              <div className="rounded-3xl overflow-hidden aspect-[4/3] shadow-2xl">
                <img
                  src="https://images.unsplash.com/photo-1523050854058-8df90110c9f1?auto=format&fit=crop&q=80&w=900"
                  alt="الخدمات التعليمية"
                  className="w-full h-full object-cover"
                />
              </div>
              {/* Accent */}
              <div className="absolute -bottom-6 -right-6 bg-[#C41E24] text-white rounded-2xl px-6 py-4 shadow-xl shadow-red-900/30">
                <div className="text-3xl font-black">35+</div>
                <div className="text-xs text-white/80 font-medium">جامعة ومعهد شريك</div>
              </div>
              <div className="absolute -top-5 -left-5 w-16 h-16 bg-yellow-300 rounded-2xl flex items-center justify-center shadow-lg">
                <GraduationCap size={30} className="text-[#C41E24]" />
              </div>
            </motion.div>

            {/* Content */}
            <motion.div
              initial={{ opacity: 0, x: 40 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.8 }}
            >
              <span className="inline-block text-[#C41E24] font-bold text-xs tracking-[0.25em] uppercase mb-4 border border-[#C41E24]/30 rounded-full px-4 py-1">
                الخدمة الأولى
              </span>
              <h2 className="text-4xl md:text-5xl font-black text-gray-900 mb-2 leading-tight">
                الخدمات
              </h2>
              <h2 className="text-4xl md:text-5xl font-black text-[#C41E24] mb-6 leading-tight">
                التعليمية
              </h2>
              <p className="text-gray-600 text-lg leading-[1.9] mb-8">
                نوفر للطلاب اليمنيين فرصاً حقيقية للوصول إلى التعليم العالي عبر منح دراسية وتخفيضات جامعية معتمدة بالشراكة مع أكبر الجامعات والمعاهد.
              </p>

              {/* Subservices */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-10">
                {[
                  { icon: <Award size={18} />, title: "المنح الدراسية الكاملة", desc: "تغطي الرسوم الدراسية بالكامل للطلاب المتميزين والمحتاجين" },
                  { icon: <University size={18} />, title: "التخفيضات الجامعية", desc: "خصومات تصل إلى 70% على رسوم التسجيل والدراسة" },
                  { icon: <BookOpen size={18} />, title: "شراكات جامعية واسعة", desc: "شبكة من ٣٥+ جامعة ومعهداً معتمداً حكومياً وخاصاً" },
                  { icon: <GraduationCap size={18} />, title: "الإرشاد الأكاديمي", desc: "متخصصون يرشدونك لاختيار التخصص والمؤسسة المناسبة" },
                ].map(({ icon, title, desc }) => (
                  <div key={title} className="bg-[#F8F5F0] rounded-2xl p-5 hover:shadow-md hover:bg-white transition-all group">
                    <div className="w-9 h-9 bg-[#C41E24]/10 rounded-xl flex items-center justify-center text-[#C41E24] mb-3 group-hover:bg-[#C41E24] group-hover:text-white transition-colors">
                      {icon}
                    </div>
                    <div className="font-bold text-gray-900 text-sm mb-1">{title}</div>
                    <div className="text-gray-500 text-xs leading-relaxed">{desc}</div>
                  </div>
                ))}
              </div>

              <div className="flex flex-wrap gap-4">
                <Link href="/programs#scholarships">
                  <button className="bg-[#C41E24] hover:bg-[#700000] text-white font-bold px-8 h-12 rounded-full transition-all hover:shadow-lg hover:shadow-red-900/20">
                    استفسر عن المنح
                  </button>
                </Link>
                <Link href="/register">
                  <button className="border-2 border-[#C41E24] text-[#C41E24] hover:bg-[#C41E24] hover:text-white font-bold px-8 h-12 rounded-full transition-all">
                    سجّل الآن
                  </button>
                </Link>
              </div>
            </motion.div>
          </div>
        </div>
      </section>

      {/* ── Divider ──────────────────────────────────────────────── */}
      <div className="bg-[#F8F5F0] py-6">
        <div className="container mx-auto px-6">
          <div className="h-px bg-gray-200" />
        </div>
      </div>

      {/* ── Service 2 — Health Insurance ──────────────────────────── */}
      <section id="medical" className="py-16 bg-[#F8F5F0]">
        <div className="container mx-auto px-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-16 items-center">

            {/* Content */}
            <motion.div
              initial={{ opacity: 0, x: -40 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.8 }}
            >
              <span className="inline-block text-[#1B7A3D] font-bold text-xs tracking-[0.25em] uppercase mb-4 border border-[#1B7A3D]/30 rounded-full px-4 py-1">
                الخدمة الثانية
              </span>
              <h2 className="text-4xl md:text-5xl font-black text-gray-900 mb-2 leading-tight">
                التأمين
              </h2>
              <h2 className="text-4xl md:text-5xl font-black text-[#1B7A3D] mb-6 leading-tight">
                الصحي
              </h2>
              <p className="text-gray-600 text-lg leading-[1.9] mb-8">
                بطاقة تأمين صحي شاملة تمنح حاملها وأسرته حق الاستفادة من شبكة واسعة من المستشفيات والمراكز الطبية والصيدليات، بخصومات معتمدة وتغطية حقيقية.
              </p>

              {/* Subservices */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-10">
                {[
                  { icon: <Hospital size={18} />, title: "مستشفيات معتمدة", desc: "شبكة من أفضل المستشفيات والمراكز الطبية في اليمن" },
                  { icon: <Stethoscope size={18} />, title: "استشارات طبية", desc: "زيارات طبية وفحوصات دورية بأسعار مدعومة" },
                  { icon: <FlaskConical size={18} />, title: "مختبرات طبية", desc: "فحوصات مخبرية وتحاليل طبية بأسعار مدعومة في مختبرات معتمدة" },
                  { icon: <HeartPulse size={18} />, title: "تغطية الأسرة", desc: "باقات تشمل الفرد أو الأسرة بالكامل بأسعار مرنة" },
                ].map(({ icon, title, desc }) => (
                  <div key={title} className="bg-white rounded-2xl p-5 hover:shadow-md transition-all group">
                    <div className="w-9 h-9 bg-[#1B7A3D]/10 rounded-xl flex items-center justify-center text-[#1B7A3D] mb-3 group-hover:bg-[#1B7A3D] group-hover:text-white transition-colors">
                      {icon}
                    </div>
                    <div className="font-bold text-gray-900 text-sm mb-1">{title}</div>
                    <div className="text-gray-500 text-xs leading-relaxed">{desc}</div>
                  </div>
                ))}
              </div>

              <div className="flex flex-wrap gap-4">
                <Link href="/programs#insurance">
                  <button className="bg-[#1B7A3D] hover:bg-[#234a1f] text-white font-bold px-8 h-12 rounded-full transition-all hover:shadow-lg hover:shadow-green-900/20">
                    استفسر عن التأمين
                  </button>
                </Link>
                <Link href="/register">
                  <button className="border-2 border-[#1B7A3D] text-[#1B7A3D] hover:bg-[#1B7A3D] hover:text-white font-bold px-8 h-12 rounded-full transition-all">
                    اشترك الآن
                  </button>
                </Link>
              </div>
            </motion.div>

            {/* Image */}
            <motion.div
              initial={{ opacity: 0, x: 40 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.8 }}
              className="relative"
            >
              <div className="rounded-3xl overflow-hidden aspect-[4/3] shadow-2xl">
                <img
                  src="https://images.unsplash.com/photo-1576091160399-112ba8d25d1d?auto=format&fit=crop&q=80&w=900"
                  alt="التأمين الصحي"
                  className="w-full h-full object-cover"
                />
              </div>
              {/* Accent */}
              <div className="absolute -bottom-6 -left-6 bg-[#1B7A3D] text-white rounded-2xl px-6 py-4 shadow-xl shadow-green-900/30">
                <div className="text-3xl font-black">50+</div>
                <div className="text-xs text-white/80 font-medium">مستشفى ومركز طبي</div>
              </div>
              <div className="absolute -top-5 -right-5 w-16 h-16 bg-emerald-100 rounded-2xl flex items-center justify-center shadow-lg">
                <HeartPulse size={30} className="text-[#1B7A3D]" />
              </div>
            </motion.div>
          </div>
        </div>
      </section>

      {/* ── Comparison / Why us ───────────────────────────────────── */}
      <section className="py-20 bg-white">
        <div className="container mx-auto px-6">
          <div className="text-center mb-14">
            <h2 className="text-3xl md:text-4xl font-black text-gray-900 mb-3">لماذا تختار المؤسسة الوطنية؟</h2>
            <div className="w-14 h-1 bg-[#C41E24] mx-auto rounded-full" />
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {[
              { num: "01", title: "اعتماد رسمي", desc: "معتمدون من الجهات الحكومية المختصة في اليمن" },
              { num: "02", title: "أسعار ميسورة", desc: "خدمات بمستوى عالي بتكاليف في متناول الجميع" },
              { num: "03", title: "شبكة واسعة", desc: "أكثر من ٨٠ جهة شريكة تعليمية وطبية معتمدة" },
              { num: "04", title: "دعم متواصل", desc: "فريق متخصص لمتابعتك في جميع مراحل الخدمة" },
            ].map((f, i) => (
              <motion.div key={f.num}
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.1 }}
                className="relative bg-[#F8F5F0] rounded-3xl p-7 hover:shadow-lg transition-all group"
              >
                <div className="text-[72px] font-black text-gray-100 leading-none absolute top-4 left-5 group-hover:text-[#C41E24]/10 transition-colors select-none">
                  {f.num}
                </div>
                <div className="relative z-10">
                  <CheckCircle2 size={22} className="text-[#C41E24] mb-4" />
                  <h3 className="text-lg font-black text-gray-900 mb-2">{f.title}</h3>
                  <p className="text-gray-500 text-sm leading-relaxed">{f.desc}</p>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* ── CTA ─────────────────────────────────────────────────── */}
      <section className="relative py-20 overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-[#C41E24] to-[#1B7A3D]" />
        <div className="absolute inset-0 opacity-[0.04]" style={{
          backgroundImage: `repeating-linear-gradient(45deg, white 0, white 1px, transparent 0, transparent 50%)`,
          backgroundSize: "20px 20px"
        }} />
        <div className="relative z-10 container mx-auto px-6 text-center">
          <h2 className="text-3xl md:text-4xl font-black text-white mb-5">هل أنت مستعد للانضمام؟</h2>
          <p className="text-white/80 text-lg mb-10 max-w-lg mx-auto">
            سجّل الآن واستفد من خدماتنا التعليمية والصحية بأفضل الأسعار
          </p>
          <Link href="/register">
            <button className="bg-white text-[#C41E24] hover:bg-yellow-300 hover:text-gray-900 font-black text-lg px-12 h-14 rounded-full shadow-2xl transition-all hover:scale-[1.02]">
              سجّل الآن مجاناً
            </button>
          </Link>
        </div>
      </section>
    </div>
  );
}
