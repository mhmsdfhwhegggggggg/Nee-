import { useState, useRef, useEffect, useCallback } from "react";
import { useLocation } from "wouter";
import { motion, AnimatePresence } from "framer-motion";
import { X, Send, Bot, ChevronDown, Upload, Check, Loader2, ImageIcon, CheckCircle2 } from "lucide-react";
import { Button } from "@/components/ui/button";

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

const REGISTRATION_MODE_PATHS = ["/register", "/training-register"];

const QUICK_REPLIES_DEFAULT = [
  { label: "🎓 مقاعد مخفضة", text: "أريد معرفة تفاصيل المقاعد الجامعية المخفضة المتاحة" },
  { label: "📊 معدلي وتخصصي", text: "أريد معرفة التخصصات المناسبة لمعدلي" },
  { label: "🏥 التأمين الصحي", text: "أريد معرفة تفاصيل التأمين الصحي" },
  { label: "📝 سجّل الآن", text: "أريد التسجيل في المؤسسة الآن" },
];

const QUICK_REPLIES_REGISTER = [
  { label: "📸 أرسل صورة الاستمارة", text: "__UPLOAD_IMAGE__" },
  { label: "✍️ أدخل بياناتي يدوياً", text: "أريد إدخال بياناتي يدوياً للتسجيل" },
  { label: "❓ المستندات المطلوبة", text: "ما هي المستندات والمتطلبات للتسجيل؟" },
];

// Strip 〔REG〕...〔/REG〕 blocks from displayed text
function stripRegBlock(text: string): string {
  return text.replace(/〔REG〕[\s\S]*?〔\/REG〕/g, "").trim();
}

// Render markdown-like bold + line breaks as HTML
function renderContent(text: string): string {
  return stripRegBlock(text)
    .replace(/\*\*(.*?)\*\*/g, "<strong>$1</strong>")
    .replace(/\*(.*?)\*/g, "<em>$1</em>");
}

// Check if string looks like a phone number
function looksLikePhone(text: string): boolean {
  const digits = text.replace(/\D/g, "");
  return digits.length >= 9 && digits.length <= 15;
}

// الحقول المطلوبة للتسجيل — تطابق نموذج التسجيل الرسمي
const REQUIRED_FIELDS: Array<{ key: keyof ExtractedData; label: string; question: string }> = [
  { key: "fullName",        label: "الاسم",      question: "ما **اسمك الرباعي الكامل**؟" },
  { key: "gpa",             label: "المعدل",     question: "ما **معدلك في الثانوية**؟ (مثال: 85.5% أو 425 درجة)" },
  { key: "department",      label: "القسم",      question: "ما **قسمك**؟\n\n1️⃣ علمي\n2️⃣ أدبي" },
  { key: "city",            label: "المدينة",    question: "من أي **محافظة**؟\n\nصنعاء | عدن | تعز | إب | الحديدة | حضرموت | مأرب | ذمار | صعدة | شبوة | البيضاء | لحج | أبين | ريمة | الضالع | المهرة | أمانة العاصمة" },
  { key: "phone",           label: "الهاتف",     question: "ما **رقم هاتفك**؟ (9 أرقام على الأقل)" },
  { key: "email",           label: "البريد",     question: "ما **بريدك الإلكتروني**؟\n\n_(اكتب **تخطي** إذا لم يكن لديك)_" },
  { key: "programType",     label: "البرنامج",   question: "أي **برنامج** يهمك؟\n\n1️⃣ منح دراسية\n2️⃣ تخفيضات جامعية\n3️⃣ تأمين طبي\n4️⃣ برامج أكاديمية" },
  { key: "universityChoice1", label: "الجامعة", question: "أي **جامعة** تفضل؟" },
  { key: "specialtyWanted", label: "التخصص",    question: "أي **تخصص** تريده؟" },
];

