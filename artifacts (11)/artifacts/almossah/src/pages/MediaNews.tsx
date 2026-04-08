import { useListNews } from "@workspace/api-client-react";
import { Link } from "wouter";
import { motion } from "framer-motion";

export default function MediaNews() {
  const { data: newsList } = useListNews({ type: 'news' });

  return (
    <div className="flex flex-col min-h-screen bg-gray-50">
      <section className="bg-primary text-white py-16">
        <div className="container mx-auto px-4 text-center">
          <h1 className="text-4xl font-bold mb-4">الأخبار</h1>
          <p className="text-white/80">أحدث الأخبار والأنشطة في المؤسسة الوطنية</p>
        </div>
      </section>

      <section className="py-16">
        <div className="container mx-auto px-4">
          <div className="grid md:grid-cols-3 gap-8">
            {newsList?.items?.map((news, idx) => (
              <motion.div 
                key={news.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: idx * 0.1 }}
                className="bg-white rounded-xl overflow-hidden shadow-sm border border-gray-100 hover:shadow-md transition-shadow group"
              >
                <div className="h-56 overflow-hidden bg-gray-100">
                  <img 
                    src={news.imageUrl || 'https://images.unsplash.com/photo-1585776245991-cf89dd7fc73a?auto=format&fit=crop&q=80'} 
                    alt={news.title}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                  />
                </div>
                <div className="p-6">
                  <div className="text-sm text-primary mb-3 font-medium">{new Date(news.createdAt).toLocaleDateString('ar-EG')}</div>
                  <h3 className="text-xl font-bold text-gray-900 mb-3">{news.title}</h3>
                  <p className="text-gray-600 mb-4 line-clamp-3">{news.excerpt}</p>
                </div>
              </motion.div>
            ))}
            
            {(!newsList?.items || newsList.items.length === 0) && (
              <div className="col-span-3 text-center py-20 text-gray-500">
                لا توجد أخبار حالياً
              </div>
            )}
          </div>
        </div>
      </section>
    </div>
  );
}