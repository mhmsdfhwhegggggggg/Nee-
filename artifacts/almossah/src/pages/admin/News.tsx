import { AdminLayout } from "@/components/layout/AdminLayout";
import { useListNews, useCreateNews, useUpdateNews, useDeleteNews } from "@workspace/api-client-react";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Plus, Trash2, Edit2 } from "lucide-react";
import { useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { getListNewsQueryKey } from "@workspace/api-client-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";

export default function News() {
  const { data: newsData, isLoading } = useListNews();
  const createNews = useCreateNews();
  const updateNews = useUpdateNews();
  const deleteNews = useDeleteNews();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  
  const [isOpen, setIsOpen] = useState(false);
  const [editingId, setEditingId] = useState<number | null>(null);
  
  const [formData, setFormData] = useState({
    title: "",
    excerpt: "",
    content: "",
    imageUrl: "",
    type: "news" as "news" | "event",
    published: true
  });

  const handleOpenEdit = (item: any) => {
    setFormData({
      title: item.title,
      excerpt: item.excerpt,
      content: item.content,
      imageUrl: item.imageUrl || "",
      type: item.type,
      published: item.published
    });
    setEditingId(item.id);
    setIsOpen(true);
  };

  const handleOpenAdd = () => {
    setFormData({
      title: "",
      excerpt: "",
      content: "",
      imageUrl: "",
      type: "news",
      published: true
    });
    setEditingId(null);
    setIsOpen(true);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (editingId) {
      updateNews.mutate(
        { id: editingId, data: formData },
        {
          onSuccess: () => {
            toast({ title: "تم التحديث بنجاح" });
            queryClient.invalidateQueries({ queryKey: getListNewsQueryKey() });
            setIsOpen(false);
          }
        }
      );
    } else {
      createNews.mutate(
        { data: formData },
        {
          onSuccess: () => {
            toast({ title: "تمت الإضافة بنجاح" });
            queryClient.invalidateQueries({ queryKey: getListNewsQueryKey() });
            setIsOpen(false);
          }
        }
      );
    }
  };

  const handleDelete = (id: number) => {
    if (confirm("هل أنت متأكد من الحذف؟")) {
      deleteNews.mutate(
        { id },
        {
          onSuccess: () => {
            toast({ title: "تم الحذف بنجاح" });
            queryClient.invalidateQueries({ queryKey: getListNewsQueryKey() });
          }
        }
      );
    }
  };

  return (
    <AdminLayout>
      <div className="mb-8 flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-slate-900 mb-2">إدارة الأخبار والفعاليات</h1>
          <p className="text-slate-500">إضافة وتعديل أخبار المؤسسة</p>
        </div>
        <Dialog open={isOpen} onOpenChange={setIsOpen}>
          <DialogTrigger asChild>
            <Button onClick={handleOpenAdd} className="bg-primary hover:bg-primary/90 text-white gap-2">
              <Plus size={18} />
              إضافة جديد
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-2xl font-sans" dir="rtl">
            <DialogHeader>
              <DialogTitle>{editingId ? 'تعديل' : 'إضافة جديد'}</DialogTitle>
            </DialogHeader>
            <form onSubmit={handleSubmit} className="space-y-4 mt-4">
              <div>
                <label className="block text-sm font-medium mb-1">العنوان</label>
                <Input required value={formData.title} onChange={e => setFormData({...formData, title: e.target.value})} />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">النوع</label>
                <Select value={formData.type} onValueChange={(v: "news" | "event") => setFormData({...formData, type: v})}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="news">خبر</SelectItem>
                    <SelectItem value="event">فعالية</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">مقتطف (وصف قصير)</label>
                <Textarea required value={formData.excerpt} onChange={e => setFormData({...formData, excerpt: e.target.value})} />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">المحتوى</label>
                <Textarea required className="min-h-[150px]" value={formData.content} onChange={e => setFormData({...formData, content: e.target.value})} />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">رابط الصورة</label>
                <Input dir="ltr" className="text-right" value={formData.imageUrl} onChange={e => setFormData({...formData, imageUrl: e.target.value})} />
              </div>
              <Button type="submit" className="w-full mt-4" disabled={createNews.isPending || updateNews.isPending}>حفظ</Button>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {isLoading ? <div className="col-span-3 text-center py-10">جاري التحميل...</div> : null}
        
        {newsData?.items?.map(item => (
          <div key={item.id} className="bg-white rounded-xl border border-slate-200 overflow-hidden shadow-sm flex flex-col">
            <div className="h-40 bg-slate-100 overflow-hidden relative">
              <span className="absolute top-2 right-2 bg-black/50 text-white px-2 py-1 rounded text-xs z-10">
                {item.type === 'news' ? 'خبر' : 'فعالية'}
              </span>
              {item.imageUrl ? (
                <img src={item.imageUrl} alt="" className="w-full h-full object-cover" />
              ) : (
                <div className="w-full h-full flex items-center justify-center text-slate-400">لا توجد صورة</div>
              )}
            </div>
            <div className="p-5 flex-1 flex flex-col">
              <h3 className="font-bold text-lg mb-2 line-clamp-1">{item.title}</h3>
              <p className="text-slate-500 text-sm mb-4 line-clamp-2">{item.excerpt}</p>
              <div className="mt-auto flex justify-between items-center pt-4 border-t border-slate-100">
                <span className="text-xs text-slate-400">{new Date(item.createdAt).toLocaleDateString('ar-EG')}</span>
                <div className="flex gap-2">
                  <Button size="icon" variant="ghost" className="h-8 w-8 text-blue-600 hover:bg-blue-50" onClick={() => handleOpenEdit(item)}>
                    <Edit2 size={16} />
                  </Button>
                  <Button size="icon" variant="ghost" className="h-8 w-8 text-red-600 hover:bg-red-50" onClick={() => handleDelete(item.id)}>
                    <Trash2 size={16} />
                  </Button>
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>
    </AdminLayout>
  );
}