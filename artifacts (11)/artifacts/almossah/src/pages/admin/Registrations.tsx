import { AdminLayout } from "@/components/layout/AdminLayout";
import { useListRegistrations, useUpdateRegistration, useDeleteRegistration } from "@workspace/api-client-react";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { Check, X, Trash2, Eye } from "lucide-react";
import { useQueryClient } from "@tanstack/react-query";
import { getListRegistrationsQueryKey } from "@workspace/api-client-react";
import { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

export default function Registrations() {
  const { data: registrationsData, isLoading } = useListRegistrations();
  const updateStatus = useUpdateRegistration();
  const deleteReg = useDeleteRegistration();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [selectedReg, setSelectedReg] = useState<any>(null);

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
                  <th className="px-4 py-4 font-medium">القسم / المعدل</th>
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
                    <td className="px-4 py-4">
                      <div className="text-slate-900 font-medium">{reg.department || "-"}</div>
                      <div className="text-slate-500 text-xs mt-1">{reg.gpa ? `المعدل: ${reg.gpa}` : "-"}</div>
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
                        <Button size="icon" variant="outline" className="text-blue-600 hover:text-blue-700 hover:bg-blue-50 h-8 w-8" onClick={() => setSelectedReg(reg)}>
                          <Eye size={16} />
                        </Button>
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
                    <td colSpan={7} className="px-6 py-8 text-center text-slate-500">لا توجد طلبات تسجيل</td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        )}
      </div>

      <Dialog open={!!selectedReg} onOpenChange={() => setSelectedReg(null)}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto" dir="rtl">
          <DialogHeader>
            <DialogTitle className="text-xl">تفاصيل طلب التسجيل</DialogTitle>
          </DialogHeader>
          {selectedReg && (
            <div className="space-y-4 mt-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-sm text-slate-500">الاسم الكامل</p>
                  <p className="font-bold text-slate-900">{selectedReg.fullName}</p>
                </div>
                <div>
                  <p className="text-sm text-slate-500">البريد الإلكتروني</p>
                  <p className="font-medium text-slate-900">{selectedReg.email}</p>
                </div>
                <div>
                  <p className="text-sm text-slate-500">رقم الهاتف</p>
                  <p className="font-medium text-slate-900" dir="ltr">{selectedReg.phone}</p>
                </div>
                <div>
                  <p className="text-sm text-slate-500">المدينة</p>
                  <p className="font-medium text-slate-900">{selectedReg.city}</p>
                </div>
                <div>
                  <p className="text-sm text-slate-500">البرنامج</p>
                  <p className="font-medium text-slate-900">{selectedReg.programType}</p>
                </div>
                <div>
                  <p className="text-sm text-slate-500">القسم</p>
                  <p className="font-medium text-slate-900">{selectedReg.department || "غير محدد"}</p>
                </div>
                <div>
                  <p className="text-sm text-slate-500">المعدل</p>
                  <p className="font-medium text-slate-900">{selectedReg.gpa || "غير محدد"}</p>
                </div>
                <div>
                  <p className="text-sm text-slate-500">الحالة</p>
                  <span className={`px-2 py-1 rounded text-xs font-medium
                    ${selectedReg.status === 'approved' ? 'bg-emerald-100 text-emerald-700' : ''}
                    ${selectedReg.status === 'pending' ? 'bg-amber-100 text-amber-700' : ''}
                    ${selectedReg.status === 'rejected' ? 'bg-red-100 text-red-700' : ''}
                  `}>
                    {selectedReg.status === 'approved' && 'مقبول'}
                    {selectedReg.status === 'pending' && 'قيد الانتظار'}
                    {selectedReg.status === 'rejected' && 'مرفوض'}
                  </span>
                </div>
              </div>

              <div className="border-t pt-4">
                <h3 className="font-bold text-slate-800 mb-3">اختيارات الجامعات</h3>
                <div className="grid grid-cols-3 gap-4">
                  <div>
                    <p className="text-sm text-slate-500">الخيار الأول</p>
                    <p className="font-medium text-slate-900">{selectedReg.universityChoice1 || "غير محدد"}</p>
                  </div>
                  <div>
                    <p className="text-sm text-slate-500">الخيار الثاني</p>
                    <p className="font-medium text-slate-900">{selectedReg.universityChoice2 || "غير محدد"}</p>
                  </div>
                  <div>
                    <p className="text-sm text-slate-500">الخيار الثالث</p>
                    <p className="font-medium text-slate-900">{selectedReg.universityChoice3 || "غير محدد"}</p>
                  </div>
                </div>
              </div>

              {selectedReg.certificateImageUrl && (
                <div className="border-t pt-4">
                  <h3 className="font-bold text-slate-800 mb-3">صورة الشهادة الثانوية</h3>
                  <img src={selectedReg.certificateImageUrl} alt="صورة الشهادة" className="max-w-full max-h-80 rounded-xl border border-slate-200 object-contain" />
                </div>
              )}

              {selectedReg.message && (
                <div className="border-t pt-4">
                  <p className="text-sm text-slate-500">ملاحظات إضافية</p>
                  <p className="font-medium text-slate-900">{selectedReg.message}</p>
                </div>
              )}
            </div>
          )}
        </DialogContent>
      </Dialog>
    </AdminLayout>
  );
}
