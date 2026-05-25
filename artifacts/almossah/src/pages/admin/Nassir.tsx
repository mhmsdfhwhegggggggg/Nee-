import { AdminLayout } from "@/components/layout/AdminLayout";
import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { getAdminToken } from "@/lib/admin-auth";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Bot, MessageSquare, Settings, BarChart3, Trash2, Eye,
  Globe, Send, RefreshCw, ToggleLeft, ToggleRight,
  Smartphone, Instagram, Facebook, Webhook, Users,
  CheckCircle, XCircle, Clock, Save,
} from "lucide-react";

interface Conversation {
  id: number;
  sessionId: string;
  platform: string;
  userIdentifier: string | null;
  createdAt: string;
  updatedAt: string;
}

interface Message {
  id: number;
  conversationId: number;
  role: string;
  content: string;
  createdAt: string;
}

interface ConversationDetail extends Conversation {
  messages: Message[];
}

interface BotSettings {
  id: number;
  systemPrompt: string;
  welcomeMessage: string;
  isActive: boolean;
  updatedAt: string;
}

const PLATFORM_LABELS: Record<string, { label: string; icon: React.ReactNode; color: string }> = {
  web: { label: "الموقع", icon: <Globe size={14} />, color: "bg-blue-100 text-blue-700" },
  whatsapp: { label: "واتساب", icon: <Smartphone size={14} />, color: "bg-green-100 text-green-700" },
  facebook: { label: "فيسبوك", icon: <Facebook size={14} />, color: "bg-indigo-100 text-indigo-700" },
  instagram: { label: "إنستغرام", icon: <Instagram size={14} />, color: "bg-pink-100 text-pink-700" },
  telegram: { label: "تيليجرام", icon: <Send size={14} />, color: "bg-sky-100 text-sky-700" },
};

