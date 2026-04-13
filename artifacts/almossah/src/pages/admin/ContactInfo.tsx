import { AdminLayout } from "@/components/layout/AdminLayout";
import { useGetContactInfo, useUpdateContactInfo, getGetContactInfoQueryKey } from "@workspace/api-client-react";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useState, useEffect } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { Phone, Mail, MapPin, Globe, Clock, Save } from "lucide-react";
import { FaFacebook, FaTwitter, FaInstagram, FaYoutube, FaLinkedin, FaWhatsapp } from "react-icons/fa";

export default function ContactInfoAdmin() {
  const { data: contactInfo, isLoading } = useGetContactInfo();
  const updateContact = useUpdateContactInfo();
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const [form, setForm] = useState({
    phone1: "",
    phone2: "",
    email1: "",
    email2: "",
    address: "",
    addressDetail: "",
    workHours: "",
    workHoursOff: "",
    facebookUrl: "",
    twitterUrl: "",
    instagramUrl: "",
    youtubeUrl: "",
    linkedinUrl: "",
    whatsappNumber: "",
    mapEmbedUrl: "",
  });

  useEffect(() => {
    if (contactInfo) {
      setForm({
        phone1: contactInfo.phone1 || "",
        phone2: contactInfo.phone2 || "",
        email1: contactInfo.email1 || "",
        email2: contactInfo.email2 || "",
        address: contactInfo.address || "",
        addressDetail: contactInfo.addressDetail || "",
        workHours: contactInfo.workHours || "",
        workHoursOff: contactInfo.workHoursOff || "",
        facebookUrl: contactInfo.facebookUrl || "",
        twitterUrl: contactInfo.twitterUrl || "",
        instagramUrl: contactInfo.instagramUrl || "",
        youtubeUrl: contactInfo.youtubeUrl || "",
        linkedinUrl: contactInfo.linkedinUrl || "",
        whatsappNumber: contactInfo.whatsappNumber || "",
        mapEmbedUrl: contactInfo.mapEmbedUrl || "",
      });
    }
  }, [contactInfo]);

  const handleChange = (field: string, value: string) => {
    setForm(prev => ({ ...prev, [field]: value }));
  };

  const handleSave = () => {
    updateContact.mutate(
      { data: form },
      {
        onSuccess: () => {
          toast({ title: "تم حفظ معلومات التواصل بنجاح" });
          queryClient.invalidateQueries({ queryKey: getGetContactInfoQueryKey() });
        },
        onError: () => {
          toast({ variant: "destructive", title: "حدث خطأ أثناء الحفظ" });
        },
      }
    );
  };

  if (isLoading) {
    return (
      <AdminLayout>
        <div className="flex items-center justify-center h-64">جاري التحميل...</div>
      </AdminLayout>
    );
  }

  return (
    <AdminLayout>
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-slate-900 mb-2">معلومات التواصل</h1>
        <p className="text-slate-500">تعديل معلومات التواصل التي تظهر في جميع صفحات الموقع</p>
      </div>

      <div className="space-y-6">
        <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-6">
          <h2 className="text-lg font-bold text-slate-800 mb-4 flex items-center gap-2">
            <Phone size={20} className="text-primary" />
            أرقام الهاتف
          </h2>
          <div className="grid md:grid-cols-2 gap-4">
            <div>
              <Label>الهاتف الأول</Label>
              <Input dir="ltr" className="text-right mt-1" value={form.phone1} onChange={e => handleChange("phone1", e.target.value)} placeholder="+967 1 234 567" />
            </div>
            <div>
              <Label>الهاتف الثاني</Label>
              <Input dir="ltr" className="text-right mt-1" value={form.phone2} onChange={e => handleChange("phone2", e.target.value)} placeholder="+967 777 123 456" />
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-6">
          <h2 className="text-lg font-bold text-slate-800 mb-4 flex items-center gap-2">
            <Mail size={20} className="text-primary" />
            البريد الإلكتروني
          </h2>
          <div className="grid md:grid-cols-2 gap-4">
            <div>
              <Label>البريد الأول</Label>
              <Input dir="ltr" className="text-right mt-1" value={form.email1} onChange={e => handleChange("email1", e.target.value)} placeholder="info@almossah.org" />
            </div>
            <div>
              <Label>البريد الثاني</Label>
              <Input dir="ltr" className="text-right mt-1" value={form.email2} onChange={e => handleChange("email2", e.target.value)} placeholder="support@almossah.org" />
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-6">
          <h2 className="text-lg font-bold text-slate-800 mb-4 flex items-center gap-2">
            <MapPin size={20} className="text-primary" />
            العنوان
          </h2>
          <div className="grid md:grid-cols-2 gap-4">
            <div>
              <Label>العنوان الرئيسي</Label>
              <Input className="mt-1" value={form.address} onChange={e => handleChange("address", e.target.value)} placeholder="الجمهورية اليمنية - أمانة العاصمة" />
            </div>
            <div>
              <Label>تفاصيل العنوان</Label>
              <Input className="mt-1" value={form.addressDetail} onChange={e => handleChange("addressDetail", e.target.value)} placeholder="شارع الزبيري، مبنى المركز التجاري" />
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-6">
          <h2 className="text-lg font-bold text-slate-800 mb-4 flex items-center gap-2">
            <Clock size={20} className="text-primary" />
            ساعات العمل
          </h2>
          <div className="grid md:grid-cols-2 gap-4">
            <div>
              <Label>أيام العمل</Label>
              <Input className="mt-1" value={form.workHours} onChange={e => handleChange("workHours", e.target.value)} placeholder="السبت - الخميس: 8:00 صباحاً - 4:00 مساءً" />
            </div>
            <div>
              <Label>أيام الإجازة</Label>
              <Input className="mt-1" value={form.workHoursOff} onChange={e => handleChange("workHoursOff", e.target.value)} placeholder="الجمعة: مغلق" />
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-6">
          <h2 className="text-lg font-bold text-slate-800 mb-4 flex items-center gap-2">
            <Globe size={20} className="text-primary" />
            وسائل التواصل الاجتماعي
          </h2>
          <div className="grid md:grid-cols-2 gap-4">
            <div>
              <Label className="flex items-center gap-2"><FaFacebook className="text-blue-600" /> فيسبوك</Label>
              <Input dir="ltr" className="text-right mt-1" value={form.facebookUrl} onChange={e => handleChange("facebookUrl", e.target.value)} placeholder="https://facebook.com/..." />
            </div>
            <div>
              <Label className="flex items-center gap-2"><FaTwitter className="text-sky-500" /> تويتر</Label>
              <Input dir="ltr" className="text-right mt-1" value={form.twitterUrl} onChange={e => handleChange("twitterUrl", e.target.value)} placeholder="https://twitter.com/..." />
            </div>
            <div>
              <Label className="flex items-center gap-2"><FaInstagram className="text-pink-500" /> انستغرام</Label>
              <Input dir="ltr" className="text-right mt-1" value={form.instagramUrl} onChange={e => handleChange("instagramUrl", e.target.value)} placeholder="https://instagram.com/..." />
            </div>
            <div>
              <Label className="flex items-center gap-2"><FaYoutube className="text-red-600" /> يوتيوب</Label>
              <Input dir="ltr" className="text-right mt-1" value={form.youtubeUrl} onChange={e => handleChange("youtubeUrl", e.target.value)} placeholder="https://youtube.com/..." />
            </div>
            <div>
              <Label className="flex items-center gap-2"><FaLinkedin className="text-blue-700" /> لينكدإن</Label>
              <Input dir="ltr" className="text-right mt-1" value={form.linkedinUrl} onChange={e => handleChange("linkedinUrl", e.target.value)} placeholder="https://linkedin.com/..." />
            </div>
            <div>
              <Label className="flex items-center gap-2"><FaWhatsapp className="text-green-500" /> واتساب</Label>
              <Input dir="ltr" className="text-right mt-1" value={form.whatsappNumber} onChange={e => handleChange("whatsappNumber", e.target.value)} placeholder="+967 ..." />
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-6">
          <h2 className="text-lg font-bold text-slate-800 mb-4 flex items-center gap-2">
            <MapPin size={20} className="text-primary" />
            رابط خريطة Google Maps
          </h2>
          <div>
            <Label>رابط التضمين (Embed URL)</Label>
            <Input dir="ltr" className="text-right mt-1" value={form.mapEmbedUrl} onChange={e => handleChange("mapEmbedUrl", e.target.value)} placeholder="https://www.google.com/maps/embed?..." />
          </div>
        </div>

        <div className="flex justify-end">
          <Button
            onClick={handleSave}
            disabled={updateContact.isPending}
            className="bg-primary hover:bg-primary/90 text-white px-8 h-11 text-base"
          >
            <Save size={18} className="ml-2" />
            {updateContact.isPending ? "جاري الحفظ..." : "حفظ التغييرات"}
          </Button>
        </div>
      </div>
    </AdminLayout>
  );
}
