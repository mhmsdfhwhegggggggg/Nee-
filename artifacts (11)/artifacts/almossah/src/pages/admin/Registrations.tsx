import { AdminLayout } from "@/components/layout/AdminLayout";
import { useListRegistrations, useUpdateRegistration, useDeleteRegistration } from "@workspace/api-client-react";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { Check, X, Trash2 } from "lucide-react";
import { useQueryClient } from "@tanstack/react-query";
import { getListRegistrationsQueryKey } from "@workspace/api-client-react";

export default function Registrations() {
  const { data: registrationsData, isLoading } = useListRegistrations();
  const updateStatus = useUpdateRegistration();
  const deleteReg = useDeleteRegistration();
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const handleStatusUpdate = (id: number, status: 'approved' | 'rejected') => {
    updateStatus.mutate(
      { id, data: { status } },
      {
        onSuccess: () => {
          toast({ title: `تم تحديث الحالة إلى ${status === 'approved' ? 'مقبول' : 'مرفوض'}` });
          queryClient.invalidateQueries({ queryKey: getListRegistrationsQueryKey() });
        },
        onError: () => toast({ variant: "destructive", title: "حدث خطأ أثناء التحديث" })
      }
    );
  };

  const handleDelete = (id: number) => {
    if (confirm("هل أنت متأكد من حذف هذا الطلب؟")) {
      deleteReg.mutate(
        { id },
        {
          onSuccess: () => {
            toast({ title: "تم حذف الطلب بنجاح" });
            queryClient.invalidateQueries({ queryKey: getListRegistrationsQueryKey() });
          },
          onError: () => toast({ variant: "destructive", title: "حدث خطأ أثناء الحذف" })
        }
      );
    }
  };

  return (
    <AdminLayout>
      <div className="mb-8 flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-slate-900 mb-2">طلبات التسجيل</h1>
          <p className="text-slate-500">إدارة ومراجعة طلبات التسجيل الواردة</p>
        </div>
      </div>

      <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
        {isLoading ? (
          <div className="p-8 text-center text-slate-500">جاري التحميل...</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-right text-sm">
              <thead className="bg-slate-50 border-b border-slate-200 text-slate-600">
                <tr>
                  <th className="px-4 py-4 font-medium">الاسم</th>
                  <th className="px-4 py-4 font-medium">التواصل</th>
                  <th className="px-4 py-4 font-medium">البرنامج / المدينة</th>
                  <th className="px-4 py-4 font-medium">التاريخ</th>
                  <th className="px-4 py-4 font-medium">الحالة</th>
                  <th className="px-4 py-4 font-medium text-center">إجراءات</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {registrationsData?.items?.map((reg) => (
                  <tr key={reg.id} className="hover:bg-slate-50 transition-colors">
                    <td className="px-4 py-4">
                      <div className="font-bold text-slate-900">{reg.fullName}</div>
                    </td>
                    <td className="px-4 py-4">
                      <div className="text-slate-600" dir="ltr">{reg.phone}</div>
                      <div className="text-slate-500 text-xs mt-1">{reg.email}</div>
                    </td>
                    <td className="px-4 py-4">
                      <div className="text-slate-900 font-medium">{reg.programType}</div>
                      <div className="text-slate-500 text-xs mt-1">{reg.city}</div>
                    </td>
                    <td className="px-4 py-4 text-slate-600">
                      {new Date(reg.createdAt).toLocaleDateString('ar-EG')}
                    </td>
                    <td className="px-4 py-4">
                      <span className={`px-2 py-1 rounded text-xs font-medium whitespace-nowrap
                        ${reg.status === 'approved' ? 'bg-emerald-100 text-emerald-700' : ''}
                        ${reg.status === 'pending' ? 'bg-amber-100 text-amber-700' : ''}
                        ${reg.status === 'rejected' ? 'bg-red-100 text-red-700' : ''}
                      `}>
                        {reg.status === 'approved' && 'مقبول'}
                        {reg.status === 'pending' && 'قيد الانتظار'}
                        {reg.status === 'rejected' && 'مرفوض'}
                      </span>
                    </td>
                    <td className="px-4 py-4">
                      <div className="flex items-center justify-center gap-2">
                        {reg.status === 'pending' && (
                          <>
                            <Button size="icon" variant="outline" className="text-emerald-600 hover:text-emerald-700 hover:bg-emerald-50 h-8 w-8" onClick={() => handleStatusUpdate(reg.id, 'approved')}>
                              <Check size={16} />
                            </Button>
                            <Button size="icon" variant="outline" className="text-red-600 hover:text-red-700 hover:bg-red-50 h-8 w-8" onClick={() => handleStatusUpdate(reg.id, 'rejected')}>
                              <X size={16} />
                            </Button>
                          </>
                        )}
                        <Button size="icon" variant="outline" className="text-slate-500 hover:text-red-600 hover:bg-red-50 h-8 w-8" onClick={() => handleDelete(reg.id)}>
                          <Trash2 size={16} />
                        </Button>
                      </div>
                    </td>
                  </tr>
                ))}
                {(!registrationsData?.items || registrationsData.items.length === 0) && (
                  <tr>
                    <td colSpan={6} className="px-6 py-8 text-center text-slate-500">لا توجد طلبات تسجيل</td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </AdminLayout>
  );
}