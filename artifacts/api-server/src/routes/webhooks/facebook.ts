import { Router } from "express";
import { getOrCreateConversation, processMessage } from "../../lib/chatHelper";

const router = Router();
const VERIFY_TOKEN = process.env.WEBHOOK_VERIFY_TOKEN || "almossah_nassir_2024";
const FB_TOKEN = () => process.env.FACEBOOK_PAGE_ACCESS_TOKEN || "";
const IG_TOKEN = () => process.env.INSTAGRAM_ACCESS_TOKEN || "";

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

router.post("/nassir/webhooks/facebook", async (req, res) => {
  res.sendStatus(200);
  try {
    const body = req.body as Record<string, unknown>;
    if (body.object === "page") {
      for (const entry of (body.entry as Record<string, unknown>[]) || []) {
        for (const event of (entry.messaging as Record<string, unknown>[]) || []) {
          await handleFBEvent(event, "facebook");
        }
      }
    }
    if (body.object === "instagram") {
      for (const entry of (body.entry as Record<string, unknown>[]) || []) {
        for (const event of (entry.messaging as Record<string, unknown>[]) || []) {
          await handleFBEvent(event, "instagram");
        }
      }
    }
  } catch {}
});

const MENU_TEXT = `🏛 *المؤسسة الوطنية للتنمية الشاملة*
أنا ناصر، مستشارك الأكاديمي الذكي 👋

ماذا يمكنني أن أفعل لك اليوم؟`;

const QUICK_REPLIES = [
  { content_type: "text", title: "🎓 المنح الدراسية", payload: "grants" },
  { content_type: "text", title: "📚 التخفيضات", payload: "discounts" },
  { content_type: "text", title: "🏥 التأمين الصحي", payload: "insurance" },
  { content_type: "text", title: "💡 الدورات", payload: "training" },
  { content_type: "text", title: "📝 سجّل الآن", payload: "register" },
  { content_type: "text", title: "📞 تواصل معنا", payload: "contact" },
];

const MENU_RESPONSES: Record<string, string> = {
  grants: `🎓 *المنح الدراسية الكاملة*

أكثر من *15,000 طالب* وثقوا بنا وحققوا أحلامهم الأكاديمية.

✅ تغطية كاملة للرسوم الدراسية
✅ أكثر من 35 جامعة ومعهد شريك
✅ إرشاد أكاديمي متخصص مجاني
✅ متاح للمتفوقين والمحتاجين

🔥 *الأماكن محدودة* — سجّل الآن قبل فوات الأوان!
🌐 almossah-website.vercel.app/register`,

  discounts: `📚 *التخفيضات الجامعية الحصرية*

خصومات تصل إلى *70%* على رسوم الجامعات:

✅ 35+ جامعة ومعهداً معتمداً
✅ تخصصات طب، هندسة، أعمال، تقنية
✅ شراكات حكومية وخاصة موثوقة

💡 *تخيّل توفير آلاف الدولارات* على تعليمك الجامعي — هذه الفرصة نادرة في ظل الظروف الحالية!
🌐 almossah-website.vercel.app/register`,

  insurance: `🏥 *التأمين الصحي الشامل*

حماية صحية لك ولأسرتك بأسعار ميسورة:

✅ أفضل المستشفيات في اليمن
✅ فحوصات ومختبرات مدعومة
✅ باقات للفرد والأسرة

🌐 almossah-website.vercel.app/training-register`,

  training: `💡 *الدورات التدريبية المعتمدة*

استثمر في مهاراتك اليوم — واحصد النتائج غداً:

✅ اللغة الإنجليزية (مستويات متعددة)
✅ الحاسوب وتقنية المعلومات
✅ مهارات سوق العمل
✅ شهادات معتمدة دولياً

🌐 almossah-website.vercel.app/training-register`,

  register: `📝 *ابدأ رحلتك الآن*

التسجيل أسهل مما تتخيل — دقيقة واحدة فقط:

🌐 *للتسجيل الدراسي:*
almossah-website.vercel.app/register

🌐 *للدورات والتأمين:*
almossah-website.vercel.app/training-register

⏰ ساعات العمل: السبت-الخميس 8ص-4م
📞 أو تحدث معي مباشرة وسأساعدك خطوة بخطوة!`,

  contact: `📞 *معلومات التواصل*

🏛 المؤسسة الوطنية للتنمية الشاملة
📍 أمانة العاصمة، شارع الزبيري، صنعاء
⏰ السبت-الخميس: 8:00ص - 4:00م
🌐 almossah-website.vercel.app`,
};

async function handleFBEvent(event: Record<string, unknown>, platform: string) {
  const senderId = (event.sender as Record<string, string>)?.id;
  if (!senderId) return;
  const token = platform === "instagram" ? IG_TOKEN() : FB_TOKEN();
  if (!token) return;

  const quickReplyPayload = (event.message as Record<string, unknown>)?.quick_reply as Record<string, string> | undefined;
  if (quickReplyPayload?.payload) {
    const resp = MENU_RESPONSES[quickReplyPayload.payload];
    if (resp) {
      await sendFBText(senderId, resp, token);
      await sendFBQuickReplies(senderId, "ماذا تريد الآن؟", [
        { content_type: "text", title: "🏠 القائمة", payload: "menu" },
        { content_type: "text", title: "📝 سجّل الآن", payload: "register" },
        { content_type: "text", title: "💬 اسأل ناصر", payload: "ai_chat" },
      ], token);
      return;
    }
    if (quickReplyPayload.payload === "menu") {
      await sendFBQuickReplies(senderId, MENU_TEXT, QUICK_REPLIES, token);
      return;
    }
    if (quickReplyPayload.payload === "ai_chat") {
      await sendFBText(senderId, "💬 تفضل، اكتب سؤالك وسأجيبك فوراً:", token);
      return;
    }
  }

  const text = (event.message as Record<string, unknown>)?.text as string | undefined;
  if (!text) return;

  const greetings = ["مرحبا", "مرحباً", "هلا", "السلام", "اهلا", "menu", "قائمة", "ابدأ", "start", "hi", "hello", "صباح", "مساء"];
  const isGreeting = greetings.some((t) => text.toLowerCase().includes(t)) || text.length < 6;

  if (isGreeting) {
    await sendFBQuickReplies(senderId, MENU_TEXT, QUICK_REPLIES, token);
    return;
  }

  const convo = await getOrCreateConversation(platform, senderId);
  const reply = await processMessage(convo.id, text);
  await sendFBText(senderId, reply, token);
  await sendFBQuickReplies(senderId, "هل تريد شيئاً آخر؟", [
    { content_type: "text", title: "🏠 القائمة", payload: "menu" },
    { content_type: "text", title: "📝 سجّل الآن", payload: "register" },
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
