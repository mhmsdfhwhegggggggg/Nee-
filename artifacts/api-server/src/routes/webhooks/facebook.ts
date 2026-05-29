import { Router } from "express";
import { getOrCreateConversation, processMessageFull } from "../../lib/chatHelper";
import { db, chatConversations, chatMessages } from "@workspace/db";
import { eq } from "drizzle-orm";

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

const MENU_TEXT = `🏛 المؤسسة الوطنية للتنمية الشاملة\nأنا ناصر، مستشارك الأكاديمي الذكي 👋\n\nأخبرني بتخصصك ومعدلك وسأجد لك أفضل فرصة جامعية!`;

const QUICK_REPLIES = [
  { content_type: "text", title: "🎓 المنح الدراسية", payload: "grants" },
  { content_type: "text", title: "📚 التخفيضات", payload: "discounts" },
  { content_type: "text", title: "🏥 التأمين الصحي", payload: "insurance" },
  { content_type: "text", title: "💡 الدورات", payload: "training" },
  { content_type: "text", title: "📝 سجّل الآن", payload: "register" },
  { content_type: "text", title: "📞 تواصل معنا", payload: "contact" },
];

const MENU_RESPONSES: Record<string, string> = {
  grants: `🏆 المنح الدراسية الكاملة\n\nأكثر من 15,000 طالب حققوا أحلامهم معنا!\n✅ تغطية كاملة للرسوم للمتميزين والمحتاجين\n✅ 35+ جامعة شريكة\n\n💡 اكتب اسمك الكامل وتخصصك وسأسجّلك مباشرة!`,
  discounts: `📚 التخفيضات الجامعية الحصرية\n\n✅ خصومات استثنائية على أفضل الجامعات\n✅ طب | هندسة | إدارة | تقنية وأكثر\n\n💬 أخبرني بتخصصك ومعدلك وسأجد لك أفضل خيار!`,
  insurance: `🏥 التأمين الصحي الشامل\n\n✅ أفضل المستشفيات في اليمن\n✅ فحوصات ومختبرات مدعومة\n✅ باقات للفرد والأسرة\n\n🌐 almossah-website.vercel.app/training-register`,
  training: `💡 الدورات التدريبية المعتمدة\n\n✅ لغة إنجليزية | حاسوب | مهارات سوق العمل\n✅ شهادات معتمدة دولياً\n\n🌐 almossah-website.vercel.app/training-register`,
  register: `📝 التسجيل الذكي عبر ناصر\n\nبدون زيارة الموقع! فقط أرسل لي:\n1️⃣ اسمك الكامل\n2️⃣ رقم هاتفك\n3️⃣ معدلك في الثانوية\n4️⃣ التخصص المطلوب\n\nوسأكمل تسجيلك فوراً! 🚀`,
  contact: `📞 معلومات التواصل\n\n🏛 المؤسسة الوطنية للتنمية الشاملة\n📍 صنعاء — جولة المصباحي، اتجاه ريماس، عمارة النزيلي\n⏰ السبت-الخميس: 8:00ص - 4:00م\n🌐 almossah-website.vercel.app`,
};

async function handleFBEvent(event: Record<string, unknown>, platform: string) {
  const senderId = (event.sender as Record<string, string>)?.id;
  if (!senderId) return;
  const token = platform === "instagram" ? IG_TOKEN() : FB_TOKEN();
  if (!token) return;

  // Quick reply payload
  const quickReplyPayload = (event.message as Record<string, unknown>)?.quick_reply as Record<string, string> | undefined;
  if (quickReplyPayload?.payload) {
    const payload = quickReplyPayload.payload;
    if (payload === "menu") {
      await sendFBQuickReplies(senderId, MENU_TEXT, QUICK_REPLIES, token);
      return;
    }
    if (payload === "ai_chat") {
      await sendFBText(senderId, "💬 تفضل، اكتب سؤالك وسأجيبك فوراً:", token);
      return;
    }
    const resp = MENU_RESPONSES[payload];
    if (resp) {
      await sendFBText(senderId, resp, token);
      await sendFBQuickReplies(senderId, "ماذا تريد الآن؟", [
        { content_type: "text", title: "🏠 القائمة", payload: "menu" },
        { content_type: "text", title: "📝 سجّل الآن", payload: "register" },
        { content_type: "text", title: "💬 اسأل ناصر", payload: "ai_chat" },
      ], token);
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

  // Get or create conversation
  const convo = await getOrCreateConversation(platform, senderId);

  // Phase 4: If admin has taken over, silently save message — admin will reply from dashboard
  if (convo.adminTakeover) {
    await db.insert(chatMessages).values({ conversationId: convo.id, role: "user", content: text });
    await db.update(chatConversations).set({ updatedAt: new Date() }).where(eq(chatConversations.id, convo.id));
    await sendFBText(
      senderId,
      "💬 تم استلام رسالتك وسيرد عليك أحد مستشارينا قريباً. 👨‍💼",
      token,
    );
    return;
  }

  // AI conversation via unified master prompt
  const platformLabel = platform === "instagram" ? "انستقرام" : "فيسبوك";
  const { reply, registrationId } = await processMessageFull(convo.id, text, platformLabel);

  if (reply !== "__admin_takeover__") {
    await sendFBText(senderId, reply, token);
  }

  // If auto-registered, send success message
  if (registrationId) {
    await sendFBText(
      senderId,
      `✅ تم تسجيلك بنجاح!\n\n📋 رقم طلبك: #${registrationId}\n\nسيتواصل معك فريق المؤسسة قريباً. بالتوفيق! 🌟`,
      token,
    );
  }

  if (reply !== "__admin_takeover__") {
    await sendFBQuickReplies(senderId, "هل تريد شيئاً آخر؟", [
      { content_type: "text", title: "🏠 القائمة", payload: "menu" },
      { content_type: "text", title: "📝 سجّل الآن", payload: "register" },
      { content_type: "text", title: "📞 تواصل", payload: "contact" },
    ], token);
  }
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
