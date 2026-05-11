import { useEffect, useState } from "react";
import { useListNews } from "@workspace/api-client-react";
import { motion, AnimatePresence } from "framer-motion";
import { ChevronDown, ChevronUp } from "lucide-react";

export default function MediaNews() {
  useEffect(() => { document.title = "الأخبار والمستجدات | المؤسسة الوطنية للتنمية الشاملة"; }, []);

  const { data: newsList } = useListNews({ type: 'news' });
  const [expandedId, setExpandedId] = useState<number | null>(null);

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
                className="bg-white rounded-xl overflow-hidden shadow-sm border border-gray-100 hover:shadow-md transition-shadow"
              >
                <div className="bg-gray-50 flex items-center justify-center overflow-hidden" style={{ minHeight: 160, maxHeight: 300 }}>
                  <img
                    src={news.imageUrl || 'https://images.unsplash.com/photo-1585776245991-cf89dd7fc73a?auto=format&fit=crop&q=80'}
                    alt={news.title}
                    className="w-full object-contain"
                    style={{ maxHeight: 300 }}
                  />
                </div>
                <div className="p-6">
                  <div className="text-sm text-primary mb-3 font-medium">{new Date(news.createdAt).toLocaleDateString('ar-EG')}</div>
                  <h3 className="text-xl font-bold text-gray-900 mb-3">{news.title}</h3>
                  <p className="text-gray-600 mb-4 line-clamp-3">{news.excerpt}</p>
                  <button
                    onClick={() => setExpandedId(expandedId === news.id ? null : news.id)}
                    className="text-primary text-sm font-bold flex items-center gap-1 hover:gap-2 transition-all"
                  >
                    {expandedId === news.id
                      ? <><span>إخفاء</span> <ChevronUp size={14} /></>
                      : <><span>اقرأ المزيد</span> <ChevronDown size={14} /></>}
                  </button>
                  <AnimatePresence>
                    {expandedId === news.id && (
                      <motion.div
                        initial={{ opacity: 0, height: 0 }}
                        animate={{ opacity: 1, height: "auto" }}
                        exit={{ opacity: 0, height: 0 }}
                        className="overflow-hidden"
                      >
                        <div className="mt-4 pt-4 border-t border-gray-100 text-gray-700 text-sm leading-relaxed whitespace-pre-wrap">
                          {news.content}
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>
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
