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

    // ─── Handle callback_query (button clicks) ───────────────────────────────
    const callbackQuery = update.callback_query as Record<string, unknown> | undefined;
    if (callbackQuery) {
      const chatId = ((callbackQuery.message as Record<string, unknown>)?.chat as Record<string, unknown>)?.id as number;
      const data = (callbackQuery.data as string) || "";
      const callbackId = callbackQuery.id as string;

      await tgApi("answerCallbackQuery", { callback_query_id: callbackId });

      switch (data) {
        case "menu":
          await sendMenu(chatId);
          break;
        case "chat":
          await sendHtml(chatId, "💬 اكتب سؤالك مباشرة وسأجيبك فوراً!\n\nمثال: <i>ما الجامعة المناسبة لمعدل 85%؟</i>");
          break;
        case "grants":
          await sendHtml(chatId,
            "🎓 <b>المنح الدراسية الكاملة</b>\n\n" +
            "✅ تغطية كاملة للرسوم للمتميزين والمحتاجين\n" +
            "✅ أكثر من 15,000 طالب مستفيد\n" +
            "✅ 35+ جامعة شريكة\n" +
            "✅ متاحة في 8 محافظات\n\n" +
            "📝 للتسجيل: almossah-website.vercel.app/register"
          );
          await sendKeyboard(chatId, "هل تريد شيئاً آخر؟", mainKeyboard());
          break;
        case "discounts":
          await sendHtml(chatId,
            "📚 <b>التخفيضات الجامعية</b>\n\n" +
            "✅ خصومات من 30% إلى 70%\n" +
            "✅ 16 جامعة شريكة في صنعاء\n" +
            "✅ جميع التخصصات: طب، هندسة، إدارة، قانون...\n\n" +
            "💬 اكتب تخصصك ومعدلك وسأجد لك أفضل خيار!"
          );
          await sendKeyboard(chatId, "هل تريد شيئاً آخر؟", mainKeyboard());
          break;
        case "insurance":
          await sendHtml(chatId,
            "🏥 <b>التأمين الصحي الشامل</b>\n\n" +
            "✅ شبكة واسعة من أفضل المستشفيات\n" +
            "✅ صيدليات ومختبرات معتمدة\n" +
            "✅ باقات للفرد والأسرة بأسعار مناسبة\n\n" +
            "🌐 almossah-website.vercel.app/training-register"
          );
          await sendKeyboard(chatId, "هل تريد شيئاً آخر؟", mainKeyboard());
          break;
        case "training":
          await sendHtml(chatId,
            "💡 <b>الدورات التدريبية المعتمدة</b>\n\n" +
            "✅ اللغة الإنجليزية جميع المستويات\n" +
            "✅ مهارات الحاسوب والتقنية\n" +
            "✅ مهارات سوق العمل والتوظيف\n" +
            "✅ شهادات معتمدة من جهات موثوقة\n\n" +
            "🌐 almossah-website.vercel.app/training-register"
          );
          await sendKeyboard(chatId, "هل تريد شيئاً آخر؟", mainKeyboard());
          break;
        case "register":
          await sendHtml(chatId,
            "📝 <b>سجّل الآن</b>\n\n" +
            "🎓 <b>تسجيل جامعي:</b>\n" +
            "almossah-website.vercel.app/register\n\n" +
            "💡 <b>دورات وتأمين:</b>\n" +
            "almossah-website.vercel.app/training-register\n\n" +
            "💬 أو اكتب <b>سجّلني</b> وسأساعدك خطوة بخطوة!"
          );
          break;
        case "contact":
          await sendHtml(chatId,
            "📞 <b>تواصل معنا</b>\n\n" +
            "📍 أمانة العاصمة، شارع الزبيري، صنعاء\n" +
            "⏰ السبت-الخميس: 8:00ص - 4:00م\n\n" +
            "🌐 almossah-website.vercel.app"
          );
          break;
        case "universities":
          await sendUniversities(chatId);
          break;
      }
      return;
    }

    // ─── Handle regular messages ───────────────────────────────────────────────
    const message = (update.message || update.edited_message) as Record<string, unknown> | undefined;
    if (!message) return;

    const chatId = (message.chat as Record<string, unknown>)?.id as number;
    const text = ((message.text as string) || "").trim();
    if (!chatId || !text) return;

    const userId = String((message.from as Record<string, unknown>)?.id || chatId);
    const firstName = ((message.from as Record<string, unknown>)?.first_name as string) || "";

    // ─── Commands ─────────────────────────────────────────────────────────────
    if (text === "/start") {
      await sendMenu(chatId, firstName);
      return;
    }

    if (text === "/register") {
      await sendHtml(chatId,
        "📝 <b>سجّل في المؤسسة الوطنية</b>\n\n" +
        "يمكنك التسجيل عبر:\n" +
        "🎓 almossah-website.vercel.app/register\n\n" +
        "أو أخبرني بتخصصك ومعدلك وسأرشدك!"
      );
      return;
    }

    if (text === "/universities") {
      await sendUniversities(chatId);
      return;
    }

    if (text === "/contact") {
      await sendHtml(chatId,
        "📞 <b>تواصل معنا</b>\n\n" +
        "📍 أمانة العاصمة، شارع الزبيري، صنعاء\n" +
        "⏰ السبت-الخميس: 8:00ص - 4:00م\n\n" +
        "🌐 almossah-website.vercel.app"
      );
      return;
    }

    // ─── AI Conversation ───────────────────────────────────────────────────────
    // Send typing indicator
    await tgApi("sendChatAction", { chat_id: chatId, action: "typing" });

    try {
      const convo = await getOrCreateConversation("telegram", userId);
      const reply = await processMessage(convo.id, text);

      // Send as plain text — no formatting to avoid Telegram parse errors
      await tgApi("sendMessage", { chat_id: chatId, text: reply.slice(0, 4000) });

      await sendKeyboard(chatId, "هل تريد شيئاً آخر؟", mainKeyboard());
    } catch (aiErr) {
      await tgApi("sendMessage", {
        chat_id: chatId,
        text: "عذراً، حدث خطأ أثناء المعالجة. حاول مرة أخرى أو اختر من القائمة أدناه."
      });
      await sendMenu(chatId);
      console.error("[Nassir AI error]", aiErr instanceof Error ? aiErr.message : String(aiErr));
    }
  } catch (err) {
    console.error("[Telegram webhook error]", err instanceof Error ? err.message : String(err));
  }
});

