import { AdminLayout } from "@/components/layout/AdminLayout";
import { useState, useEffect, useRef, useCallback } from "react";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { getAdminToken } from "@/lib/admin-auth";
import {
  Bot, MessageSquare, Settings, BarChart3, Trash2, Eye,
  Globe, Send, RefreshCw, ToggleLeft, ToggleRight,
  Smartphone, Instagram, Facebook, Webhook, Users,
  CheckCircle, XCircle, Clock, Save, UserCheck, UserX,
  Radio, AlertCircle, TrendingUp,
} from "lucide-react";

interface Conversation {
  id: number;
  sessionId: string;
  platform: string;
  userIdentifier: string | null;
  studentName: string | null;
  studentIntent: string | null;
  msgCount: number;
  adminTakeover: boolean;
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

const INTENT_BADGES: Record<string, { label: string; color: string }> = {
  interested: { label: "مهتم 🟢", color: "bg-emerald-100 text-emerald-700" },
  hesitant: { label: "متردد 🟡", color: "bg-amber-100 text-amber-700" },
  registered: { label: "مسجّل ✅", color: "bg-blue-100 text-blue-700" },
};

function PlatformBadge({ platform }: { platform: string }) {
  const p = PLATFORM_LABELS[platform] || { label: platform, icon: <Globe size={14} />, color: "bg-gray-100 text-gray-600" };
  return (
    <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium ${p.color}`}>
      {p.icon}{p.label}
    </span>
  );
}

function IntentBadge({ intent }: { intent: string | null }) {
  if (!intent) return null;
  const b = INTENT_BADGES[intent];
  if (!b) return null;
  return (
    <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium ${b.color}`}>
      {b.label}
    </span>
  );
}

function timeAgo(date: string) {
  const d = new Date(date);
  const diff = (Date.now() - d.getTime()) / 1000;
  if (diff < 60) return "الآن";
  if (diff < 3600) return `${Math.floor(diff / 60)} دق`;
  if (diff < 86400) return `${Math.floor(diff / 3600)} س`;
  return `${Math.floor(diff / 86400)} ي`;
}

function authHeaders() {
  const t = getAdminToken();
  return t ? { Authorization: `Bearer ${t}`, "Content-Type": "application/json" } : { "Content-Type": "application/json" };
}

