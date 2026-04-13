import { useListNews } from "@workspace/api-client-react";
import { motion } from "framer-motion";

export default function MediaEvents() {
  const { data: eventsList } = useListNews({ type: 'event' });

  return (
    <div className="flex flex-col min-h-screen bg-gray-50">
      <section className="bg-primary text-white py-16">
        <div className="container mx-auto px-4 text-center">
          <h1 className="text-4xl font-bold mb-4">الفعاليات</h1>
          <p className="text-white/80">الفعاليات والمؤتمرات التي تنظمها أو تشارك فيها المؤسسة</p>
        </div>
      </section>

      <section className="py-16">
        <div className="container mx-auto px-4">
          <div className="grid md:grid-cols-2 gap-8">
            {eventsList?.items?.map((event, idx) => (
              <motion.div 
                key={event.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: idx * 0.1 }}
                className="bg-white rounded-xl shadow-sm border border-gray-100 flex flex-col md:flex-row overflow-hidden hover:shadow-md transition-shadow"
              >
                <div className="md:w-1/3 h-48 md:h-auto bg-gray-100 shrink-0">
                  <img 
                    src={event.imageUrl || 'https://images.unsplash.com/photo-1540575467063-178a50c2df87?auto=format&fit=crop&q=80'} 
                    alt={event.title}
                    className="w-full h-full object-cover"
                  />
                </div>
                <div className="p-6 flex flex-col justify-center">
                  <div className="text-sm text-accent mb-2 font-bold">{new Date(event.createdAt).toLocaleDateString('ar-EG')}</div>
                  <h3 className="text-xl font-bold text-gray-900 mb-3">{event.title}</h3>
                  <p className="text-gray-600 line-clamp-3">{event.excerpt}</p>
                </div>
              </motion.div>
            ))}

            {(!eventsList?.items || eventsList.items.length === 0) && (
              <div className="col-span-2 text-center py-20 text-gray-500">
                لا توجد فعاليات حالياً
              </div>
            )}
          </div>
        </div>
      </section>
    </div>
  );
}