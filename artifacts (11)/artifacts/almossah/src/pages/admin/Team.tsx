import { AdminLayout } from "@/components/layout/AdminLayout";
import { useListTeam, useCreateTeamMember, useUpdateTeamMember, useDeleteTeamMember } from "@workspace/api-client-react";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Plus, Trash2, Edit2 } from "lucide-react";
import { useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { getListTeamQueryKey } from "@workspace/api-client-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";

export default function Team() {
  const { data: teamData, isLoading } = useListTeam();
  const create = useCreateTeamMember();
  const update = useUpdateTeamMember();
  const remove = useDeleteTeamMember();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  
  const [isOpen, setIsOpen] = useState(false);
  const [editingId, setEditingId] = useState<number | null>(null);
  
  const [formData, setFormData] = useState({
    name: "",
    role: "",
    bio: "",
    imageUrl: "",
    order: 0
  });

  const handleOpenEdit = (item: any) => {
    setFormData({
      name: item.name,
      role: item.role,
      bio: item.bio || "",
      imageUrl: item.imageUrl || "",
      order: item.order
    });
    setEditingId(item.id);
    setIsOpen(true);
  };

  const handleOpenAdd = () => {
    setFormData({
      name: "",
      role: "",
      bio: "",
      imageUrl: "",
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
            queryClient.invalidateQueries({ queryKey: getListTeamQueryKey() });
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
            queryClient.invalidateQueries({ queryKey: getListTeamQueryKey() });
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
            queryClient.invalidateQueries({ queryKey: getListTeamQueryKey() });
          }
        }
      );
    }
  };

  return (
    <AdminLayout>
      <div className="mb-8 flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-slate-900 mb-2">إدارة فريق العمل</h1>
          <p className="text-slate-500">إضافة وتعديل أعضاء فريق المؤسسة</p>
        </div>
        <Dialog open={isOpen} onOpenChange={setIsOpen}>
          <DialogTrigger asChild>
            <Button onClick={handleOpenAdd} className="bg-primary hover:bg-primary/90 text-white gap-2">
              <Plus size={18} />
              إضافة عضو
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-md font-sans" dir="rtl">
            <DialogHeader>
              <DialogTitle>{editingId ? 'تعديل بيانات العضو' : 'إضافة عضو جديد'}</DialogTitle>
            </DialogHeader>
            <form onSubmit={handleSubmit} className="space-y-4 mt-4">
              <div>
                <label className="block text-sm font-medium mb-1">الاسم</label>
                <Input required value={formData.name} onChange={e => setFormData({...formData, name: e.target.value})} />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">المنصب / الصفة</label>
                <Input required value={formData.role} onChange={e => setFormData({...formData, role: e.target.value})} />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">نبذة (اختياري)</label>
                <Textarea value={formData.bio} onChange={e => setFormData({...formData, bio: e.target.value})} />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">رابط الصورة (URL)</label>
                <Input dir="ltr" className="text-right" value={formData.imageUrl} onChange={e => setFormData({...formData, imageUrl: e.target.value})} />
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

      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
        {isLoading ? <div className="col-span-4 text-center py-10">جاري التحميل...</div> : null}
        
        {teamData?.items?.map(member => (
          <div key={member.id} className="bg-white rounded-xl border border-slate-200 overflow-hidden shadow-sm text-center p-6 relative group">
            <div className="absolute top-2 left-2 opacity-0 group-hover:opacity-100 transition-opacity flex gap-1 bg-white shadow rounded p-1">
              <Button size="icon" variant="ghost" className="h-6 w-6 text-blue-600 hover:bg-blue-50" onClick={() => handleOpenEdit(member)}>
                <Edit2 size={12} />
              </Button>
              <Button size="icon" variant="ghost" className="h-6 w-6 text-red-600 hover:bg-red-50" onClick={() => handleDelete(member.id)}>
                <Trash2 size={12} />
              </Button>
            </div>
            
            <div className="w-24 h-24 mx-auto rounded-full overflow-hidden mb-4 border-4 border-slate-50">
              <img 
                src={member.imageUrl || 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?auto=format&fit=crop&q=80&w=200'} 
                alt={member.name}
                className="w-full h-full object-cover"
              />
            </div>
            <h3 className="font-bold text-lg text-slate-900 mb-1">{member.name}</h3>
            <p className="text-primary text-sm font-medium mb-2">{member.role}</p>
            <p className="text-xs text-slate-500">الترتيب: {member.order}</p>
          </div>
        ))}
      </div>
    </AdminLayout>
  );
}