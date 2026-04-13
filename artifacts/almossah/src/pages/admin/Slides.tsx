import { useState } from "react";
import { AdminLayout } from "@/components/layout/AdminLayout";
import { useListSlides, useCreateSlide, useUpdateSlide, useDeleteSlide } from "@workspace/api-client-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useToast } from "@/hooks/use-toast";
import { Plus, Trash2, Edit2, Image as ImageIcon, Video, Eye, EyeOff, GripVertical } from "lucide-react";

interface SlideForm {
  title: string;
  subtitle: string;
  url: string;
  type: "image" | "video";
  active: boolean;
  order: number;
}

const DEFAULT_FORM: SlideForm = {
  title: "",
  subtitle: "",
  url: "",
  type: "image",
  active: true,
  order: 0,
};

export default function AdminSlides() {
  const { data: slides, refetch } = useListSlides();
  const createSlide = useCreateSlide();
  const updateSlide = useUpdateSlide();
  const deleteSlide = useDeleteSlide();
  const { toast } = useToast();

  const [showForm, setShowForm] = useState(false);
  const [editId, setEditId] = useState<number | null>(null);
  const [form, setForm] = useState<SlideForm>(DEFAULT_FORM);
  const [loading, setLoading] = useState(false);

  const resetForm = () => {
    setForm(DEFAULT_FORM);
    setEditId(null);
    setShowForm(false);
  };

  const handleEdit = (slide: NonNullable<typeof slides>[number]) => {
    setForm({
      title: slide.title,
      subtitle: slide.subtitle ?? "",
      url: slide.url,
      type: slide.type as "image" | "video",
      active: slide.active,
      order: slide.order,
    });
    setEditId(slide.id);
    setShowForm(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.title || !form.url) {
      toast({ variant: "destructive", title: "يرجى إدخال العنوان والرابط" });
      return;
    }
    setLoading(true);
    try {
      const data = {
        title: form.title,
        subtitle: form.subtitle || undefined,
        url: form.url,
        type: form.type,
        active: form.active,
        order: form.order,
      };

      if (editId) {
        await updateSlide.mutateAsync({ id: editId, data });
        toast({ title: "تم تحديث الشريحة بنجاح" });
      } else {
        await createSlide.mutateAsync({ data });
        toast({ title: "تم إضافة الشريحة بنجاح" });
      }
      await refetch();
      resetForm();
    } catch {
      toast({ variant: "destructive", title: "حدث خطأ، يرجى المحاولة مجدداً" });
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id: number) => {
    if (!confirm("هل أنت متأكد من حذف هذه الشريحة؟")) return;
    try {
      await deleteSlide.mutateAsync({ id });
      toast({ title: "تم حذف الشريحة" });
      await refetch();
    } catch {
      toast({ variant: "destructive", title: "فشل الحذف" });
    }
  };

  const handleToggleActive = async (slide: NonNullable<typeof slides>[number]) => {
    try {
      await updateSlide.mutateAsync({ id: slide.id, data: { active: !slide.active } });
      await refetch();
    } catch {
      toast({ variant: "destructive", title: "فشل التحديث" });
    }
  };

  return (
    <AdminLayout>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">إدارة شرائح الصفحة الرئيسية</h1>
            <p className="text-gray-600 mt-1">أضف صوراً وفيديوهات تظهر في قسم الوسائط بالصفحة الرئيسية</p>
          </div>
          <Button className="bg-primary hover:bg-primary/90" onClick={() => { resetForm(); setShowForm(true); }}>
            <Plus size={18} className="ml-2" />
            إضافة شريحة
          </Button>
        </div>

        {/* Form */}
        {showForm && (
          <div className="bg-white rounded-xl border border-gray-200 p-6 shadow-sm">
            <h2 className="text-lg font-bold text-gray-900 mb-6">
              {editId ? "تعديل الشريحة" : "إضافة شريحة جديدة"}
            </h2>
            <form onSubmit={handleSubmit} className="space-y-5">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">العنوان *</label>
                  <Input
                    value={form.title}
                    onChange={e => setForm(f => ({ ...f, title: e.target.value }))}
                    placeholder="عنوان الشريحة"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">العنوان الفرعي</label>
                  <Input
                    value={form.subtitle}
                    onChange={e => setForm(f => ({ ...f, subtitle: e.target.value }))}
                    placeholder="وصف قصير (اختياري)"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  {form.type === "image" ? "رابط الصورة *" : "رابط الفيديو (YouTube Embed) *"}
                </label>
                <Input
                  value={form.url}
                  onChange={e => setForm(f => ({ ...f, url: e.target.value }))}
                  placeholder={form.type === "image"
                    ? "https://example.com/image.jpg"
                    : "https://www.youtube.com/embed/VIDEO_ID"
                  }
                  dir="ltr"
                  required
                />
                {form.type === "video" && (
                  <p className="text-xs text-gray-500 mt-1">
                    للفيديوهات من YouTube، استخدم رابط الـ Embed مثل: https://www.youtube.com/embed/dQw4w9WgXcQ
                  </p>
                )}
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">نوع المحتوى</label>
                  <div className="flex gap-3">
                    <button
                      type="button"
                      onClick={() => setForm(f => ({ ...f, type: "image" }))}
                      className={`flex-1 flex items-center justify-center gap-2 py-2 px-4 rounded-lg border-2 transition-colors ${form.type === "image" ? "border-primary bg-primary/5 text-primary" : "border-gray-200 text-gray-600 hover:border-gray-300"}`}
                    >
                      <ImageIcon size={16} />
                      صورة
                    </button>
                    <button
                      type="button"
                      onClick={() => setForm(f => ({ ...f, type: "video" }))}
                      className={`flex-1 flex items-center justify-center gap-2 py-2 px-4 rounded-lg border-2 transition-colors ${form.type === "video" ? "border-primary bg-primary/5 text-primary" : "border-gray-200 text-gray-600 hover:border-gray-300"}`}
                    >
                      <Video size={16} />
                      فيديو
                    </button>
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">الترتيب</label>
                  <Input
                    type="number"
                    value={form.order}
                    onChange={e => setForm(f => ({ ...f, order: parseInt(e.target.value) || 0 }))}
                    min={0}
                    dir="ltr"
                  />
                </div>

                <div className="flex items-end">
                  <label className="flex items-center gap-3 cursor-pointer">
                    <div
                      onClick={() => setForm(f => ({ ...f, active: !f.active }))}
                      className={`relative w-12 h-6 rounded-full transition-colors ${form.active ? "bg-green-500" : "bg-gray-300"}`}
                    >
                      <div className={`absolute top-1 w-4 h-4 rounded-full bg-white shadow transition-transform ${form.active ? "right-1" : "left-1"}`} />
                    </div>
                    <span className="text-sm font-medium text-gray-700">{form.active ? "مفعّلة" : "مخفية"}</span>
                  </label>
                </div>
              </div>

              {/* Preview */}
              {form.url && form.type === "image" && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">معاينة</label>
                  <img
                    src={form.url}
                    alt="معاينة"
                    className="w-full max-h-40 object-cover rounded-lg border border-gray-200"
                    onError={e => { e.currentTarget.src = ""; e.currentTarget.style.display = "none"; }}
                  />
                </div>
              )}

              <div className="flex gap-3 pt-2">
                <Button type="submit" className="bg-primary hover:bg-primary/90" disabled={loading}>
                  {loading ? "جاري الحفظ..." : editId ? "حفظ التعديلات" : "إضافة الشريحة"}
                </Button>
                <Button type="button" variant="outline" onClick={resetForm}>إلغاء</Button>
              </div>
            </form>
          </div>
        )}

        {/* Slides List */}
        <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
          {!slides || slides.length === 0 ? (
            <div className="p-12 text-center">
              <ImageIcon size={48} className="mx-auto text-gray-300 mb-4" />
              <p className="text-gray-500 text-lg">لا توجد شرائح بعد</p>
              <p className="text-gray-400 text-sm mt-1">أضف صوراً أو فيديوهات لعرضها في الصفحة الرئيسية</p>
            </div>
          ) : (
            <div className="divide-y divide-gray-100">
              {slides.map((slide) => (
                <div key={slide.id} className="flex items-center gap-4 p-4 hover:bg-gray-50 transition-colors">
                  <GripVertical size={18} className="text-gray-300 shrink-0" />

                  {/* Thumbnail */}
                  <div className="w-20 h-14 rounded-lg overflow-hidden bg-gray-100 shrink-0">
                    {slide.type === "video" ? (
                      <div className="w-full h-full flex items-center justify-center bg-slate-800">
                        <Video size={20} className="text-white" />
                      </div>
                    ) : (
                      <img
                        src={slide.url}
                        alt={slide.title}
                        className="w-full h-full object-cover"
                        onError={e => { e.currentTarget.style.display = "none"; }}
                      />
                    )}
                  </div>

                  {/* Info */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <span className={`px-2 py-0.5 text-xs rounded-full font-medium ${slide.type === "video" ? "bg-blue-100 text-blue-700" : "bg-green-100 text-green-700"}`}>
                        {slide.type === "video" ? "فيديو" : "صورة"}
                      </span>
                      <span className="text-xs text-gray-400">ترتيب: {slide.order}</span>
                    </div>
                    <h3 className="font-semibold text-gray-900 truncate">{slide.title}</h3>
                    {slide.subtitle && <p className="text-sm text-gray-500 truncate">{slide.subtitle}</p>}
                  </div>

                  {/* Actions */}
                  <div className="flex items-center gap-2 shrink-0">
                    <button
                      onClick={() => handleToggleActive(slide)}
                      className={`p-2 rounded-lg transition-colors ${slide.active ? "text-green-600 hover:bg-green-50" : "text-gray-400 hover:bg-gray-100"}`}
                      title={slide.active ? "إخفاء" : "تفعيل"}
                    >
                      {slide.active ? <Eye size={18} /> : <EyeOff size={18} />}
                    </button>
                    <button
                      onClick={() => handleEdit(slide)}
                      className="p-2 rounded-lg text-blue-600 hover:bg-blue-50 transition-colors"
                    >
                      <Edit2 size={18} />
                    </button>
                    <button
                      onClick={() => handleDelete(slide.id)}
                      className="p-2 rounded-lg text-red-500 hover:bg-red-50 transition-colors"
                    >
                      <Trash2 size={18} />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </AdminLayout>
  );
}
