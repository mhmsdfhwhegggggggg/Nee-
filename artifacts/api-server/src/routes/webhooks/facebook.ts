import { Router } from "express";
  import { getOrCreateConversation, processMessage } from "../../lib/chatHelper";

  const router = Router();
  const VERIFY_TOKEN = process.env.WEBHOOK_VERIFY_TOKEN || "almossah_nassir_2024";
  const FB_TOKEN = () => process.env.FACEBOOK_PAGE_ACCESS_TOKEN || "";
  const IG_TOKEN = () => process.env.INSTAGRAM_ACCESS_TOKEN || "";

  // ── Verification ─────────────────────────────────────────────────────────────
  router.get("/nassir/webhooks/facebook", (req, res) => {
    const mode = req.query["hub.mode"];
    const token = req.query["hub.verify_token"];
    const challenge = req.query["hub.challenge"];
    if (mode === "subscribe" && token === VERIFY_TOKEN) {
      res.status(200).send(challenge);
    } else {
      res.status(403).json({ error: "Verify token mismatch" });
    }
  });

  // ── Incoming messages ────────────────────────────────────────────────────────
  router.post("/nassir/webhooks/facebook", async (req, res) => {
    res.sendStatus(200);
    try {
      const body = req.body;

      if (body.object === "page") {
        for (const entry of body.entry || []) {
          for (const event of entry.messaging || []) {
            await handleFBEvent(event, "facebook");
          }
        }
      }

      if (body.object === "instagram") {
        for (const entry of body.entry || []) {
          for (const event of entry.messaging || []) {
            await handleFBEvent(event, "instagram");
          }
        }
      }
    } catch (e) {
      console.error("Facebook webhook error:", e);
    }
  });

  const MAIN_MENU_TEXT = `🏛 المؤسسة الوطنية للتنمية الشاملة
  أنا ناصر، مساعدك الذكي 👋

  اختر ما يهمك:`;

  const FB_QUICK_REPLIES = [
    { content_type: "text", title: "🎓 المنح الدراسية", payload: "grants" },
    { content_type: "text", title: "🏥 التأمين الصحي", payload: "insurance" },
    { content_type: "text", title: "📚 التخفيضات", payload: "discounts" },
  ];

  const FB_QUICK_REPLIES_2 = [
    { content_type: "text", title: "💡 الدورات التدريبية", payload: "training" },
    { content_type: "text", title: "📝 التسجيل الآن", payload: "register" },
    { content_type: "text", title: "📞 تواصل معنا", payload: "contact" },
  ];

  const FB_MENU_RESPONSES: Record<string, string> = {
    grants: `🎓 *المنح الدراسية الكاملة*

  توفر المؤسسة منحاً دراسية كاملة للمتميزين والمحتاجين:
  ✅ تغطية كاملة للرسوم الدراسية
  ✅ أكثر من 35 جامعة ومعهد شريك
  ✅ إرشاد أكاديمي متخصص

  للتسجيل: almossah-website.vercel.app/register`,

    discounts: `📚 *التخفيضات الجامعية*

  خصومات حصرية تصل إلى 70%:
  ✅ شبكة من 35+ جامعة ومعهداً
  ✅ تخصصات متنوعة
  ✅ أسعار في متناول الجميع

  للتسجيل: almossah-website.vercel.app/register`,

    insurance: `🏥 *التأمين الصحي الشامل*

  بطاقة تأمين صحية لك ولأسرتك:
  ✅ أفضل المستشفيات في اليمن
  ✅ فحوصات وتحاليل مدعومة
  ✅ باقات مرنة للفرد والأسرة

  للتسجيل: almossah-website.vercel.app/training-register`,

    training: `💡 *الدورات التدريبية*

  دورات لغة إنجليزية، حاسوب، ومهارات:
  ✅ مدربون متخصصون
  ✅ شهادات معتمدة
  ✅ جداول مرنة

  للتسجيل: almossah-website.vercel.app/training-register`,

    register: `📝 *التسجيل في الخدمات*

  سجّل عبر موقعنا:
  🌐 almossah-website.vercel.app

  • التسجيل الدراسي: /register
  • الدورات والتأمين: /training-register

  ساعات العمل: السبت-الخميس 8ص-4م`,

    contact: `📞 *معلومات التواصل*

  📍 أمانة العاصمة، شارع الزبيري، صنعاء
  ⏰ السبت-الخميس: 8:00ص - 4:00م
  🌐 almossah-website.vercel.app`,
  };

  async function handleFBEvent(event: Record<string, unknown>, platform: string) {
    const senderId = (event.sender as Record<string, string>)?.id;
    if (!senderId) return;

    const token = platform === "instagram" ? IG_TOKEN() : FB_TOKEN();
    if (!token) return;

    // Handle quick reply
    const quickReplyPayload = (event.message as Record<string, unknown>)?.quick_reply as Record<string, string> | undefined;
    if (quickReplyPayload?.payload) {
      const resp = FB_MENU_RESPONSES[quickReplyPayload.payload];
      if (resp) {
        await sendFBText(senderId, resp, token);
        await sendFBQuickReplies(senderId, "ماذا تريد الآن؟", [
          { content_type: "text", title: "🏠 القائمة", payload: "menu" },
          { content_type: "text", title: "📝 التسجيل", payload: "register" },
          { content_type: "text", title: "💬 اسأل ناصر", payload: "ai_chat" },
        ], token);
        return;
      }
      if (quickReplyPayload.payload === "menu") {
        await sendFBQuickReplies(senderId, MAIN_MENU_TEXT, [...FB_QUICK_REPLIES, ...FB_QUICK_REPLIES_2], token);
        return;
      }
      if (quickReplyPayload.payload === "ai_chat") {
        await sendFBText(senderId, "💬 اكتب سؤالك وسأجيبك:", token);
        return;
      }
    }

    // Handle text
    const text = (event.message as Record<string, unknown>)?.text as string | undefined;
    if (!text) return;

    const menuTriggers = ["مرحبا", "مرحباً", "هلا", "السلام", "اهلا", "menu", "قائمة", "ابدأ", "start", "hi", "hello"];
    const isGreeting = menuTriggers.some((t) => text.toLowerCase().includes(t)) || text.length < 8;

    if (isGreeting) {
      await sendFBQuickReplies(senderId, MAIN_MENU_TEXT, [...FB_QUICK_REPLIES, ...FB_QUICK_REPLIES_2], token);
      return;
    }

    // AI response
    const convo = await getOrCreateConversation(platform, senderId);
    const reply = await processMessage(convo.id, text);
    await sendFBText(senderId, reply, token);
    await sendFBQuickReplies(senderId, "هل تريد شيئاً آخر؟", [
      { content_type: "text", title: "🏠 القائمة", payload: "menu" },
      { content_type: "text", title: "📝 التسجيل", payload: "register" },
      { content_type: "text", title: "📞 تواصل", payload: "contact" },
    ], token);
  }

  async function sendFBText(recipientId: string, text: string, token: string) {
    await fetch("https://graph.facebook.com/v19.0/me/messages", {
      method: "POST",
      headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
      body: JSON.stringify({ recipient: { id: recipientId }, message: { text } }),
    });
  }

  async function sendFBQuickReplies(
    recipientId: string,
    text: string,
    quickReplies: Array<{ content_type: string; title: string; payload: string }>,
    token: string,
  ) {
    await fetch("https://graph.facebook.com/v19.0/me/messages", {
      method: "POST",
      headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
      body: JSON.stringify({
        recipient: { id: recipientId },
        message: { text, quick_replies: quickReplies },
      }),
    });
  }

  export default router;
  