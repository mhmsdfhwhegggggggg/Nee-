import { useState, useRef, useEffect, useCallback } from "react";
  import { X, Send, Bot, Loader2, ChevronDown } from "lucide-react";

  const BASE = import.meta.env.BASE_URL?.replace(/\/$/, "") || "";

  interface Msg {
    id: string;
    role: "user" | "assistant";
    content: string;
    streaming?: boolean;
  }

  const QUICK_REPLIES = [
    "ما هي خدمات المؤسسة؟",
    "كيف أتقدم للمنح الدراسية؟",
    "ما هي الجامعات المتاحة؟",
    "كيف يمكنني التواصل معكم؟",
  ];

  function TypingDots() {
    return (
      <div className="flex gap-1 items-center px-1 py-2">
        {[0, 150, 300].map((d) => (
          <span key={d} className="w-2 h-2 rounded-full bg-primary/50 animate-bounce" style={{ animationDelay: `${d}ms` }} />
        ))}
      </div>
    );
  }

  export function NassirWidget() {
    const [open, setOpen] = useState(false);
    const [msgs, setMsgs] = useState<Msg[]>([]);
    const [input, setInput] = useState("");
    const [convId, setConvId] = useState<number | null>(null);
    const [isTyping, setIsTyping] = useState(false);
    const [initialized, setInitialized] = useState(false);
    const [showQuick, setShowQuick] = useState(true);
    const scrollRef = useRef<HTMLDivElement>(null);
    const inputRef = useRef<HTMLInputElement>(null);
    const msgIdRef = useRef(0);

    const nextId = () => String(++msgIdRef.current);

    const scrollToBottom = useCallback(() => {
      setTimeout(() => {
        scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: "smooth" });
      }, 50);
    }, []);

    useEffect(() => {
      if (msgs.length) scrollToBottom();
    }, [msgs, scrollToBottom]);

    const initChat = useCallback(async () => {
      if (initialized) return;
      setInitialized(true);
      try {
        const [settingsRes, convoRes] = await Promise.all([
          fetch(`${BASE}/api/nassir/settings`),
          fetch(`${BASE}/api/nassir/conversations`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ platform: "web" }),
          }),
        ]);
        const settings = settingsRes.ok ? await settingsRes.json() : null;
        const convo = convoRes.ok ? await convoRes.json() : null;
        if (convo?.id) setConvId(convo.id);
        const welcome = settings?.welcomeMessage || "مرحباً! أنا ناصر، مساعدك الذكي 👋\nكيف يمكنني مساعدتك اليوم؟";
        setMsgs([{ id: nextId(), role: "assistant", content: welcome }]);
      } catch {
        setMsgs([{ id: nextId(), role: "assistant", content: "مرحباً! كيف يمكنني مساعدتك اليوم؟" }]);
      }
    }, [initialized]);

    const handleOpen = () => {
      setOpen(true);
      if (!initialized) initChat();
      setTimeout(() => inputRef.current?.focus(), 300);
    };

    const sendMessage = useCallback(async (text: string) => {
      const trimmed = text.trim();
      if (!trimmed || isTyping || !convId) return;
      setInput("");
      setShowQuick(false);
      setMsgs((prev) => [...prev, { id: nextId(), role: "user", content: trimmed }]);
      setIsTyping(true);

      const assistantId = nextId();
      setMsgs((prev) => [...prev, { id: assistantId, role: "assistant", content: "", streaming: true }]);

      try {
        const res = await fetch(`${BASE}/api/nassir/conversations/${convId}/messages`, {
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
                setMsgs((prev) =>
                  prev.map((m) => m.id === assistantId ? { ...m, content: fullText, streaming: true } : m)
                );
              }
              if (parsed.done) {
                setMsgs((prev) =>
                  prev.map((m) => m.id === assistantId ? { ...m, streaming: false } : m)
                );
              }
            } catch {}
          }
        }
      } catch {
        setMsgs((prev) =>
          prev.map((m) => m.id === assistantId ? { ...m, content: "عذراً، حدث خطأ. حاول مرة أخرى.", streaming: false } : m)
        );
      } finally {
        setIsTyping(false);
      }
    }, [convId, isTyping]);

    const handleSubmit = (e: React.FormEvent) => {
      e.preventDefault();
      sendMessage(input);
    };

    function renderContent(content: string) {
      return content.split("\n").map((line, i) => (
        <span key={i}>{line}{i < content.split("\n").length - 1 && <br />}</span>
      ));
    }

    return (
      <>
        {/* Floating button */}
        <div className="fixed bottom-6 left-6 z-50 flex flex-col items-center gap-2">
          {!open && (
            <div className="relative">
              <div className="absolute inset-0 rounded-full bg-primary/30 animate-ping" />
              <button
                onClick={handleOpen}
                aria-label="افتح ناصر المساعد الذكي"
                className="relative flex items-center gap-2 bg-primary hover:bg-primary/90 text-white rounded-full px-4 py-3 shadow-xl transition-all hover:scale-105 active:scale-95 font-medium text-sm"
              >
                <Bot size={20} />
                <span>ناصر</span>
              </button>
            </div>
          )}
          {open && (
            <button
              onClick={() => setOpen(false)}
              className="flex items-center gap-1.5 bg-gray-700 hover:bg-gray-800 text-white rounded-full px-3 py-2 shadow-lg text-xs transition-all"
            >
              <ChevronDown size={14} />
              <span>إغلاق</span>
            </button>
          )}
        </div>

        {/* Chat window */}
        {open && (
          <div
            dir="rtl"
            className="fixed bottom-20 left-4 z-50 w-[340px] max-w-[calc(100vw-2rem)] bg-white rounded-2xl shadow-2xl border border-gray-200 flex flex-col overflow-hidden"
            style={{ height: "480px" }}
          >
            {/* Header */}
            <div className="bg-primary px-4 py-3 flex items-center gap-3 shrink-0">
              <div className="flex-1">
                <p className="text-white font-bold text-sm">ناصر — المساعد الذكي</p>
                <p className="text-white/70 text-xs">المؤسسة الوطنية للتنمية الشاملة</p>
              </div>
              <div className="w-2 h-2 rounded-full bg-green-300 animate-pulse" />
              <button onClick={() => setOpen(false)} className="text-white/70 hover:text-white p-1 rounded-lg hover:bg-white/10 transition-colors">
                <X size={18} />
              </button>
            </div>

            {/* Messages */}
            <div ref={scrollRef} className="flex-1 overflow-y-auto p-3 space-y-3 bg-gray-50">
              {msgs.length === 0 && (
                <div className="flex justify-center items-center h-full">
                  <Loader2 className="animate-spin text-gray-300" size={24} />
                </div>
              )}
              {msgs.map((msg) => (
                <div key={msg.id} className={`flex gap-2 ${msg.role === "user" ? "flex-row-reverse" : "flex-row"}`}>
                  {msg.role === "assistant" && (
                    <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center shrink-0 mt-0.5">
                      <Bot size={16} className="text-primary" />
                    </div>
                  )}
                  <div
                    className={`max-w-[78%] rounded-2xl px-3 py-2 text-sm leading-relaxed shadow-sm
                      ${msg.role === "user"
                        ? "bg-primary text-white rounded-tr-sm"
                        : "bg-white text-gray-800 rounded-tl-sm border border-gray-100"
                      }`}
                  >
                    {msg.role === "assistant" && msg.streaming && !msg.content
                      ? <TypingDots />
                      : renderContent(msg.content)
                    }
                    {msg.streaming && msg.content && (
                      <span className="inline-block w-0.5 h-3.5 bg-gray-400 animate-pulse ml-0.5 align-middle" />
                    )}
                  </div>
                </div>
              ))}
            </div>

            {/* Quick replies */}
            {showQuick && msgs.length <= 1 && !isTyping && (
              <div className="px-3 py-2 flex flex-wrap gap-1.5 bg-gray-50 border-t border-gray-100 shrink-0">
                {QUICK_REPLIES.map((q) => (
                  <button
                    key={q}
                    onClick={() => sendMessage(q)}
                    className="text-xs bg-white border border-primary/30 text-primary hover:bg-primary hover:text-white px-2.5 py-1 rounded-full transition-colors whitespace-nowrap"
                  >
                    {q}
                  </button>
                ))}
              </div>
            )}

            {/* Input */}
            <form onSubmit={handleSubmit} className="flex gap-2 p-3 border-t border-gray-100 bg-white shrink-0">
              <button
                type="submit"
                disabled={!input.trim() || isTyping || !convId}
                className="w-9 h-9 rounded-xl bg-primary hover:bg-primary/90 text-white flex items-center justify-center shrink-0 disabled:opacity-40 disabled:cursor-not-allowed transition-all"
              >
                <Send size={16} />
              </button>
              <input
                ref={inputRef}
                value={input}
                onChange={(e) => setInput(e.target.value)}
                placeholder="اكتب رسالتك..."
                disabled={isTyping || !convId}
                className="flex-1 text-sm border border-gray-200 rounded-xl px-3 py-2 focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary bg-gray-50 disabled:opacity-60 text-right"
                onKeyDown={(e) => { if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); sendMessage(input); }}}
              />
            </form>
          </div>
        )}
      </>
    );
  }
  