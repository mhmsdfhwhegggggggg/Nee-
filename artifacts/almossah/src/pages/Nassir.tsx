import { useState, useRef, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Bot, Send, Upload, Check, Loader2, ImageIcon, Sparkles, GraduationCap, BookOpen, Heart, Star } from "lucide-react";

interface Message {
  id: string;
  role: "user" | "assistant";
  content: string;
  isTyping?: boolean;
}

interface ExtractedData {
  fullName?: string;
  gpa?: string;
  department?: string;
  city?: string;
  phone?: string;
  email?: string;
  programType?: string;
  specialtyWanted?: string;
  universityChoice1?: string;
  notes?: string;
}

// الحقول المطلوبة لإتمام التسجيل — تطابق نموذج التسجيل الرسمي
const REQUIRED_FIELDS: Array<{ key: keyof ExtractedData; label: string; question: string }> = [
  { key: "fullName",        label: "الاسم",      question: "ما **اسمك الرباعي الكامل**؟" },
  { key: "gpa",             label: "المعدل",     question: "ما **معدلك في الثانوية**؟ (مثال: 85.5% أو 425 درجة)" },
  { key: "department",      label: "القسم",      question: "ما **قسمك**؟\n\n1️⃣ علمي\n2️⃣ أدبي" },
  { key: "city",            label: "المدينة",    question: "من أي **محافظة**؟\n\nصنعاء | عدن | تعز | إب | الحديدة | حضرموت | مأرب | ذمار | صعدة | شبوة | البيضاء | لحج | أبين | ريمة | الضالع | المهرة | الجوف | سقطرى | أمانة العاصمة" },
  { key: "phone",           label: "الهاتف",     question: "ما **رقم هاتفك**؟ (9 أرقام على الأقل)" },
  { key: "email",           label: "البريد",     question: "ما **بريدك الإلكتروني**؟\n\n_(اكتب **تخطي** إذا لم يكن لديك)_" },
  { key: "programType",     label: "البرنامج",   question: "أي **برنامج** يهمك؟\n\n1️⃣ منح دراسية\n2️⃣ تخفيضات جامعية\n3️⃣ تأمين طبي\n4️⃣ برامج أكاديمية" },
  { key: "universityChoice1", label: "الجامعة", question: "أي **جامعة** تفضل؟" },
  { key: "specialtyWanted", label: "التخصص",    question: "أي **تخصص** تريده؟" },
];

function buildMissingQueue(data: Record<string, string>): typeof REQUIRED_FIELDS {
  return REQUIRED_FIELDS.filter((f) => !data[f.key] || data[f.key].trim() === "");
}

function parseProgramType(text: string): string {
  if (text.includes("1") || text.includes("منح") || text.includes("منحة")) return "منح دراسية";
  if (text.includes("2") || text.includes("تخفيض")) return "تخفيضات جامعية";
  if (text.includes("3") || text.includes("تأمين")) return "تأمين طبي";
  if (text.includes("4") || text.includes("أكاديم")) return "برامج أكاديمية";
  if (text.includes("منح") || text.includes("منحة")) return "منح دراسية";
  return "تخفيضات جامعية";
}

function parseDepartment(text: string): string {
  if (text.includes("1") || text.includes("علمي") || text.toLowerCase().includes("sci")) return "علمي";
  if (text.includes("2") || text.includes("أدبي") || text.toLowerCase().includes("lit")) return "أدبي";
  return text.trim();
}

function looksLikePhone(text: string): boolean {
  return text.replace(/\D/g, "").length >= 9;
}

function renderContent(text: string): string {
  return text
    .replace(/\*\*(.*?)\*\*/g, "<strong>$1</strong>")
    .replace(/\n/g, "<br/>");
}