// ── Conversation Detail Panel ────────────────────────────────────────────────
function ConversationPanel({
  convoId,
  onClose,
  onTakeoverChange,
}: {
  convoId: number;
  onClose: () => void;
  onTakeoverChange: (id: number, takeover: boolean) => void;
}) {
  const { toast } = useToast();
  const [detail, setDetail] = useState<ConversationDetail | null>(null);
  const [sendText, setSendText] = useState("");
  const [sending, setSending] = useState(false);
  const [togglingTakeover, setTogglingTakeover] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);

  const load = useCallback(async () => {
    try {
      const r = await fetch(`/api/admin/nassir/conversations/${convoId}`, { headers: authHeaders() });
      const data = await r.json() as ConversationDetail;
      setDetail(data);
      setTimeout(() => {
        if (scrollRef.current) scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
      }, 50);
    } catch {
      toast({ variant: "destructive", title: "خطأ في تحميل المحادثة" });
    }
  }, [convoId, toast]);

  useEffect(() => {
    void load();
    const t = setInterval(() => { void load(); }, 5000);
    return () => clearInterval(t);
  }, [load]);

  const handleSend = async () => {
    if (!sendText.trim() || !detail) return;
    setSending(true);
    try {
      const r = await fetch(`/api/admin/nassir/conversations/${convoId}/send`, {
        method: "POST",
        headers: authHeaders(),
        body: JSON.stringify({ message: sendText.trim() }),
      });
      const res = await r.json() as { success: boolean; delivered: boolean };
      setSendText("");
      await load();
      toast({
        title: res.delivered ? "✅ تم إرسال الرسالة للمستخدم" : "✅ تم حفظ الرسالة (الويب فقط)",
      });
    } catch {
      toast({ variant: "destructive", title: "فشل الإرسال" });
    }
    setSending(false);
  };

  const toggleTakeover = async () => {
    if (!detail) return;
    setTogglingTakeover(true);
    try {
      const r = await fetch(`/api/admin/nassir/conversations/${convoId}/takeover`, {
        method: "PATCH",
        headers: authHeaders(),
        body: JSON.stringify({ takeover: !detail.adminTakeover }),
      });
      const updated = await r.json() as Conversation;
      setDetail((d) => d ? { ...d, adminTakeover: updated.adminTakeover } : d);
      onTakeoverChange(convoId, updated.adminTakeover);
      toast({
        title: updated.adminTakeover
          ? "🔴 المسؤول يتحكم — ناصر متوقف لهذه المحادثة"
          : "🟢 ناصر مُعاد تشغيله لهذه المحادثة",
      });
    } catch {
      toast({ variant: "destructive", title: "خطأ في تغيير وضع التحكم" });
    }
    setTogglingTakeover(false);
  };

  const roleStyle = (role: string) => {
    if (role === "user") return "bg-slate-100 text-slate-800 self-start max-w-[80%]";
    if (role === "admin") return "bg-orange-100 text-orange-900 border border-orange-200 self-end max-w-[80%]";
    return "bg-primary text-white self-end max-w-[80%]";
  };

  const roleName = (role: string) => {
    if (role === "user") return "الطالب";
    if (role === "admin") return "المسؤول 👨‍💼";
    return "ناصر 🤖";
  };

  if (!detail) {
    return (
      <div className="flex items-center justify-center h-full text-slate-400">
        <RefreshCw size={24} className="animate-spin ml-2" /> جاري التحميل...
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full">
      {/* Header */}
      <div className="flex items-center justify-between p-4 border-b border-slate-200 bg-slate-50 shrink-0">
        <div className="flex items-center gap-3">
          <div>
            <div className="flex items-center gap-2">
              <span className="font-bold text-slate-800">
                {detail.studentName || detail.userIdentifier || `محادثة #${detail.id}`}
              </span>
              <PlatformBadge platform={detail.platform} />
              <IntentBadge intent={detail.studentIntent} />
            </div>
            <div className="text-xs text-slate-400 mt-0.5">
              {detail.msgCount} رسالة · آخر نشاط {timeAgo(detail.updatedAt)}
            </div>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={toggleTakeover}
            disabled={togglingTakeover}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
              detail.adminTakeover
                ? "bg-orange-100 text-orange-700 border border-orange-300 hover:bg-orange-200"
                : "bg-slate-100 text-slate-600 border border-slate-300 hover:bg-slate-200"
            }`}
          >
            {detail.adminTakeover ? <><UserCheck size={13} /> تحكم مباشر</> : <><UserX size={13} /> تولّ المحادثة</>}
          </button>
          <button
            onClick={load}
            className="w-7 h-7 rounded-lg bg-slate-100 hover:bg-slate-200 flex items-center justify-center text-slate-600"
          >
            <RefreshCw size={13} />
          </button>
          <button
            onClick={onClose}
            className="w-7 h-7 rounded-lg bg-slate-100 hover:bg-red-100 flex items-center justify-center text-slate-600 hover:text-red-500"
          >
            <XCircle size={14} />
          </button>
        </div>
      </div>

      {detail.adminTakeover && (
        <div className="mx-4 mt-3 px-3 py-2 bg-orange-50 border border-orange-200 rounded-lg text-xs text-orange-800 flex items-center gap-2 shrink-0">
          <AlertCircle size={13} />
          وضع التحكم المباشر مُفعَّل — ناصر متوقف. أنت تتحدث مباشرة مع المستخدم.
        </div>
      )}

      {/* Messages */}
      <div ref={scrollRef} className="flex-1 overflow-y-auto p-4 space-y-3">
        {detail.messages.map((m) => (
          <div key={m.id} className={`flex flex-col gap-0.5 ${m.role === "user" ? "items-start" : "items-end"}`}>
            <span className="text-xs text-slate-400 px-1">{roleName(m.role)}</span>
            <div className={`px-3 py-2 rounded-xl text-sm whitespace-pre-wrap leading-relaxed ${roleStyle(m.role)}`}>
              {m.content}
            </div>
            <span className="text-xs text-slate-300 px-1">
              {new Date(m.createdAt).toLocaleTimeString("ar-YE", { hour: "2-digit", minute: "2-digit" })}
            </span>
          </div>
        ))}
        {detail.messages.length === 0 && (
          <p className="text-center text-slate-400 text-sm py-8">لا توجد رسائل بعد</p>
        )}
      </div>

      {/* Send area */}
      <div className="p-4 border-t border-slate-200 bg-slate-50 shrink-0">
        <div className="flex gap-2">
          <input
            type="text"
            value={sendText}
            onChange={(e) => setSendText(e.target.value)}
            onKeyDown={(e) => { if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); void handleSend(); } }}
            placeholder={detail.adminTakeover ? "اكتب رداً مباشراً للمستخدم..." : "اكتب رسالة بصفتك المسؤول..."}
            dir="rtl"
            className="flex-1 border border-slate-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary/30"
          />
          <Button
            onClick={handleSend}
            disabled={sending || !sendText.trim()}
            size="sm"
            className="bg-primary gap-1.5 shrink-0"
          >
            {sending ? <RefreshCw size={14} className="animate-spin" /> : <Send size={14} />}
            إرسال
          </Button>
        </div>
        <p className="text-xs text-slate-400 mt-1.5 text-right">
          {detail.platform === "facebook" || detail.platform === "instagram"
            ? "✅ الرسالة ستُرسل مباشرة للمستخدم عبر فيسبوك/إنستغرام"
            : detail.platform === "telegram"
            ? "✅ الرسالة ستُرسل عبر تيليجرام"
            : "💬 الرسالة محفوظة — ستظهر للمستخدم في ويدجت الموقع"}
        </p>
      </div>
    </div>
  );
}

// ── Main Page ─────────────────────────────────────────────────────────────────
export default function NassirAdmin() {
  const { toast } = useToast();
  const [tab, setTab] = useState<"conversations" | "settings" | "stats" | "webhooks">("conversations");
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [loadingConvos, setLoadingConvos] = useState(true);
  const [selectedConvoId, setSelectedConvoId] = useState<number | null>(null);
  const [settings, setSettings] = useState<BotSettings | null>(null);
  const [saving, setSaving] = useState(false);
  const [editPrompt, setEditPrompt] = useState("");
  const [editWelcome, setEditWelcome] = useState("");
  const [searchTerm, setSearchTerm] = useState("");
  const [filterPlatform, setFilterPlatform] = useState("all");
  const [filterIntent, setFilterIntent] = useState("all");
  const [liveActive, setLiveActive] = useState(false);

  const loadConversations = useCallback(async (silent = false) => {
    if (!silent) setLoadingConvos(true);
    try {
      const r = await fetch("/api/admin/nassir/conversations", { headers: authHeaders() });
      const data = await r.json() as Conversation[];
      setConversations(Array.isArray(data) ? data : []);
    } catch {
      if (!silent) toast({ variant: "destructive", title: "خطأ في تحميل المحادثات" });
    }
    if (!silent) setLoadingConvos(false);
  }, [toast]);

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

  const deleteConversation = async (id: number) => {
    if (!confirm("هل أنت متأكد من حذف هذه المحادثة؟")) return;
    try {
      await fetch(`/api/admin/nassir/conversations/${id}`, {
        method: "DELETE",
        headers: authHeaders(),
      });
      setConversations((prev) => prev.filter((c) => c.id !== id));
      if (selectedConvoId === id) setSelectedConvoId(null);
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
    if (!confirm("هل تريد إعادة تعيين النظام الكامل للإقناع الأكاديمي؟")) return;
    try {
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
  };

  // Live auto-refresh every 10s when tab is conversations
  useEffect(() => {
    void loadConversations();
    void loadSettings();
  }, []);

  useEffect(() => {
    if (tab !== "conversations") return;
    const t = setInterval(() => { void loadConversations(true); }, 10000);
    return () => clearInterval(t);
  }, [tab, loadConversations]);

  const handleTakeoverChange = (id: number, takeover: boolean) => {
    setConversations((prev) =>
      prev.map((c) => c.id === id ? { ...c, adminTakeover: takeover } : c)
    );
  };

  const filteredConvos = conversations.filter((c) => {
    const matchPlatform = filterPlatform === "all" || c.platform === filterPlatform;
    const matchIntent = filterIntent === "all" || c.studentIntent === filterIntent;
    const name = (c.studentName || c.userIdentifier || c.sessionId).toLowerCase();
    const matchSearch = !searchTerm || name.includes(searchTerm.toLowerCase());
    return matchPlatform && matchIntent && matchSearch;
  });

  const platformStats = conversations.reduce<Record<string, number>>((acc, c) => {
    acc[c.platform] = (acc[c.platform] || 0) + 1;
    return acc;
  }, {});

  const intentStats = conversations.reduce<Record<string, number>>((acc, c) => {
    if (c.studentIntent) acc[c.studentIntent] = (acc[c.studentIntent] || 0) + 1;
    return acc;
  }, {});

  const takeoverCount = conversations.filter((c) => c.adminTakeover).length;

  const TABS = [
    { id: "conversations", label: "المحادثات", icon: <MessageSquare size={16} /> },
    { id: "settings", label: "إعدادات ناصر", icon: <Settings size={16} /> },
    { id: "stats", label: "الإحصائيات", icon: <BarChart3 size={16} /> },
    { id: "webhooks", label: "المنصات والربط", icon: <Webhook size={16} /> },
  ] as const;

  return (
    <AdminLayout>
      {/* Header */}
      <div className="mb-6 flex items-center justify-between flex-wrap gap-4">
        <div className="flex items-center gap-3">
          <div className="w-11 h-11 bg-primary/10 rounded-xl flex items-center justify-center">
            <Bot size={24} className="text-primary" />
          </div>
          <div>
            <div className="flex items-center gap-3">
              <h1 className="text-2xl font-bold text-slate-900">ناصر — المساعد الذكي</h1>
              {liveActive && (
                <span className="flex items-center gap-1 text-xs font-semibold text-emerald-600 bg-emerald-50 border border-emerald-200 px-2 py-0.5 rounded-full">
                  <Radio size={10} className="animate-pulse" /> مباشر
                </span>
              )}
            </div>
            <p className="text-slate-500 text-sm">إدارة شاملة للمساعد الأكاديمي ومنصات التواصل</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          {takeoverCount > 0 && (
            <span className="flex items-center gap-1.5 text-xs font-bold text-orange-700 bg-orange-50 border border-orange-200 px-3 py-1.5 rounded-lg">
              <UserCheck size={13} /> {takeoverCount} تحت تحكم مباشر
            </span>
          )}
          {settings && (
            <button
              onClick={toggleActive}
              className={`flex items-center gap-2 px-4 py-2 rounded-xl font-semibold text-sm transition-all ${settings.isActive ? "bg-emerald-50 text-emerald-700 border border-emerald-200 hover:bg-emerald-100" : "bg-red-50 text-red-600 border border-red-200 hover:bg-red-100"}`}
            >
              {settings.isActive ? <><ToggleRight size={20} /> ناصر مُفعَّل</> : <><ToggleLeft size={20} /> ناصر مُوقف</>}
            </button>
          )}
        </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 bg-slate-100 rounded-xl p-1 mb-6 w-fit">
        {TABS.map((t) => (
          <button
            key={t.id}
            onClick={() => setTab(t.id)}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all ${tab === t.id ? "bg-white text-primary shadow-sm" : "text-slate-600 hover:text-slate-900"}`}
          >
            {t.icon}{t.label}
            {t.id === "conversations" && conversations.length > 0 && (
              <span className="bg-primary/10 text-primary text-xs rounded-full px-1.5 py-0.5 leading-none">
                {conversations.length}
              </span>
            )}
          </button>
        ))}
      </div>

      {/* ── Conversations Tab ── */}
      {tab === "conversations" && (
        <div className={`flex gap-4 ${selectedConvoId ? "h-[calc(100vh-260px)]" : ""}`}>
          {/* Left: Conversation list */}
          <div className={`${selectedConvoId ? "w-[46%] shrink-0" : "w-full"} bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden flex flex-col`}>
            {/* Filters */}
            <div className="px-4 py-3 border-b border-slate-200 bg-slate-50 flex items-center justify-between flex-wrap gap-2">
              <h2 className="font-bold text-slate-800 flex items-center gap-2 text-sm">
                <MessageSquare size={16} className="text-primary" />
                المحادثات ({filteredConvos.length})
              </h2>
              <div className="flex items-center gap-2 flex-wrap">
                <input
                  type="text"
                  placeholder="بحث..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="border border-slate-200 rounded-lg px-2.5 py-1.5 text-xs w-28 focus:outline-none focus:ring-2 focus:ring-primary/30"
                />
                <select
                  value={filterPlatform}
                  onChange={(e) => setFilterPlatform(e.target.value)}
                  className="border border-slate-200 rounded-lg px-2.5 py-1.5 text-xs focus:outline-none"
                >
                  <option value="all">كل المنصات</option>
                  {Object.keys(PLATFORM_LABELS).map((p) => (
                    <option key={p} value={p}>{PLATFORM_LABELS[p].label}</option>
                  ))}
                </select>
                <select
                  value={filterIntent}
                  onChange={(e) => setFilterIntent(e.target.value)}
                  className="border border-slate-200 rounded-lg px-2.5 py-1.5 text-xs focus:outline-none"
                >
                  <option value="all">كل النيات</option>
                  <option value="interested">مهتم 🟢</option>
                  <option value="hesitant">متردد 🟡</option>
                  <option value="registered">مسجّل ✅</option>
                </select>
                <button
                  onClick={() => loadConversations()}
                  className="w-7 h-7 rounded-lg bg-white border border-slate-200 hover:bg-slate-50 flex items-center justify-center text-slate-600"
                >
                  <RefreshCw size={13} />
                </button>
              </div>
            </div>

            {/* List */}
            <div className="overflow-y-auto flex-1">
              {loadingConvos ? (
                <div className="flex items-center justify-center h-32 text-slate-400 text-sm">
                  <RefreshCw size={18} className="animate-spin ml-2" /> جاري التحميل...
                </div>
              ) : filteredConvos.length === 0 ? (
                <div className="flex flex-col items-center justify-center h-32 text-slate-400">
                  <MessageSquare size={28} className="mb-2 opacity-40" />
                  <p className="text-sm">لا توجد محادثات</p>
                </div>
              ) : (
                <div className="divide-y divide-slate-100">
                  {filteredConvos.map((convo) => (
                    <div
                      key={convo.id}
                      onClick={() => setSelectedConvoId(convo.id === selectedConvoId ? null : convo.id)}
                      className={`px-4 py-3 cursor-pointer hover:bg-slate-50 transition-colors flex items-start gap-3 ${selectedConvoId === convo.id ? "bg-primary/5 border-r-2 border-r-primary" : ""} ${convo.adminTakeover ? "bg-orange-50/60" : ""}`}
                    >
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-1 flex-wrap">
                          <span className="font-semibold text-slate-800 text-sm truncate">
                            {convo.studentName || convo.userIdentifier || `#${convo.id}`}
                          </span>
                          {convo.adminTakeover && (
                            <span className="text-xs bg-orange-100 text-orange-700 px-1.5 py-0.5 rounded-full shrink-0">
                              👨‍💼 تحكم مباشر
                            </span>
                          )}
                        </div>
                        <div className="flex items-center gap-1.5 flex-wrap">
                          <PlatformBadge platform={convo.platform} />
                          <IntentBadge intent={convo.studentIntent} />
                          {convo.msgCount > 0 && (
                            <span className="text-xs text-slate-400">{convo.msgCount} رسالة</span>
                          )}
                        </div>
                      </div>
                      <div className="flex flex-col items-end gap-2 shrink-0">
                        <span className="text-xs text-slate-400">{timeAgo(convo.updatedAt)}</span>
                        <div className="flex items-center gap-1.5">
                          <button
                            onClick={(e) => { e.stopPropagation(); setSelectedConvoId(convo.id); }}
                            className="w-7 h-7 rounded-lg bg-primary/10 hover:bg-primary/20 flex items-center justify-center text-primary"
                            title="عرض"
                          >
                            <Eye size={13} />
                          </button>
                          <button
                            onClick={(e) => { e.stopPropagation(); void deleteConversation(convo.id); }}
                            className="w-7 h-7 rounded-lg bg-red-50 hover:bg-red-100 flex items-center justify-center text-red-400"
                            title="حذف"
                          >
                            <Trash2 size={13} />
                          </button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Right: Detail panel */}
          {selectedConvoId && (
            <div className="flex-1 bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden flex flex-col">
              <ConversationPanel
                convoId={selectedConvoId}
                onClose={() => setSelectedConvoId(null)}
                onTakeoverChange={handleTakeoverChange}
              />
            </div>
          )}
        </div>
      )}

      {/* ── Settings Tab ── */}
      {tab === "settings" && settings && (
        <div className="space-y-6">
          <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-6">
            <div className="flex items-center justify-between mb-5">
              <h2 className="font-bold text-slate-800 flex items-center gap-2 text-lg">
                <Bot size={20} className="text-primary" /> شخصية ناصر ونظام الإقناع
              </h2>
              <Button
                size="sm"
                variant="outline"
                onClick={resetToMaster}
                className="text-orange-600 border-orange-200 hover:bg-orange-50 gap-1"
              >
                <RefreshCw size={14} /> استعادة النظام الكامل
              </Button>
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
                placeholder="أضف هنا تعليمات خاصة إضافية... (اتركه فارغاً لاستخدام النظام الكامل)"
                className="w-full border border-slate-200 rounded-xl px-4 py-3 text-sm font-mono focus:outline-none focus:ring-2 focus:ring-primary/40 resize-none"
              />
            </div>

            <div className="mb-6">
              <label className="block text-sm font-semibold text-slate-700 mb-2">رسالة الترحيب</label>
              <textarea
                value={editWelcome}
                onChange={(e) => setEditWelcome(e.target.value)}
                rows={3}
                dir="rtl"
                className="w-full border border-slate-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-primary/40 resize-none"
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

      {/* ── Stats Tab ── */}
      {tab === "stats" && (
        <div className="space-y-6">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm flex items-center gap-4">
              <div className="w-11 h-11 bg-blue-50 rounded-xl flex items-center justify-center shrink-0">
                <MessageSquare size={20} className="text-blue-600" />
              </div>
              <div>
                <p className="text-slate-500 text-xs">إجمالي المحادثات</p>
                <h3 className="text-2xl font-bold text-slate-900">{conversations.length}</h3>
              </div>
            </div>
            <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm flex items-center gap-4">
              <div className="w-11 h-11 bg-emerald-50 rounded-xl flex items-center justify-center shrink-0">
                <TrendingUp size={20} className="text-emerald-600" />
              </div>
              <div>
                <p className="text-slate-500 text-xs">مهتمون بالتسجيل</p>
                <h3 className="text-2xl font-bold text-slate-900">{(intentStats.interested || 0) + (intentStats.registered || 0)}</h3>
              </div>
            </div>
            <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm flex items-center gap-4">
              <div className="w-11 h-11 bg-blue-50 rounded-xl flex items-center justify-center shrink-0">
                <CheckCircle size={20} className="text-blue-600" />
              </div>
              <div>
                <p className="text-slate-500 text-xs">مسجّلون</p>
                <h3 className="text-2xl font-bold text-slate-900">{intentStats.registered || 0}</h3>
              </div>
            </div>
            <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm flex items-center gap-4">
              <div className="w-11 h-11 bg-orange-50 rounded-xl flex items-center justify-center shrink-0">
                <UserCheck size={20} className="text-orange-600" />
              </div>
              <div>
                <p className="text-slate-500 text-xs">تحكم مباشر نشط</p>
                <h3 className="text-2xl font-bold text-slate-900">{takeoverCount}</h3>
              </div>
            </div>
          </div>

          {/* Platform bars */}
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
                      <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs ${val.color}`}>
                        {val.icon} {val.label}
                      </span>
                      <span className="text-sm font-bold text-slate-900">{count} ({pct}%)</span>
                    </div>
                    <div className="h-2.5 bg-slate-100 rounded-full overflow-hidden">
                      <div className="h-full bg-primary rounded-full transition-all duration-500" style={{ width: `${pct}%` }} />
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Intent distribution */}
          <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
            <div className="px-6 py-4 border-b border-slate-200 bg-slate-50">
              <h2 className="font-bold text-slate-800">توزيع نية الطلاب</h2>
            </div>
            <div className="p-6 grid grid-cols-3 gap-4">
              {[
                { key: "interested", label: "مهتم", icon: "🟢", color: "bg-emerald-50 border-emerald-200 text-emerald-700" },
                { key: "hesitant", label: "متردد", icon: "🟡", color: "bg-amber-50 border-amber-200 text-amber-700" },
                { key: "registered", label: "مسجّل", icon: "✅", color: "bg-blue-50 border-blue-200 text-blue-700" },
              ].map((item) => (
                <div key={item.key} className={`flex flex-col items-center justify-center p-4 rounded-xl border ${item.color}`}>
                  <span className="text-2xl mb-1">{item.icon}</span>
                  <span className="text-2xl font-bold">{intentStats[item.key] || 0}</span>
                  <span className="text-xs font-medium mt-0.5">{item.label}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Recent */}
          <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-6">
            <h2 className="font-bold text-slate-800 mb-4 flex items-center gap-2">
              <Clock size={18} className="text-primary" /> أحدث المحادثات
            </h2>
            <div className="space-y-2">
              {conversations.slice(0, 8).map((c) => (
                <div
                  key={c.id}
                  className="flex items-center justify-between p-3 bg-slate-50 rounded-lg cursor-pointer hover:bg-slate-100"
                  onClick={() => { setTab("conversations"); setSelectedConvoId(c.id); }}
                >
                  <div className="flex items-center gap-2">
                    <PlatformBadge platform={c.platform} />
                    <span className="text-sm text-slate-700">{c.studentName || c.userIdentifier || `#${c.id}`}</span>
                    <IntentBadge intent={c.studentIntent} />
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

      {/* ── Webhooks Tab ── */}
      {tab === "webhooks" && (
        <div className="space-y-5">
          <div className="bg-blue-50 border border-blue-200 rounded-xl p-4 text-sm text-blue-800">
            <strong>📌 كيفية الربط:</strong> أضف متغيرات البيئة التالية في إعدادات Vercel/النشر، ثم أضف عنوان الـ Webhook في إعدادات كل منصة.
          </div>

          {[
            {
              platform: "فيسبوك Messenger",
              icon: <Facebook size={20} className="text-indigo-600" />,
              color: "bg-indigo-50 border-indigo-200",
              envVars: ["FACEBOOK_PAGE_ACCESS_TOKEN", "WEBHOOK_VERIFY_TOKEN"],
              webhookUrl: `${window.location.origin}/api/nassir/webhooks/facebook`,
              notes: "في Meta Developer: Pages → Add Messenger Product → Webhooks → Subscribe to messages + messaging_postbacks",
            },
            {
              platform: "إنستغرام DM",
              icon: <Instagram size={20} className="text-pink-600" />,
              color: "bg-pink-50 border-pink-200",
              envVars: ["INSTAGRAM_ACCESS_TOKEN", "WEBHOOK_VERIFY_TOKEN"],
              webhookUrl: `${window.location.origin}/api/nassir/webhooks/facebook`,
              notes: "نفس الـ Webhook endpoint مع تفعيل instagram في Meta Developer",
            },
            {
              platform: "تيليجرام Bot",
              icon: <Send size={20} className="text-sky-600" />,
              color: "bg-sky-50 border-sky-200",
              envVars: ["TELEGRAM_BOT_TOKEN"],
              webhookUrl: `${window.location.origin}/api/nassir/webhooks/telegram`,
              notes: "في BotFather: أنشئ Bot جديد، احصل على التوكن، أضف Webhook",
            },
          ].map((item) => (
            <div key={item.platform} className={`rounded-xl border p-5 ${item.color}`}>
              <div className="flex items-center gap-3 mb-4">
                <div className="w-10 h-10 bg-white rounded-xl flex items-center justify-center shadow-sm">
                  {item.icon}
                </div>
                <div>
                  <h3 className="font-bold text-slate-800">{item.platform}</h3>
                  <p className="text-xs text-slate-500">{item.notes}</p>
                </div>
              </div>
              <div className="space-y-2">
                {item.envVars.map((v) => (
                  <div key={v} className="flex items-center gap-2 bg-white rounded-lg p-2.5 font-mono text-xs border border-slate-200">
                    <span className="text-slate-500">ENV:</span>
                    <span className="font-bold text-slate-800">{v}</span>
                  </div>
                ))}
                <div className="flex items-center gap-2 bg-slate-900 text-green-400 rounded-lg p-2.5 font-mono text-xs">
                  <Globe size={12} className="text-slate-400 shrink-0" />
                  <span className="truncate">{item.webhookUrl}</span>
                  <button
                    onClick={() => { void navigator.clipboard.writeText(item.webhookUrl); toast({ title: "تم نسخ الرابط" }); }}
                    className="ml-auto shrink-0 text-slate-400 hover:text-white"
                  >
                    نسخ
                  </button>
                </div>
              </div>
            </div>
          ))}

          <div className="bg-emerald-50 border border-emerald-200 rounded-xl p-5">
            <h3 className="font-bold text-slate-800 mb-3 flex items-center gap-2">
              <Users size={18} className="text-emerald-600" /> التحكم المباشر (Admin Intervention)
            </h3>
            <ul className="text-sm text-slate-700 space-y-2">
              <li>✅ <strong>تولّ أي محادثة:</strong> اضغط على أيقونة العين لفتح المحادثة → اضغط "تولّ المحادثة"</li>
              <li>✅ <strong>أرسل مباشرة:</strong> اكتب رسالتك في المحادثة وستصل للمستخدم عبر نفس منصته (فيسبوك/إنستغرام/تيليجرام)</li>
              <li>✅ <strong>أطلق السيطرة:</strong> اضغط "تحكم مباشر" مرة ثانية لإعادة ناصر للرد الآلي</li>
              <li>✅ <strong>Facebook Handover Protocol:</strong> عند إطلاق السيطرة، يُمرر التحكم تلقائياً لـ ناصر</li>
            </ul>
          </div>
        </div>
      )}
    </AdminLayout>
  );
}
