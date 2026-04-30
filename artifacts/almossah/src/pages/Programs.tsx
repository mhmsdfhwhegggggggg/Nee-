import { motion } from "framer-motion";
import { Link } from "wouter";

export default function Programs() {
  const programs = [
    {
      id: "scholarships",
      title: "برنامج المنح الدراسية",
      image: "https://images.unsplash.com/photo-1523050854058-8df90110c9f1?auto=format&fit=crop&q=80",
      desc: "منح دراسية كاملة وجزئية للطلاب المتفوقين في مختلف التخصصات الجامعية.",
      registerHref: "/register",
      registerLabel: "سجّل للمنح",
      color: "#C41E24",
    },
    {
      id: "discounts",
      title: "برنامج التخفيضات الجامعية",
      image: "https://images.unsplash.com/photo-1541339907198-e08756dedf3f?auto=format&fit=crop&q=80",
      desc: "تخفيضات تصل إلى 50% بالتعاون مع الجامعات الأهلية المرموقة.",
      registerHref: "/register",
      registerLabel: "سجّل للتخفيضات",
      color: "#C41E24",
    },
    {
      id: "insurance",
      title: "برنامج التأمين الطبي",
      image: "https://images.unsplash.com/photo-1504439468489-c8920d786a2b?auto=format&fit=crop&q=80",
      desc: "توفير الرعاية الصحية بأسعار رمزية عبر شبكة واسعة من المستشفيات والمراكز الطبية.",
      registerHref: "/training-register",
      registerLabel: "سجّل للتأمين الصحي ←",
      color: "#1B7A3D",
    },
    {
      id: "courses",
      title: "برنامج الدورات التدريبية",
      image: "https://images.unsplash.com/photo-1524178232363-1fb2b075b655?auto=format&fit=crop&q=80",
      desc: "دورات مكثفة في اللغة الإنجليزية والحاسوب ومهارات سوق العمل.",
      registerHref: "/training-register",
      registerLabel: "سجّل في الدورات ←",
      color: "#1B7A3D",
    },
  ];

  return (
    <div className="flex flex-col min-h-screen" dir="rtl">
      <section className="relative h-[300px] flex items-center justify-center overflow-hidden bg-primary">
        <div className="absolute inset-0 bg-black/40 z-10" />
        <div className="absolute inset-0 bg-[url('https://images.unsplash.com/photo-1497633762265-9d179a990aa6?auto=format&fit=crop&q=80')] bg-cover bg-center mix-blend-overlay" />
        <div className="container mx-auto px-4 z-20 text-center text-white">
          <motion.h1
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-4xl font-bold mb-4"
          >
            البرامج
          </motion.h1>
        </div>
      </section>

      <section className="py-20 bg-[#F8F5F0]">
        <div className="container mx-auto px-4">
          <div className="grid md:grid-cols-2 gap-12">
            {programs.map((program, idx) => (
              <motion.div
                key={program.id}
                id={program.id}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: idx * 0.1 }}
                className="group rounded-2xl overflow-hidden shadow-sm border border-gray-100 hover:shadow-lg transition-all bg-white"
              >
                <div className="h-64 overflow-hidden relative">
                  <div className="absolute inset-0 bg-black/20 group-hover:bg-transparent transition-colors z-10" />
                  <img
                    src={program.image}
                    alt={program.title}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700"
                  />
                </div>
                <div className="p-8">
                  <h3 className="text-2xl font-bold mb-3" style={{ color: program.color }}>
                    {program.title}
                  </h3>
                  <p className="text-gray-600 text-base mb-6 leading-relaxed">{program.desc}</p>
                  <Link href={program.registerHref}>
                    <button
                      className="font-bold text-sm px-7 h-11 rounded-full text-white transition-all hover:opacity-90 hover:scale-[1.02] active:scale-95 shadow-md"
                      style={{ backgroundColor: program.color }}
                    >
                      {program.registerLabel}
                    </button>
                  </Link>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>
    </div>
  );
}
