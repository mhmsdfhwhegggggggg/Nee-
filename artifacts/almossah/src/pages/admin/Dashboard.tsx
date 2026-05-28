import { useGetAdminDashboard } from "@workspace/api-client-react";
import { AdminLayout } from "@/components/layout/AdminLayout";
import { Users, FileText, Handshake, UserCheck, UserX, Clock, Settings, Bot, RefreshCw } from "lucide-react";
import { useQueryClient } from "@tanstack/react-query";
import { useEffect, useRef, useState, useCallback } from "react";
import { useToast } from "@/hooks/use-toast";
import { Link } from "wouter";

const DASHBOARD_QUERY_KEY = ["getAdminDashboard"];

export default function Dashboard() {
  const queryClient = useQueryClient();
  const { toast } = useToast();
  const { data: dashboard, isLoading } = useGetAdminDashboard();
  const prevTotalRef = useRef<number | null>(null);
  const [lastRefreshed, setLastRefreshed] = useState<Date>(new Date());
  const [refreshing, setRefreshing] = useState(false);

  const refresh = useCallback(async () => {
    setRefreshing(true);
    await queryClient.invalidateQueries({ queryKey: DASHBOARD_QUERY_KEY });
    setLastRefreshed(new Date());
    setTimeout(() => setRefreshing(false), 600);
  }, [queryClient]);

  // Auto-refresh every 15 seconds
  useEffect(() => {
    const interval = setInterval(refresh, 15000);
    return () => clearInterval(interval);
  }, [refresh]);

  // Toast when new registrations arrive
  useEffect(() => {
    const total = dashboard?.totalRegistrations;
    if (total === undefined) return;
    if (prevTotalRef.current !== null && total > prevTotalRef.current) {
      const diff = total - prevTotalRef.current;
      toast({
        title: `🔔 ${diff} طلب${diff > 1 ? "ات" : ""} تسجيل جديد عبر ناصر!`,
        description: "انتقل إلى صفحة الطلبات لمراجعتها.",
      });
    }
    prevTotalRef.current = total;
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [dashboard?.totalRegistrations]);

  if (isLoading) return (
    <AdminLayout>
      <div className="flex items-center justify-center h-64 text-slate-400">
        <div className="w-8 h-8 border-4 border-primary/30 border-t-primary rounded-full animate-spin" />
      </div>
    </AdminLayout>
  );

  const statsCards = [
    { title: "إجمالي الطلبات",      value: dashboard?.totalRegistrations || 0,  icon: <Users className="text-blue-500" size={24} />,    bgColor: "bg-blue-50" },
    { title: "قيد الانتظار",        value: dashboard?.pendingRegistrations || 0, icon: <Clock className="text-amber-500" size={24} />,   bgColor: "bg-amber-50", highlight: (dashboard?.pendingRegistrations || 0) > 0 },
    { title: "طلبات مقبولة",        value: dashboard?.approvedRegistrations || 0,icon: <UserCheck className="text-emerald-500" size={24}/>,bgColor: "bg-emerald-50" },
    { title: "طلبات مرفوضة",       value: dashboard?.rejectedRegistrations || 0, icon: <UserX className="text-red-500" size={24} />,     bgColor: "bg-red-50" },
    { title: "الأخبار والفعاليات",  value: dashboard?.totalNews || 0,            icon: <FileText className="text-purple-500" size={24}/>, bgColor: "bg-purple-50" },
    { title: "شركاء النجاح",       value: dashboard?.totalPartners || 0,         icon: <Handshake className="text-indigo-500" size={24}/>,bgColor: "bg-indigo-50" },
    { title: "فريق العمل",          value: dashboard?.totalTeamMembers || 0,      icon: <Settings className="text-slate-500" size={24} />, bgColor: "bg-slate-50" },
  ];

  return (
    <AdminLayout>
      {/* Header */}
      <div className="mb-8 flex items-start justify-between gap-4 flex-wrap">
        <div>
          <h1 className="text-3xl font-bold text-slate-900 mb-1">لوحة التحكم</h1>
          <p className="text-slate-400 text-xs">
            آخر تحديث: {lastRefreshed.toLocaleTimeString("ar-EG")} — يتجدد تلقائياً كل 15 ثانية
          </p>
        </div>
        <button
          onClick={refresh}
          className="flex items-center gap-2 text-sm text-slate-500 hover:text-primary border border-slate-200 hover:border-primary px-3 py-1.5 rounded-lg transition-colors"
        >
          <RefreshCw size={14} className={refreshing ? "animate-spin" : ""} />
          تحديث الآن
        </button>
      </div>

      {/* Stats grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        {statsCards.map((stat, idx) => (
          <div
            key={idx}
            className={`bg-white p-6 rounded-xl border shadow-sm flex items-center gap-4 transition-all
              ${stat.highlight ? "border-amber-300 ring-2 ring-amber-100 shadow-amber-50" : "border-slate-200"}`}
          >
            <div className={`w-14 h-14 rounded-full ${stat.bgColor} flex items-center justify-center shrink-0`}>
              {stat.icon}
            </div>
            <div>
              <p className="text-slate-500 text-sm font-medium mb-1">{stat.title}</p>
              <h3 className={`text-2xl font-bold ${stat.highlight ? "text-amber-600" : "text-slate-900"}`}>
                {stat.value}
              </h3>
            </div>
          </div>
        ))}
      </div>

      {/* Nassir live status banner */}
      <div className="mb-6 flex items-center gap-3 bg-gradient-to-l from-blue-50 to-primary/5 border border-primary/20 rounded-xl px-5 py-3 flex-wrap">
        <div className="flex items-center gap-2">
          <Bot size={18} className="text-primary" />
          <span className="text-primary font-bold text-sm">ناصر يعمل على جميع المنصات</span>
        </div>
        <div className="flex items-center gap-1.5 mr-auto">
          <span className="w-2 h-2 bg-green-500 rounded-full animate-pulse" />
          <span className="text-green-700 text-xs font-medium">متصل — الموقع | تيليجرام | واتساب | فيسبوك | انستقرام</span>
        </div>
        <Link href="/admin/registrations">
          <button className="text-xs text-primary border border-primary/30 hover:bg-primary hover:text-white px-3 py-1 rounded-full transition-colors whitespace-nowrap">
            عرض الطلبات
          </button>
        </Link>
      </div>

      {/* Recent registrations table */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="px-6 py-5 border-b border-slate-200 bg-slate-50 flex items-center justify-between">
          <h2 className="font-bold text-lg text-slate-800">أحدث طلبات التسجيل</h2>
          <span className="text-xs text-slate-400 flex items-center gap-1">
            <span className="w-1.5 h-1.5 bg-green-400 rounded-full animate-pulse inline-block" />
            تحديث تلقائي
          </span>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-right text-sm">
            <thead className="bg-slate-50 border-b border-slate-200 text-slate-600">
              <tr>
                <th className="px-6 py-4 font-medium">الاسم</th>
                <th className="px-6 py-4 font-medium">البرنامج</th>
                <th className="px-6 py-4 font-medium">المدينة</th>
                <th className="px-6 py-4 font-medium">المصدر</th>
                <th className="px-6 py-4 font-medium">التاريخ</th>
                <th className="px-6 py-4 font-medium">الحالة</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {dashboard?.recentRegistrations?.map((reg) => {
                const msg = (reg as { message?: string }).message || "";
                const isNassir = msg.includes("ناصر");
                const sourcePlatform = msg.match(/\(([^)]+)\)/)?.[1];
                return (
                  <tr key={reg.id} className={`hover:bg-slate-50 transition-colors ${isNassir ? "bg-blue-50/30" : ""}`}>
                    <td className="px-6 py-4 font-medium text-slate-900">
                      <div className="flex items-center gap-2 flex-wrap">
                        {reg.fullName}
                        {isNassir && (
                          <span className="inline-flex items-center gap-1 bg-primary/10 text-primary text-xs px-1.5 py-0.5 rounded font-semibold whitespace-nowrap">
                            <Bot size={10} /> ناصر
                          </span>
                        )}
                      </div>
                    </td>
                    <td className="px-6 py-4 text-slate-600">{reg.programType}</td>
                    <td className="px-6 py-4 text-slate-600">{reg.city}</td>
                    <td className="px-6 py-4">
                      {isNassir ? (
                        <span className="text-xs text-blue-600 font-medium">{sourcePlatform || "ناصر"}</span>
                      ) : (
                        <span className="text-xs text-slate-400">يدوي</span>
                      )}
                    </td>
                    <td className="px-6 py-4 text-slate-600">
                      {new Date(reg.createdAt).toLocaleDateString("ar-EG")}
                    </td>
                    <td className="px-6 py-4">
                      <span className={`px-3 py-1 rounded-full text-xs font-medium
                        ${reg.status === "approved" ? "bg-emerald-100 text-emerald-700" : ""}
                        ${reg.status === "pending"  ? "bg-amber-100 text-amber-700"   : ""}
                        ${reg.status === "rejected" ? "bg-red-100 text-red-700"       : ""}
                      `}>
                        {reg.status === "approved" && "مقبول"}
                        {reg.status === "pending"  && "قيد الانتظار"}
                        {reg.status === "rejected" && "مرفوض"}
                      </span>
                    </td>
                  </tr>
                );
              })}
              {(!dashboard?.recentRegistrations || dashboard.recentRegistrations.length === 0) && (
                <tr>
                  <td colSpan={6} className="px-6 py-8 text-center text-slate-500">
                    لا توجد طلبات تسجيل حديثة
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </AdminLayout>
  );
}
