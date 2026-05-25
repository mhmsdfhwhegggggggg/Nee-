import { Router } from "express";
import { getOrCreateConversation, processMessage } from "../../lib/chatHelper";

const router = Router();

const VERIFY_TOKEN = process.env.WEBHOOK_VERIFY_TOKEN || "almossah_nassir_2024";
const WA_TOKEN = () => process.env.WHATSAPP_ACCESS_TOKEN || "";
const PHONE_ID = () => process.env.WHATSAPP_PHONE_NUMBER_ID || "";
const GRAPH = "https://graph.facebook.com/v19.0";

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

  if (msg.type === "text") {
    const text = (msg.text as Record<string, string>)?.body || "";
    if (!text) return;

    const isGreeting = GREETINGS.some((g) => text.toLowerCase().includes(g)) || text.length < 6;

    if (isGreeting) {
      await sendWAMainMenu(from, token, phoneId);
      return;
    }

    const interactiveReply = (msg.interactive as Record<string, unknown>)?.list_reply as Record<string, string> | undefined
      || (msg.interactive as Record<string, unknown>)?.button_reply as Record<string, string> | undefined;

    if (interactiveReply?.id) {
      await handleMenuAction(from, interactiveReply.id, token, phoneId);
      return;
    }

    const convo = await getOrCreateConversation("whatsapp", from);
    const reply = await processMessage(convo.id, text);
    await sendWAText(from, reply, token, phoneId);
    await sendWAButtons(from, token, phoneId, "هل تريد شيئاً آخر؟", [
      { id: "menu", title: "🏠 القائمة الرئيسية" },
      { id: "register", title: "📝 سجّل الآن" },
      { id: "contact", title: "📞 تواصل معنا" },
    ]);
  }

  if (msg.type === "interactive") {
    const interactive = msg.interactive as Record<string, unknown>;
    const listReply = (interactive?.list_reply as Record<string, string>) || {};
    const btnReply = (interactive?.button_reply as Record<string, string>) || {};
    const actionId = listReply.id || btnReply.id;
    if (actionId) await handleMenuAction(from, actionId, token, phoneId);
  }
}

const MENU_RESPONSES: Record<string, string> = {
  grants: `🎓 *المنح الدراسية الكاملة*

أكثر من *15,000 طالب* أثقوا بنا وحققوا أحلامهم!

✅ تغطية كاملة للرسوم الدراسية
✅ 35+ جامعة ومعهد شريك
✅ للمتفوقين والمحتاجين

🔥 الأماكن محدودة — سجّل الآن!
🌐 almossah-website.vercel.app/register`,

  discounts: `📚 *التخفيضات الجامعية — حتى 70%*

فرصة لن تتكرر كثيراً:
✅ 35+ جامعة شريكة
✅ طب، هندسة، أعمال، تقنية وأكثر
✅ شراكات حكومية وخاصة موثوقة

🌐 almossah-website.vercel.app/register`,

  insurance: `🏥 *التأمين الصحي الشامل*

حماية حقيقية لك ولأسرتك:
✅ أفضل المستشفيات
✅ فحوصات ومختبرات مدعومة
✅ باقات مرنة

🌐 almossah-website.vercel.app/training-register`,

  training: `💡 *الدورات التدريبية المعتمدة*

✅ لغة إنجليزية وحاسوب
✅ مهارات سوق العمل
✅ شهادات معتمدة

🌐 almossah-website.vercel.app/training-register`,

  register: `📝 *سجّل الآن — الخطوة الأولى نحو مستقبلك*

🎓 التسجيل الدراسي:
almossah-website.vercel.app/register

💡 الدورات والتأمين:
almossah-website.vercel.app/training-register

⏰ أوقات الدوام: السبت-الخميس 8ص-4م`,

  contact: `📞 *معلومات التواصل*

🏛 المؤسسة الوطنية للتنمية الشاملة
📍 أمانة العاصمة، شارع الزبيري، صنعاء
⏰ السبت-الخميس: 8:00ص - 4:00م
🌐 almossah-website.vercel.app`,
};

async function handleMenuAction(from: string, actionId: string, token: string, phoneId: string) {
  if (actionId === "menu") { await sendWAMainMenu(from, token, phoneId); return; }
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

async function sendWAMainMenu(to: string, token: string, phoneId: string) {
  return sendWAMessage(to, token, phoneId, {
    type: "interactive",
    interactive: {
      type: "list",
      header: { type: "text", text: "🏛 المؤسسة الوطنية للتنمية الشاملة" },
      body: { text: "أهلاً! أنا ناصر، مستشارك الأكاديمي الذكي 👋\nاختر ما يهمك:" },
      footer: { text: "نبني الإنسان لنعمر الأوطان" },
      action: {
        button: "عرض الخيارات",
        sections: [
          {
            title: "الخدمات التعليمية",
            rows: [
              { id: "grants", title: "🎓 المنح الدراسية", description: "منح كاملة للمتميزين" },
              { id: "discounts", title: "📚 التخفيضات الجامعية", description: "خصومات تصل إلى 70%" },
              { id: "training", title: "💡 الدورات التدريبية", description: "لغة إنجليزية وحاسوب" },
            ],
          },
          {
            title: "الخدمات الأخرى",
            rows: [
              { id: "insurance", title: "🏥 التأمين الصحي", description: "حماية لك ولأسرتك" },
              { id: "register", title: "📝 سجّل الآن", description: "ابدأ رحلتك اليوم" },
              { id: "contact", title: "📞 تواصل معنا", description: "عناوين وأوقات الدوام" },
            ],
          },
        ],
      },
    },
  });
}

async function sendWAText(to: string, text: string, token: string, phoneId: string) {
  return sendWAMessage(to, token, phoneId, { type: "text", text: { body: text, preview_url: false } });
}

async function sendWAButtons(to: string, token: string, phoneId: string, bodyText: string, buttons: Array<{ id: string; title: string }>) {
  return sendWAMessage(to, token, phoneId, {
    type: "interactive",
    interactive: {
      type: "button",
      body: { text: bodyText },
      action: { buttons: buttons.map((b) => ({ type: "reply", reply: { id: b.id, title: b.title } })) },
    },
  });
}

async function sendWAMessage(to: string, token: string, phoneId: string, payload: object) {
  try {
    await fetch(`${GRAPH}/${phoneId}/messages`, {
      method: "POST",
      headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
      body: JSON.stringify({ messaging_product: "whatsapp", recipient_type: "individual", to, ...payload }),
    });
  } catch {}
}

export default router;