export function NassirWidget() {
  const [location] = useLocation();
  const [open, setOpen] = useState(false);
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [conversationId, setConversationId] = useState<number | null>(null);
  const [extractedData, setExtractedData] = useState<ExtractedData | null>(null);
  const [awaitingConfirm, setAwaitingConfirm] = useState(false);
  const [registrationStep, setRegistrationStep] = useState(0);
  const [regData, setRegData] = useState<Record<string, string>>({});
  const [missingFieldsQueue, setMissingFieldsQueue] = useState<typeof REQUIRED_FIELDS>([]);
  const [availableUniversities, setAvailableUniversities] = useState<string[]>([]);
  const [availableSpecialties, setAvailableSpecialties] = useState<string[]>([]);
  const [uploadingImage, setUploadingImage] = useState(false);
  const [showImageSuccess, setShowImageSuccess] = useState(false);
  const [autoRegistered, setAutoRegistered] = useState<{ id: number; name: string } | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const isRegisterPage = REGISTRATION_MODE_PATHS.includes(location);

  const scrollToBottom = () => messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  useEffect(() => { scrollToBottom(); }, [messages]);

  // Listen for external open event (from Register page mode selector)
  useEffect(() => {
    const handler = () => { void openWidget(); };
    window.addEventListener("nassir:open", handler);
    return () => window.removeEventListener("nassir:open", handler);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const createConversation = useCallback(async () => {
    const r = await fetch("/api/nassir/conversations", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ platform: "web" }),
    });
    const d = await r.json() as { id: number };
    setConversationId(d.id);
    return d.id;
  }, []);

  const addMessage = (role: "user" | "assistant", content: string) => {
    const id = Math.random().toString(36).slice(2);
    setMessages((prev) => [...prev, { id, role, content }]);
    return id;
  };

  const openWidget = async () => {
    setOpen(true);
    if (messages.length > 0) return;
    setLoading(true);
    await createConversation();

    const welcome = isRegisterPage
      ? `مرحباً بك! أنا **ناصر** 🎓\n\nأنت على بُعد دقيقتين من تأمين مقعدك الجامعي!\n\n📸 **الأسرع:** أرسل صورة استمارتك وسأملأ البيانات تلقائياً في ثوانٍ!\n✍️ **أو:** أخبرني بمعدلك وتخصصك المطلوب وسأجد لك أفضل جامعة بأقل تكلفة.\n\n**أكثر من 15,000 طالب** بدأوا هكذا — أنت التالي! 🌟`
      : `مرحباً! أنا **ناصر** 👋\nمستشارك الأكاديمي الذكي — متاح الآن 🟢\n\nأخبرني بـ **معدلك** و**تخصصك المطلوب** وسأحلّل وضعك فوراً وأجد لك أفضل فرصة! 🎓`;

    addMessage("assistant", welcome);
    setLoading(false);
  };

  const sendMessage = async (text: string) => {
    if (!text.trim()) return;
    const id = conversationId;
    if (!id) return;

    addMessage("user", text);
    setInput("");
    setLoading(true);

    const typingId = Math.random().toString(36).slice(2);
    setMessages((prev) => [...prev, { id: typingId, role: "assistant", content: "", isTyping: true }]);

    try {
      const r = await fetch(`/api/nassir/conversations/${id}/messages`, {
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
            const data = JSON.parse(line.slice(6)) as {
              content?: string;
              done?: boolean;
              autoRegistered?: boolean;
              registrationId?: number;
              studentName?: string;
            };

            if (data.content) {
              full += data.content;
              const displayText = stripRegBlock(full);
              setMessages((prev) =>
                prev.map((m) => m.id === msgId ? { ...m, content: displayText } : m),
              );
            }

            if (data.autoRegistered && data.registrationId) {
              setAutoRegistered({ id: data.registrationId, name: data.studentName || "الطالب" });
              setMessages((prev) =>
                prev.map((m) =>
                  m.id === msgId
                    ? { ...m, content: stripRegBlock(full) }
                    : m,
                ),
              );
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

  const handleQuickReply = (text: string) => {
    if (text === "__UPLOAD_IMAGE__") {
      fileInputRef.current?.click();
      return;
    }
    void sendMessage(text);
  };

  const buildMissingQueue = (extracted: Record<string, string>): typeof REQUIRED_FIELDS => {
    return REQUIRED_FIELDS.filter((f) => !extracted[f.key] || extracted[f.key].trim() === "");
  };

  // ── سؤال ديناميكي (يجلب الجامعات/التخصصات من API) ────────────────────────
  const askMissingField = async (field: typeof REQUIRED_FIELDS[0], data: Record<string, string>) => {
    if (field.key === "universityChoice1") {
      const gpa = data.gpa || "0";
      const dept = data.department || "";
      try {
        const r = await fetch(`/api/university-specialties?${new URLSearchParams({ gpa, department: dept })}`);
        const specs = await r.json() as Array<{ university_name: string }>;
        const univs = [...new Set(specs.map((s) => s.university_name))].sort();
        if (univs.length > 0) {
          setAvailableUniversities(univs);
          const list = univs.map((u, i) => `${i + 1}. ${u}`).join("\n");
          addMessage("assistant", `🏛 **الجامعات المتاحة لمعدلك (${gpa}) وقسمك (${dept}):**\n\n${list}\n\nاكتب **اسم الجامعة** أو **رقمها**:`);
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
          const r = await fetch(`/api/university-specialties?${new URLSearchParams({ university: uni, gpa, department: dept })}`);
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

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !conversationId) return;
    if (!file.type.startsWith("image/")) return;

    setUploadingImage(true);
    addMessage("user", `📸 إرسال صورة الاستمارة: ${file.name}`);

    try {
      addMessage("assistant", "📋 جاري قراءة استمارتك... لحظة من فضلك ✨");
      const { base64, mimeType: compressedMime } = await compressAndToBase64(file);

      const r = await fetch("/api/nassir/vision/extract", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ imageBase64: base64, mimeType: compressedMime }),
      });
      if (!r.ok) {
        const errData = await r.json().catch(() => ({})) as { message?: string };
        throw new Error(errData.message || `HTTP ${r.status}`);
      }
      const data = await r.json() as ExtractedData & { _error?: string };
      if (data._error) throw new Error(data._error);

      setUploadingImage(false);
      setShowImageSuccess(true);
      setTimeout(() => setShowImageSuccess(false), 3000);

      const hasAnyData = data.fullName || data.gpa || data.department || data.city || data.phone;

      if (hasAnyData) {
        // Build summary of extracted fields
        const summaryLines = [
          data.fullName ? `👤 الاسم: **${data.fullName}**` : null,
          data.gpa ? `📊 المعدل: **${data.gpa}**` : null,
          data.department ? `📚 القسم: **${data.department}**` : null,
          data.city ? `🏙 المدينة: **${data.city}**` : null,
          data.phone ? `📱 الهاتف: **${data.phone}**` : null,
          data.specialtyWanted ? `🎯 التخصص: **${data.specialtyWanted}**` : null,
          data.universityChoice1 ? `🏛 الجامعة: **${data.universityChoice1}**` : null,
          data.programType ? `📌 البرنامج: **${data.programType}**` : null,
        ].filter(Boolean).join("\n");

        // Store extracted data as regData
        const initialRegData: Record<string, string> = {};
        for (const [k, v] of Object.entries(data)) {
          if (typeof v === "string" && v.trim() !== "" && k !== "_error") {
            initialRegData[k] = v.trim();
          }
        }
        setRegData(initialRegData);
        setExtractedData(data);

        // Compute missing required fields
        const missing = buildMissingQueue(initialRegData);
        setMissingFieldsQueue(missing);

        if (missing.length === 0) {
          // كل البيانات المطلوبة موجودة — اعرض الملخص واطلب التأكيد مباشرة
          addMessage(
            "assistant",
            `✅ ممتاز! استخرجت جميع بياناتك من الاستمارة:\n\n${summaryLines}\n\n**هل تؤكد التسجيل بهذه البيانات؟**`,
          );
          setRegistrationStep(8);
          setAwaitingConfirm(true);
        } else {
          setRegistrationStep(20);
          addMessage(
            "assistant",
            `✅ استخرجت بياناتك من الاستمارة:\n\n${summaryLines}\n\nلإتمام التسجيل أحتاج بعض المعلومات الإضافية:`,
          );
          void askMissingField(missing[0], initialRegData);
        }
      } else {
        // لم يُستخرج شيء
        addMessage(
          "assistant",
          "لم أتمكن من قراءة الاستمارة بوضوح كافٍ.\n\nلا مشكلة! يمكنك إخباري ببياناتك مباشرة:\n**ما اسمك الرباعي الكامل؟**",
        );
        setRegData({});
        setMissingFieldsQueue(REQUIRED_FIELDS.slice(1)); // ابدأ من الحقل الثاني (الاسم تم طرحه)
        setRegistrationStep(20);
      }
    } catch {
      setUploadingImage(false);
      addMessage("assistant", "حدث خطأ أثناء قراءة الصورة. يرجى المحاولة مرة أخرى أو إدخال بياناتك يدوياً.");
    }

    if (e.target) e.target.value = "";
  };

  const handleAutoRegister = async (finalData?: Record<string, string>) => {
    const dataToRegister = finalData || regData;
    if (!conversationId) return;
    setLoading(true);
    try {
      const r = await fetch("/api/nassir/auto-register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...dataToRegister,
          programType: dataToRegister.programType || "تخفيضات جامعية",
          conversationId: String(conversationId),
        }),
      });
      const d = await r.json() as { success?: boolean; registrationId?: number; error?: string };
      if (d.success && d.registrationId) {
        setAutoRegistered({ id: d.registrationId, name: dataToRegister.fullName || "الطالب" });
        addMessage(
          "assistant",
          `🎉 **تم تسجيلك بنجاح!**\n\nرقم طلبك: **#${d.registrationId}**\n\nسيتواصل معك فريقنا قريباً على رقم هاتفك المسجّل.\n\nنتمنى لك مسيرة أكاديمية موفقة! 🌟`,
        );
        setAwaitingConfirm(false);
        setExtractedData(null);
        setRegistrationStep(0);
        setRegData({});
        setMissingFieldsQueue([]);
      } else {
        addMessage("assistant", "حدث خطأ أثناء التسجيل. يرجى زيارة صفحة التسجيل مباشرة أو التواصل مع الفريق على 770441247.");
      }
    } catch {
      addMessage("assistant", "حدث خطأ أثناء التسجيل. يرجى المحاولة مرة أخرى.");
    }
    setLoading(false);
  };

  function parseProgramType(text: string): string {
    if (text.includes("1") || text.includes("منح") || text.includes("منحة")) return "منح دراسية";
    if (text.includes("2") || text.includes("تخفيض")) return "تخفيضات جامعية";
    if (text.includes("3") || text.includes("تأمين")) return "تأمين طبي";
    if (text.includes("4") || text.includes("أكاديم")) return "برامج أكاديمية";
    return "تخفيضات جامعية";
  }

  function parseDepartment(text: string): string {
    if (text.includes("1") || text.includes("علمي")) return "علمي";
    if (text.includes("2") || text.includes("أدبي")) return "أدبي";
    return text.trim();
  }

  const handleSend = () => {
    if (!input.trim() || !conversationId) return;

    // ── step 20: إكمال الحقول الناقصة (بعد الصورة أو اليدوي) ────────────────
    if (registrationStep === 20) {
      const text = input.trim();
      if (text.includes("تعديل") || text.includes("خطأ") || text.includes("غلط")) {
        addMessage("user", text); setInput("");
        addMessage("assistant", "لا مشكلة! أخبرني **باسمك الكامل** وأبدأ معك من جديد:");
        setRegData({}); setExtractedData(null); setRegistrationStep(2); return;
      }

      addMessage("user", text); setInput("");
      const currentField = buildMissingQueue(regData)[0];
      if (!currentField) { showFinalConfirmation(regData); return; }

      if (currentField.key === "phone" && !looksLikePhone(text)) {
        addMessage("assistant", "يبدو أن الرقم غير صحيح. يرجى إدخال رقم هاتف صحيح (9 أرقام على الأقل):");
        return;
      }

      let value = text;
      if (currentField.key === "department") {
        value = parseDepartment(text);
      } else if (currentField.key === "programType") {
        value = parseProgramType(text);
      } else if (currentField.key === "universityChoice1" && availableUniversities.length > 0) {
        const num = parseInt(text);
        if (!isNaN(num) && num >= 1 && num <= availableUniversities.length) value = availableUniversities[num - 1];
      } else if (currentField.key === "specialtyWanted" && availableSpecialties.length > 0) {
        const num = parseInt(text);
        if (!isNaN(num) && num >= 1 && num <= availableSpecialties.length) value = availableSpecialties[num - 1];
      } else if (currentField.key === "email" && !text.includes("@")) {
        value = "__skip__";
      }

      const updatedData = { ...regData, [currentField.key]: value };
      setRegData(updatedData);

      const stillMissing = buildMissingQueue(updatedData);
      if (stillMissing.length === 0) {
        showFinalConfirmation(updatedData);
      } else {
        void askMissingField(stillMissing[0], updatedData);
      }
      return;
    }

    // ── step 8: تأكيد نهائي ────────────────────────────────────────────────
    if (registrationStep === 8 && awaitingConfirm) {
      const lc = input.toLowerCase();
      const confirmed = lc.includes("نعم") || lc.includes("أكد") || lc.includes("تمام") || lc.includes("موافق") || lc.includes("صح");
      if (confirmed) { addMessage("user", input); setInput(""); void handleAutoRegister(); return; }
      const denied = lc.includes("لا") || lc.includes("خطأ") || lc.includes("غلط");
      if (denied) {
        addMessage("user", input); setInput("");
        addMessage("assistant", "لا مشكلة! أخبرني **باسمك الكامل** وأبدأ معك من جديد:");
        setRegData({}); setExtractedData(null); setAwaitingConfirm(false); setRegistrationStep(2); return;
      }
    }

    // ── التسجيل اليدوي — خطوة البداية فقط، ثم step 20 يتولى الباقي ──────────
    if (registrationStep === 2) {
      const text = input.trim(); addMessage("user", text); setInput("");
      const d: Record<string, string> = { fullName: text };
      setRegData(d);
      setRegistrationStep(20);
      const missing = buildMissingQueue(d);
      if (missing.length > 0) void askMissingField(missing[0], d);
      else showFinalConfirmation(d);
      return;
    }

    // Default: send to AI
    void sendMessage(input);
  };

  // ── عرض ملخص التسجيل النهائي وطلب التأكيد ────────────────────────────────
  const showFinalConfirmation = (data: Record<string, string>) => {
    const summary = [
      data.fullName          ? `👤 الاسم: **${data.fullName}**`              : null,
      data.phone             ? `📱 الهاتف: **${data.phone}**`                : null,
      data.email && data.email.includes("@") ? `📧 البريد: **${data.email}**` : null,
      data.gpa               ? `📊 المعدل: **${data.gpa}**`                  : null,
      data.department        ? `📚 القسم: **${data.department}**`            : null,
      data.city              ? `🏙 المحافظة: **${data.city}**`               : null,
      data.programType       ? `📌 البرنامج: **${data.programType}**`        : null,
      data.universityChoice1 ? `🏛 الجامعة: **${data.universityChoice1}**`   : null,
      data.specialtyWanted   ? `🎯 التخصص: **${data.specialtyWanted}**`      : null,
    ].filter(Boolean).join("\n");

    addMessage("assistant", `✅ **ملخص طلب تسجيلك:**\n\n${summary}\n\n**هل تؤكد التسجيل بهذه البيانات؟**`);
    setExtractedData(data as ExtractedData);
    setRegistrationStep(8);
    setAwaitingConfirm(true);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); handleSend(); }
  };

  return (
    <>
      <input ref={fileInputRef} type="file" accept="image/*" className="hidden" onChange={handleImageUpload} />

      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0, y: 20, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 20, scale: 0.95 }}
            transition={{ duration: 0.25 }}
            className="fixed bottom-24 left-4 right-4 sm:right-auto sm:left-6 sm:w-[390px] z-50 flex flex-col shadow-2xl rounded-2xl overflow-hidden border border-white/20"
            style={{ maxHeight: "calc(100vh - 120px)", height: 560 }}
            dir="rtl"
          >
            {/* Header */}
            <div className="bg-gradient-to-l from-blue-900 via-primary to-blue-600 px-4 py-3 flex items-center justify-between shrink-0 shadow-md">
              <div className="flex items-center gap-3">
                <div className="relative">
                  <div className="w-10 h-10 rounded-full bg-white/25 ring-2 ring-white/40 flex items-center justify-center shadow-inner">
                    <Bot size={20} className="text-white" />
                  </div>
                  <span className="absolute -bottom-0.5 -right-0.5 w-3 h-3 bg-green-400 rounded-full border-2 border-primary" />
                </div>
                <div>
                  <p className="text-white font-bold text-sm leading-tight">ناصر</p>
                  <p className="text-white/80 text-xs font-medium">المستشار الأكاديمي الذكي • متاح الآن 🟢</p>
                </div>
              </div>
              <Button variant="ghost" size="icon" className="text-white/80 hover:text-white hover:bg-white/20 h-8 w-8" onClick={() => setOpen(false)}>
                <X size={18} />
              </Button>
            </div>

            {isRegisterPage && (
              <div className="bg-amber-50 border-b border-amber-200 px-4 py-2 flex items-center gap-2 shrink-0">
                <div className="w-2 h-2 bg-amber-500 rounded-full animate-pulse" />
                <p className="text-amber-800 text-xs font-semibold">وضع التسجيل الذكي — ناصر يملأ الاستمارة عنك! 🚀</p>
              </div>
            )}

            {/* Auto-registered success banner */}
            {autoRegistered && (
              <div className="bg-green-50 border-b border-green-200 px-4 py-2.5 flex items-center gap-2 shrink-0">
                <CheckCircle2 size={16} className="text-green-600 shrink-0" />
                <div>
                  <p className="text-green-800 text-xs font-bold">✅ تم تسجيل {autoRegistered.name} بنجاح!</p>
                  <p className="text-green-600 text-xs">رقم الطلب: #{autoRegistered.id} — سيتواصل معك الفريق قريباً</p>
                </div>
              </div>
            )}

            {/* Messages */}
            <div className="flex-1 overflow-y-auto bg-gray-50 px-4 py-3 space-y-3">
              {messages.map((msg) => (
                <div key={msg.id} className={`flex ${msg.role === "user" ? "justify-start" : "justify-end"} items-end gap-1`}>
                  <div className={`max-w-[88%] px-3.5 py-2.5 rounded-2xl text-sm leading-relaxed whitespace-pre-wrap ${
                    msg.role === "user"
                      ? "bg-gradient-to-br from-primary to-blue-700 text-white rounded-bl-sm shadow-md"
                      : "bg-white text-gray-800 shadow-md border border-gray-100 rounded-br-sm"
                  }`}>
                    {msg.isTyping ? (
                      <div className="flex gap-1 items-center py-1 px-1">
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

              {/* Quick replies */}
              {messages.length > 0 && !loading && !awaitingConfirm && registrationStep === 0 && (
                <div className="flex flex-wrap gap-2 justify-end pt-1">
                  {(isRegisterPage && messages.length <= 2 ? QUICK_REPLIES_REGISTER : QUICK_REPLIES_DEFAULT).map((qr) => (
                    <button
                      key={qr.label}
                      onClick={() => handleQuickReply(qr.text)}
                      className="text-xs bg-white border border-primary/40 text-primary hover:bg-gradient-to-r hover:from-primary hover:to-blue-600 hover:text-white hover:border-transparent transition-all rounded-full px-3 py-1.5 font-semibold shadow-sm"
                    >
                      {qr.label}
                    </button>
                  ))}
                </div>
              )}

              {/* Confirm registration buttons */}
              {awaitingConfirm && registrationStep === 8 && (
                <div className="flex justify-end gap-2 pt-1">
                  <button
                    onClick={() => { void handleAutoRegister(); setAwaitingConfirm(false); }}
                    className="text-sm bg-green-600 hover:bg-green-700 text-white rounded-lg px-4 py-2 font-bold flex items-center gap-1 shadow"
                  >
                    <Check size={16} /> تأكيد التسجيل
                  </button>
                  <button
                    onClick={() => {
                      setRegistrationStep(0);
                      setAwaitingConfirm(false);
                      setExtractedData(null);
                      setRegData({});
                      setMissingFieldsQueue([]);
                      addMessage("assistant", "لا مشكلة! يمكنك البدء من جديد. ما الذي يمكنني مساعدتك فيه؟");
                    }}
                    className="text-sm bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-lg px-3 py-2"
                  >
                    إلغاء
                  </button>
                </div>
              )}

              <div ref={messagesEndRef} />
            </div>

            {/* Input area */}
            <div className="bg-white border-t border-gray-100 px-3 py-3 shrink-0">
              <div className="flex items-end gap-2">
                {isRegisterPage && (
                  <button
                    onClick={() => fileInputRef.current?.click()}
                    disabled={uploadingImage}
                    className="shrink-0 w-9 h-9 rounded-xl bg-amber-50 hover:bg-amber-100 border border-amber-200 flex items-center justify-center transition-colors"
                    title="إرسال صورة الاستمارة"
                  >
                    {uploadingImage
                      ? <Loader2 size={16} className="text-amber-600 animate-spin" />
                      : showImageSuccess
                      ? <Check size={16} className="text-green-600" />
                      : <ImageIcon size={16} className="text-amber-600" />}
                  </button>
                )}
                <div className="flex-1 relative">
                  <textarea
                    value={input}
                    onChange={(e) => setInput(e.target.value)}
                    onKeyDown={handleKeyDown}
                    placeholder={isRegisterPage ? "اكتب هنا أو أرسل صورة الاستمارة..." : "اكتب سؤالك هنا..."}
                    rows={1}
                    disabled={loading || uploadingImage}
                    className="w-full resize-none rounded-xl border border-gray-200 bg-gray-50 px-3.5 py-2.5 text-sm text-right focus:outline-none focus:ring-2 focus:ring-primary/40 focus:border-primary disabled:opacity-50 placeholder:text-gray-400"
                    style={{ maxHeight: 80 }}
                  />
                </div>
                <button
                  onClick={handleSend}
                  disabled={!input.trim() || loading || uploadingImage}
                  className="shrink-0 w-9 h-9 rounded-xl bg-primary hover:bg-primary/90 flex items-center justify-center text-white disabled:opacity-40 transition-colors"
                >
                  <Send size={16} className="rotate-180" />
                </button>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Floating button */}
      <motion.button
        onClick={() => { if (!open) { void openWidget(); } else { setOpen(false); } }}
        className="fixed bottom-6 left-6 z-50 w-14 h-14 rounded-full bg-gradient-to-br from-primary to-blue-700 shadow-xl flex items-center justify-center text-white"
        whileHover={{ scale: 1.08 }}
        whileTap={{ scale: 0.95 }}
      >
        <AnimatePresence mode="wait">
          {open ? (
            <motion.div key="close" initial={{ rotate: -90, opacity: 0 }} animate={{ rotate: 0, opacity: 1 }} exit={{ rotate: 90, opacity: 0 }}>
              <ChevronDown size={24} />
            </motion.div>
          ) : (
            <motion.div key="bot" initial={{ rotate: 90, opacity: 0 }} animate={{ rotate: 0, opacity: 1 }} exit={{ rotate: -90, opacity: 0 }}>
              <Bot size={26} />
            </motion.div>
          )}
        </AnimatePresence>
        {!open && (
          <motion.span
            className="absolute -top-1 -right-1 w-5 h-5 bg-green-400 rounded-full border-2 border-white flex items-center justify-center"
            animate={{ scale: [1, 1.2, 1] }}
            transition={{ repeat: Infinity, duration: 2 }}
          >
            <span className="w-2 h-2 bg-white rounded-full" />
          </motion.span>
        )}
      </motion.button>
    </>
  );
}

// ── Image compression helper ──────────────────────────────────────────────────
async function compressAndToBase64(file: File): Promise<{ base64: string; mimeType: string }> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    const url = URL.createObjectURL(file);
    img.onload = () => {
      URL.revokeObjectURL(url);
      const MAX = 1024;
      let { width, height } = img;
      if (width > MAX || height > MAX) {
        if (width > height) { height = Math.round((height * MAX) / width); width = MAX; }
        else { width = Math.round((width * MAX) / height); height = MAX; }
      }
      const canvas = document.createElement("canvas");
      canvas.width = width; canvas.height = height;
      const ctx = canvas.getContext("2d");
      if (!ctx) { reject(new Error("Canvas not supported")); return; }
      ctx.drawImage(img, 0, 0, width, height);
      const dataUrl = canvas.toDataURL("image/jpeg", 0.82);
      const base64 = dataUrl.split(",")[1];
      resolve({ base64, mimeType: "image/jpeg" });
    };
    img.onerror = () => reject(new Error("Failed to load image"));
    img.src = url;
  });
}
