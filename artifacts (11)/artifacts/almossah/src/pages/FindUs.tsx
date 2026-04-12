import { MapPin, Navigation, Compass } from "lucide-react";
import { useGetContactInfo } from "@workspace/api-client-react";

export default function FindUs() {
  const { data: contact } = useGetContactInfo();

  return (
    <div className="flex flex-col min-h-screen bg-gray-50">
      <section className="bg-primary text-white py-16 text-center">
        <h1 className="text-4xl font-bold mb-4">ابحث عنا</h1>
        <p className="text-white/80">فروع المؤسسة الوطنية في مختلف المحافظات</p>
      </section>

      <section className="py-16">
        <div className="container mx-auto px-4 max-w-5xl">
          <div className="grid md:grid-cols-3 gap-8">
            <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 hover:shadow-md transition-shadow">
              <div className="w-12 h-12 bg-primary/10 text-primary rounded-full flex items-center justify-center mb-4">
                <MapPin size={24} />
              </div>
              <h3 className="text-xl font-bold text-gray-900 mb-2">المركز الرئيسي - صنعاء</h3>
              <p className="text-gray-600 mb-4">{contact?.address || "شارع الزبيري"}{contact?.addressDetail ? `، ${contact.addressDetail}` : ""}</p>
              <div className="text-sm text-primary font-medium flex items-center gap-1 cursor-pointer">
                <Navigation size={14} />
                <span>عرض على الخريطة</span>
              </div>
            </div>

            <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 hover:shadow-md transition-shadow">
              <div className="w-12 h-12 bg-primary/10 text-primary rounded-full flex items-center justify-center mb-4">
                <MapPin size={24} />
              </div>
              <h3 className="text-xl font-bold text-gray-900 mb-2">فرع عدن</h3>
              <p className="text-gray-600 mb-4">خور مكسر، الشارع الرئيسي، بجوار البنك المركزي.</p>
              <div className="text-sm text-primary font-medium flex items-center gap-1 cursor-pointer">
                <Navigation size={14} />
                <span>عرض على الخريطة</span>
              </div>
            </div>

            <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 hover:shadow-md transition-shadow">
              <div className="w-12 h-12 bg-primary/10 text-primary rounded-full flex items-center justify-center mb-4">
                <MapPin size={24} />
              </div>
              <h3 className="text-xl font-bold text-gray-900 mb-2">فرع تعز</h3>
              <p className="text-gray-600 mb-4">شارع جمال، أمام مدرسة الشعب، عمارة النور، الطابق الثاني.</p>
              <div className="text-sm text-primary font-medium flex items-center gap-1 cursor-pointer">
                <Navigation size={14} />
                <span>عرض على الخريطة</span>
              </div>
            </div>
          </div>
          
          <div className="mt-12 bg-white p-8 rounded-2xl shadow-sm border border-gray-100 text-center">
            <Compass size={48} className="mx-auto text-primary mb-4" />
            <h3 className="text-2xl font-bold text-gray-900 mb-4">هل تواجه صعوبة في الوصول إلينا؟</h3>
            <p className="text-gray-600 mb-6 max-w-xl mx-auto">
              فريق خدمة العملاء متاح لمساعدتك في الوصول إلى أقرب فرع لك. يمكنك الاتصال بنا وسنقوم بتزويدك بالاتجاهات الدقيقة.
            </p>
            <p className="text-xl font-bold text-primary" dir="ltr">{contact?.phone1 || "+967 1 234 567"}</p>
          </div>
        </div>
      </section>
    </div>
  );
}
