import { motion } from "framer-motion";

export default function Programs() {
  const programs = [
    { id: "scholarships", title: "برنامج المنح الدراسية", image: "https://images.unsplash.com/photo-1523050854058-8df90110c9f1?auto=format&fit=crop&q=80", desc: "منح دراسية كاملة وجزئية للطلاب المتفوقين في مختلف التخصصات الجامعية." },
    { id: "discounts", title: "برنامج التخفيضات الجامعية", image: "https://images.unsplash.com/photo-1541339907198-e08756dedf3f?auto=format&fit=crop&q=80", desc: "تخفيضات تصل إلى 50% بالتعاون مع الجامعات الأهلية المرموقة." },
    { id: "insurance", title: "برنامج التأمين الطبي", image: "https://images.unsplash.com/photo-1504439468489-c8920d786a2b?auto=format&fit=crop&q=80", desc: "توفير الرعاية الصحية بأسعار رمزية عبر شبكة واسعة من المستشفيات والمراكز الطبية." },
    { id: "courses", title: "برنامج الدورات التدريبية", image: "https://images.unsplash.com/photo-1524178232363-1fb2b075b655?auto=format&fit=crop&q=80", desc: "دورات مكثفة في اللغة الإنجليزية والحاسوب ومهارات سوق العمل." }
  ];

  return (
    <div className="flex flex-col min-h-screen">
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

      <section className="py-20">
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
                className="group rounded-2xl overflow-hidden shadow-sm border border-gray-100 hover:shadow-lg transition-all"
              >
                <div className="h-64 overflow-hidden relative">
                  <div className="absolute inset-0 bg-black/20 group-hover:bg-transparent transition-colors z-10"></div>
                  <img src={program.image} alt={program.title} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700" />
                </div>
                <div className="p-8 bg-white relative z-20 -mt-8 mx-4 rounded-xl shadow-md">
                  <h3 className="text-2xl font-bold text-primary mb-4">{program.title}</h3>
                  <p className="text-gray-600 text-lg">{program.desc}</p>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>
    </div>
  );
}