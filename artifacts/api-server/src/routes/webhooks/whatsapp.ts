import { Router } from "express";
import { getOrCreateConversation, processMessageFull } from "../../lib/chatHelper";
import { sendWAText, sendWAButtons, sendWAMainMenu } from "../../lib/whatsappSender";

const router = Router();
const VERIFY_TOKEN = process.env.WEBHOOK_VERIFY_TOKEN || "almossah_nassir_2024";
const WA_TOKEN = () => process.env.WHATSAPP_ACCESS_TOKEN || "";
const PHONE_ID = () => process.env.WHATSAPP_PHONE_NUMBER_ID || "";

router.get("/nassir/webhooks/whatsapp", (req, res) => {
  const mode = req.query["hub.mode"];
  const token = req.query["hub.verify_token"];
  const challenge = req.query["hub.challenge"];
  if (mode === "subscribe" && token === VERIFY_TOKEN) {
    res.status(200).send(challenge);
  } else {
    res.status(403).json({ error: "Verify token mismatch" });
  }
});

router.post("/nassir/webhooks/whatsapp", async (req, res) => {
  res.sendStatus(200);
  try {
    const body = req.body as Record<string, unknown>;
    if (body.object !== "whatsapp_business_account") return;

    for (const entry of (body.entry as Record<string, unknown>[]) || []) {
      for (const change of (entry.changes as Record<string, unknown>[]) || []) {
        const value = change.value as Record<string, unknown>;
        if (!value?.messages) continue;

        const token = WA_TOKEN();
        const phoneId = PHONE_ID();
        if (!token || !phoneId) continue;

        for (const msg of (value.messages as Record<string, unknown>[]) || []) {
          await handleWAMessage(msg, token, phoneId);
        }
      }
    }
  } catch {}
});

const GREETINGS = ["مرحبا", "مرحباً", "هلا", "السلام", "اهلا", "ابدأ", "start", "hi", "hello", "صباح", "مساء", "menu", "قائمة"];

async function handleWAMessage(msg: Record<string, unknown>, token: string, phoneId: string) {
  const from = msg.from as string;
  if (!from) return;

  // Interactive button/list reply
  if (msg.type === "interactive") {
    const interactive = msg.interactive as Record<string, unknown>;
    const listReply = (interactive?.list_reply as Record<string, string>) || {};
    const btnReply = (interactive?.button_reply as Record<string, string>) || {};
    const actionId = listReply.id || btnReply.id;
    if (actionId) await handleMenuAction(from, actionId, token, phoneId);
    return;
  }

  if (msg.type !== "text") return;

  const text = ((msg.text as Record<string, string>)?.body || "").trim();
  if (!text) return;

  const isGreeting = GREETINGS.some((g) => text.toLowerCase().includes(g)) || text.length < 6;

  if (isGreeting) {
    await sendWAMainMenu(from, token, phoneId);
    return;
  }

  // Check for menu action from text
  const interactiveReply = (msg.interactive as Record<string, unknown>)?.list_reply as Record<string, string> | undefined
    || (msg.interactive as Record<string, unknown>)?.button_reply as Record<string, string> | undefined;
  if (interactiveReply?.id) {
    await handleMenuAction(from, interactiveReply.id, token, phoneId);
    return;
  }

  // AI conversation via unified master prompt
  const convo = await getOrCreateConversation("whatsapp", from);
  const { reply, registrationId } = await processMessageFull(convo.id, text, "واتساب");

  await sendWAText(from, reply, token, phoneId);

  // If auto-registered, send success message
  if (registrationId) {
    await sendWAText(
      from,
      `✅ *تم تسجيلك بنجاح!*\n\n📋 رقم طلبك: *#${registrationId}*\n\nسيتواصل معك فريق المؤسسة قريباً. بالتوفيق! 🌟`,
      token,
      phoneId,
    );
  }

  await sendWAButtons(from, token, phoneId, "هل تريد شيئاً آخر؟", [
    { id: "menu", title: "🏠 القائمة الرئيسية" },
    { id: "register", title: "📝 سجّل الآن" },
    { id: "contact", title: "📞 تواصل معنا" },
  ]);
}

async function handleMenuAction(from: string, actionId: string, token: string, phoneId: string) {
  if (actionId === "menu") { await sendWAMainMenu(from, token, phoneId); return; }

  const MENU_RESPONSES: Record<string, string> = {
    grants: `🏆 *المنح الدراسية الكاملة*\n\nأكثر من *15,000 طالب* حققوا أحلامهم معنا!\n\n✅ تغطية كاملة للرسوم للمتميزين والمحتاجين\n✅ 35+ جامعة شريكة\n\n💡 اكتب اسمك الكامل وتخصصك المطلوب وسأسجّلك مباشرة هنا!`,
    discounts: `📚 *التخفيضات الجامعية الحصرية*\n\n✅ خصومات استثنائية على أفضل الجامعات\n✅ طب | هندسة | إدارة | تقنية | وأكثر\n\n💬 أخبرني بتخصصك ومعدلك وسأجد لك أفضل خيار بأقل سعر!`,
    insurance: `🏥 *التأمين الصحي الشامل*\n\nحماية حقيقية لك ولأسرتك:\n✅ أفضل المستشفيات\n✅ فحوصات ومختبرات مدعومة\n✅ باقات مرنة\n\n🌐 almossah-website.vercel.app/training-register`,
    training: `💡 *الدورات التدريبية المعتمدة*\n\n✅ لغة إنجليزية وحاسوب\n✅ مهارات سوق العمل\n✅ شهادات معتمدة\n\n🌐 almossah-website.vercel.app/training-register`,
    register: `📝 *التسجيل الذكي عبر ناصر*\n\nالأسرع والأسهل — بدون زيارة الموقع!\n\nفقط أرسل لي:\n1️⃣ اسمك الكامل\n2️⃣ رقم هاتفك\n3️⃣ معدلك في الثانوية\n4️⃣ التخصص الذي تريده\n\nوسأكمل التسجيل فوراً! 🚀`,
    contact: `📞 *معلومات التواصل*\n\n🏛 المؤسسة الوطنية للتنمية الشاملة\n📍 صنعاء — جولة المصباحي، اتجاه ريماس، عمارة النزيلي، جوار حلمي للعسل اليمني\n⏰ السبت-الخميس: 8:00ص - 4:00م\n🌐 almossah-website.vercel.app`,
  };

  const resp = MENU_RESPONSES[actionId];
  if (resp) {
    await sendWAText(from, resp, token, phoneId);
    await sendWAButtons(from, token, phoneId, "ماذا تريد الآن؟", [
      { id: "menu", title: "🏠 القائمة الرئيسية" },
      { id: "register", title: "📝 سجّل الآن" },
      { id: "contact", title: "📞 تواصل معنا" },
    ]);
  }
}

export default router;