function PlatformBadge({ platform }: { platform: string }) {
  const p = PLATFORM_LABELS[platform] || { label: platform, icon: <Globe size={14} />, color: "bg-gray-100 text-gray-600" };
  return (
    <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium ${p.color}`}>
      {p.icon}{p.label}
    </span>
  );
}

function timeAgo(date: string) {
  const d = new Date(date);
  const diff = (Date.now() - d.getTime()) / 1000;
  if (diff < 60) return "الآن";
  if (diff < 3600) return `${Math.floor(diff / 60)} دقيقة`;
  if (diff < 86400) return `${Math.floor(diff / 3600)} ساعة`;
  return `${Math.floor(diff / 86400)} يوم`;
}

function authHeaders() {
  const t = getAdminToken();
  return t ? { Authorization: `Bearer ${t}`, "Content-Type": "application/json" } : { "Content-Type": "application/json" };
}

export default function NassirAdmin() {
  const { toast } = useToast();
  const [tab, setTab] = useState<"conversations" | "settings" | "stats" | "webhooks">("conversations");
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [loadingConvos, setLoadingConvos] = useState(true);
  const [selectedConvo, setSelectedConvo] = useState<ConversationDetail | null>(null);
  const [settings, setSettings] = useState<BotSettings | null>(null);
  const [saving, setSaving] = useState(false);
  const [editPrompt, setEditPrompt] = useState("");
  const [editWelcome, setEditWelcome] = useState("");
  const [searchTerm, setSearchTerm] = useState("");
  const [filterPlatform, setFilterPlatform] = useState("all");

  const loadConversations = async () => {
    setLoadingConvos(true);
    try {
      const r = await fetch("/api/admin/nassir/conversations", { headers: authHeaders() });
      const data = await r.json() as Conversation[];
      setConversations(Array.isArray(data) ? data : []);
    } catch {
      toast({ variant: "destructive", title: "خطأ في تحميل المحادثات" });
    }
    setLoadingConvos(false);
  };

  const loadSettings = async () => {
    try {
      const r = await fetch("/api/nassir/settings");
      const data = await r.json() as BotSettings;
      setSettings(data);
      setEditPrompt(data.systemPrompt);
      setEditWelcome(data.welcomeMessage);
    } catch {
      toast({ variant: "destructive", title: "خطأ في تحميل الإعدادات" });
    }
  };

  const openConversation = async (id: number) => {
    try {
      const r = await fetch(`/api/admin/nassir/conversations/${id}`, { headers: authHeaders() });
      const data = await r.json() as ConversationDetail;
      setSelectedConvo(data);
    } catch {
      toast({ variant: "destructive", title: "خطأ في فتح المحادثة" });
    }
  };

  const deleteConversation = async (id: number) => {
    if (!confirm("هل أنت متأكد من حذف هذه المحادثة؟")) return;
    try {
      await fetch(`/api/admin/nassir/conversations/${id}`, {
        method: "DELETE",
        headers: authHeaders(),
      });
      setConversations((prev) => prev.filter((c) => c.id !== id));
      toast({ title: "تم حذف المحادثة" });
    } catch {
      toast({ variant: "destructive", title: "خطأ في الحذف" });
    }
  };

  const saveSettings = async () => {
    if (!settings) return;
    setSaving(true);
    try {
      const r = await fetch("/api/admin/nassir/settings", {
        method: "PATCH",
        headers: authHeaders(),
        body: JSON.stringify({ systemPrompt: editPrompt, welcomeMessage: editWelcome }),
      });
      const data = await r.json() as BotSettings;
      setSettings(data);
      toast({ title: "✅ تم حفظ الإعدادات بنجاح" });
    } catch {
      toast({ variant: "destructive", title: "خطأ في الحفظ" });
    }
    setSaving(false);
  };

  const toggleActive = async () => {
    if (!settings) return;
    try {
      const r = await fetch("/api/admin/nassir/settings", {
        method: "PATCH",
        headers: authHeaders(),
        body: JSON.stringify({ isActive: !settings.isActive }),
      });
      const data = await r.json() as BotSettings;
      setSettings(data);
      toast({ title: data.isActive ? "✅ ناصر مُفعَّل" : "⏸ ناصر مُوقف مؤقتاً" });
    } catch {
      toast({ variant: "destructive", title: "خطأ في التحديث" });
    }
  };

  const resetToMaster = async () => {
    if (!confirm("هل تريد إعادة تعيين النظام الكامل للإقناع الأكاديمي؟ سيُحذف الشخصية الحالية.")) return;
    try {
      const r = await fetch("/api/nassir/settings");
      const s = await r.json() as BotSettings;
      await fetch("/api/admin/nassir/settings", {
        method: "PATCH",
        headers: authHeaders(),
        body: JSON.stringify({ systemPrompt: "" }),
      });
      toast({ title: "✅ تمت إعادة التعيين — يستخدم ناصر النظام الكامل الآن" });
      setEditPrompt("");
    } catch {
      toast({ variant: "destructive", title: "خطأ" });
    }
    void s;
  };

  useEffect(() => {
    void loadConversations();
    void loadSettings();
  }, []);

  const filteredConvos = conversations.filter((c) => {
    const matchPlatform = filterPlatform === "all" || c.platform === filterPlatform;
    const matchSearch = !searchTerm || (c.userIdentifier || "").includes(searchTerm) || c.sessionId.includes(searchTerm);
    return matchPlatform && matchSearch;
  });

  const platformStats = conversations.reduce<Record<string, number>>((acc, c) => {
    acc[c.platform] = (acc[c.platform] || 0) + 1;
    return acc;
  }, {});

  const TABS = [
    { id: "conversations", label: "المحادثات", icon: <MessageSquare size={16} /> },
    { id: "settings", label: "إعدادات ناصر", icon: <Settings size={16} /> },
    { id: "stats", label: "الإحصائيات", icon: <BarChart3 size={16} /> },
    { id: "webhooks", label: "المنصات والربط", icon: <Webhook size={16} /> },
  ] as const;

  return (
    <AdminLayout>
      <div className="mb-6 flex items-center justify-between flex-wrap gap-4">
        <div className="flex items-center gap-3">
          <div className="w-11 h-11 bg-primary/10 rounded-xl flex items-center justify-center">
            <Bot size={24} className="text-primary" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-slate-900">ناصر — المساعد الذكي</h1>
            <p className="text-slate-500 text-sm">إدارة شاملة للمساعد الأكاديمي ومنصات التواصل</p>
          </div>
        </div>
        {settings && (
          <button
            onClick={toggleActive}
            className={`flex items-center gap-2 px-4 py-2 rounded-xl font-semibold text-sm transition-all ${settings.isActive ? "bg-emerald-50 text-emerald-700 border border-emerald-200 hover:bg-emerald-100" : "bg-red-50 text-red-600 border border-red-200 hover:bg-red-100"}`}
          >
            {settings.isActive ? <><ToggleRight size={20} /> ناصر مُفعَّل</> : <><ToggleLeft size={20} /> ناصر مُوقف</>}
          </button>
        )}
      </div>

      <div className="flex gap-1 bg-slate-100 rounded-xl p-1 mb-6 w-fit">
        {TABS.map((t) => (
          <button
            key={t.id}
            onClick={() => setTab(t.id)}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all ${tab === t.id ? "bg-white text-primary shadow-sm" : "text-slate-600 hover:text-slate-900"}`}
          >
            {t.icon}{t.label}
          </button>
        ))}
      </div>

      {tab === "conversations" && (
        <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
          <div className="px-6 py-4 border-b border-slate-200 bg-slate-50 flex items-center justify-between flex-wrap gap-3">
            <h2 className="font-bold text-slate-800 flex items-center gap-2">
              <MessageSquare size={18} className="text-primary" />
              المحادثات ({filteredConvos.length})
            </h2>
            <div className="flex items-center gap-3 flex-wrap">
              <input
                type="text"
                placeholder="بحث..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="border border-slate-200 rounded-lg px-3 py-1.5 text-sm w-40 focus:outline-none focus:ring-2 focus:ring-primary/30"
              />
              <select
                value={filterPlatform}
                onChange={(e) => setFilterPlatform(e.target.value)}
                className="border border-slate-200 rounded-lg px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary/30"
              >
                <option value="all">كل المنصات</option>
                {Object.keys(PLATFORM_LABELS).map((p) => (
                  <option key={p} value={p}>{PLATFORM_LABELS[p].label}</option>
                ))}
              </select>
              <Button size="sm" variant="outline" onClick={loadConversations} className="gap-1">
                <RefreshCw size={14} /> تحديث
              </Button>
            </div>
          </div>

          {loadingConvos ? (
            <div className="flex items-center justify-center h-40 text-slate-400">
              <RefreshCw size={24} className="animate-spin ml-2" /> جاري التحميل...
            </div>
          ) : filteredConvos.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-40 text-slate-400">
              <MessageSquare size={32} className="mb-2 opacity-40" />
              <p>لا توجد محادثات بعد</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-right text-sm">
                <thead className="bg-slate-50 border-b border-slate-200 text-slate-600">
                  <tr>
                    <th className="px-4 py-3 font-medium">#</th>
                    <th className="px-4 py-3 font-medium">المنصة</th>
                    <th className="px-4 py-3 font-medium">المعرّف</th>
                    <th className="px-4 py-3 font-medium">تاريخ الإنشاء</th>
                    <th className="px-4 py-3 font-medium">آخر نشاط</th>
                    <th className="px-4 py-3 font-medium">إجراءات</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {filteredConvos.map((convo) => (
                    <tr key={convo.id} className="hover:bg-slate-50 transition-colors">
                      <td className="px-4 py-3 text-slate-500 font-mono">#{convo.id}</td>
                      <td className="px-4 py-3"><PlatformBadge platform={convo.platform} /></td>
                      <td className="px-4 py-3 text-slate-700 font-medium max-w-[160px] truncate">
                        {convo.userIdentifier || convo.sessionId.slice(0, 12) + "..."}
                      </td>
                      <td className="px-4 py-3 text-slate-500 text-xs">
                        {new Date(convo.createdAt).toLocaleDateString("ar-YE")}
                      </td>
                      <td className="px-4 py-3">
                        <span className="text-xs text-slate-500 bg-slate-100 px-2 py-0.5 rounded-full">
                          {timeAgo(convo.updatedAt)}
                        </span>
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-2">
                          <button
                            onClick={() => openConversation(convo.id)}
                            className="w-8 h-8 rounded-lg bg-primary/10 hover:bg-primary/20 flex items-center justify-center text-primary transition-colors"
                            title="عرض المحادثة"
                          >
                            <Eye size={15} />
                          </button>
                          <button
                            onClick={() => deleteConversation(convo.id)}
                            className="w-8 h-8 rounded-lg bg-red-50 hover:bg-red-100 flex items-center justify-center text-red-500 transition-colors"
                            title="حذف"
                          >
                            <Trash2 size={15} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {tab === "settings" && settings && (
        <div className="space-y-6">
          <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-6">
            <div className="flex items-center justify-between mb-5">
              <h2 className="font-bold text-slate-800 flex items-center gap-2 text-lg">
                <Bot size={20} className="text-primary" /> شخصية ناصر ونظام الإقناع
              </h2>
              <div className="flex gap-2">
                <Button
                  size="sm"
                  variant="outline"
                  onClick={resetToMaster}
                  className="text-orange-600 border-orange-200 hover:bg-orange-50 gap-1"
                >
                  <RefreshCw size={14} /> استعادة النظام الكامل
                </Button>
              </div>
            </div>

            <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 mb-5 text-sm text-amber-800">
              <strong>💡 ملاحظة مهمة:</strong> ناصر يستخدم نظام إقناع أكاديمي متكامل يشمل معلومات الجامعات الـ16 الشريكة،
              التخصصات، المعدلات المطلوبة، وتقنيات الإقناع النفسي. يمكنك إضافة تعليمات خاصة هنا وستُضاف على النظام الأساسي.
            </div>

            <div className="mb-5">
              <label className="block text-sm font-semibold text-slate-700 mb-2">
                تعليمات مخصصة إضافية (اختياري)
              </label>
              <textarea
                value={editPrompt}
                onChange={(e) => setEditPrompt(e.target.value)}
                rows={10}
                dir="rtl"
                placeholder="أضف هنا تعليمات خاصة إضافية لتخصيص سلوك ناصر... (اتركه فارغاً لاستخدام النظام الكامل)"
                className="w-full border border-slate-200 rounded-xl px-4 py-3 text-sm font-mono focus:outline-none focus:ring-2 focus:ring-primary/40 focus:border-primary resize-none"
              />
            </div>

            <div className="mb-6">
              <label className="block text-sm font-semibold text-slate-700 mb-2">رسالة الترحيب</label>
              <textarea
                value={editWelcome}
                onChange={(e) => setEditWelcome(e.target.value)}
                rows={3}
                dir="rtl"
                className="w-full border border-slate-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-primary/40 focus:border-primary resize-none"
              />
            </div>

            <div className="flex justify-end gap-3">
              <Button onClick={saveSettings} disabled={saving} className="bg-primary gap-2">
                <Save size={16} />
                {saving ? "جاري الحفظ..." : "حفظ الإعدادات"}
              </Button>
            </div>
          </div>

          <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-6">
            <h2 className="font-bold text-slate-800 flex items-center gap-2 text-lg mb-4">
              <CheckCircle size={20} className="text-emerald-500" /> حالة المساعد
            </h2>
            <div className="flex items-center justify-between p-4 bg-slate-50 rounded-xl">
              <div>
                <p className="font-semibold text-slate-700">تفعيل ناصر على الموقع</p>
                <p className="text-sm text-slate-500">يتحكم في ظهور زر المساعد الذكي لزوار الموقع</p>
              </div>
              <button
                onClick={toggleActive}
                className={`flex items-center gap-2 px-5 py-2.5 rounded-xl font-bold text-sm transition-all ${settings.isActive ? "bg-emerald-500 text-white hover:bg-emerald-600" : "bg-slate-300 text-slate-600 hover:bg-slate-400"}`}
              >
                {settings.isActive ? <><CheckCircle size={16} /> مُفعَّل</> : <><XCircle size={16} /> مُوقف</>}
              </button>
            </div>
          </div>
        </div>
      )}

      {tab === "stats" && (
        <div className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm flex items-center gap-4">
              <div className="w-12 h-12 bg-blue-50 rounded-xl flex items-center justify-center shrink-0">
                <MessageSquare size={22} className="text-blue-600" />
              </div>
              <div>
                <p className="text-slate-500 text-xs font-medium">إجمالي المحادثات</p>
                <h3 className="text-2xl font-bold text-slate-900">{conversations.length}</h3>
              </div>
            </div>

            {Object.entries(PLATFORM_LABELS).map(([key, val]) => (
              <div key={key} className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm flex items-center gap-4">
                <div className={`w-12 h-12 rounded-xl flex items-center justify-center shrink-0 ${val.color.replace("text-", "").replace("bg-", "bg-")}`}>
                  <span className={val.color.split(" ")[1]}>{val.icon}</span>
                </div>
                <div>
                  <p className="text-slate-500 text-xs font-medium">{val.label}</p>
                  <h3 className="text-2xl font-bold text-slate-900">{platformStats[key] || 0}</h3>
                </div>
              </div>
            ))}
          </div>

          <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
            <div className="px-6 py-4 border-b border-slate-200 bg-slate-50">
              <h2 className="font-bold text-slate-800">توزيع المحادثات حسب المنصة</h2>
            </div>
            <div className="p-6">
              {Object.entries(PLATFORM_LABELS).map(([key, val]) => {
                const count = platformStats[key] || 0;
                const pct = conversations.length > 0 ? Math.round((count / conversations.length) * 100) : 0;
                return (
                  <div key={key} className="mb-4">
                    <div className="flex items-center justify-between mb-1.5">
                      <div className="flex items-center gap-2 text-sm font-medium text-slate-700">
                        <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs ${val.color}`}>
                          {val.icon} {val.label}
                        </span>
                      </div>
                      <span className="text-sm font-bold text-slate-900">{count} ({pct}%)</span>
                    </div>
                    <div className="h-2.5 bg-slate-100 rounded-full overflow-hidden">
                      <div
                        className="h-full bg-primary rounded-full transition-all duration-500"
                        style={{ width: `${pct}%` }}
                      />
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-6">
            <h2 className="font-bold text-slate-800 mb-4 flex items-center gap-2">
              <Clock size={18} className="text-primary" /> أحدث المحادثات
            </h2>
            <div className="space-y-2">
              {conversations.slice(0, 5).map((c) => (
                <div key={c.id} className="flex items-center justify-between p-3 bg-slate-50 rounded-lg">
                  <div className="flex items-center gap-3">
                    <PlatformBadge platform={c.platform} />
                    <span className="text-sm text-slate-700">{c.userIdentifier || "زائر"}</span>
                  </div>
                  <span className="text-xs text-slate-400">{timeAgo(c.updatedAt)}</span>
                </div>
              ))}
              {conversations.length === 0 && (
                <p className="text-slate-400 text-center py-4">لا توجد محادثات بعد</p>
              )}
            </div>
          </div>
        </div>
      )}

      {tab === "webhooks" && (
        <div className="space-y-5">
          <div className="bg-blue-50 border border-blue-200 rounded-xl p-4 text-sm text-blue-800">
            <strong>📌 كيفية الربط:</strong> أضف متغيرات البيئة التالية في إعدادات النشر، ثم أضف عنوان الـ Webhook في إعدادات كل منصة.
          </div>

          {[
            {
              platform: "واتساب Business",
              icon: <Smartphone size={20} className="text-green-600" />,
              color: "bg-green-50 border-green-200",
              status: "يحتاج ربط",
              statusColor: "text-amber-600 bg-amber-50",
              webhook: "https://almossah-website.vercel.app/api/nassir/webhooks/whatsapp",
              vars: [
                { name: "WHATSAPP_ACCESS_TOKEN", desc: "توكن الوصول من Meta Business Suite" },
                { name: "WHATSAPP_PHONE_NUMBER_ID", desc: "معرّف رقم الهاتف التجاري" },
                { name: "WEBHOOK_VERIFY_TOKEN", desc: "كلمة التحقق (almossah_nassir_2024)" },
              ],
              steps: [
                "تفعيل WhatsApp Business API من Meta for Developers",
                "إنشاء تطبيق جديد واختيار WhatsApp",
                "نسخ Access Token و Phone Number ID",
                "إضافة عنوان Webhook أعلاه في إعدادات التطبيق",
                "التحقق باستخدام كلمة almossah_nassir_2024",
              ],
            },
            {
              platform: "فيسبوك ماسنجر",
              icon: <Facebook size={20} className="text-blue-600" />,
              color: "bg-blue-50 border-blue-200",
              status: "يحتاج ربط",
              statusColor: "text-amber-600 bg-amber-50",
              webhook: "https://almossah-website.vercel.app/api/nassir/webhooks/facebook",
              vars: [
                { name: "FACEBOOK_PAGE_ACCESS_TOKEN", desc: "توكن الصفحة من Meta Business Suite" },
                { name: "WEBHOOK_VERIFY_TOKEN", desc: "كلمة التحقق (almossah_nassir_2024)" },
              ],
              steps: [
                "افتح Meta for Developers وأنشئ تطبيقاً",
                "فعّل Messenger على الصفحة",
                "أضف عنوان Webhook مع صلاحية messages",
                "انسخ Page Access Token",
              ],
            },
            {
              platform: "إنستغرام",
              icon: <Instagram size={20} className="text-pink-600" />,
              color: "bg-pink-50 border-pink-200",
              status: "يحتاج ربط",
              statusColor: "text-amber-600 bg-amber-50",
              webhook: "https://almossah-website.vercel.app/api/nassir/webhooks/facebook",
              vars: [
                { name: "INSTAGRAM_ACCESS_TOKEN", desc: "توكن Instagram Business من Meta" },
                { name: "WEBHOOK_VERIFY_TOKEN", desc: "كلمة التحقق (almossah_nassir_2024)" },
              ],
              steps: [
                "ربط حساب إنستغرام Business بتطبيق Meta",
                "تفعيل Instagram Messaging في إعدادات التطبيق",
                "نفس Webhook عنوان فيسبوك",
              ],
            },
            {
              platform: "تيليجرام",
              icon: <Send size={20} className="text-sky-600" />,
              color: "bg-sky-50 border-sky-200",
              status: "يحتاج ربط",
              statusColor: "text-amber-600 bg-amber-50",
              webhook: "https://almossah-website.vercel.app/api/nassir/webhooks/telegram",
              vars: [
                { name: "TELEGRAM_BOT_TOKEN", desc: "توكن البوت من @BotFather على تيليجرام" },
              ],
              steps: [
                "تحدث مع @BotFather على تيليجرام",
                "أرسل /newbot واختر اسماً للبوت",
                "انسخ التوكن الذي تحصل عليه",
                "أضف TELEGRAM_BOT_TOKEN في متغيرات البيئة",
                "سيُسجَّل الـ Webhook تلقائياً عند أول رسالة",
              ],
            },
          ].map((platform) => (
            <div key={platform.platform} className={`border ${platform.color} rounded-xl overflow-hidden`}>
              <div className={`${platform.color} px-5 py-4 flex items-center justify-between`}>
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-white rounded-xl flex items-center justify-center shadow-sm">
                    {platform.icon}
                  </div>
                  <div>
                    <h3 className="font-bold text-slate-800">{platform.platform}</h3>
                    <p className="text-xs text-slate-500 mt-0.5">Webhook جاهز للربط</p>
                  </div>
                </div>
                <span className={`text-xs font-semibold px-3 py-1 rounded-full ${platform.statusColor}`}>
                  {platform.status}
                </span>
              </div>

              <div className="bg-white p-5 space-y-4">
                <div>
                  <p className="text-xs font-semibold text-slate-500 mb-1.5">عنوان Webhook</p>
                  <div className="flex items-center gap-2 bg-slate-50 border border-slate-200 rounded-lg px-3 py-2">
                    <code className="text-xs text-primary flex-1 font-mono break-all">{platform.webhook}</code>
                    <button
                      onClick={() => { void navigator.clipboard.writeText(platform.webhook); toast({ title: "تم النسخ" }); }}
                      className="text-xs text-slate-500 hover:text-primary shrink-0 font-medium"
                    >
                      نسخ
                    </button>
                  </div>
                </div>

                <div>
                  <p className="text-xs font-semibold text-slate-500 mb-2">متغيرات البيئة المطلوبة</p>
                  <div className="space-y-2">
                    {platform.vars.map((v) => (
                      <div key={v.name} className="flex items-start gap-3 p-3 bg-slate-50 rounded-lg">
                        <code className="text-xs font-mono text-orange-600 bg-orange-50 px-2 py-0.5 rounded shrink-0">{v.name}</code>
                        <p className="text-xs text-slate-600">{v.desc}</p>
                      </div>
                    ))}
                  </div>
                </div>

                <div>
                  <p className="text-xs font-semibold text-slate-500 mb-2">خطوات الربط</p>
                  <ol className="space-y-1.5">
                    {platform.steps.map((step, i) => (
                      <li key={i} className="flex items-start gap-2 text-xs text-slate-600">
                        <span className="w-5 h-5 bg-primary/10 text-primary rounded-full flex items-center justify-center shrink-0 font-bold text-[10px] mt-0.5">{i + 1}</span>
                        {step}
                      </li>
                    ))}
                  </ol>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      <Dialog open={!!selectedConvo} onOpenChange={() => setSelectedConvo(null)}>
        <DialogContent className="max-w-2xl max-h-[80vh] flex flex-col" dir="rtl">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-3">
              <MessageSquare size={20} className="text-primary" />
              <span>محادثة #{selectedConvo?.id}</span>
              {selectedConvo && <PlatformBadge platform={selectedConvo.platform} />}
            </DialogTitle>
          </DialogHeader>
          <div className="flex-1 overflow-y-auto space-y-3 py-2 min-h-0">
            {selectedConvo?.messages.map((msg) => (
              <div key={msg.id} className={`flex ${msg.role === "user" ? "justify-start" : "justify-end"}`}>
                <div className={`max-w-[80%] px-4 py-2.5 rounded-2xl text-sm leading-relaxed whitespace-pre-wrap ${
                  msg.role === "user"
                    ? "bg-primary text-white rounded-bl-sm"
                    : "bg-slate-100 text-slate-800 rounded-br-sm"
                }`}>
                  {msg.content}
                </div>
              </div>
            ))}
            {selectedConvo?.messages.length === 0 && (
              <p className="text-slate-400 text-center py-8">لا توجد رسائل في هذه المحادثة</p>
            )}
          </div>
          <div className="pt-3 border-t border-slate-100 shrink-0">
            <p className="text-xs text-slate-400">
              المستخدم: {selectedConvo?.userIdentifier || "زائر"} •
              الجلسة: {selectedConvo?.sessionId.slice(0, 12)}...
            </p>
          </div>
        </DialogContent>
      </Dialog>
    </AdminLayout>
  );
}
