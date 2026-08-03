import { useState, useEffect, useCallback } from "react";
    import { AdminLayout } from "@/components/layout/AdminLayout";
    import { Eye, RefreshCw } from "lucide-react";
    import { Button } from "@/components/ui/button";
    import {
    Dialog, DialogContent, DialogHeader, DialogTitle,
    } from "@/components/ui/dialog";
    import { getAdminToken } from "@/lib/admin-auth";

    const BASE = import.meta.env.BASE_URL?.replace(/\/$/, "") || "";

    interface Survey {
    id: number;
    form_data: Record<string, unknown>;
    created_at: string;
    }

    export default function TrainingSurveys() {
    const [surveys, setSurveys] = useState<Survey[]>([]);
    const [loading, setLoading] = useState(true);
    const [selected, setSelected] = useState<Survey | null>(null);
    const [refreshing, setRefreshing] = useState(false);

    const fetchData = useCallback(async () => {
      try {
        const token = getAdminToken();
        const res = await fetch(`${BASE}/api/training-survey/list`, {
          headers: token ? { Authorization: `Bearer ${token}` } : {},
        });
        const data = await res.json();
        setSurveys(Array.isArray(data) ? data : []);
      } catch { /* ignore */ }
      setLoading(false);
    }, []);

    useEffect(() => { void fetchData(); }, [fetchData]);

    const refresh = async () => {
      setRefreshing(true);
      await fetchData();
      setRefreshing(false);
    };

    const formatDate = (d: string) =>
      new Date(d).toLocaleDateString("ar-SA", { year: "numeric", month: "short", day: "numeric", hour: "2-digit", minute: "2-digit" });

    const getField = (sv: Survey, ...keys: string[]): string => {
      const fd = sv.form_data;
      for (const key of keys) {
        if (typeof fd[key] === "string") return fd[key] as string;
        for (const sec of Object.values(fd)) {
          if (sec && typeof sec === "object" && !Array.isArray(sec)) {
            const v = (sec as Record<string, unknown>)[key];
            if (typeof v === "string" && v) return v;
          }
        }
      }
      return "—";
    };

    return (
      <AdminLayout>
        <div className="mb-8 flex items-center justify-between flex-wrap gap-4">
          <div>
            <h1 className="text-3xl font-bold text-slate-900 mb-1">استطلاعات البرامج التدريبية</h1>
            <p className="text-slate-500">استعراض جميع ردود المشاركين في استطلاع البرامج التدريبية</p>
          </div>
          <Button variant="outline" onClick={refresh} disabled={refreshing} className="gap-2">
            <RefreshCw size={16} className={refreshing ? "animate-spin" : ""} />
            تحديث
          </Button>
        </div>

        {loading ? (
          <div className="text-center py-16 text-slate-400">جاري التحميل...</div>
        ) : surveys.length === 0 ? (
          <div className="text-center py-16 text-slate-400 bg-white rounded-xl border border-slate-200">
            <p className="text-lg font-medium mb-1">لا توجد استطلاعات بعد</p>
            <p className="text-sm">ستظهر البيانات هنا بعد تعبئة الاستطلاع من صفحة "استطلاع التدريب"</p>
          </div>
        ) : (
          <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
            <div className="px-6 py-4 border-b border-slate-100 bg-slate-50 flex items-center gap-3">
              <span className="font-semibold text-slate-700">إجمالي الاستطلاعات:</span>
              <span className="bg-primary text-white text-xs font-bold px-2.5 py-1 rounded-full">{surveys.length}</span>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-sm text-right">
                <thead className="bg-slate-50 text-slate-600 border-b border-slate-200">
                  <tr>
                    <th className="px-4 py-3 font-semibold">#</th>
                    <th className="px-4 py-3 font-semibold">الاسم</th>
                    <th className="px-4 py-3 font-semibold">رقم الهاتف</th>
                    <th className="px-4 py-3 font-semibold">البريد الإلكتروني</th>
                    <th className="px-4 py-3 font-semibold">تاريخ الاستطلاع</th>
                    <th className="px-4 py-3 font-semibold">عرض</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {surveys.map((sv) => (
                    <tr key={sv.id} className="hover:bg-slate-50/70 transition-colors">
                      <td className="px-4 py-3 text-slate-400 font-mono text-xs">{sv.id}</td>
                      <td className="px-4 py-3 font-medium text-slate-800">{getField(sv, "الاسم الرباعي", "الاسم")}</td>
                      <td className="px-4 py-3 text-slate-600 font-mono">{getField(sv, "رقم الهاتف للتواصل", "رقم الهاتف")}</td>
                      <td className="px-4 py-3 text-slate-500">{getField(sv, "البريد الإلكتروني للتواصل", "البريد الإلكتروني")}</td>
                      <td className="px-4 py-3 text-slate-500 text-xs">{formatDate(sv.created_at)}</td>
                      <td className="px-4 py-3">
                        <Button size="sm" variant="outline" onClick={() => setSelected(sv)} className="gap-1.5 h-8 text-xs">
                          <Eye size={13} /> عرض التفاصيل
                        </Button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* Detail Dialog */}
        <Dialog open={!!selected} onOpenChange={(open) => !open && setSelected(null)}>
          <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto" dir="rtl">
            <DialogHeader>
              <DialogTitle className="text-right text-lg">
                تفاصيل الاستطلاع #{selected?.id}
              </DialogTitle>
            </DialogHeader>
            {selected && (
              <div className="space-y-4 text-sm mt-2">
                {Object.entries(selected.form_data).map(([section, value]) => (
                  <div key={section} className="border border-slate-200 rounded-xl overflow-hidden">
                    <div className="bg-slate-50 px-4 py-2.5 font-bold text-slate-700 border-b border-slate-200 text-sm">
                      {section}
                    </div>
                    <div className="px-4 py-3">
                      {typeof value === "object" && value !== null && !Array.isArray(value) ? (
                        <div className="space-y-2">
                          {Object.entries(value as Record<string, unknown>).map(([k, v]) => (
                            <div key={k} className="flex gap-2 text-sm">
                              <span className="text-slate-500 shrink-0 min-w-[140px]">{k}:</span>
                              <span className="text-slate-800 font-medium">
                                {Array.isArray(v) ? (v as string[]).join("، ") : String(v ?? "—")}
                              </span>
                            </div>
                          ))}
                        </div>
                      ) : Array.isArray(value) ? (
                        <div className="flex flex-wrap gap-2">
                          {(value as string[]).map((item, i) => (
                            <span key={i} className="bg-primary/10 text-primary text-xs px-2.5 py-1 rounded-full">{item}</span>
                          ))}
                        </div>
                      ) : (
                        <p className="text-slate-800">{String(value ?? "—")}</p>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </DialogContent>
        </Dialog>
      </AdminLayout>
    );
    }
    