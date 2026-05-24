import { useState, useEffect } from "react";
  import { AdminLayout } from "@/components/layout/AdminLayout";
  import { Button } from "@/components/ui/button";
  import { Bot, MessageSquare, Trash2, Eye, Power, Save, ChevronRight, RefreshCw, Smartphone, Facebook, Instagram, Globe } from "lucide-react";
  import { getAdminToken } from "@/lib/admin-auth";

  const BASE = import.meta.env.BASE_URL?.replace(/\/$/, "") || "";

  interface Settings {
    id: number;
    systemPrompt: string;
    welcomeMessage: string;
    isActive: boolean;
  }

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
    role: "user" | "assistant";
    content: string;
    createdAt: string;
  }

  function PlatformBadge({ platform }: { platform: string }) {
    const map: Record<string, { icon: React.ReactNode; label: string; color: string }> = {
      web: { icon: <Globe size={12} />, label: "الموقع", color: "bg-blue-100 text-blue-700" },
      whatsapp: { icon: <Smartphone size={12} />, label: "واتساب", color: "bg-green-100 text-green-700" },
      facebook: { icon: <Facebook size={12} />, label: "فيسبوك", color: "bg-indigo-100 text-indigo-700" },
      instagram: { icon: <Instagram size={12} />, label: "إنستغرام", color: "bg-pink-100 text-pink-700" },
    };
    const info = map[platform] || { icon: <Globe size={12} />, label: platform, color: "bg-gray-100 text-gray-600" };
    return (
      <span className={`inline-flex items-center gap-1 text-xs px-2 py-0.5 rounded-full font-medium ${info.color}`}>
        {info.icon}{info.label}
      </span>
    );
  }

  export default function NassirAdmin() {
    const [tab, setTab] = useState<"settings" | "conversations">("conversations");
    const [settings, setSettings] = useState<Settings | null>(null);
    const [conversations, setConversations] = useState<Conversation[]>([]);
    const [selectedConvo, setSelectedConvo] = useState<(Conversation & { messages: Message[] }) | null>(null);
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [saved, setSaved] = useState(false);
    const [editSettings, setEditSettings] = useState<Partial<Settings>>({});

    const token = getAdminToken();
    const authHeaders: Record<string, string> = {
      "Content-Type": "application/json",
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    };

    const loadSettings = async () => {
      const res = await fetch(`${BASE}/api/nassir/settings`);
      if (res.ok) {
        const data = await res.json();
        setSettings(data);
        setEditSettings(data);
      }
    };

    const loadConversations = async () => {
      const res = await fetch(`${BASE}/api/admin/nassir/conversations`, { headers: authHeaders });
      if (res.ok) setConversations(await res.json());
      setLoading(false);
    };

    useEffect(() => {
      Promise.all([loadSettings(), loadConversations()]);
    }, []);

    const saveSettings = async () => {
      if (!settings) return;
      setSaving(true);
      const res = await fetch(`${BASE}/api/admin/nassir/settings`, {
        method: "PATCH",
        headers: authHeaders,
        body: JSON.stringify(editSettings),
      });
      if (res.ok) {
        const data = await res.json();
        setSettings(data);
        setEditSettings(data);
        setSaved(true);
        setTimeout(() => setSaved(false), 2000);
      }
      setSaving(false);
    };

    const toggleActive = async () => {
      if (!settings) return;
      const newVal = !settings.isActive;
      const res = await fetch(`${BASE}/api/admin/nassir/settings`, {
        method: "PATCH",
        headers: authHeaders,
        body: JSON.stringify({ isActive: newVal }),
      });
      if (res.ok) {
        const data = await res.json();
        setSettings(data);
        setEditSettings(data);
      }
    };

    const openConvo = async (convo: Conversation) => {
      const res = await fetch(`${BASE}/api/admin/nassir/conversations/${convo.id}`, { headers: authHeaders });
      if (res.ok) setSelectedConvo(await res.json());
    };

    const deleteConvo = async (id: number, e: React.MouseEvent) => {
      e.stopPropagation();
      if (!confirm("هل تريد حذف هذه المحادثة؟")) return;
      await fetch(`${BASE}/api/admin/nassir/conversations/${id}`, { method: "DELETE", headers: authHeaders });
      setConversations(prev => prev.filter(c => c.id !== id));
      if (selectedConvo?.id === id) setSelectedConvo(null);
    };

    const platformCounts = conversations.reduce((acc, c) => {
      acc[c.platform] = (acc[c.platform] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    return (
      <AdminLayout>
        <div dir="rtl" className="space-y-6">
          {/* Header */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-primary/10 rounded-xl flex items-center justify-center">
                <Bot size={22} className="text-primary" />
              </div>
              <div>
                <h1 className="text-xl font-bold text-gray-900">ناصر — المساعد الذكي</h1>
                <p className="text-sm text-gray-500">مبني على Grok xAI</p>
              </div>
            </div>
            <button
              onClick={toggleActive}
              className={`flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-medium transition-all ${
                settings?.isActive
                  ? "bg-green-100 text-green-700 hover:bg-red-100 hover:text-red-700"
                  : "bg-red-100 text-red-700 hover:bg-green-100 hover:text-green-700"
              }`}
            >
              <Power size={16} />
              {settings?.isActive ? "ناصر يعمل" : "ناصر متوقف"}
            </button>
          </div>

          {/* Stats */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {[
              { label: "إجمالي المحادثات", value: conversations.length, color: "text-blue-600" },
              { label: "من الموقع", value: platformCounts["web"] || 0, color: "text-blue-500" },
              { label: "من واتساب", value: platformCounts["whatsapp"] || 0, color: "text-green-500" },
              { label: "فيسبوك / إنستغرام", value: (platformCounts["facebook"] || 0) + (platformCounts["instagram"] || 0), color: "text-purple-500" },
            ].map((s) => (
              <div key={s.label} className="bg-white rounded-xl border border-gray-100 p-4 shadow-sm">
                <p className={`text-2xl font-bold ${s.color}`}>{s.value}</p>
                <p className="text-xs text-gray-500 mt-1">{s.label}</p>
              </div>
            ))}
          </div>

          {/* Tabs */}
          <div className="flex gap-1 bg-gray-100 rounded-xl p-1 w-fit">
            {[
              { id: "conversations", label: "المحادثات", icon: <MessageSquare size={16} /> },
              { id: "settings", label: "الإعدادات", icon: <Bot size={16} /> },
            ].map((t) => (
              <button
                key={t.id}
                onClick={() => setTab(t.id as typeof tab)}
                className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all ${
                  tab === t.id ? "bg-white text-primary shadow-sm" : "text-gray-500 hover:text-gray-700"
                }`}
              >
                {t.icon}{t.label}
              </button>
            ))}
          </div>

          {/* ── Tab: Conversations ── */}
          {tab === "conversations" && (
            <div className="grid grid-cols-1 lg:grid-cols-5 gap-4">
              {/* List */}
              <div className="lg:col-span-2 bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
                <div className="flex items-center justify-between px-4 py-3 border-b border-gray-100">
                  <span className="font-semibold text-sm text-gray-700">المحادثات ({conversations.length})</span>
                  <button onClick={() => { setLoading(true); loadConversations(); }} className="p-1.5 rounded-lg hover:bg-gray-100 text-gray-400 hover:text-gray-600 transition-colors">
                    <RefreshCw size={15} />
                  </button>
                </div>
                {loading ? (
                  <div className="flex justify-center py-12">
                    <div className="w-6 h-6 border-2 border-primary/30 border-t-primary rounded-full animate-spin" />
                  </div>
                ) : conversations.length === 0 ? (
                  <div className="text-center py-12 text-gray-400">
                    <MessageSquare size={32} className="mx-auto mb-2 opacity-40" />
                    <p className="text-sm">لا توجد محادثات بعد</p>
                  </div>
                ) : (
                  <div className="overflow-y-auto max-h-[520px] divide-y divide-gray-50">
                    {conversations.map((c) => (
                      <div
                        key={c.id}
                        onClick={() => openConvo(c)}
                        className={`flex items-center gap-3 px-4 py-3 cursor-pointer hover:bg-gray-50 transition-colors ${selectedConvo?.id === c.id ? "bg-primary/5 border-r-2 border-primary" : ""}`}
                      >
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 mb-0.5">
                            <PlatformBadge platform={c.platform} />
                            <span className="text-xs text-gray-400">#{c.id}</span>
                          </div>
                          <p className="text-xs text-gray-400 truncate">
                            {c.userIdentifier || "زائر مجهول"} · {new Date(c.updatedAt).toLocaleDateString("ar-YE")}
                          </p>
                        </div>
                        <div className="flex items-center gap-1 shrink-0">
                          <button onClick={(e) => deleteConvo(c.id, e)} className="p-1.5 rounded-lg hover:bg-red-50 text-gray-300 hover:text-red-500 transition-colors">
                            <Trash2 size={13} />
                          </button>
                          <ChevronRight size={14} className="text-gray-300" />
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Detail */}
              <div className="lg:col-span-3 bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden flex flex-col">
                {!selectedConvo ? (
                  <div className="flex-1 flex flex-col items-center justify-center text-gray-300 py-16">
                    <Eye size={40} className="mb-3 opacity-40" />
                    <p className="text-sm">اختر محادثة لعرض تفاصيلها</p>
                  </div>
                ) : (
                  <>
                    <div className="flex items-center gap-3 px-4 py-3 border-b border-gray-100 shrink-0">
                      <PlatformBadge platform={selectedConvo.platform} />
                      <span className="text-sm font-medium text-gray-700">{selectedConvo.userIdentifier || "زائر"}</span>
                      <span className="text-xs text-gray-400 mr-auto">{new Date(selectedConvo.createdAt).toLocaleDateString("ar-YE")}</span>
                    </div>
                    <div className="flex-1 overflow-y-auto p-4 space-y-3 bg-gray-50" style={{ maxHeight: "460px" }}>
                      {selectedConvo.messages.map((msg) => (
                        <div key={msg.id} className={`flex ${msg.role === "user" ? "justify-start" : "justify-end"}`}>
                          <div className={`max-w-[80%] rounded-2xl px-3 py-2 text-sm ${
                            msg.role === "user"
                              ? "bg-white text-gray-800 border border-gray-100 rounded-tr-sm"
                              : "bg-primary text-white rounded-tl-sm"
                          }`}>
                            <p className="leading-relaxed whitespace-pre-wrap">{msg.content}</p>
                            <p className={`text-[10px] mt-1 ${msg.role === "user" ? "text-gray-400" : "text-white/60"}`}>
                              {new Date(msg.createdAt).toLocaleTimeString("ar-YE", { hour: "2-digit", minute: "2-digit" })}
                            </p>
                          </div>
                        </div>
                      ))}
                    </div>
                  </>
                )}
              </div>
            </div>
          )}

          {/* ── Tab: Settings ── */}
          {tab === "settings" && settings && (
            <div className="max-w-2xl space-y-5">
              <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6 space-y-5">
                <h2 className="font-semibold text-gray-800 flex items-center gap-2">
                  <Bot size={18} className="text-primary" />
                  إعدادات ناصر
                </h2>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1.5">رسالة الترحيب</label>
                  <textarea
                    value={editSettings.welcomeMessage ?? ""}
                    onChange={(e) => setEditSettings((p) => ({ ...p, welcomeMessage: e.target.value }))}
                    rows={3}
                    className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary resize-none"
                    placeholder="رسالة الترحيب التي يراها الزائر أول ما يفتح ناصر..."
                  />
                  <p className="text-xs text-gray-400 mt-1">هذه أول رسالة يراها الزائر عند فتح نافذة الدردشة</p>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1.5">الشخصية والتعليمات (System Prompt)</label>
                  <textarea
                    value={editSettings.systemPrompt ?? ""}
                    onChange={(e) => setEditSettings((p) => ({ ...p, systemPrompt: e.target.value }))}
                    rows={8}
                    className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary resize-none font-mono"
                    placeholder="اكتب تعليمات شخصية ناصر هنا... مثلاً: أنت مساعد ذكي للمؤسسة..."
                  />
                  <p className="text-xs text-gray-400 mt-1">هذه التعليمات يراها فقط الذكاء الاصطناعي ولا يراها الزوار — تحدد شخصية ناصر وكيفية ردوده</p>
                </div>

                <Button
                  onClick={saveSettings}
                  disabled={saving}
                  className="bg-primary hover:bg-primary/90 text-white gap-2"
                >
                  {saving ? (
                    <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  ) : (
                    <Save size={16} />
                  )}
                  {saved ? "تم الحفظ ✓" : "حفظ الإعدادات"}
                </Button>
              </div>

              {/* Social media guide */}
              <div className="bg-blue-50 border border-blue-100 rounded-2xl p-6 space-y-4">
                <h3 className="font-semibold text-blue-800 text-sm flex items-center gap-2">
                  <Smartphone size={16} />
                  كيفية ربط مواقع التواصل الاجتماعي
                </h3>
                <div className="space-y-3 text-sm text-blue-700">
                  {[
                    {
                      platform: "واتساب Business",
                      icon: "💬",
                      url: `${window.location.origin}/api/nassir/webhooks/whatsapp`,
                      token: "WHATSAPP_ACCESS_TOKEN",
                      steps: ["اذهب إلى Meta for Developers → WhatsApp", "أضف رابط Webhook أعلاه", "Verify Token: almossah_nassir_2024"],
                    },
                    {
                      platform: "فيسبوك ماسنجر",
                      icon: "📘",
                      url: `${window.location.origin}/api/nassir/webhooks/facebook`,
                      token: "FACEBOOK_PAGE_ACCESS_TOKEN",
                      steps: ["اذهب إلى Meta for Developers → Messenger", "أضف رابط Webhook أعلاه", "Verify Token: almossah_nassir_2024"],
                    },
                    {
                      platform: "إنستغرام",
                      icon: "📸",
                      url: `${window.location.origin}/api/nassir/webhooks/facebook`,
                      token: "INSTAGRAM_ACCESS_TOKEN",
                      steps: ["نفس webhook فيسبوك (يتعامل مع Instagram أيضاً)", "حساب Instagram Business مطلوب"],
                    },
                  ].map((p) => (
                    <div key={p.platform} className="bg-white rounded-xl p-3 space-y-2">
                      <p className="font-semibold text-gray-800">{p.icon} {p.platform}</p>
                      <div className="bg-gray-50 rounded-lg px-3 py-1.5 font-mono text-xs text-gray-600 break-all select-all">
                        {p.url}
                      </div>
                      <ul className="text-xs text-gray-600 space-y-1 list-none">
                        {p.steps.map((s, i) => <li key={i} className="flex gap-1"><span className="text-blue-400 shrink-0">{i + 1}.</span>{s}</li>)}
                      </ul>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}
        </div>
      </AdminLayout>
    );
  }
  