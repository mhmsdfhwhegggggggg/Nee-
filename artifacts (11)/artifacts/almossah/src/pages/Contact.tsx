import { MapPin, Phone, Mail, Clock } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";

export default function Contact() {
  const { toast } = useToast();

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    toast({
      title: "تم استلام رسالتك",
      description: "سنقوم بالرد عليك في أقرب وقت ممكن.",
    });
  };

  return (
    <div className="flex flex-col min-h-screen bg-white">
      <section className="bg-primary text-white py-16 text-center">
        <h1 className="text-4xl font-bold mb-4">اتصل بنا</h1>
        <p className="text-white/80">نحن هنا للإجابة على استفساراتكم وتقديم الدعم اللازم</p>
      </section>

      <section className="py-16">
        <div className="container mx-auto px-4 max-w-6xl">
          <div className="grid md:grid-cols-2 gap-12">
            
            {/* Contact Info */}
            <div className="space-y-8">
              <h2 className="text-3xl font-bold text-gray-900 mb-6">معلومات التواصل</h2>
              
              <div className="flex items-start gap-4">
                <div className="w-12 h-12 bg-primary/10 text-primary rounded-full flex items-center justify-center shrink-0">
                  <MapPin size={24} />
                </div>
                <div>
                  <h3 className="font-bold text-lg text-gray-900 mb-1">العنوان الرئيسي</h3>
                  <p className="text-gray-600">الجمهورية اليمنية، أمانة العاصمة، شارع الزبيري، تقاطع شارع بغداد، مبنى المركز التجاري.</p>
                </div>
              </div>

              <div className="flex items-start gap-4">
                <div className="w-12 h-12 bg-primary/10 text-primary rounded-full flex items-center justify-center shrink-0">
                  <Phone size={24} />
                </div>
                <div>
                  <h3 className="font-bold text-lg text-gray-900 mb-1">الهاتف</h3>
                  <p className="text-gray-600" dir="ltr">+967 1 234 567</p>
                  <p className="text-gray-600" dir="ltr">+967 777 123 456</p>
                </div>
              </div>

              <div className="flex items-start gap-4">
                <div className="w-12 h-12 bg-primary/10 text-primary rounded-full flex items-center justify-center shrink-0">
                  <Mail size={24} />
                </div>
                <div>
                  <h3 className="font-bold text-lg text-gray-900 mb-1">البريد الإلكتروني</h3>
                  <p className="text-gray-600">info@almossah.org</p>
                  <p className="text-gray-600">support@almossah.org</p>
                </div>
              </div>

              <div className="flex items-start gap-4">
                <div className="w-12 h-12 bg-primary/10 text-primary rounded-full flex items-center justify-center shrink-0">
                  <Clock size={24} />
                </div>
                <div>
                  <h3 className="font-bold text-lg text-gray-900 mb-1">ساعات العمل</h3>
                  <p className="text-gray-600">السبت - الخميس: 8:00 صباحاً - 4:00 مساءً</p>
                  <p className="text-gray-600">الجمعة: مغلق</p>
                </div>
              </div>
            </div>

            {/* Contact Form */}
            <div className="bg-gray-50 p-8 rounded-2xl border border-gray-100 shadow-sm">
              <h2 className="text-2xl font-bold text-gray-900 mb-6">أرسل رسالة</h2>
              <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">الاسم</label>
                  <Input required placeholder="اسمك الكريم" className="bg-white" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">البريد الإلكتروني</label>
                  <Input required type="email" placeholder="البريد الإلكتروني" className="bg-white" dir="ltr" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">الموضوع</label>
                  <Input required placeholder="موضوع الرسالة" className="bg-white" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">الرسالة</label>
                  <Textarea required placeholder="اكتب رسالتك هنا..." className="min-h-[150px] bg-white" />
                </div>
                <Button type="submit" className="w-full bg-primary hover:bg-primary/90 text-white h-12 text-lg">
                  إرسال
                </Button>
              </form>
            </div>

          </div>
        </div>
      </section>

      {/* Map */}
      <section className="h-[400px] w-full bg-gray-200">
        {/* Placeholder for iframe map */}
        <div className="w-full h-full flex items-center justify-center text-gray-500 bg-gray-100 border-t border-gray-200">
          خريطة الموقع (Google Maps Embed)
        </div>
      </section>
    </div>
  );
}