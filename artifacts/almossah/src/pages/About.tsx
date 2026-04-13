import { Layout } from "@/components/layout/Layout";
import { Link } from "wouter";
import { useListTeam } from "@workspace/api-client-react";
import { motion } from "framer-motion";

export default function About() {
  const { data: teamList } = useListTeam();

  return (
    <div className="flex flex-col min-h-screen">
      {/* Hero */}
      <section className="relative h-[300px] flex items-center justify-center overflow-hidden bg-primary">
        <div className="absolute inset-0 bg-black/40 z-10" />
        <div className="absolute inset-0 bg-[url('https://images.unsplash.com/photo-1577962917302-cd874c4e31d2?auto=format&fit=crop&q=80')] bg-cover bg-center mix-blend-overlay" />
        <div className="container mx-auto px-4 z-20 text-center text-white">
          <motion.h1 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-4xl font-bold mb-4"
          >
            عن المؤسسة
          </motion.h1>
          <div className="flex items-center justify-center gap-2 text-sm text-white/80">
            <Link href="/">الرئيسية</Link>
            <span>/</span>
            <span>عن المؤسسة</span>
          </div>
        </div>
      </section>

      {/* Content */}
      <section className="py-20" id="who-we-are">
        <div className="container mx-auto px-4">
          <div className="grid md:grid-cols-2 gap-12 items-center">
            <div>
              <h2 className="text-3xl font-bold text-primary mb-6">من نحن</h2>
              <p className="text-gray-600 leading-relaxed mb-6 text-lg">
                المؤسسة الوطنية هي مؤسسة تنموية رائدة تسعى لتقديم خدمات تعليمية وطبية وتنموية متميزة، للمساهمة في بناء مجتمع معرفي وصحي متكامل، وفقاً لأعلى معايير الجودة الشاملة.
              </p>
              <p className="text-gray-600 leading-relaxed text-lg">
                نعمل من خلال رؤية واضحة ورسالة سامية تهدف إلى الارتقاء بالخدمات المقدمة للمواطن اليمني في مختلف المجالات، مع التركيز على الشباب والطلاب لبناء جيل قادر على صناعة المستقبل.
              </p>
            </div>
            <div className="rounded-2xl overflow-hidden shadow-lg h-[400px]">
              <img src="https://images.unsplash.com/photo-1524178232363-1fb2b075b655?auto=format&fit=crop&q=80" alt="عن المؤسسة" className="w-full h-full object-cover" />
            </div>
          </div>
        </div>
      </section>

      {/* Vision & Mission */}
      <section className="py-20 bg-gray-50">
        <div className="container mx-auto px-4">
          <div className="grid md:grid-cols-2 gap-8">
            <div className="bg-white p-10 rounded-2xl shadow-sm border border-gray-100" id="vision">
              <div className="w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center mb-6">
                <span className="text-2xl text-primary font-bold">🎯</span>
              </div>
              <h3 className="text-2xl font-bold text-gray-900 mb-4">رؤيتنا</h3>
              <p className="text-gray-600 leading-relaxed text-lg">
                أن نكون المؤسسة الرائدة والأولى في تقديم الخدمات التعليمية والطبية والتنموية في اليمن، وصناعة نموذج يحتذى به في العمل المؤسسي التنموي.
              </p>
            </div>
            <div className="bg-white p-10 rounded-2xl shadow-sm border border-gray-100" id="mission">
              <div className="w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center mb-6">
                <span className="text-2xl text-primary font-bold">🚀</span>
              </div>
              <h3 className="text-2xl font-bold text-gray-900 mb-4">رسالتنا</h3>
              <p className="text-gray-600 leading-relaxed text-lg">
                تقديم خدمات نوعية وشاملة تلبي احتياجات المجتمع اليمني، وتساهم في تخفيف المعاناة وبناء القدرات وتمكين الشباب من خلال برامج مستدامة وشراكات فاعلة.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Team */}
      <section className="py-20" id="team">
        <div className="container mx-auto px-4">
          <div className="text-center mb-16">
            <h2 className="text-3xl font-bold text-gray-900 mb-4">فريق العمل</h2>
            <div className="w-16 h-1 bg-primary mx-auto rounded-full"></div>
          </div>

          <div className="grid md:grid-cols-3 lg:grid-cols-4 gap-8">
            {teamList?.items?.map((member) => (
              <div key={member.id} className="bg-white rounded-xl overflow-hidden shadow-sm border border-gray-100 text-center p-6 hover:shadow-md transition-shadow">
                <div className="w-32 h-32 mx-auto rounded-full overflow-hidden mb-4 border-4 border-gray-50">
                  <img 
                    src={member.imageUrl || 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?auto=format&fit=crop&q=80&w=200'} 
                    alt={member.name}
                    className="w-full h-full object-cover"
                  />
                </div>
                <h3 className="text-lg font-bold text-gray-900 mb-1">{member.name}</h3>
                <p className="text-primary text-sm font-medium mb-3">{member.role}</p>
                {member.bio && <p className="text-gray-500 text-sm text-center">{member.bio}</p>}
              </div>
            ))}
          </div>
        </div>
      </section>
    </div>
  );
}