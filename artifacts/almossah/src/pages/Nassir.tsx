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
  notes?: string;
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
  const [extractedData, setExtractedData] = useState<ExtractedData | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);
  const initialized = useRef(false);

  const scrollToBottom = () => messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  useEffect(() => { scrollToBottom(); }, [messages]);

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

    const welcome = `مرحباً بك! أنا **ناصر** 🎓\nمستشارك الأكاديمي الذكي للمؤسسة الوطنية للتنمية الشاملة.\n\nلدي معلومات كاملة عن:\n🏛 16 جامعة شريكة مع تخصصاتها الكاملة\n📊 معدلات القبول لكل تخصص\n🎯 المنح والتخفيضات المتاحة\n📝 التسجيل الذكي من صورة الاستمارة!\n\nما الذي يشغل تفكيرك اليوم؟`;
    addMessage("assistant", welcome);
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
              setMessages((prev) => prev.map((m) => m.id === msgId ? { ...m, content: full } : m));
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

  const handleSend = () => {
    if (!input.trim() || !conversationId) return;
    const text = input.trim();

    if (regStep === 2) { addMessage("user", text); setInput(""); setRegData((p) => ({ ...p, fullName: text })); addMessage("assistant", `شكراً ${text}! 😊\n\nما **معدلك** في الثانوية؟ (مثال: 85.5 أو 425)`); setRegStep(4); return; }
    if (regStep === 4) { addMessage("user", text); setInput(""); setRegData((p) => ({ ...p, gpa: text })); addMessage("assistant", "📊 ممتاز!\n\nما **قسمك**؟ (علمي / أدبي)"); setRegStep(5); return; }
    if (regStep === 5) { addMessage("user", text); setInput(""); setRegData((p) => ({ ...p, department: text })); addMessage("assistant", "👍\n\nمن أي **مدينة أو محافظة**؟"); setRegStep(6); return; }
    if (regStep === 6) { addMessage("user", text); setInput(""); setRegData((p) => ({ ...p, city: text })); addMessage("assistant", "الآن أخبرني: **ما التخصص الذي تريده؟**"); setRegStep(6.5); return; }
    if (regStep === 6.5) { addMessage("user", text); setInput(""); setRegData((p) => ({ ...p, specialization: text })); addMessage("assistant", "وأخيراً — **رقم هاتفك** لإتمام التسجيل:"); setRegStep(3); return; }
    if (regStep === 3) {
      if (text.length < 9) { addMessage("user", text); setInput(""); addMessage("assistant", "يبدو أن الرقم قصير. يرجى إدخال رقم صحيح (9 أرقام على الأقل)."); return; }
      addMessage("user", text); setInput("");
      const fullData = { ...regData, phone: text };
      setRegData(fullData);
      const programs = `اختر البرنامج المناسب:\n\n1️⃣ منحة دراسية كاملة\n2️⃣ تخفيض جامعي\n3️⃣ دورة تدريبية\n4️⃣ تأمين صحي`;
      addMessage("assistant", programs); setRegStep(7); return;
    }
    if (regStep === 7) {
      addMessage("user", text); setInput("");
      let prog = "منح دراسية";
      if (text.includes("2") || text.includes("تخفيض")) prog = "تخفيضات جامعية";
      else if (text.includes("3") || text.includes("دورة")) prog = "دورات تدريبية";
      else if (text.includes("4") || text.includes("تأمين")) prog = "تأمين طبي";
      const d = { ...regData, programType: prog };
      setRegData(d);
      setExtractedData(d as ExtractedData);
      const summary = [`👤 الاسم: **${d.fullName || "غير محدد"}**`, `📱 الهاتف: **${d.phone || ""}**`, d.gpa ? `📊 المعدل: **${d.gpa}**` : null, d.department ? `📚 القسم: **${d.department}**` : null, d.city ? `🏙 المدينة: **${d.city}**` : null, `🎯 البرنامج: **${prog}**`].filter(Boolean).join("\n");
      addMessage("assistant", `✅ **ملخص طلبك:**\n\n${summary}\n\nهل تؤكد التسجيل؟`);
      setRegStep(8); setAwaitingConfirm(true); return;
    }
    if (regStep === 8 && awaitingConfirm) {
      const lc = text.toLowerCase();
      const yes = lc.includes("نعم") || lc.includes("أكد") || lc.includes("تمام") || lc.includes("موافق");
      if (yes) { addMessage("user", text); setInput(""); void handleAutoRegister(); return; }
    }

    addMessage("user", text);
    setInput("");
    void sendToApi(text, conversationId);
  };

  const handleAutoRegister = async () => {
    if (!conversationId) return;
    setLoading(true);
    try {
      const payload = { ...regData, programType: regData.programType || "منح دراسية", conversationId: String(conversationId) };
      const r = await fetch("/api/nassir/auto-register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      const d = await r.json() as { success?: boolean; registrationId?: number };
      if (d.success) {
        addMessage("assistant", `🎉 **تهانينا! تم تسجيلك بنجاح!**\n\nرقم طلبك: **#${d.registrationId}**\n\nسيتواصل معك فريقنا المتخصص خلال **24 ساعة** على رقم هاتفك المسجّل.\n\n_"الفرصة التي أمّنتها اليوم ستكون نقطة التحوّل في مسيرتك الأكاديمية"_ 🌟`);
        setAwaitingConfirm(false); setExtractedData(null); setRegStep(0); setRegData({});
        setShowSuccess(true); setTimeout(() => setShowSuccess(false), 5000);
      } else {
        addMessage("assistant", "حدث خطأ أثناء التسجيل. يرجى التواصل المباشر مع فريقنا أو زيارة صفحة التسجيل.");
      }
    } catch {
      addMessage("assistant", "حدث خطأ غير متوقع. يرجى المحاولة لاحقاً.");
    }
    setLoading(false);
  };

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
      if (!r.ok) {
        const errData = await r.json().catch(() => ({})) as { message?: string };
        throw new Error(errData.message || `HTTP ${r.status}`);
      }
      const data = await r.json() as ExtractedData & { _error?: string };
      if (data._error) { throw new Error(data._error); }
      setExtractedData(data);
      const hasData = data.fullName || data.gpa || data.department;
      if (hasData) {
        const summary = [data.fullName ? `👤 الاسم: **${data.fullName}**` : null, data.gpa ? `📊 المعدل: **${data.gpa}**` : null, data.department ? `📚 القسم: **${data.department}**` : null, data.city ? `🏙 المدينة: **${data.city}**` : null].filter(Boolean).join("\n");
        addMessage("assistant", `✅ **استخرجت بياناتك بنجاح!**\n\n${summary}\n\nهل هذه البيانات صحيحة؟ أخبرني بـ "نعم" للمتابعة أو صحّح أي معلومة.`);
        setRegData({ ...(data as Record<string, string>) });
        setAwaitingConfirm(true); setRegStep(1);
      } else {
        addMessage("assistant", "لم أتمكن من قراءة الاستمارة بوضوح كافٍ.\n\nلا مشكلة! أخبرني **باسمك الكامل** وأنا أكمل معك:");
        setRegStep(2);
      }
    } catch {
      addMessage("assistant", "حدث خطأ في قراءة الصورة. يمكنك إدخال بياناتك يدوياً — ما **اسمك الكامل**؟");
      setRegStep(2);
    }
    setUploadingImage(false);
    if (e.target) e.target.value = "";
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
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-blue-50/30" dir="rtl">
      <div className="container mx-auto max-w-5xl px-4 py-10">
        <motion.div initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }} className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-gradient-to-br from-primary to-blue-700 rounded-2xl shadow-xl mb-4">
            <Bot size={32} className="text-white" />
          </div>
          <h1 className="text-3xl font-bold text-slate-900 mb-2">ناصر — المستشار الأكاديمي الذكي</h1>
          <p className="text-slate-500 max-w-xl mx-auto">مساعدك الشخصي الذكي للتوجيه الأكاديمي والتسجيل — متاح 24/7</p>
          <div className="flex items-center justify-center gap-4 mt-4 flex-wrap">
            {[["15,000+", "طالب مستفيد", GraduationCap], ["16", "جامعة شريكة", BookOpen], ["70%", "أقصى خصم", Star], ["24/7", "متاح دائماً", Heart]].map(([num, label, Icon]) => (
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
          <div className="lg:col-span-3 flex flex-col bg-white rounded-2xl shadow-lg border border-slate-200 overflow-hidden" style={{ height: 580 }}>
            <div className="bg-gradient-to-l from-primary to-blue-700 px-5 py-4 flex items-center gap-3 shrink-0">
              <div className="relative">
                <div className="w-10 h-10 rounded-xl bg-white/20 flex items-center justify-center">
                  <Bot size={22} className="text-white" />
                </div>
                <span className="absolute -bottom-0.5 -right-0.5 w-3.5 h-3.5 bg-green-400 rounded-full border-2 border-primary" />
              </div>
              <div>
                <p className="text-white font-bold">ناصر الذكي</p>
                <p className="text-white/70 text-xs">متاح الآن • يقرأ الاستمارات تلقائياً</p>
              </div>
              <div className="mr-auto flex items-center gap-1.5 text-white/80 text-xs bg-white/10 px-3 py-1 rounded-full">
                <Sparkles size={12} />
                مدعوم بـ Groq AI
              </div>
            </div>

            <div className="flex-1 overflow-y-auto px-5 py-4 space-y-4 bg-gray-50">
              {messages.map((msg) => (
                <div key={msg.id} className={`flex ${msg.role === "user" ? "justify-start" : "justify-end"}`}>
                  <div className={`max-w-[82%] px-4 py-3 rounded-2xl text-sm leading-relaxed whitespace-pre-wrap shadow-sm ${
                    msg.role === "user"
                      ? "bg-primary text-white rounded-bl-sm"
                      : "bg-white text-gray-800 border border-gray-100 rounded-br-sm"
                  }`}>
                    {msg.isTyping ? (
                      <div className="flex gap-1 items-center py-1">
                        <span className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: "0ms" }} />
                        <span className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: "150ms" }} />
                        <span className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: "300ms" }} />
                      </div>
                    ) : (
                      <span dangerouslySetInnerHTML={{ __html: msg.content.replace(/\*\*(.*?)\*\*/g, "<strong>$1</strong>").replace(/\n/g, "<br/>") }} />
                    )}
                  </div>
                </div>
              ))}
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
              {awaitingConfirm && regStep === 8 && (
                <div className="flex gap-2 justify-end flex-wrap">
                  <button onClick={() => { void handleAutoRegister(); setAwaitingConfirm(false); }}
                    className="bg-green-600 hover:bg-green-700 text-white rounded-xl px-5 py-2 text-sm font-bold flex items-center gap-2">
                    <Check size={16} /> تأكيد التسجيل النهائي
                  </button>
                  <button onClick={() => { setRegStep(0); setAwaitingConfirm(false); setExtractedData(null); addMessage("assistant", "لا مشكلة! كيف يمكنني مساعدتك؟"); }}
                    className="bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl px-4 py-2 text-sm">
                    إلغاء
                  </button>
                </div>
              )}
              <div ref={messagesEndRef} />
            </div>

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
                  placeholder="اسأل ناصر عن أي شيء — تخصصات، جامعات، تسجيل..."
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
              <p className="text-center text-xs text-slate-400 mt-2">اضغط 📎 لرفع صورة استمارتك وسيعبّئ ناصر بياناتك تلقائياً</p>
            </div>
          </div>

          <div className="space-y-4">
            <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-4">
              <h3 className="font-bold text-slate-800 mb-3 text-sm flex items-center gap-2">
                <GraduationCap size={16} className="text-primary" /> ما يمكن لناصر فعله
              </h3>
              <div className="space-y-2.5">
                {[
                  { icon: "📸", text: "يقرأ استمارتك ويسجّلك تلقائياً" },
                  { icon: "🏛", text: "معلومات كاملة عن 16 جامعة" },
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
      }, mimeType, 0.75);
    };
    img.onerror = reject;
    img.src = url;
  });
}
