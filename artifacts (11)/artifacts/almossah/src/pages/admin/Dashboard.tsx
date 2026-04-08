import { useGetAdminDashboard } from "@workspace/api-client-react";
import { AdminLayout } from "@/components/layout/AdminLayout";
import { Users, FileText, Handshake, UserCheck, UserX, Clock, Settings } from "lucide-react";

export default function Dashboard() {
  const { data: dashboard, isLoading } = useGetAdminDashboard();

  if (isLoading) return <AdminLayout><div className="flex items-center justify-center h-64">جاري التحميل...</div></AdminLayout>;

  const statsCards = [
    { title: "إجمالي الطلبات", value: dashboard?.totalRegistrations || 0, icon: <Users className="text-blue-500" size={24} />, bgColor: "bg-blue-50" },
    { title: "طلبات قيد الانتظار", value: dashboard?.pendingRegistrations || 0, icon: <Clock className="text-amber-500" size={24} />, bgColor: "bg-amber-50" },
    { title: "طلبات مقبولة", value: dashboard?.approvedRegistrations || 0, icon: <UserCheck className="text-emerald-500" size={24} />, bgColor: "bg-emerald-50" },
    { title: "طلبات مرفوضة", value: dashboard?.rejectedRegistrations || 0, icon: <UserX className="text-red-500" size={24} />, bgColor: "bg-red-50" },
    { title: "الأخبار والفعاليات", value: dashboard?.totalNews || 0, icon: <FileText className="text-purple-500" size={24} />, bgColor: "bg-purple-50" },
    { title: "شركاء النجاح", value: dashboard?.totalPartners || 0, icon: <Handshake className="text-indigo-500" size={24} />, bgColor: "bg-indigo-50" },
    { title: "فريق العمل", value: dashboard?.totalTeamMembers || 0, icon: <Settings className="text-slate-500" size={24} />, bgColor: "bg-slate-50" },
  ];

  return (
    <AdminLayout>
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-slate-900 mb-2">لوحة التحكم</h1>
        <p className="text-slate-500">نظرة عامة على إحصائيات النظام</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        {statsCards.map((stat, idx) => (
          <div key={idx} className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm flex items-center gap-4">
            <div className={`w-14 h-14 rounded-full ${stat.bgColor} flex items-center justify-center shrink-0`}>
              {stat.icon}
            </div>
            <div>
              <p className="text-slate-500 text-sm font-medium mb-1">{stat.title}</p>
              <h3 className="text-2xl font-bold text-slate-900">{stat.value}</h3>
            </div>
          </div>
        ))}
      </div>

      <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="px-6 py-5 border-b border-slate-200 bg-slate-50">
          <h2 className="font-bold text-lg text-slate-800">أحدث طلبات التسجيل</h2>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-right text-sm">
            <thead className="bg-slate-50 border-b border-slate-200 text-slate-600">
              <tr>
                <th className="px-6 py-4 font-medium">الاسم</th>
                <th className="px-6 py-4 font-medium">البرنامج</th>
                <th className="px-6 py-4 font-medium">المدينة</th>
                <th className="px-6 py-4 font-medium">التاريخ</th>
                <th className="px-6 py-4 font-medium">الحالة</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {dashboard?.recentRegistrations?.map((reg) => (
                <tr key={reg.id} className="hover:bg-slate-50 transition-colors">
                  <td className="px-6 py-4 font-medium text-slate-900">{reg.fullName}</td>
                  <td className="px-6 py-4 text-slate-600">{reg.programType}</td>
                  <td className="px-6 py-4 text-slate-600">{reg.city}</td>
                  <td className="px-6 py-4 text-slate-600">{new Date(reg.createdAt).toLocaleDateString('ar-EG')}</td>
                  <td className="px-6 py-4">
                    <span className={`px-3 py-1 rounded-full text-xs font-medium
                      ${reg.status === 'approved' ? 'bg-emerald-100 text-emerald-700' : ''}
                      ${reg.status === 'pending' ? 'bg-amber-100 text-amber-700' : ''}
                      ${reg.status === 'rejected' ? 'bg-red-100 text-red-700' : ''}
                    `}>
                      {reg.status === 'approved' && 'مقبول'}
                      {reg.status === 'pending' && 'قيد الانتظار'}
                      {reg.status === 'rejected' && 'مرفوض'}
                    </span>
                  </td>
                </tr>
              ))}
              {(!dashboard?.recentRegistrations || dashboard.recentRegistrations.length === 0) && (
                <tr>
                  <td colSpan={5} className="px-6 py-8 text-center text-slate-500">لا توجد طلبات تسجيل حديثة</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </AdminLayout>
  );
}