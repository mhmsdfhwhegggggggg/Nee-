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
      ? `مرحباً بك! أنا **ناصر** 🎓\n\nأنت على بُعد دقيقتين من تأمين مقعدك الجامعي!\n\n📸 **الأسرع:** أرسل صورة استمارة ثانويتك وأملأ بياناتك تلقائياً في ثوانٍ!\n✍️ **أو:** أخبرني بمعدلك وتخصصك المطلوب وسأجد لك أفضل جامعة بأقل تكلفة.\n\n**أكثر من 15,000 طالب** بدأوا هكذا — أنت التالي! 🌟`
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
              // Strip 〔REG〕 blocks from live display
              const displayText = stripRegBlock(full);
              setMessages((prev) =>
                prev.map((m) => m.id === msgId ? { ...m, content: displayText } : m),
              );
            }

            if (data.autoRegistered && data.registrationId) {
              setAutoRegistered({ id: data.registrationId, name: data.studentName || "الطالب" });
              // Update last message to clean version
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

      setExtractedData(data);
      setUploadingImage(false);
      setShowImageSuccess(true);
      setTimeout(() => setShowImageSuccess(false), 3000);

      const hasData = data.fullName || data.gpa || data.department;
      if (hasData) {
        const summary = [
          data.fullName ? `👤 الاسم: **${data.fullName}**` : null,
          data.gpa ? `📊 المعدل: **${data.gpa}**` : null,
          data.department ? `📚 القسم: **${data.department}**` : null,
          data.city ? `🏙 المدينة: **${data.city}**` : null,
        ].filter(Boolean).join("\n");

        addMessage(
          "assistant",
          `✅ ممتاز! استخرجت بياناتك بنجاح:\n\n${summary}\n\nهل هذه البيانات صحيحة؟ سأحتاج أيضاً إلى **رقم هاتفك** لإتمام التسجيل.`,
        );
        setAwaitingConfirm(true);
        setRegData({ ...data } as Record<string, string>);
        setRegistrationStep(1);
      } else {
        addMessage(
          "assistant",
          "لم أتمكن من قراءة الاستمارة بوضوح كافٍ.\n\nلا مشكلة! يمكنك إخباري ببياناتك مباشرة:\n**ما اسمك الكامل؟**",
        );
        setRegistrationStep(2);
      }
    } catch {
      setUploadingImage(false);
      addMessage("assistant", "حدث خطأ أثناء قراءة الصورة. يرجى المحاولة مرة أخرى أو إدخال بياناتك يدوياً.");
    }

    if (e.target) e.target.value = "";
  };

  const handleAutoRegister = async () => {
    if (!conversationId || !extractedData) return;
    setLoading(true);
    try {
      const r = await fetch("/api/nassir/auto-register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...regData,
          programType: regData.programType || "مقاعد مخفضة",
          conversationId: String(conversationId),
        }),
      });
      const d = await r.json() as { success?: boolean; registrationId?: number; error?: string };
      if (d.success && d.registrationId) {
        setAutoRegistered({ id: d.registrationId, name: regData.fullName || "الطالب" });
        addMessage(
          "assistant",
          `🎉 **تم تسجيلك بنجاح!**\n\nرقم طلبك: **#${d.registrationId}**\n\nسيتواصل معك فريقنا قريباً على رقم هاتفك المسجّل.\n\nنتمنى لك مسيرة أكاديمية موفقة! 🌟`,
        );
        setAwaitingConfirm(false);
        setExtractedData(null);
        setRegistrationStep(0);
        setRegData({});
      } else {
        addMessage("assistant", "حدث خطأ أثناء التسجيل. يرجى زيارة صفحة التسجيل مباشرة أو التواصل مع الفريق على 770441247.");
      }
    } catch {
      addMessage("assistant", "حدث خطأ أثناء التسجيل. يرجى المحاولة مرة أخرى.");
    }
    setLoading(false);
  };

  const handleSend = () => {
    if (!input.trim() || !conversationId) return;

    // ── Manual step-by-step registration flow ────────────────────────────────
    if (awaitingConfirm && registrationStep === 1) {
      const lc = input.toLowerCase();
      const confirmed = lc.includes("نعم") || lc.includes("صح") || lc.includes("صحيح") || lc.includes("تمام") || lc.includes("موافق") || lc.includes("yes");
      if (confirmed) {
        addMessage("user", input); setInput("");
        addMessage("assistant", "رائع! 🎊 آخر خطوة — ما **رقم هاتفك** حتى يتواصل معك فريقنا؟");
        setRegistrationStep(3); setAwaitingConfirm(false); return;
      }
      const denied = lc.includes("لا") || lc.includes("خطأ") || lc.includes("غلط") || lc.includes("no");
      if (denied) {
        addMessage("user", input); setInput("");
        addMessage("assistant", "لا مشكلة! أخبرني ببياناتك الصحيحة:\n**ما اسمك الكامل؟**");
        setAwaitingConfirm(false); setRegistrationStep(2); return;
      }
    }

    if (registrationStep === 2) {
      const text = input.trim(); addMessage("user", text); setInput("");
      setRegData((prev) => ({ ...prev, fullName: text }));
      addMessage("assistant", `شكراً ${text}! 😊\n\n**ما هو معدلك في الثانوية؟** (مثال: 85% أو 425 درجة)`);
      setRegistrationStep(4); return;
    }
    if (registrationStep === 4) {
      const text = input.trim(); addMessage("user", text); setInput("");
      setRegData((prev) => ({ ...prev, gpa: text }));
      addMessage("assistant", `ممتاز! 📊\n\n**ما قسمك؟** (علمي / أدبي)`);
      setRegistrationStep(5); return;
    }
    if (registrationStep === 5) {
      const text = input.trim(); addMessage("user", text); setInput("");
      setRegData((prev) => ({ ...prev, department: text }));
      addMessage("assistant", `**ما التخصص الذي تريده؟** (مثال: طب بشري، هندسة، إدارة...)`);
      setRegistrationStep(9); return;
    }
    if (registrationStep === 9) {
      const text = input.trim(); addMessage("user", text); setInput("");
      setRegData((prev) => ({ ...prev, specialtyWanted: text }));
      addMessage("assistant", `**من أي مدينة أو محافظة أنت؟**`);
      setRegistrationStep(6); return;
    }
    if (registrationStep === 6) {
      const text = input.trim(); addMessage("user", text); setInput("");
      setRegData((prev) => ({ ...prev, city: text }));
      addMessage("assistant", `الآن آخر شيء — **رقم هاتفك** لإتمام التسجيل:`);
      setRegistrationStep(3); return;
    }
    if (registrationStep === 3) {
      const phone = input.trim();
      if (phone.replace(/\D/g, "").length < 9) {
        addMessage("user", input); setInput("");
        addMessage("assistant", "يبدو أن الرقم قصير. يرجى إدخال رقم هاتف صحيح (9 أرقام على الأقل)."); return;
      }
      addMessage("user", phone); setInput("");
      const fullRegData = { ...regData, phone };
      setRegData(fullRegData);

      addMessage("assistant", `أي برنامج يهمك؟\n\n1️⃣ **مقاعد مخفضة** — جامعة بسعر استثنائي\n2️⃣ **منحة دراسية كاملة** — للمتميزين\n3️⃣ **دورة تدريبية** — لغة / حاسوب / مهارات\n4️⃣ **تأمين صحي** — للفرد والأسرة`);
      setRegistrationStep(7); return;
    }
    if (registrationStep === 7) {
      const text = input.trim(); addMessage("user", text); setInput("");
      let programType = "مقاعد مخفضة";
      if (text.includes("2") || text.includes("منح")) programType = "منحة دراسية";
      else if (text.includes("3") || text.includes("دورة")) programType = "دورة تدريبية";
      else if (text.includes("4") || text.includes("تأمين")) programType = "تأمين صحي";

      const finalData = { ...regData, programType };
      setRegData(finalData);
      setExtractedData(finalData as ExtractedData);
      setRegistrationStep(8);

      const summary = [
        finalData.fullName ? `👤 الاسم: **${finalData.fullName}**` : null,
        finalData.phone ? `📱 الهاتف: **${finalData.phone}**` : null,
        finalData.gpa ? `📊 المعدل: **${finalData.gpa}**` : null,
        finalData.department ? `📚 القسم: **${finalData.department}**` : null,
        finalData.specialtyWanted ? `🎯 التخصص: **${finalData.specialtyWanted}**` : null,
        finalData.city ? `🏙 المدينة: **${finalData.city}**` : null,
        `📌 البرنامج: **${programType}**`,
      ].filter(Boolean).join("\n");

      addMessage("assistant", `✅ **ملخص طلب تسجيلك:**\n\n${summary}\n\n**هل تؤكد التسجيل بهذه البيانات؟**`);
      setAwaitingConfirm(true); return;
    }
    if (registrationStep === 8 && awaitingConfirm) {
      const lc = input.toLowerCase();
      const confirmed = lc.includes("نعم") || lc.includes("أكد") || lc.includes("تمام") || lc.includes("موافق") || lc.includes("yes");
      if (confirmed) {
        addMessage("user", input); setInput("");
        void handleAutoRegister(); return;
      }
    }

    // Default: send to AI
    void sendMessage(input);
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
              {messages.length > 0 && !loading && !awaitingConfirm && (
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

// Image compression helper
async function compressAndToBase64(file: File): Promise<{ base64: string; mimeType: string }> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    const url = URL.createObjectURL(file);
    img.onload = () => {
      URL.revokeObjectURL(url);
      const MAX = 1200;
      let { width, height } = img;
      if (width > MAX || height > MAX) {
        const ratio = Math.min(MAX / width, MAX / height);
        width = Math.round(width * ratio);
        height = Math.round(height * ratio);
      }
      const canvas = document.createElement("canvas");
      canvas.width = width; canvas.height = height;
      canvas.getContext("2d")!.drawImage(img, 0, 0, width, height);
      const dataUrl = canvas.toDataURL("image/jpeg", 0.82);
      resolve({ base64: dataUrl.split(",")[1], mimeType: "image/jpeg" });
    };
    img.onerror = reject;
    img.src = url;
  });
}
