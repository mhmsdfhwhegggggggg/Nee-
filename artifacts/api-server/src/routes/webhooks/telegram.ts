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

    // Handle callback_query (button clicks) — must be in the SAME route
    const callbackQuery = update.callback_query as Record<string, unknown> | undefined;
    if (callbackQuery) {
      const chatId = ((callbackQuery.message as Record<string, unknown>)?.chat as Record<string, unknown>)?.id as number;
      const data = (callbackQuery.data as string) || "";
      const callbackId = callbackQuery.id as string;

      await fetch(`${TGAPI()}/answerCallbackQuery`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ callback_query_id: callbackId }),
      }).catch(() => {});

      if (data === "menu") { await sendTGMenu(chatId); return; }
      if (data === "chat") {
        await sendTGText(chatId, "💬 اكتب سؤالك مباشرة وسأجيبك فوراً!\n\nمثال: *ما الجامعة المناسبة لمعدل 85%؟*");
        return;
      }

      const STATIC: Record<string, string> = {
        grants: `🎓 *المنح الدراسية الكاملة*\n\n✅ تغطية كاملة للرسوم للمتميزين والمحتاجين\n✅ أكثر من 15,000 طالب مستفيد\n✅ 35+ جامعة شريكة\n✅ متاحة في 8 محافظات\n\n📝 للتسجيل: almossah\\-website\\.vercel\\.app/register`,
        discounts: `📚 *التخفيضات الجامعية*\n\n✅ خصومات من 30% إلى 70%\n✅ 16 جامعة شريكة في صنعاء\n✅ جميع التخصصات: طب، هندسة، إدارة، قانون...\n\n💬 اكتب تخصصك ومعدلك وسأجد لك أفضل خيار!`,
        insurance: `🏥 *التأمين الصحي الشامل*\n\n✅ شبكة واسعة من أفضل المستشفيات\n✅ صيدليات ومختبرات معتمدة\n✅ باقات للفرد والأسرة بأسعار مناسبة\n\n🌐 almossah\\-website\\.vercel\\.app/training\\-register`,
        training: `💡 *الدورات التدريبية المعتمدة*\n\n✅ اللغة الإنجليزية جميع المستويات\n✅ مهارات الحاسوب والتقنية\n✅ مهارات سوق العمل والتوظيف\n✅ شهادات معتمدة من جهات موثوقة\n\n🌐 almossah\\-website\\.vercel\\.app/training\\-register`,
        register: `📝 *سجّل الآن*\n\n🎓 *تسجيل جامعي:*\nalmossah\\-website\\.vercel\\.app/register\n\n💡 *دورات وتأمين:*\nalmossah\\-website\\.vercel\\.app/training\\-register\n\n💬 أو اكتب *"سجّلني"* وسأساعدك خطوة بخطوة!`,
        contact: `📞 *تواصل معنا*\n\n📍 أمانة العاصمة، شارع الزبيري، صنعاء\n⏰ السبت\\-الخميس: 8:00ص \\- 4:00م\n\n🌐 almossah\\-website\\.vercel\\.app`,
      };

      if (STATIC[data]) {
        await sendTGText(chatId, STATIC[data], true);
        await sendTGInlineKeyboard(chatId, "هل تريد شيئاً آخر؟", [
          [{ text: "🏠 القائمة الرئيسية", callback_data: "menu" }, { text: "💬 اسأل ناصر", callback_data: "chat" }],
        ]);
      }
      return;
    }

    // Handle regular messages
    const message = (update.message || update.edited_message) as Record<string, unknown> | undefined;
    if (!message) return;

    const chatId = (message.chat as Record<string, unknown>)?.id as number;
    const text = ((message.text as string) || "").trim();
    if (!chatId || !text) return;

    const userId = String((message.from as Record<string, unknown>)?.id || chatId);
    const firstName = ((message.from as Record<string, unknown>)?.first_name as string) || "";

    // Commands
    if (text === "/start") {
      await sendTGMenu(chatId, firstName);
      return;
    }

    if (text === "/register") {
      await sendTGText(chatId, `📝 *سجّل في المؤسسة الوطنية*\n\nيمكنك التسجيل عبر:\n🎓 almossah\\-website\\.vercel\\.app/register\n\nأو أخبرني بتخصصك ومعدلك وسأرشدك! 😊`, true);
      return;
    }

    if (text === "/universities") {
      await sendTGText(chatId, `🏛 *الجامعات الشريكة \\(16 جامعة\\)*\n\n1\\. الجامعة اللبنانية الدولية — خصم 40\\-60%\n2\\. جامعة العلوم والتكنولوجيا — خصم 50%\n3\\. جامعة سبأ — خصم 35\\-50%\n4\\. جامعة الملكة أروى — خصم 30\\-45%\n5\\. جامعة الأندلس — خصم 40\\-55%\n6\\. جامعة الحكمة — خصم 30\\-40%\n7\\. جامعة دار السلام — خصم 30\\-50%\n8\\. جامعة الناصر — خصم 35\\-50%\n9\\. جامعة المستقبل — خصم 40\\-60%\n10\\. جامعة الجيل الجديد — خصم 35\\-50%\n11\\. جامعة آزال — خصم 40\\-55%\n12\\. جامعة الإيمان — خصم 30\\-45%\n13\\. جامعة المعرفة والعلوم — خصم 35\\-50%\n14\\. جامعة الوطن — خصم 30\\-45%\n15\\. جامعة القرآن الكريم — خصم 30\\-50%\n16\\. جامعة الرازي — خصم 40\\-60%\n\n💬 اكتب تخصصك لأوجّهك للأنسب!`, true);
      return;
    }

    if (text === "/contact") {
      await sendTGText(chatId, `📞 *تواصل معنا*\n\n📍 أمانة العاصمة، شارع الزبيري، صنعاء\n⏰ السبت\\-الخميس: 8:00ص \\- 4:00م\n\n🌐 almossah\\-website\\.vercel\\.app`, true);
      return;
    }

    // Send typing indicator while processing
    await fetch(`${TGAPI()}/sendChatAction`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ chat_id: chatId, action: "typing" }),
    }).catch(() => {});

    // Process with AI
    const convo = await getOrCreateConversation("telegram", userId);
    const reply = await processMessage(convo.id, text);

    // Clean reply for Telegram (remove markdown that may break)
    const cleanReply = reply
      .replace(/[_*[\]()~`>#+=|{}.!-]/g, (c) => `\\${c}`)
      .slice(0, 4000);

    await sendTGText(chatId, cleanReply, true);

    // Quick reply buttons after AI response
    await sendTGInlineKeyboard(chatId, "\_", [
      [{ text: "🎓 المنح", callback_data: "grants" }, { text: "📚 التخفيضات", callback_data: "discounts" }],
      [{ text: "📝 سجّل الآن", callback_data: "register" }, { text: "🏠 القائمة", callback_data: "menu" }],
    ]);
  } catch (err) {
    // Log error silently — do not crash
    console.error("[Telegram webhook error]", err instanceof Error ? err.message : String(err));
  }
});

async function sendTGMenu(chatId: number, firstName?: string) {
  const name = firstName ? ` ${firstName}` : "";
  await sendTGInlineKeyboard(
    chatId,
    `🏛 *المؤسسة الوطنية للتنمية الشاملة*\nأهلاً${name}\\! أنا ناصر، مستشارك الأكاديمي الذكي 👋\n\nيمكنني مساعدتك في:\n• اختيار الجامعة والتخصص المناسب\n• معرفة التخفيضات والمنح المتاحة\n• التسجيل خطوة بخطوة\n\n*اختر ما يهمك أو اكتب سؤالك مباشرة:*`,
    [
      [{ text: "🎓 المنح الدراسية", callback_data: "grants" }, { text: "📚 التخفيضات", callback_data: "discounts" }],
      [{ text: "🏥 التأمين الصحي", callback_data: "insurance" }, { text: "💡 الدورات", callback_data: "training" }],
      [{ text: "📝 سجّل الآن", callback_data: "register" }, { text: "📞 تواصل معنا", callback_data: "contact" }],
      [{ text: "💬 اسأل ناصر مباشرة", callback_data: "chat" }],
    ],
    true
  );
}

async function sendTGText(chatId: number, text: string, markdownV2 = false) {
  const body: Record<string, unknown> = { chat_id: chatId, text };
  if (markdownV2) body.parse_mode = "MarkdownV2";
  await fetch(`${TGAPI()}/sendMessage`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  }).catch(() => {});
}

async function sendTGInlineKeyboard(
  chatId: number,
  text: string,
  keyboard: Array<Array<{ text: string; callback_data: string }>>,
  markdownV2 = false
) {
  const body: Record<string, unknown> = {
    chat_id: chatId,
    text: text || " ",
    reply_markup: { inline_keyboard: keyboard },
  };
  if (markdownV2) body.parse_mode = "MarkdownV2";
  await fetch(`${TGAPI()}/sendMessage`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  }).catch(() => {});
}

export default router;
