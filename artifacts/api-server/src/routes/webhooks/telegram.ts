import { Router } from "express";
import { getOrCreateConversation, processMessage } from "../../lib/chatHelper";

const router = Router();
const TG_TOKEN = () => process.env.TELEGRAM_BOT_TOKEN || "";
const TGAPI = () => `https://api.telegram.org/bot${TG_TOKEN()}`;

router.post("/nassir/webhooks/telegram", async (req, res) => {
  res.sendStatus(200);
  if (!TG_TOKEN()) return;

  try {
    const update = req.body as Record<string, unknown>;
    const message = (update.message || update.edited_message) as Record<string, unknown> | undefined;
    if (!message) return;

    const chatId = (message.chat as Record<string, unknown>)?.id as number;
    const text = (message.text as string) || "";
    if (!chatId || !text) return;

    const userId = String((message.from as Record<string, unknown>)?.id || chatId);

    const greetings = ["/start", "مرحبا", "مرحباً", "هلا", "اهلا", "ابدأ", "hi", "hello"];
    const isGreeting = greetings.some((g) => text.toLowerCase().includes(g));

    if (isGreeting || text === "/start") {
      await sendTGMenu(chatId);
      return;
    }

    if (text === "/register") {
      await sendTGText(chatId, `📝 *سجّل الآن في المؤسسة الوطنية*\n\nزر موقعنا للتسجيل:\n🎓 التسجيل الدراسي: almossah-website.vercel.app/register\n💡 الدورات والتأمين: almossah-website.vercel.app/training-register`);
      return;
    }

    if (text === "/services") {
      await sendTGText(chatId, `🏛 *خدماتنا*\n\n🎓 المنح الدراسية الكاملة\n📚 التخفيضات الجامعية حتى 70%\n🏥 التأمين الصحي الشامل\n💡 الدورات التدريبية المعتمدة\n\nاكتب سؤالك وسأجيبك!`);
      return;
    }

    const convo = await getOrCreateConversation("telegram", userId);
    const reply = await processMessage(convo.id, text);
    await sendTGText(chatId, reply);

    await sendTGInlineKeyboard(chatId, "هل تريد شيئاً آخر؟", [
      [{ text: "🎓 المنح الدراسية", callback_data: "grants" }, { text: "📝 سجّل الآن", callback_data: "register" }],
      [{ text: "📞 تواصل معنا", callback_data: "contact" }, { text: "🏠 القائمة", callback_data: "menu" }],
    ]);
  } catch {}
});

router.post("/nassir/webhooks/telegram/callback", async (req, res) => {
  res.sendStatus(200);
  if (!TG_TOKEN()) return;

  try {
    const update = req.body as Record<string, unknown>;
    const callbackQuery = update.callback_query as Record<string, unknown> | undefined;
    if (!callbackQuery) return;

    const chatId = ((callbackQuery.message as Record<string, unknown>)?.chat as Record<string, unknown>)?.id as number;
    const data = callbackQuery.data as string;
    const callbackId = callbackQuery.id as string;

    await fetch(`${TGAPI()}/answerCallbackQuery`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ callback_query_id: callbackId }),
    });

    if (data === "menu") { await sendTGMenu(chatId); return; }

    const RESPONSES: Record<string, string> = {
      grants: `🎓 *المنح الدراسية الكاملة*\n\nأكثر من 15,000 طالب وثقوا بنا!\n✅ تغطية كاملة\n✅ 35+ جامعة شريكة\n\n🔥 سجّل الآن: almossah-website.vercel.app/register`,
      discounts: `📚 *التخفيضات — حتى 70%*\n\n✅ 35+ جامعة\n✅ تخصصات متنوعة\n\n🌐 almossah-website.vercel.app/register`,
      insurance: `🏥 *التأمين الصحي*\n\n✅ أفضل المستشفيات\n✅ باقات للفرد والأسرة\n\n🌐 almossah-website.vercel.app/training-register`,
      training: `💡 *الدورات التدريبية*\n\n✅ لغة إنجليزية وحاسوب\n✅ شهادات معتمدة\n\n🌐 almossah-website.vercel.app/training-register`,
      register: `📝 *سجّل الآن*\n\n🎓 almossah-website.vercel.app/register\n💡 almossah-website.vercel.app/training-register`,
      contact: `📞 *تواصل معنا*\n\n📍 أمانة العاصمة، شارع الزبيري\n⏰ السبت-الخميس: 8:00ص - 4:00م`,
    };

    const resp = RESPONSES[data];
    if (resp) await sendTGText(chatId, resp);
  } catch {}
});

async function sendTGMenu(chatId: number) {
  await sendTGInlineKeyboard(chatId,
    `🏛 *المؤسسة الوطنية للتنمية الشاملة*\nأنا ناصر، مستشارك الأكاديمي الذكي 👋\n\nاختر ما يهمك:`,
    [
      [{ text: "🎓 المنح الدراسية", callback_data: "grants" }, { text: "📚 التخفيضات", callback_data: "discounts" }],
      [{ text: "🏥 التأمين الصحي", callback_data: "insurance" }, { text: "💡 الدورات", callback_data: "training" }],
      [{ text: "📝 سجّل الآن", callback_data: "register" }, { text: "📞 تواصل معنا", callback_data: "contact" }],
    ]
  );
}

async function sendTGText(chatId: number, text: string) {
  await fetch(`${TGAPI()}/sendMessage`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ chat_id: chatId, text, parse_mode: "Markdown" }),
  });
}

async function sendTGInlineKeyboard(chatId: number, text: string, keyboard: Array<Array<{ text: string; callback_data: string }>>) {
  await fetch(`${TGAPI()}/sendMessage`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      chat_id: chatId,
      text,
      parse_mode: "Markdown",
      reply_markup: { inline_keyboard: keyboard },
    }),
  });
}

export default router;
