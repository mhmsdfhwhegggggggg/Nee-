import { AdminLayout } from "@/components/layout/AdminLayout";
import { useListRegistrations, useUpdateRegistration, useDeleteRegistration, getListRegistrationsQueryKey } from "@workspace/api-client-react";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { Check, X, Trash2, Eye, Bot, RefreshCw, Filter } from "lucide-react";
import { useQueryClient } from "@tanstack/react-query";
import { useState, useEffect, useRef, useCallback } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

type FilterType = "all" | "nassir" | "manual" | "pending";

export default function Registrations() {
  const { data: registrationsData, isLoading } = useListRegistrations();
  const updateStatus = useUpdateRegistration();
  const deleteReg = useDeleteRegistration();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [selectedReg, setSelectedReg] = useState<any>(null);
  const [filter, setFilter] = useState<FilterType>("all");
  const [refreshing, setRefreshing] = useState(false);
  const [lastRefreshed, setLastRefreshed] = useState<Date>(new Date());
  const prevTotalRef = useRef<number | null>(null);
  const [newIds, setNewIds] = useState<Set<number>>(new Set());

  const refresh = useCallback(async () => {
    setRefreshing(true);
    await queryClient.invalidateQueries({ queryKey: getListRegistrationsQueryKey() });
    setLastRefreshed(new Date());
    setTimeout(() => setRefreshing(false), 600);
  }, [queryClient]);

  // Auto-refresh every 15 seconds
  useEffect(() => {
    const interval = setInterval(refresh, 15000);
    return () => clearInterval(interval);
  }, [refresh]);

  // Detect and highlight newly arrived registrations
  useEffect(() => {
    const items = registrationsData?.items;
    if (!items) return;
    const total = items.length;
    if (prevTotalRef.current !== null && total > prevTotalRef.current) {
      const diff = total - prevTotalRef.current;
      const newItemIds = items.slice(0, diff).map((r: any) => r.id as number);
      setNewIds(new Set(newItemIds));
      // Clear highlights after 10 seconds
      setTimeout(() => setNewIds(new Set()), 10000);
      toast({
        title: `🔔 ${diff} طلب${diff > 1 ? "ات" : ""} جديد عبر ناصر!`,
        description: "الطلبات الجديدة محددة باللون الأزرق.",
      });
    }
    prevTotalRef.current = total;
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [registrationsData?.items?.length]);

  const handleStatusUpdate = (id: number, status: "approved" | "rejected") => {
    updateStatus.mutate(
      { id, data: { status } },
      {
        onSuccess: () => {
          toast({ title: `تم تحديث الحالة إلى ${status === "approved" ? "مقبول" : "مرفوض"}` });
          queryClient.invalidateQueries({ queryKey: getListRegistrationsQueryKey() });
        },
        onError: () => toast({ variant: "destructive", title: "حدث خطأ أثناء التحديث" }),
      },
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
          onError: () => toast({ variant: "destructive", title: "حدث خطأ أثناء الحذف" }),
        },
      );
    }
  };

  const allItems: any[] = registrationsData?.items || [];
  const filteredItems = allItems.filter((reg: any) => {
    const isNassir = (reg.message || "").includes("ناصر");
    if (filter === "nassir") return isNassir;
    if (filter === "manual") return !isNassir;
    if (filter === "pending") return reg.status === "pending";
    return true;
  });

  const nassirCount = allItems.filter((r: any) => (r.message || "").includes("ناصر")).length;
  const pendingCount = allItems.filter((r: any) => r.status === "pending").length;

  return (
    <AdminLayout>
      <div className="mb-6 flex items-start justify-between gap-4 flex-wrap">
        <div>
          <h1 className="text-3xl font-bold text-slate-900 mb-1">طلبات التسجيل</h1>
          <p className="text-slate-400 text-xs">
            آخر تحديث: {lastRefreshed.toLocaleTimeString("ar-EG")} — يتجدد كل 15 ثانية
          </p>
        </div>
        <button
          onClick={refresh}
          className="flex items-center gap-2 text-sm text-slate-500 hover:text-primary border border-slate-200 hover:border-primary px-3 py-1.5 rounded-lg transition-colors"
        >
          <RefreshCw size={14} className={refreshing ? "animate-spin" : ""} />
          تحديث
        </button>
      </div>

      {/* Stats bar */}
      <div className="flex flex-wrap gap-3 mb-5">
        {[
          { key: "all",     label: `الكل (${allItems.length})`,              color: "border-slate-300 text-slate-700 bg-white" },
          { key: "nassir",  label: `🤖 عبر ناصر (${nassirCount})`,           color: "border-primary/40 text-primary bg-primary/5" },
          { key: "manual",  label: `✍️ يدوي (${allItems.length - nassirCount})`, color: "border-slate-300 text-slate-600 bg-white" },
          { key: "pending", label: `⏳ قيد الانتظار (${pendingCount})`,      color: "border-amber-300 text-amber-700 bg-amber-50" },
        ].map((f) => (
          <button
            key={f.key}
            onClick={() => setFilter(f.key as FilterType)}
            className={`text-xs font-semibold px-3 py-1.5 rounded-full border transition-all ${filter === f.key ? "ring-2 ring-offset-1 ring-primary shadow-sm" : ""} ${f.color}`}
          >
            {f.label}
          </button>
        ))}
      </div>

      <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
        {isLoading ? (
          <div className="p-8 text-center text-slate-400 flex items-center justify-center gap-2">
            <div className="w-5 h-5 border-2 border-primary/30 border-t-primary rounded-full animate-spin" />
            جاري التحميل...
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-right text-sm">
              <thead className="bg-slate-50 border-b border-slate-200 text-slate-600">
                <tr>
                  <th className="px-4 py-4 font-medium">الاسم</th>
                  <th className="px-4 py-4 font-medium">التواصل</th>
                  <th className="px-4 py-4 font-medium">البرنامج / المدينة</th>
                  <th className="px-4 py-4 font-medium">القسم / المعدل</th>
                  <th className="px-4 py-4 font-medium">المصدر</th>
                  <th className="px-4 py-4 font-medium">التاريخ</th>
                  <th className="px-4 py-4 font-medium">الحالة</th>
                  <th className="px-4 py-4 font-medium text-center">إجراءات</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filteredItems.map((reg: any) => {
                  const isNassir = (reg.message || "").includes("ناصر");
                  const isNew = newIds.has(reg.id);
                  const sourcePlatform = (reg.message || "").match(/\(([^)]+)\)/)?.[1];

                  return (
                    <tr
                      key={reg.id}
                      className={`hover:bg-slate-50 transition-all ${
                        isNew      ? "bg-blue-50 ring-1 ring-inset ring-blue-200" :
                        isNassir   ? "bg-blue-50/20" : ""
                      }`}
                    >
                      <td className="px-4 py-4">
                        <div className="font-bold text-slate-900 flex items-center gap-1.5 flex-wrap">
                          {reg.fullName}
                          {isNassir && (
                            <span className="inline-flex items-center gap-0.5 bg-primary/10 text-primary text-xs px-1.5 py-0.5 rounded font-semibold whitespace-nowrap">
                              <Bot size={9} /> ناصر
                            </span>
                          )}
                          {isNew && (
                            <span className="bg-blue-500 text-white text-xs px-1.5 py-0.5 rounded font-bold animate-pulse whitespace-nowrap">
                              جديد!
                            </span>
                          )}
                        </div>
                      </td>
                      <td className="px-4 py-4">
                        <div className="text-slate-600" dir="ltr">{reg.phone}</div>
                        <div className="text-slate-400 text-xs mt-0.5">{reg.email}</div>
                      </td>
                      <td className="px-4 py-4">
                        <div className="text-slate-900 font-medium">{reg.programType}</div>
                        <div className="text-slate-400 text-xs mt-0.5">{reg.city}</div>
                      </td>
                      <td className="px-4 py-4">
                        <div className="text-slate-900 font-medium">{reg.department || "—"}</div>
                        <div className="text-slate-400 text-xs mt-0.5">{reg.gpa ? `معدل: ${reg.gpa}` : "—"}</div>
                        {(reg.specialty || reg.universityChoice1) && (
                          <div className="text-emerald-700 text-xs mt-1 font-medium truncate max-w-[180px]" title={reg.specialty || reg.universityChoice1}>
                            🎓 {reg.specialty || reg.universityChoice1}
                          </div>
                        )}
                      </td>
                      <td className="px-4 py-4">
                        {isNassir ? (
                          <span className="inline-flex items-center gap-1 text-xs text-blue-700 font-medium bg-blue-50 px-2 py-0.5 rounded-full border border-blue-200 whitespace-nowrap">
                            <Bot size={10} />
                            {sourcePlatform || "ناصر"}
                          </span>
                        ) : (
                          <span className="text-xs text-slate-400">يدوي</span>
                        )}
                      </td>
                      <td className="px-4 py-4 text-slate-500 text-xs whitespace-nowrap">
                        {new Date(reg.createdAt).toLocaleDateString("ar-EG")}
                        <div className="text-slate-300 mt-0.5">
                          {new Date(reg.createdAt).toLocaleTimeString("ar-EG", { hour: "2-digit", minute: "2-digit" })}
                        </div>
                      </td>
                      <td className="px-4 py-4">
                        <span className={`px-2 py-1 rounded text-xs font-medium
                          ${reg.status === "approved" ? "bg-emerald-100 text-emerald-700" : ""}
                          ${reg.status === "pending"  ? "bg-amber-100 text-amber-700"   : ""}
                          ${reg.status === "rejected" ? "bg-red-100 text-red-700"       : ""}
                        `}>
                          {reg.status === "approved" && "مقبول"}
                          {reg.status === "pending"  && "قيد الانتظار"}
                          {reg.status === "rejected" && "مرفوض"}
                        </span>
                      </td>
                      <td className="px-4 py-4">
                        <div className="flex items-center justify-center gap-1.5">
                          <Button size="icon" variant="outline" className="text-blue-600 hover:text-blue-700 hover:bg-blue-50 h-8 w-8" onClick={() => setSelectedReg(reg)}>
                            <Eye size={14} />
                          </Button>
                          {reg.status === "pending" && (
                            <>
                              <Button size="icon" variant="outline" className="text-emerald-600 hover:text-emerald-700 hover:bg-emerald-50 h-8 w-8" onClick={() => handleStatusUpdate(reg.id, "approved")}>
                                <Check size={14} />
                              </Button>
                              <Button size="icon" variant="outline" className="text-red-600 hover:text-red-700 hover:bg-red-50 h-8 w-8" onClick={() => handleStatusUpdate(reg.id, "rejected")}>
                                <X size={14} />
                              </Button>
                            </>
                          )}
                          <Button size="icon" variant="outline" className="text-slate-400 hover:text-red-600 hover:bg-red-50 h-8 w-8" onClick={() => handleDelete(reg.id)}>
                            <Trash2 size={14} />
                          </Button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
                {filteredItems.length === 0 && (
                  <tr>
                    <td colSpan={8} className="px-6 py-10 text-center text-slate-400">
                      <Filter size={28} className="mx-auto mb-2 opacity-30" />
                      لا توجد طلبات بهذا الفلتر
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Detail dialog */}
      <Dialog open={!!selectedReg} onOpenChange={() => setSelectedReg(null)}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto" dir="rtl">
          <DialogHeader>
            <DialogTitle className="text-xl flex items-center gap-2">
              تفاصيل طلب التسجيل
              {selectedReg && (selectedReg.message || "").includes("ناصر") && (
                <span className="inline-flex items-center gap-1 bg-primary/10 text-primary text-sm px-2 py-0.5 rounded font-semibold">
                  <Bot size={13} /> عبر ناصر
                </span>
              )}
            </DialogTitle>
          </DialogHeader>
          {selectedReg && (
            <div className="space-y-4 mt-4">
              <div className="grid grid-cols-2 gap-4">
                {[
                  ["الاسم الكامل", selectedReg.fullName],
                  ["رقم الهاتف", selectedReg.phone],
                  ["البريد الإلكتروني", selectedReg.email],
                  ["المدينة", selectedReg.city],
                  ["البرنامج", selectedReg.programType],
                  ["القسم", selectedReg.department || "—"],
                  ["المعدل", selectedReg.gpa || "—"],
                  ["التخصص المطلوب", (selectedReg.specialty ?? (selectedReg.specialtyWanted ?? "—"))],
                ].map(([label, value]) => (
                  <div key={label}>
                    <p className="text-xs text-slate-400 mb-0.5">{label}</p>
                    <p className="font-semibold text-slate-900">{value}</p>
                  </div>
                ))}
              </div>

              {/* Source info */}
              {(selectedReg.message || "").includes("ناصر") && (
                <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
                  <p className="text-xs font-bold text-blue-700 mb-1 flex items-center gap-1">
                    <Bot size={12} /> مصدر التسجيل
                  </p>
                  <p className="text-sm text-blue-800">{selectedReg.message}</p>
                </div>
              )}

              {/* Status */}
              <div className="flex items-center gap-3 pt-2">
                <span className="text-xs text-slate-400">الحالة الحالية:</span>
                <span className={`px-3 py-1 rounded-full text-xs font-bold
                  ${selectedReg.status === "approved" ? "bg-emerald-100 text-emerald-700" : ""}
                  ${selectedReg.status === "pending"  ? "bg-amber-100 text-amber-700"   : ""}
                  ${selectedReg.status === "rejected" ? "bg-red-100 text-red-700"       : ""}
                `}>
                  {selectedReg.status === "approved" && "مقبول"}
                  {selectedReg.status === "pending"  && "قيد الانتظار"}
                  {selectedReg.status === "rejected" && "مرفوض"}
                </span>
                {selectedReg.status === "pending" && (
                  <div className="flex gap-2 mr-auto">
                    <Button size="sm" className="bg-emerald-600 hover:bg-emerald-700 text-white h-8" onClick={() => { handleStatusUpdate(selectedReg.id, "approved"); setSelectedReg(null); }}>
                      <Check size={14} className="ml-1" /> قبول
                    </Button>
                    <Button size="sm" variant="outline" className="text-red-600 border-red-200 hover:bg-red-50 h-8" onClick={() => { handleStatusUpdate(selectedReg.id, "rejected"); setSelectedReg(null); }}>
                      <X size={14} className="ml-1" /> رفض
                    </Button>
                  </div>
                )}
              </div>

              {/* University choices */}
              <div className="border-t pt-4">
                <h3 className="font-bold text-slate-800 mb-3 text-sm">اختيارات الجامعات والتخصصات</h3>
                <div className="space-y-2">
                  {[1, 2, 3].map((n) => {
                    const uni = selectedReg[`universityChoice${n}`];
                    const spec = selectedReg[`specializationChoice${n}`];
                    if (!uni && !spec) return null;
                    return (
                      <div key={n} className="bg-primary/5 rounded-lg p-3 border border-primary/20">
                        <p className="text-xs font-bold text-primary mb-2">
                          الخيار {n === 1 ? "الأول" : n === 2 ? "الثاني" : "الثالث"}
                        </p>
                        <div className="grid grid-cols-2 gap-2">
                          <div>
                            <p className="text-xs text-slate-500">الجامعة</p>
                            <p className="font-bold text-slate-900 text-sm">{uni || "—"}</p>
                          </div>
                          <div>
                            <p className="text-xs text-slate-500">التخصص</p>
                            <p className="font-bold text-emerald-700 text-sm">{spec || "—"}</p>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Certificate image */}
              {selectedReg.certificateImageUrl && (
                <div className="border-t pt-4">
                  <h3 className="font-bold text-slate-800 mb-3 text-sm">صورة الشهادة الثانوية</h3>
                  <img src={selectedReg.certificateImageUrl} alt="الشهادة" className="max-w-full max-h-72 rounded-xl border border-slate-200 object-contain" />
                </div>
              )}

              {/* Notes */}
              {selectedReg.message && (
                <div className="border-t pt-4">
                  <p className="text-xs text-slate-400 mb-1">ملاحظات</p>
                  <p className="text-sm text-slate-700">{selectedReg.message}</p>
                </div>
              )}
            </div>
          )}
        </DialogContent>
      </Dialog>
    </AdminLayout>
  );
}
