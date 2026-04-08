import { motion } from "framer-motion";
import { Link } from "wouter";
import { GraduationCap, BookOpen, Laptop, HeartPulse } from "lucide-react";

export default function Programs() {
  const programs = [
    {
      id: "scholarships",
      icon: <GraduationCap size={32} />,
      color: "#8B0000",
      title: "برنامج المنح الدراسية",
      image: "https://images.unsplash.com/photo-1523050854058-8df90110c9f1?auto=format&fit=crop&q=80",
      desc: "منح دراسية كاملة وجزئية للطلاب المتفوقين والمحتاجين في مختلف التخصصات الجامعية، بالتعاون مع أكثر من ٣٥ جامعة ومعهداً معتمداً.",
      features: ["تغطية كاملة للرسوم الدراسية", "متاحة لجميع التخصصات", "شراكات مع جامعات حكومية وخاصة"],
    },
    {
      id: "discounts",
      icon: <BookOpen size={32} />,
      color: "#8B0000",
      title: "برنامج التخفيضات الجامعية",
      image: "https://images.unsplash.com/photo-1541339907198-e08756dedf3f?auto=format&fit=crop&q=80",
      desc: "تخفيضات تصل إلى 70% على رسوم التسجيل والدراسة بالتعاون مع الجامعات الأهلية المرموقة في اليمن.",
      features: ["خصومات تصل إلى 70%", "على رسوم التسجيل والدراسة", "قابلة للتجديد سنوياً"],
    },
    {
      id: "courses",
      icon: <Laptop size={32} />,
      color: "#2D5A27",
      title: "برنامج الدورات التدريبية",
      image: "https://images.unsplash.com/photo-1524178232363-1fb2b075b655?auto=format&fit=crop&q=80",
      desc: "دورات مكثفة في اللغة الإنجليزية والحاسوب ومهارات سوق العمل، لتأهيل الشباب اليمني وتعزيز فرصهم الوظيفية.",
      features: ["دورات لغة إنجليزية", "مهارات الحاسوب والتقنية", "مهارات سوق العمل"],
    },
    {
      id: "insurance",
      icon: <HeartPulse size={32} />,
      color: "#2D5A27",
      title: "برنامج التأمين الصحي",
      image: "https://images.unsplash.com/photo-1576091160399-112ba8d25d1d?auto=format&fit=crop&q=80",
      desc: "بطاقة تأمين صحي شاملة توفر رعاية صحية بأسعار مدعومة عبر شبكة واسعة من المستشفيات والمراكز الطبية والصيدليات المعتمدة.",
      features: ["شبكة 50+ مستشفى ومركز طبي", "خصومات على الأدوية والفحوصات", "باقات للفرد والأسرة"],
    },
  ];

  return (
    <div className="flex flex-col min-h-screen" dir="rtl">
      {/* Hero */}
      <section className="relative h-[320px] flex items-center justify-center overflow-hidden bg-primary">
        <div className="absolute inset-0 bg-black/40 z-10" />
        <div
          className="absolute inset-0 bg-cover bg-center mix-blend-overlay"
          style={{ backgroundImage: "url('https://images.unsplash.com/photo-1497633762265-9d179a990aa6?auto=format&fit=crop&q=80')" }}
        />
        <div className="container mx-auto px-4 z-20 text-center text-white">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
          >
            <div className="inline-flex items-center gap-2 bg-white/10 border border-white/20 rounded-full px-5 py-2 mb-5 text-xs tracking-wider font-semibold">
              ما نقدمه
            </div>
            <h1 className="text-5xl font-black mb-3">برامجنا</h1>
            <p className="text-white/80 text-lg">
              خدمات تعليمية وتأمين صحي لكل أبناء اليمن
            </p>
          </motion.div>
        </div>
        <div className="absolute bottom-0 left-0 right-0">
          <svg viewBox="0 0 1440 60" className="w-full" preserveAspectRatio="none" style={{ height: 48, display: "block" }}>
            <path d="M0,0 C480,60 960,60 1440,0 L1440,60 L0,60 Z" fill="#F8F5F0" />
          </svg>
        </div>
      </section>

      {/* Programs grid */}
      <section className="py-20 bg-[#F8F5F0]">
        <div className="container mx-auto px-6">
          <div className="grid md:grid-cols-2 gap-10">
            {programs.map((program, idx) => (
              <motion.div
                key={program.id}
                id={program.id}
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: idx * 0.1, duration: 0.6 }}
                className="group rounded-3xl overflow-hidden shadow-sm border border-gray-100 hover:shadow-xl transition-all bg-white"
              >
                {/* Image */}
                <div className="h-52 overflow-hidden relative">
                  <img
                    src={program.image}
                    alt={program.title}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700"
                  />
                  <div
                    className="absolute inset-0 opacity-60"
                    style={{ background: `linear-gradient(to top, ${program.color}, transparent)` }}
                  />
                  <div className="absolute bottom-4 right-4 w-12 h-12 rounded-2xl bg-white/20 backdrop-blur-sm flex items-center justify-center text-white">
                    {program.icon}
                  </div>
                </div>

                {/* Content */}
                <div className="p-8">
                  <h3 className="text-2xl font-black mb-3" style={{ color: program.color }}>
                    {program.title}
                  </h3>
                  <p className="text-gray-600 text-base leading-relaxed mb-6">{program.desc}</p>

                  {/* Features */}
                  <ul className="flex flex-col gap-2 mb-7">
                    {program.features.map(f => (
                      <li key={f} className="flex items-center gap-2 text-sm text-gray-700">
                        <span className="w-2 h-2 rounded-full shrink-0" style={{ background: program.color }} />
                        {f}
                      </li>
                    ))}
                  </ul>

                  <Link href="/register">
                    <button
                      className="font-bold text-sm px-7 h-10 rounded-full text-white transition-all hover:opacity-90 hover:shadow-md"
                      style={{ background: program.color }}
                    >
                      سجّل الآن
                    </button>
                  </Link>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-16 bg-[#8B0000]">
        <div className="container mx-auto px-6 text-center">
          <h2 className="text-3xl font-black text-white mb-4">هل أنت مستعد للانضمام؟</h2>
          <p className="text-white/80 mb-8 text-lg">سجّل الآن واستفد من منحنا الدراسية وتأميننا الصحي</p>
          <Link href="/register">
            <button className="bg-white text-[#8B0000] hover:bg-yellow-300 font-black text-lg px-12 h-13 rounded-full shadow-xl transition-all hover:scale-[1.02]">
              سجّل مجاناً
            </button>
          </Link>
        </div>
      </section>
    </div>
  );
}
