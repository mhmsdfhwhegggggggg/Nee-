import { AdminLayout } from "@/components/layout/AdminLayout";
import { useListPartners, useCreatePartner, useUpdatePartner, useDeletePartner } from "@workspace/api-client-react";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Plus, Trash2, Edit2 } from "lucide-react";
import { useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { getListPartnersQueryKey } from "@workspace/api-client-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";

export default function Partners() {
  const { data: partnersData, isLoading } = useListPartners();
  const create = useCreatePartner();
  const update = useUpdatePartner();
  const remove = useDeletePartner();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  
  const [isOpen, setIsOpen] = useState(false);
  const [editingId, setEditingId] = useState<number | null>(null);
  
  const [formData, setFormData] = useState({
    name: "",
    logoUrl: "",
    website: "",
    type: "university" as any,
    order: 0
  });

  const handleOpenEdit = (item: any) => {
    setFormData({
      name: item.name,
      logoUrl: item.logoUrl,
      website: item.website || "",
      type: item.type,
      order: item.order
    });
    setEditingId(item.id);
    setIsOpen(true);
  };

  const handleOpenAdd = () => {
    setFormData({
      name: "",
      logoUrl: "",
      website: "",
      type: "university",
      order: 0
    });
    setEditingId(null);
    setIsOpen(true);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (editingId) {
      update.mutate(
        { id: editingId, data: formData },
        {
          onSuccess: () => {
            toast({ title: "تم التحديث بنجاح" });
            queryClient.invalidateQueries({ queryKey: getListPartnersQueryKey() });
            setIsOpen(false);
          }
        }
      );
    } else {
      create.mutate(
        { data: formData },
        {
          onSuccess: () => {
            toast({ title: "تمت الإضافة بنجاح" });
            queryClient.invalidateQueries({ queryKey: getListPartnersQueryKey() });
            setIsOpen(false);
          }
        }
      );
    }
  };

  const handleDelete = (id: number) => {
    if (confirm("هل أنت متأكد من الحذف؟")) {
      remove.mutate(
        { id },
        {
          onSuccess: () => {
            toast({ title: "تم الحذف بنجاح" });
            queryClient.invalidateQueries({ queryKey: getListPartnersQueryKey() });
          }
        }
      );
    }
  };

  return (
    <AdminLayout>
      <div className="mb-8 flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-slate-900 mb-2">إدارة الشركاء</h1>
          <p className="text-slate-500">إضافة وتعديل شركاء النجاح</p>
        </div>
        <Dialog open={isOpen} onOpenChange={setIsOpen}>
          <DialogTrigger asChild>
            <Button onClick={handleOpenAdd} className="bg-primary hover:bg-primary/90 text-white gap-2">
              <Plus size={18} />
              إضافة شريك
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-md font-sans" dir="rtl">
            <DialogHeader>
              <DialogTitle>{editingId ? 'تعديل شريك' : 'إضافة شريك جديد'}</DialogTitle>
            </DialogHeader>
            <form onSubmit={handleSubmit} className="space-y-4 mt-4">
              <div>
                <label className="block text-sm font-medium mb-1">اسم الجهة</label>
                <Input required value={formData.name} onChange={e => setFormData({...formData, name: e.target.value})} />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">النوع</label>
                <Select value={formData.type} onValueChange={(v: any) => setFormData({...formData, type: v})}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="university">جامعة</SelectItem>
                    <SelectItem value="institute">معهد</SelectItem>
                    <SelectItem value="company">شركة</SelectItem>
                    <SelectItem value="organization">منظمة</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">رابط الشعار (URL)</label>
                <Input dir="ltr" required className="text-right" value={formData.logoUrl} onChange={e => setFormData({...formData, logoUrl: e.target.value})} />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">الموقع الإلكتروني (اختياري)</label>
                <Input dir="ltr" className="text-right" value={formData.website} onChange={e => setFormData({...formData, website: e.target.value})} />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">الترتيب</label>
                <Input type="number" required value={formData.order} onChange={e => setFormData({...formData, order: Number(e.target.value)})} />
              </div>
              <Button type="submit" className="w-full mt-4" disabled={create.isPending || update.isPending}>حفظ</Button>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
        {isLoading ? (
          <div className="p-8 text-center text-slate-500">جاري التحميل...</div>
        ) : (
          <table className="w-full text-right text-sm">
            <thead className="bg-slate-50 border-b border-slate-200 text-slate-600">
              <tr>
                <th className="px-6 py-4 font-medium">الشعار</th>
                <th className="px-6 py-4 font-medium">الاسم</th>
                <th className="px-6 py-4 font-medium">النوع</th>
                <th className="px-6 py-4 font-medium">الترتيب</th>
                <th className="px-6 py-4 font-medium text-center">إجراءات</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {partnersData?.items?.map((item) => (
                <tr key={item.id} className="hover:bg-slate-50">
                  <td className="px-6 py-4">
                    <div className="w-16 h-12 bg-white border border-slate-100 rounded flex items-center justify-center p-1">
                      <img src={item.logoUrl} alt="" className="max-w-full max-h-full object-contain" />
                    </div>
                  </td>
                  <td className="px-6 py-4 font-bold text-slate-900">{item.name}</td>
                  <td className="px-6 py-4 text-slate-600">{item.type}</td>
                  <td className="px-6 py-4 text-slate-600">{item.order}</td>
                  <td className="px-6 py-4">
                    <div className="flex items-center justify-center gap-2">
                      <Button size="icon" variant="ghost" className="text-blue-600 hover:bg-blue-50 h-8 w-8" onClick={() => handleOpenEdit(item)}>
                        <Edit2 size={16} />
                      </Button>
                      <Button size="icon" variant="ghost" className="text-red-600 hover:bg-red-50 h-8 w-8" onClick={() => handleDelete(item.id)}>
                        <Trash2 size={16} />
                      </Button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </AdminLayout>
  );
}