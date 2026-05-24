import { useState, useRef, useEffect, useCallback } from "react";
  import { Send, Bot, Loader2, Sparkles, GraduationCap, HeartPulse, BookOpen, Phone, MessageCircle, ChevronRight } from "lucide-react";
  import { Layout } from "@/components/layout/Layout";

  const BASE = import.meta.env.BASE_URL?.replace(/\/$/, "") || "";

  interface Msg {
    id: string;
    role: "user" | "assistant";
    content: string;
    streaming?: boolean;
  }

  const MENU_ITEMS = [
    { id: "grants",    icon: GraduationCap, label: "المنح الدراسية",      color: "bg-blue-50 text-blue-700 border-blue-200",    msg: "ما هي المنح الدراسية المتاحة وكيف أتقدم لها؟" },
    { id: "discounts", icon: BookOpen,      label: "التخفيضات الجامعية",  color: "bg-purple-50 text-purple-700 border-purple-200", msg: "ما هي التخفيضات الجامعية المتوفرة والجامعات الشريكة؟" },
    { id: "insurance", icon: HeartPulse,   label: "التأمين الصحي",       color: "bg-green-50 text-green-700 border-green-200",  msg: "أريد معلومات عن التأمين الصحي وتكلفته ومزاياه" },
    { id: "training",  icon: Sparkles,     label: "الدورات التدريبية",   color: "bg-orange-50 text-orange-700 border-orange-200", msg: "ما هي الدورات التدريبية المتاحة وكيف أسجل؟" },
    { id: "register",  icon: ChevronRight, label: "كيف أسجل؟",           color: "bg-red-50 text-red-700 border-red-200",        msg: "كيف يمكنني التسجيل في خدمات المؤسسة؟" },
    { id: "contact",   icon: Phone,        label: "تواصل معنا",          color: "bg-gray-50 text-gray-700 border-gray-200",     msg: "ما هي معلومات التواصل وعنوان المؤسسة؟" },
  ];

  function TypingDots() {
    return (
      <div className="flex gap-1.5 items-center px-2 py-3">
        {[0, 150, 300].map((d) => (
          <span key={d} className="w-2 h-2 rounded-full bg-primary/40 animate-bounce" style={{ animationDelay: d + "ms" }} />
        ))}
      </div>
    );
  }

  function MsgBubble({ msg }: { msg: Msg }) {
    const isUser = msg.role === "user";
    const lines = msg.content.split("\n");
    return (
      <div className={"flex gap-3 " + (isUser ? "flex-row-reverse" : "flex-row")}>
        {!isUser && (
          <div className="w-9 h-9 rounded-full bg-primary flex items-center justify-center shrink-0 mt-0.5 shadow-sm">
            <Bot size={18} className="text-white" />
          </div>
        )}
        <div
          className={"max-w-[75%] md:max-w-[65%] rounded-2xl px-4 py-3 text-sm leading-relaxed shadow-sm " +
            (isUser
              ? "bg-primary text-white rounded-tr-sm"
              : "bg-white text-gray-800 rounded-tl-sm border border-gray-100")}
        >
          {msg.role === "assistant" && msg.streaming && !msg.content
            ? <TypingDots />
            : lines.map((line, i) => <span key={i}>{line}{i < lines.length - 1 && <br />}</span>)}
          {msg.streaming && msg.content && (
            <span className="inline-block w-0.5 h-4 bg-gray-400 animate-pulse mr-0.5 align-middle" />
          )}
        </div>
      </div>
    );
  }

  export default function NassirPage() {
    const [msgs, setMsgs] = useState<Msg[]>([]);
    const [input, setInput] = useState("");
    const [convId, setConvId] = useState<number | null>(null);
    const [isTyping, setIsTyping] = useState(false);
    const [initialized, setInitialized] = useState(false);
    const [menuUsed, setMenuUsed] = useState(false);
    const scrollRef = useRef<HTMLDivElement>(null);
    const inputRef = useRef<HTMLInputElement>(null);
    const msgIdRef = useRef(0);
    const nextId = () => String(++msgIdRef.current);

    useEffect(() => { document.title = "ناصر مساعدك الذكي | المؤسسة الوطنية"; }, []);

    const scrollToBottom = useCallback(() => {
      setTimeout(() => {
        scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: "smooth" });
      }, 60);
    }, []);

    useEffect(() => { if (msgs.length) scrollToBottom(); }, [msgs, scrollToBottom]);

    useEffect(() => {
      (async () => {
        try {
          const [settingsRes, convoRes] = await Promise.all([
            fetch(BASE + "/api/nassir/settings"),
            fetch(BASE + "/api/nassir/conversations", {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({ platform: "web" }),
            }),
          ]);
          const settings = settingsRes.ok ? await settingsRes.json() : null;
          const convo = convoRes.ok ? await convoRes.json() : null;
          if (convo?.id) setConvId(convo.id);
          const welcome = settings?.welcomeMessage || "مرحباً! أنا ناصر مساعدك الذكي 👋\nاختر من القائمة أو اكتب سؤالك مباشرة.";
          setMsgs([{ id: nextId(), role: "assistant", content: welcome }]);
          setInitialized(true);
        } catch {
          setMsgs([{ id: nextId(), role: "assistant", content: "مرحباً! أنا ناصر مساعدك الذكي 👋\nكيف يمكنني مساعدتك؟" }]);
          setInitialized(true);
        }
      })();
    }, []);

    const sendMessage = useCallback(async (text: string) => {
      const trimmed = text.trim();
      if (!trimmed || isTyping || !convId) return;
      setInput("");
      setMenuUsed(true);
      setMsgs((prev) => [...prev, { id: nextId(), role: "user", content: trimmed }]);
      setIsTyping(true);
      const assistantId = nextId();
      setMsgs((prev) => [...prev, { id: assistantId, role: "assistant", content: "", streaming: true }]);

      try {
        const res = await fetch(BASE + "/api/nassir/conversations/" + convId + "/messages", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ content: trimmed }),
        });
        if (!res.body) throw new Error("No body");
        const reader = res.body.getReader();
        const decoder = new TextDecoder();
        let buffer = "";
        let fullText = "";
        while (true) {
          const { done, value } = await reader.read();
          if (done) break;
          buffer += decoder.decode(value, { stream: true });
          const lines = buffer.split("\n");
          buffer = lines.pop() || "";
          for (const line of lines) {
            if (!line.startsWith("data:")) continue;
            try {
              const parsed = JSON.parse(line.slice(5).trim());
              if (parsed.content) {
                fullText += parsed.content;
                setMsgs((prev) => prev.map((m) => m.id === assistantId ? { ...m, content: fullText, streaming: true } : m));
              }
              if (parsed.done) setMsgs((prev) => prev.map((m) => m.id === assistantId ? { ...m, streaming: false } : m));
            } catch {}
          }
        }
      } catch {
        setMsgs((prev) => prev.map((m) => m.id === assistantId ? { ...m, content: "عذراً، حدث خطأ. حاول مرة أخرى.", streaming: false } : m));
      } finally {
        setIsTyping(false);
      }
    }, [convId, isTyping]);

    return (
      <Layout>
        <div dir="rtl" className="min-h-screen bg-gradient-to-b from-gray-50 to-white">

          {/* ── Hero ── */}
          <section className="bg-gradient-to-br from-primary via-primary to-primary/80 text-white py-10 px-4">
            <div className="container mx-auto max-w-3xl text-center">
              <div className="flex items-center justify-center gap-3 mb-4">
                <div className="w-16 h-16 rounded-2xl bg-white/20 backdrop-blur flex items-center justify-center shadow-lg">
                  <Bot size={32} className="text-white" />
                </div>
              </div>
              <h1 className="text-3xl md:text-4xl font-extrabold mb-2 tracking-tight">ناصر مساعدك الذكي</h1>
              <p className="text-white/80 text-base md:text-lg">المؤسسة الوطنية للتنمية الشاملة</p>
              <div className="flex items-center justify-center gap-2 mt-3">
                <span className="w-2 h-2 rounded-full bg-green-400 animate-pulse" />
                <span className="text-white/70 text-sm">متاح الآن · يرد فوراً</span>
              </div>
            </div>
          </section>

          {/* ── Interactive Menu ── */}
          <section className="py-6 px-4 border-b border-gray-100 bg-white">
            <div className="container mx-auto max-w-3xl">
              <p className="text-center text-sm text-gray-500 mb-4 font-medium">اختر موضوعاً أو اكتب سؤالك مباشرة</p>
              <div className="grid grid-cols-2 md:grid-cols-3 gap-2.5">
                {MENU_ITEMS.map((item) => {
                  const Icon = item.icon;
                  return (
                    <button
                      key={item.id}
                      onClick={() => { sendMessage(item.msg); setTimeout(() => scrollRef.current?.scrollIntoView({ behavior: "smooth" }), 100); }}
                      disabled={isTyping || !convId}
                      className={"flex items-center gap-2.5 px-3 py-3 rounded-xl border text-sm font-semibold transition-all hover:scale-[1.02] active:scale-95 disabled:opacity-50 text-right " + item.color}
                    >
                      <Icon size={18} className="shrink-0" />
                      <span className="leading-tight">{item.label}</span>
                    </button>
                  );
                })}
              </div>
            </div>
          </section>

          {/* ── Chat ── */}
          <section className="py-4 px-4">
            <div className="container mx-auto max-w-3xl flex flex-col" style={{ height: "calc(100vh - 420px)", minHeight: "380px" }}>

              {/* Messages */}
              <div ref={scrollRef} className="flex-1 overflow-y-auto space-y-4 px-1 py-2">
                {!initialized && (
                  <div className="flex justify-center py-10">
                    <Loader2 className="animate-spin text-primary/40" size={28} />
                  </div>
                )}
                {msgs.map((msg) => <MsgBubble key={msg.id} msg={msg} />)}
              </div>

              {/* Input */}
              <div className="mt-4 pt-4 border-t border-gray-100">
                <form
                  onSubmit={(e) => { e.preventDefault(); sendMessage(input); }}
                  className="flex gap-2 bg-white rounded-2xl border border-gray-200 shadow-sm p-2"
                >
                  <button
                    type="submit"
                    disabled={!input.trim() || isTyping || !convId}
                    className="w-10 h-10 rounded-xl bg-primary hover:bg-primary/90 text-white flex items-center justify-center shrink-0 disabled:opacity-40 transition-all"
                  >
                    <Send size={16} />
                  </button>
                  <input
                    ref={inputRef}
                    value={input}
                    onChange={(e) => setInput(e.target.value)}
                    onKeyDown={(e) => { if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); sendMessage(input); }}}
                    placeholder="اكتب سؤالك هنا..."
                    disabled={isTyping || !convId}
                    className="flex-1 text-sm bg-transparent border-none outline-none text-right placeholder:text-gray-400 disabled:opacity-60 px-2"
                  />
                  {isTyping && <Loader2 size={16} className="animate-spin text-primary/50 self-center ml-2 shrink-0" />}
                </form>
                <p className="text-center text-xs text-gray-400 mt-2">
                  مدعوم بـ Groq AI · <span className="text-primary">ناصر مساعدك الذكي</span>
                </p>
              </div>
            </div>
          </section>

        </div>
      </Layout>
    );
  }
  