export default function NassirPage() {
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [conversationId, setConversationId] = useState<number | null>(null);
  const [uploadingImage, setUploadingImage] = useState(false);
  const [showSuccess, setShowSuccess] = useState(false);
  const [regData, setRegData] = useState<Record<string, string>>({});
  const [regStep, setRegStep] = useState(0);
  const [awaitingConfirm, setAwaitingConfirm] = useState(false);
  const [availableUniversities, setAvailableUniversities] = useState<string[]>([]);
  const [availableSpecialties, setAvailableSpecialties] = useState<string[]>([]);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);
  const initialized = useRef(false);

  const scrollToBottom = () => messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  useEffect(() => { scrollToBottom(); }, [messages]);

  // ── سؤال ديناميكي للحقل التالي (يجلب الجامعات/التخصصات من API) ───────────
  const askMissingField = async (field: typeof REQUIRED_FIELDS[0], data: Record<string, string>) => {
    if (field.key === "universityChoice1") {
      const gpa = data.gpa || "0";
      const dept = data.department || "";
      try {
        const params = new URLSearchParams({ gpa, department: dept });
        const r = await fetch(`/api/university-specialties?${params}`);
        const specs = await r.json() as Array<{ university_name: string }>;
        const univs = [...new Set(specs.map((s) => s.university_name))].sort();
        if (univs.length > 0) {
          setAvailableUniversities(univs);
          const list = univs.map((u, i) => `${i + 1}. ${u}`).join("\n");
          addMessage("assistant", `🏛 **الجامعات المتاحة لمعدلك (${gpa}) وقسمك (${dept}):**\n\n${list}\n\naكتب **اسم الجامعة** أو **رقمها**:`);
          return;
        }
      } catch { /* fallthrough */ }
      addMessage("assistant", field.question);

    } else if (field.key === "specialtyWanted") {
      const uni = data.universityChoice1 || "";
      const gpa = data.gpa || "0";
      const dept = data.department || "";
      if (uni) {
        try {
          const params = new URLSearchParams({ university: uni, gpa, department: dept });
          const r = await fetch(`/api/university-specialties?${params}`);
          const specs = await r.json() as Array<{ specialty_name: string }>;
          if (specs.length > 0) {
            setAvailableSpecialties(specs.map((s) => s.specialty_name));
            const list = specs.map((s, i) => `${i + 1}. ${s.specialty_name}`).join("\n");
            addMessage("assistant", `🎓 **التخصصات المتاحة في ${uni}:**\n\n${list}\n\nاكتب **اسم التخصص** أو **رقمه**:`);
            return;
          }
        } catch { /* fallthrough */ }
      }
      addMessage("assistant", field.question);

    } else {
      addMessage("assistant", field.question);
    }
  };

  const addMessage = (role: "user" | "assistant", content: string) => {
    const id = Math.random().toString(36).slice(2);
    setMessages((prev) => [...prev, { id, role, content }]);
    return id;
  };

  const init = async () => {
    if (initialized.current) return;
    initialized.current = true;
    const r = await fetch("/api/nassir/conversations", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ platform: "web" }),
    });
    const d = await r.json() as { id: number };
    setConversationId(d.id);
    addMessage("assistant", `مرحباً بك! أنا **ناصر** 🎓\nمستشارك الأكاديمي الذكي للمؤسسة الوطنية للتنمية الشاملة.\n\nلدي معلومات كاملة عن:\n🏛 35+ جامعة شريكة مع تخصصاتها الكاملة\n📊 معدلات القبول لكل تخصص\n🎯 المنح والتخفيضات المتاحة\n📝 التسجيل الذكي من صورة الاستمارة!\n\nما الذي يشغل تفكيرك اليوم؟`);
  };

  useEffect(() => { void init(); }, []);

  const sendToApi = async (text: string, cid: number) => {
    const typingId = Math.random().toString(36).slice(2);
    setMessages((prev) => [...prev, { id: typingId, role: "assistant", content: "", isTyping: true }]);
    setLoading(true);
    try {
      const r = await fetch(`/api/nassir/conversations/${cid}/messages`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ content: text }),
      });
      setMessages((prev) => prev.filter((m) => m.id !== typingId));
      if (!r.body) { setLoading(false); return; }

      const reader = r.body.getReader();
      const decoder = new TextDecoder();
      let full = "";
      const msgId = Math.random().toString(36).slice(2);
      setMessages((prev) => [...prev, { id: msgId, role: "assistant", content: "" }]);

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        const chunk = decoder.decode(value);
        for (const line of chunk.split("\n")) {
          if (!line.startsWith("data: ")) continue;
          try {
            const data = JSON.parse(line.slice(6)) as { content?: string; done?: boolean };
            if (data.content) {
              full += data.content;
              // Strip 〔REG〕 blocks from display
              const display = full.replace(/〔REG〕[\s\S]*?〔\/REG〕/g, "").trim();
              setMessages((prev) => prev.map((m) => m.id === msgId ? { ...m, content: display } : m));
            }
          } catch {}
        }
      }
    } catch {
      setMessages((prev) => prev.filter((m) => m.id !== typingId));
      addMessage("assistant", "عذراً، حدث خطأ. يرجى المحاولة مرة أخرى.");
    }
    setLoading(false);
  };

  // ── عرض الملخص النهائي وطلب التأكيد ──────────────────────────────────────
  const showFinalSummary = (data: Record<string, string>) => {
    const lines = [
      data.fullName          ? `👤 الاسم: **${data.fullName}**`               : null,
      data.phone             ? `📱 الهاتف: **${data.phone}**`                  : null,
      data.email && data.email.includes("@") ? `📧 البريد: **${data.email}**`  : null,
      data.gpa               ? `📊 المعدل: **${data.gpa}**`                    : null,
      data.department        ? `📚 القسم: **${data.department}**`              : null,
      data.city              ? `🏙 المحافظة: **${data.city}**`                 : null,
      data.programType       ? `📌 البرنامج: **${data.programType}**`          : null,
      data.universityChoice1 ? `🏛 الجامعة: **${data.universityChoice1}**`     : null,
      data.specialtyWanted   ? `🎯 التخصص: **${data.specialtyWanted}**`        : null,
    ].filter(Boolean).join("\n");

    addMessage("assistant", `✅ **ملخص طلب تسجيلك:**\n\n${lines}\n\nهل تؤكد التسجيل؟`);
    setRegStep(8);
    setAwaitingConfirm(true);
  };

  // ── التسجيل التلقائي ─────────────────────────────────────────────────────
  const handleAutoRegister = async (data?: Record<string, string>) => {
    if (!conversationId) return;
    const finalData = data || regData;
    setLoading(true);
    try {
      const payload = { ...finalData, programType: finalData.programType || "تخفيضات جامعية", conversationId: String(conversationId) };
      const r = await fetch("/api/nassir/auto-register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      const d = await r.json() as { success?: boolean; registrationId?: number };
      if (d.success) {
        addMessage("assistant", `🎉 **تهانينا! تم تسجيلك بنجاح!**\n\nرقم طلبك: **#${d.registrationId}**\n\nسيتواصل معك فريقنا المتخصص خلال **24 ساعة** على رقم هاتفك المسجّل.\n\n_"الفرصة التي أمّنتها اليوم ستكون نقطة التحوّل في مسيرتك الأكاديمية"_ 🌟`);
        setAwaitingConfirm(false); setRegStep(0); setRegData({});
        setShowSuccess(true); setTimeout(() => setShowSuccess(false), 5000);
      } else {
        addMessage("assistant", "حدث خطأ أثناء التسجيل. يرجى التواصل المباشر مع فريقنا أو زيارة صفحة التسجيل.");
      }
    } catch {
      addMessage("assistant", "حدث خطأ غير متوقع. يرجى المحاولة لاحقاً.");
    }
    setLoading(false);
  };

  // ── معالجة رفع الصورة ────────────────────────────────────────────────────
  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !conversationId) return;
    if (!file.type.startsWith("image/")) return;
    setUploadingImage(true);
    addMessage("user", `📸 صورة الاستمارة: ${file.name}`);
    addMessage("assistant", "📋 أقرأ استمارتك الآن بالذكاء الاصطناعي... ثوانٍ فقط ✨");
    try {
      const { base64, mimeType: compressedMime } = await compressAndToBase64(file);
      const r = await fetch("/api/nassir/vision/extract", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ imageBase64: base64, mimeType: compressedMime }),
      });
      if (!r.ok) throw new Error(`HTTP ${r.status}`);
      const data = await r.json() as ExtractedData & { _error?: string };
      if (data._error) throw new Error(data._error);

      setUploadingImage(false);
      const hasData = data.fullName || data.gpa || data.department;

      if (hasData) {
        const summaryLines = [
          data.fullName        ? `👤 الاسم: **${data.fullName}**`             : null,
          data.gpa             ? `📊 المعدل: **${data.gpa}**`                  : null,
          data.department      ? `📚 القسم: **${data.department}**`            : null,
          data.city            ? `🏙 المدينة: **${data.city}**`                : null,
          data.phone           ? `📱 الهاتف: **${data.phone}**`                : null,
          data.specialtyWanted ? `🎯 التخصص: **${data.specialtyWanted}**`      : null,
          data.universityChoice1 ? `🏛 الجامعة: **${data.universityChoice1}**` : null,
          data.programType     ? `📌 البرنامج: **${data.programType}**`        : null,
        ].filter(Boolean).join("\n");

        // Store all extracted fields
        const initialData: Record<string, string> = {};
        for (const [k, v] of Object.entries(data)) {
          if (typeof v === "string" && v.trim() !== "" && k !== "_error") {
            initialData[k] = v.trim();
          }
        }
        setRegData(initialData);

        // Determine what's still missing
        const missing = buildMissingQueue(initialData);

        if (missing.length === 0) {
          addMessage("assistant", `✅ **استخرجت جميع بياناتك:**\n\n${summaryLines}\n\nهل تؤكد التسجيل بهذه البيانات؟`);
          setRegStep(8);
          setAwaitingConfirm(true);
        } else {
          setRegStep(20);
          addMessage("assistant", `✅ **استخرجت بياناتك:**\n\n${summaryLines}\n\nلإتمام التسجيل أحتاج بعض المعلومات الإضافية:`);
          void askMissingField(missing[0], initialData);
        }
      } else {
        addMessage("assistant", "لم أتمكن من قراءة الاستمارة بوضوح كافٍ.\n\nلا مشكلة! أخبرني **باسمك الكامل** وأنا أكمل معك:");
        setRegData({});
        setRegStep(2);
      }
    } catch {
      setUploadingImage(false);
      addMessage("assistant", "حدث خطأ في قراءة الصورة. يمكنك إدخال بياناتك يدوياً — ما **اسمك الكامل**؟");
      setRegStep(2);
    }
    if (e.target) e.target.value = "";
  };

  // ── handleSend ────────────────────────────────────────────────────────────
  const handleSend = () => {
    if (!input.trim() || !conversationId) return;
    const text = input.trim();

    // ── step 20: إكمال الحقول الناقصة (بعد الصورة أو التسجيل اليدوي) ────
    if (regStep === 20) {
      if (text.includes("تعديل") || text.includes("خطأ") || text.includes("غلط")) {
        addMessage("user", text); setInput("");
        addMessage("assistant", "لا مشكلة! أخبرني **باسمك الكامل** وأبدأ معك من جديد:");
        setRegData({}); setRegStep(2); return;
      }

      addMessage("user", text); setInput("");

      const currentMissing = buildMissingQueue(regData);
      const currentField = currentMissing[0];
      if (!currentField) { showFinalSummary(regData); return; }

      // التحقق من صحة رقم الهاتف
      if (currentField.key === "phone" && !looksLikePhone(text)) {
        addMessage("assistant", "يبدو أن الرقم غير صحيح. يرجى إدخال رقم هاتف صحيح (9 أرقام على الأقل):"); return;
      }

      // تحويل الرقم إلى اسم للجامعة أو التخصص
      let value = text;
      if (currentField.key === "department") {
        value = parseDepartment(text);
      } else if (currentField.key === "programType") {
        value = parseProgramType(text);
      } else if (currentField.key === "universityChoice1" && availableUniversities.length > 0) {
        const num = parseInt(text);
        if (!isNaN(num) && num >= 1 && num <= availableUniversities.length) {
          value = availableUniversities[num - 1];
        }
      } else if (currentField.key === "specialtyWanted" && availableSpecialties.length > 0) {
        const num = parseInt(text);
        if (!isNaN(num) && num >= 1 && num <= availableSpecialties.length) {
          value = availableSpecialties[num - 1];
        }
      } else if (currentField.key === "email") {
        // إذا لم يكن بريداً حقيقياً، نقبله كـ "تخطي"
        if (!text.includes("@")) value = "__skip__";
      }

      const updatedData = { ...regData, [currentField.key]: value };
      setRegData(updatedData);

      const stillMissing = buildMissingQueue(updatedData);
      if (stillMissing.length === 0) {
        showFinalSummary(updatedData);
      } else {
        void askMissingField(stillMissing[0], updatedData);
      }
      return;
    }

    // ── step 8: تأكيد نهائي ───────────────────────────────────────────────
    if (regStep === 8 && awaitingConfirm) {
      const lc = text.toLowerCase();
      const yes = lc.includes("نعم") || lc.includes("أكد") || lc.includes("تمام") || lc.includes("موافق") || lc.includes("صح");
      if (yes) {
        addMessage("user", text); setInput("");
        void handleAutoRegister(); return;
      }
      const no = lc.includes("لا") || lc.includes("خطأ") || lc.includes("غلط");
      if (no) {
        addMessage("user", text); setInput("");
        addMessage("assistant", "لا مشكلة! أخبرني **باسمك الكامل** وأبدأ معك من جديد:");
        setRegStep(2); setRegData({}); setAwaitingConfirm(false); return;
      }
    }

    // ── التسجيل اليدوي — خطوة البداية فقط (ثم يتولى step 20 الباقي) ──────
    if (regStep === 2) {
      addMessage("user", text); setInput("");
      const d: Record<string, string> = { fullName: text };
      setRegData(d);
      setRegStep(20);
      const missing = buildMissingQueue(d);
      if (missing.length > 0) {
        void askMissingField(missing[0], d);
      } else {
        showFinalSummary(d);
      }
      return;
    }

    // Default: إرسال إلى الذكاء الاصطناعي
    addMessage("user", text);
    setInput("");
    void sendToApi(text, conversationId);
  };

  const QUICK_REPLIES = [
    { label: "🎓 أريد التسجيل الآن", text: "أريد التسجيل في المؤسسة الآن" },
    { label: "🏛 عرض الجامعات", text: "ما هي الجامعات الشريكة وتخصصاتها؟" },
    { label: "📊 معدلي وتخصصي", text: "أريد معرفة التخصصات التي يؤهلني لها معدلي" },
    { label: "💰 المنح والتخفيضات", text: "ما هي المنح والتخفيضات الجامعية المتاحة؟" },
    { label: "🏥 التأمين الصحي", text: "أريد معلومات عن التأمين الصحي" },
    { label: "📸 أرفع استمارتي", text: "__UPLOAD__" },
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50/60 via-white to-slate-50" dir="rtl">
      <div className="container mx-auto max-w-5xl px-4 py-10">
        <motion.div initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }} className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-20 h-20 bg-gradient-to-br from-blue-900 via-primary to-blue-500 rounded-3xl shadow-2xl mb-5 ring-4 ring-primary/20">
            <Bot size={32} className="text-white" />
          </div>
          <h1 className="text-3xl font-bold text-slate-900 mb-2">ناصر <span className="text-primary">مساعدك الذكي</span></h1>
          <p className="text-slate-500 max-w-xl mx-auto">مستشارك الأكاديمي الذكي للتوجيه والتسجيل — 35+ جامعة شريكة • متاح 24/7</p>
          <div className="flex items-center justify-center gap-4 mt-4 flex-wrap">
            {[["15,000+", "طالب مستفيد", GraduationCap], ["35+", "جامعة شريكة", BookOpen], ["70%", "أقصى خصم", Star], ["24/7", "متاح دائماً", Heart]].map(([num, label, Icon]) => (
              <div key={label as string} className="flex items-center gap-2 bg-white border border-slate-200 rounded-xl px-4 py-2 shadow-sm">
                {Icon && <Icon size={16} className="text-primary" />}
                <span className="font-bold text-primary">{num as string}</span>
                <span className="text-xs text-slate-500">{label as string}</span>
              </div>
            ))}
          </div>
        </motion.div>

        <AnimatePresence>
          {showSuccess && (
            <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}
              className="mb-4 p-4 bg-green-50 border border-green-200 rounded-xl flex items-center gap-3 text-green-800">
              <Check size={20} className="text-green-600 shrink-0" />
              <p className="font-semibold">🎉 تم تسجيلك بنجاح! سيتواصل معك فريقنا قريباً.</p>
            </motion.div>
          )}
        </AnimatePresence>

        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
          {/* Chat panel */}
          <div className="lg:col-span-3 flex flex-col bg-white rounded-2xl shadow-lg border border-slate-200 overflow-hidden" style={{ height: 580 }}>
            {/* Header */}
            <div className="bg-gradient-to-l from-blue-900 via-primary to-blue-600 px-5 py-4 flex items-center gap-3 shrink-0 shadow-md">
              <div className="relative">
                <div className="w-10 h-10 rounded-xl bg-white/25 ring-2 ring-white/40 flex items-center justify-center shadow-inner">
                  <Bot size={22} className="text-white" />
                </div>
                <span className="absolute -bottom-0.5 -right-0.5 w-3.5 h-3.5 bg-green-400 rounded-full border-2 border-primary" />
              </div>
              <div>
                <p className="text-white font-bold text-base">ناصر <span className="font-normal opacity-90">مساعدك الذكي</span></p>
                <p className="text-white/80 text-xs font-medium">🟢 متاح الآن • يقرأ الاستمارات تلقائياً</p>
              </div>
              <div className="mr-auto flex items-center gap-1.5 text-white/80 text-xs bg-white/10 px-3 py-1 rounded-full">
                <Sparkles size={12} />
                مدعوم بالذكاء الاصطناعي
              </div>
            </div>

            {/* Messages */}
            <div className="flex-1 overflow-y-auto px-5 py-4 space-y-4 bg-gray-50">
              {messages.map((msg) => (
                <div key={msg.id} className={`flex ${msg.role === "user" ? "justify-start" : "justify-end"}`}>
                  <div className={`max-w-[82%] px-4 py-3 rounded-2xl text-sm leading-relaxed shadow-sm ${
                    msg.role === "user"
                      ? "bg-gradient-to-br from-primary to-blue-700 text-white rounded-bl-sm shadow-md"
                      : "bg-white text-gray-800 border border-gray-100 rounded-br-sm shadow-md"
                  }`}>
                    {msg.isTyping ? (
                      <div className="flex gap-1 items-center py-1">
                        <span className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: "0ms" }} />
                        <span className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: "150ms" }} />
                        <span className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: "300ms" }} />
                      </div>
                    ) : (
                      <span dangerouslySetInnerHTML={{ __html: renderContent(msg.content) }} />
                    )}
                  </div>
                </div>
              ))}

              {/* Quick replies — تظهر فقط بعد رسالة الترحيب */}
              {messages.length === 1 && !loading && (
                <div className="flex flex-wrap gap-2 justify-end pt-2">
                  {QUICK_REPLIES.map((qr) => (
                    <button
                      key={qr.label}
                      onClick={() => {
                        if (qr.text === "__UPLOAD__") { fileInputRef.current?.click(); return; }
                        addMessage("user", qr.label.slice(2).trim());
                        void sendToApi(qr.text, conversationId!);
                      }}
                      className="text-xs bg-white border border-primary/25 text-primary hover:bg-primary hover:text-white transition-all rounded-full px-3 py-1.5 font-medium shadow-sm"
                    >
                      {qr.label}
                    </button>
                  ))}
                </div>
              )}

              {/* زر التأكيد النهائي */}
              {awaitingConfirm && regStep === 8 && (
                <div className="flex gap-2 justify-end flex-wrap">
                  <button
                    onClick={() => { void handleAutoRegister(); setAwaitingConfirm(false); }}
                    className="bg-green-600 hover:bg-green-700 text-white rounded-xl px-5 py-2 text-sm font-bold flex items-center gap-2 shadow"
                  >
                    <Check size={16} /> تأكيد التسجيل النهائي
                  </button>
                  <button
                    onClick={() => {
                      setRegStep(0); setAwaitingConfirm(false); setRegData({});
                      addMessage("assistant", "لا مشكلة! كيف يمكنني مساعدتك؟");
                    }}
                    className="bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl px-4 py-2 text-sm"
                  >
                    إلغاء
                  </button>
                </div>
              )}

              <div ref={messagesEndRef} />
            </div>

            {/* Input */}
            <div className="bg-white border-t border-gray-100 px-4 py-3 shrink-0">
              <div className="flex items-end gap-2">
                <button
                  onClick={() => fileInputRef.current?.click()}
                  disabled={uploadingImage}
                  title="إرسال صورة الاستمارة للتسجيل التلقائي"
                  className="shrink-0 w-10 h-10 rounded-xl bg-amber-50 hover:bg-amber-100 border border-amber-200 flex items-center justify-center transition-colors"
                >
                  {uploadingImage ? <Loader2 size={17} className="text-amber-600 animate-spin" /> : <ImageIcon size={17} className="text-amber-600" />}
                </button>
                <textarea
                  ref={inputRef}
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  onKeyDown={(e) => { if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); handleSend(); } }}
                  placeholder={regStep === 20 || (regStep >= 2 && regStep <= 8) ? "اكتب إجابتك هنا..." : "اسألني عن تخصصك، معدلك، الجامعات..."}
                  rows={1}
                  disabled={loading || uploadingImage}
                  className="flex-1 resize-none rounded-xl border border-gray-200 bg-gray-50 px-4 py-2.5 text-sm text-right focus:outline-none focus:ring-2 focus:ring-primary/40 focus:border-primary disabled:opacity-50"
                  style={{ maxHeight: 90 }}
                />
                <button
                  onClick={handleSend}
                  disabled={!input.trim() || loading || uploadingImage}
                  className="shrink-0 w-10 h-10 rounded-xl bg-primary hover:bg-primary/90 flex items-center justify-center text-white disabled:opacity-40 transition-colors"
                >
                  <Send size={17} className="rotate-180" />
                </button>
              </div>
              <p className="text-center text-xs text-slate-400 mt-2">📎 ارفع صورة استمارتك وسيقرأها مساعدك الذكي تلقائياً</p>
            </div>
          </div>

          {/* Sidebar */}
          <div className="space-y-4">
            <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-4">
              <h3 className="font-bold text-slate-800 mb-3 text-sm flex items-center gap-2">
                <GraduationCap size={16} className="text-primary" /> ما يمكن لمساعدك الذكي فعله
              </h3>
              <div className="space-y-2.5">
                {[
                  { icon: "📸", text: "يقرأ استمارتك ويسجّلك تلقائياً" },
                  { icon: "🏛", text: "معلومات كاملة عن 35+ جامعة" },
                  { icon: "📊", text: "يحدد تخصصك بناءً على معدلك" },
                  { icon: "🎓", text: "يجد أفضل المنح والتخفيضات لك" },
                  { icon: "💬", text: "متاح 24/7 للإجابة على أسئلتك" },
                ].map((item) => (
                  <div key={item.text} className="flex items-start gap-2 text-xs text-slate-600">
                    <span>{item.icon}</span>
                    <span>{item.text}</span>
                  </div>
                ))}
              </div>
            </div>

            <div className="bg-gradient-to-br from-amber-50 to-orange-50 border border-amber-200 rounded-2xl p-4">
              <h3 className="font-bold text-amber-800 mb-2 text-sm">⚡ تسجيل سريع</h3>
              <p className="text-xs text-amber-700 mb-3 leading-relaxed">أرسل صورة استمارة ثانويتك وسيعبّئ ناصر بياناتك تلقائياً في ثوانٍ!</p>
              <button
                onClick={() => fileInputRef.current?.click()}
                className="w-full bg-amber-500 hover:bg-amber-600 text-white rounded-xl py-2 text-xs font-bold flex items-center justify-center gap-2 transition-colors"
              >
                <Upload size={14} /> أرفع استمارتي الآن
              </button>
            </div>

            <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-4">
              <h3 className="font-bold text-slate-800 mb-3 text-sm flex items-center gap-2">
                <BookOpen size={16} className="text-primary" /> أسئلة شائعة
              </h3>
              <div className="space-y-2">
                {[
                  "ما معدلي المطلوب لطب؟",
                  "ما أفضل جامعة للهندسة؟",
                  "كيف أحصل على منحة كاملة؟",
                  "ما مميزات التأمين الصحي؟",
                ].map((q) => (
                  <button
                    key={q}
                    onClick={() => { if (!conversationId) return; addMessage("user", q); void sendToApi(q, conversationId); }}
                    className="w-full text-right text-xs text-primary hover:text-primary/80 border border-primary/20 hover:border-primary/40 hover:bg-primary/5 rounded-lg px-3 py-2 transition-all"
                  >
                    {q}
                  </button>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>

      <input ref={fileInputRef} type="file" accept="image/*" className="hidden" onChange={handleImageUpload} />
    </div>
  );
}

function compressAndToBase64(file: File): Promise<{ base64: string; mimeType: string }> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    const url = URL.createObjectURL(file);
    img.onload = () => {
      URL.revokeObjectURL(url);
      const MAX = 1200;
      let { width, height } = img;
      if (width > MAX || height > MAX) {
        if (width > height) { height = Math.round(height * MAX / width); width = MAX; }
        else { width = Math.round(width * MAX / height); height = MAX; }
      }
      const canvas = document.createElement("canvas");
      canvas.width = width; canvas.height = height;
      const ctx = canvas.getContext("2d");
      if (!ctx) { reject(new Error("canvas")); return; }
      ctx.drawImage(img, 0, 0, width, height);
      const mimeType = "image/jpeg";
      canvas.toBlob((blob) => {
        if (!blob) { reject(new Error("blob")); return; }
        const reader = new FileReader();
        reader.readAsDataURL(blob);
        reader.onload = () => {
          const result = reader.result as string;
          resolve({ base64: result.split(",")[1] ?? "", mimeType });
        };
        reader.onerror = reject;
      }, mimeType, 0.82);
    };
    img.onerror = reject;
    img.src = url;
  });
}
