import { useState } from "react";
import { AdminLayout } from "@/components/layout/AdminLayout";
import { KeyRound, Eye, EyeOff, CheckCircle2, AlertCircle } from "lucide-react";
import { getAdminToken } from "@/lib/admin-auth";

export default function Settings() {
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showCurrent, setShowCurrent] = useState(false);
  const [showNew, setShowNew] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<{ success: boolean; message: string } | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setResult(null);

    if (newPassword !== confirmPassword) {
      setResult({ success: false, message: "كلمة المرور الجديدة وتأكيدها غير متطابقتين" });
      return;
    }
    if (newPassword.length < 6) {
      setResult({ success: false, message: "كلمة المرور الجديدة يجب أن تكون 6 أحرف على الأقل" });
      return;
    }

    setLoading(true);
    try {
      const token = getAdminToken();
      const res = await fetch("/api/admin/change-password", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        body: JSON.stringify({ currentPassword, newPassword }),
      });
      const data = await res.json();
      setResult({ success: data.success, message: data.message });
      if (data.success) {
        setCurrentPassword("");
        setNewPassword("");
        setConfirmPassword("");
      }
    } catch {
      setResult({ success: false, message: "حدث خطأ، يرجى المحاولة مجدداً" });
    } finally {
      setLoading(false);
    }
  };

  return (
    <AdminLayout>
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-slate-900 mb-2">الإعدادات</h1>
        <p className="text-slate-500">إدارة إعدادات الحساب وكلمة المرور</p>
      </div>

      <div className="max-w-lg">
        <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
          <div className="px-6 py-5 border-b border-slate-200 bg-slate-50 flex items-center gap-3">
            <div className="w-9 h-9 rounded-lg bg-primary/10 flex items-center justify-center">
              <KeyRound size={18} className="text-primary" />
            </div>
            <h2 className="font-bold text-lg text-slate-800">تغيير كلمة المرور</h2>
          </div>

          <form onSubmit={handleSubmit} className="p-6 space-y-5">

            {result && (
              <div className={`flex items-center gap-3 p-4 rounded-lg text-sm font-medium ${
                result.success
                  ? "bg-emerald-50 text-emerald-700 border border-emerald-200"
                  : "bg-red-50 text-red-700 border border-red-200"
              }`}>
                {result.success
                  ? <CheckCircle2 size={18} className="shrink-0" />
                  : <AlertCircle size={18} className="shrink-0" />}
                {result.message}
              </div>
            )}

            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2">
                كلمة المرور الحالية
              </label>
              <div className="relative">
                <input
                  type={showCurrent ? "text" : "password"}
                  value={currentPassword}
                  onChange={e => setCurrentPassword(e.target.value)}
                  required
                  placeholder="أدخل كلمة المرور الحالية"
                  className="w-full border border-slate-300 rounded-lg px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary pr-10"
                />
                <button
                  type="button"
                  onClick={() => setShowCurrent(!showCurrent)}
                  className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                >
                  {showCurrent ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2">
                كلمة المرور الجديدة
              </label>
              <div className="relative">
                <input
                  type={showNew ? "text" : "password"}
                  value={newPassword}
                  onChange={e => setNewPassword(e.target.value)}
                  required
                  placeholder="6 أحرف على الأقل"
                  className="w-full border border-slate-300 rounded-lg px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary pr-10"
                />
                <button
                  type="button"
                  onClick={() => setShowNew(!showNew)}
                  className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                >
                  {showNew ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2">
                تأكيد كلمة المرور الجديدة
              </label>
              <div className="relative">
                <input
                  type={showConfirm ? "text" : "password"}
                  value={confirmPassword}
                  onChange={e => setConfirmPassword(e.target.value)}
                  required
                  placeholder="أعد كتابة كلمة المرور الجديدة"
                  className="w-full border border-slate-300 rounded-lg px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary pr-10"
                />
                <button
                  type="button"
                  onClick={() => setShowConfirm(!showConfirm)}
                  className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                >
                  {showConfirm ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-primary hover:bg-primary/90 disabled:opacity-60 text-white font-bold py-2.5 rounded-lg transition-colors text-sm"
            >
              {loading ? "جاري الحفظ..." : "حفظ كلمة المرور الجديدة"}
            </button>
          </form>
        </div>
      </div>
    </AdminLayout>
  );
}