// ─── Helpers ────────────────────────────────────────────────────────────────

async function tgApi(method: string, body: Record<string, unknown>): Promise<unknown> {
  try {
    const res = await fetch(`${TGAPI()}/${method}`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });
    const json = await res.json() as { ok: boolean; description?: string };
    if (!json.ok) {
      console.error(`[Telegram API ${method} error]`, json.description);
    }
    return json;
  } catch (e) {
    console.error(`[Telegram API ${method} fetch error]`, e instanceof Error ? e.message : String(e));
    return null;
  }
}

async function sendHtml(chatId: number, html: string) {
  await tgApi("sendMessage", { chat_id: chatId, text: html, parse_mode: "HTML" });
}

async function sendKeyboard(chatId: number, text: string, keyboard: Array<Array<{ text: string; callback_data: string }>>) {
  await tgApi("sendMessage", {
    chat_id: chatId,
    text,
    parse_mode: "HTML",
    reply_markup: { inline_keyboard: keyboard },
  });
}

function mainKeyboard() {
  return [
    [{ text: "🎓 المنح", callback_data: "grants" }, { text: "📚 التخفيضات", callback_data: "discounts" }],
    [{ text: "📝 سجّل الآن", callback_data: "register" }, { text: "🏠 القائمة", callback_data: "menu" }],
  ];
}

async function sendMenu(chatId: number, firstName?: string) {
  const name = firstName ? ` ${firstName}` : "";
  await tgApi("sendMessage", {
    chat_id: chatId,
    text:
      `🏛 <b>المؤسسة الوطنية للتنمية الشاملة</b>\n` +
      `أهلاً${name}! أنا ناصر، مستشارك الأكاديمي الذكي 👋\n\n` +
      `يمكنني مساعدتك في:\n` +
      `• اختيار الجامعة والتخصص المناسب\n` +
      `• معرفة التخفيضات والمنح المتاحة\n` +
      `• التسجيل خطوة بخطوة\n\n` +
      `<b>اختر ما يهمك أو اكتب سؤالك مباشرة:</b>`,
    parse_mode: "HTML",
    reply_markup: {
      inline_keyboard: [
        [{ text: "🎓 المنح الدراسية", callback_data: "grants" }, { text: "📚 التخفيضات", callback_data: "discounts" }],
        [{ text: "🏥 التأمين الصحي", callback_data: "insurance" }, { text: "💡 الدورات", callback_data: "training" }],
        [{ text: "📝 سجّل الآن", callback_data: "register" }, { text: "📞 تواصل معنا", callback_data: "contact" }],
        [{ text: "🏛 الجامعات الشريكة", callback_data: "universities" }, { text: "💬 اسأل ناصر", callback_data: "chat" }],
      ],
    },
  });
}

async function sendUniversities(chatId: number) {
  await tgApi("sendMessage", {
    chat_id: chatId,
    text:
      "🏛 <b>الجامعات الشريكة (16 جامعة)</b>\n\n" +
      "1. الجامعة اللبنانية الدولية — خصم 40-60%\n" +
      "2. جامعة العلوم والتكنولوجيا — خصم 50%\n" +
      "3. جامعة سبأ — خصم 35-50%\n" +
      "4. جامعة الملكة أروى — خصم 30-45%\n" +
      "5. جامعة الأندلس — خصم 40-55%\n" +
      "6. جامعة الحكمة — خصم 30-40%\n" +
      "7. جامعة دار السلام — خصم 30-50%\n" +
      "8. جامعة الناصر — خصم 35-50%\n" +
      "9. جامعة المستقبل — خصم 40-60%\n" +
      "10. جامعة الجيل الجديد — خصم 35-50%\n" +
      "11. جامعة آزال — خصم 40-55%\n" +
      "12. جامعة الإيمان — خصم 30-45%\n" +
      "13. جامعة المعرفة والعلوم — خصم 35-50%\n" +
      "14. جامعة الوطن — خصم 30-45%\n" +
      "15. جامعة القرآن الكريم — خصم 30-50%\n" +
      "16. جامعة الرازي — خصم 40-60%\n\n" +
      "💬 اكتب تخصصك لأوجّهك للأنسب!",
    parse_mode: "HTML",
  });
  await sendKeyboard(chatId, "هل تريد شيئاً آخر؟", mainKeyboard());
}

export default router;
