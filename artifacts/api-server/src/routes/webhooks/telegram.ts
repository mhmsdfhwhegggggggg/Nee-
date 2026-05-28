import { Router } from "express";
import { getOrCreateConversation, processMessageFast } from "../../lib/chatHelper";

const router = Router();
const TG_TOKEN = () => process.env.TELEGRAM_BOT_TOKEN || "";
const TGAPI = () => `https://api.telegram.org/bot${TG_TOKEN()}`;

router.post("/nassir/webhooks/telegram", async (req, res) => {
  if (!TG_TOKEN()) { res.sendStatus(200); return; }

  try {
    const update = req.body as Record<string, unknown>;

    // ── Callback query (inline button clicks) ────────────────────────────────
    const callbackQuery = update.callback_query as Record<string, unknown> | undefined;
    if (callbackQuery) {
      const chatId = ((callbackQuery.message as Record<string, unknown>)?.chat as Record<string, unknown>)?.id as number;
      const data = (callbackQuery.data as string) || "";
      const callbackId = callbackQuery.id as string;
      void tgApi("answerCallbackQuery", { callback_query_id: callbackId });

      switch (data) {
        case "menu":       await sendMenu(chatId); break;
        case "chat":       await sendHtml(chatId, "💬 اكتب سؤالك مباشرة وسأجيبك!\n\n<i>مثال: ما الجامعة المناسبة لمعدل 85%؟</i>"); break;
        case "grants":     await sendHtml(chatId,
          "🏆 <b>المنح الدراسية الكاملة</b>\n\n" +
          "✅ تغطية كاملة للرسوم للمتميزين والمحتاجين\n" +
          "✅ أكثر من 15,000 طالب مستفيد\n" +
          "✅ 35+ جامعة شريكة\n\n" +
          "📝 سجّل: almossah-website.vercel.app/register\n\n" +
          "أو اكتب <b>سجّلني</b> وسيجمع ناصر بياناتك تلقائياً!");
          await sendKeyboard(chatId, "ماذا تريد بعد ذلك؟", mainKeyboard()); break;
        case "discounts":  await sendHtml(chatId,
          "📚 <b>التخفيضات الجامعية الحصرية</b>\n\n" +
          "✅ خصومات استثنائية على أفضل الجامعات\n" +
          "✅ طب | هندسة | إدارة | تقنية | وأكثر\n\n" +
          "💬 اكتب تخصصك ومعدلك وسأجد لك أفضل خيار!");
          await sendKeyboard(chatId, "ماذا تريد بعد ذلك؟", mainKeyboard()); break;
        case "insurance":  await sendHtml(chatId,
          "🏥 <b>التأمين الصحي الشامل</b>\n\n" +
          "✅ مستشفيات + عيادات + صيدليات + مختبرات\n" +
          "✅ باقات للفرد والأسرة\n\n" +
          "🌐 almossah-website.vercel.app/training-register");
          await sendKeyboard(chatId, "ماذا تريد بعد ذلك؟", mainKeyboard()); break;
        case "training":   await sendHtml(chatId,
          "💡 <b>الدورات التدريبية المعتمدة</b>\n\n" +
          "✅ لغة إنجليزية | حاسوب | مهارات قيادية\n" +
          "✅ شهادات معتمدة دولياً\n\n" +
          "🌐 almossah-website.vercel.app/training-register");
          await sendKeyboard(chatId, "ماذا تريد بعد ذلك؟", mainKeyboard()); break;
        case "register":   await sendHtml(chatId,
          "📝 <b>التسجيل الذكي عبر ناصر</b>\n\n" +
          "أسرع طريقة: اكتب بياناتك هنا وسأسجّلك مباشرة!\n\n" +
          "ابدأ بإخباري: <b>ما اسمك الكامل وما تخصصك المطلوب؟</b>"); break;
        case "contact":    await sendHtml(chatId,
          "📞 <b>تواصل معنا</b>\n\n" +
          "📍 صنعاء — جولة المصباحي، اتجاه ريماس، عمارة النزيلي، جوار حلمي للعسل اليمني\n" +
          "📞 واتساب/اتصال: 770441247\n" +
          "⏰ السبت-الخميس: 8:00ص - 4:00م\n\n" +
          "🌐 almossah-website.vercel.app"); break;
        case "universities": await sendUniversities(chatId); break;
      }

      res.sendStatus(200);
      return;
    }

    // ── Regular text messages ─────────────────────────────────────────────────
    const message = (update.message || update.edited_message) as Record<string, unknown> | undefined;
    if (!message) { res.sendStatus(200); return; }

    const chatId = (message.chat as Record<string, unknown>)?.id as number;
    const text = ((message.text as string) || "").trim();
    if (!chatId || !text) { res.sendStatus(200); return; }

    const userId = String((message.from as Record<string, unknown>)?.id || chatId);
    const firstName = ((message.from as Record<string, unknown>)?.first_name as string) || "";

    // ── Commands ──────────────────────────────────────────────────────────────
    if (text === "/start") { await sendMenu(chatId, firstName); res.sendStatus(200); return; }
    if (text === "/register") {
      await sendHtml(chatId,
        "📝 <b>سجّل في المؤسسة الوطنية</b>\n\n" +
        "الطريقة الأسرع: أخبرني باسمك الكامل وتخصصك وسأسجّلك هنا مباشرة!\n\n" +
        "أو عبر الموقع: almossah-website.vercel.app/register");
      res.sendStatus(200); return;
    }
    if (text === "/universities") { await sendUniversities(chatId); res.sendStatus(200); return; }
    if (text === "/contact") {
      await sendHtml(chatId,
        "📞 <b>تواصل معنا</b>\n\n" +
        "📍 صنعاء — جولة المصباحي، اتجاه ريماس، عمارة النزيلي، جوار حلمي للعسل اليمني\n" +
        "📞 واتساب/اتصال: 770441247\n" +
        "⏰ السبت-الخميس: 8:00ص - 4:00م");
      res.sendStatus(200); return;
    }

    // ── AI Conversation via unified master prompt ─────────────────────────────
    const thinkingResult = await tgApi("sendMessage", {
      chat_id: chatId,
      text: "⏳ ناصر يحلّل طلبك...",
    }) as { ok: boolean; result?: { message_id: number } };

    const thinkingMsgId = thinkingResult?.result?.message_id;

    try {
      const convo = await getOrCreateConversation("telegram", userId);
      const { reply, registrationId } = await processMessageFast(convo.id, text);

      // Edit "thinking" message with real reply
      const displayText = reply.slice(0, 4000);
      if (thinkingMsgId) {
        await tgApi("editMessageText", {
          chat_id: chatId,
          message_id: thinkingMsgId,
          text: displayText,
          parse_mode: "HTML",
        });
      } else {
        await tgApi("sendMessage", { chat_id: chatId, text: displayText, parse_mode: "HTML" });
      }

      // If auto-registered, send confirmation
      if (registrationId) {
        await tgApi("sendMessage", {
          chat_id: chatId,
          text:
            `✅ <b>تم تسجيلك بنجاح!</b>\n\n` +
            `📋 رقم طلبك: <b>#${registrationId}</b>\n\n` +
            `سيتواصل معك فريق المؤسسة قريباً. بالتوفيق! 🌟`,
          parse_mode: "HTML",
        });
      }

      await sendKeyboard(chatId, "هل تريد شيئاً آخر؟", mainKeyboard());
    } catch (aiErr) {
      console.error("[Nassir Telegram AI error]", aiErr instanceof Error ? aiErr.message : String(aiErr));
      const errText = "عذراً، تأخّر الرد. اكتب سؤالك مرة أخرى وسأجيبك!";
      if (thinkingMsgId) {
        await tgApi("editMessageText", { chat_id: chatId, message_id: thinkingMsgId, text: errText });
      } else {
        await tgApi("sendMessage", { chat_id: chatId, text: errText });
      }
    }
  } catch (err) {
    console.error("[Telegram webhook error]", err instanceof Error ? err.message : String(err));
  }

  res.sendStatus(200);
});

// ── Helper functions ──────────────────────────────────────────────────────────
async function tgApi(method: string, body: Record<string, unknown>): Promise<unknown> {
  try {
    const res = await fetch(`${TGAPI()}/${method}`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });
    const json = await res.json() as { ok: boolean; description?: string; result?: unknown };
    if (!json.ok) console.error(`[TG ${method}]`, json.description);
    return json;
  } catch (e) {
    console.error(`[TG ${method} fetch]`, e instanceof Error ? e.message : String(e));
    return { ok: false };
  }
}

async function sendHtml(chatId: number, html: string) {
  await tgApi("sendMessage", {
    chat_id: chatId,
    text: html,
    parse_mode: "HTML",
    link_preview_options: { is_disabled: true },
  });
}

async function sendKeyboard(
  chatId: number,
  text: string,
  keyboard: Array<Array<{ text: string; callback_data: string }>>,
) {
  await tgApi("sendMessage", {
    chat_id: chatId,
    text,
    parse_mode: "HTML",
    link_preview_options: { is_disabled: true },
    reply_markup: { inline_keyboard: keyboard },
  });
}

function mainKeyboard() {
  return [
    [{ text: "🎓 المنح", callback_data: "grants" }, { text: "📚 التخفيضات", callback_data: "discounts" }],
    [{ text: "🏥 التأمين", callback_data: "insurance" }, { text: "💡 الدورات", callback_data: "training" }],
    [{ text: "📝 سجّل الآن", callback_data: "register" }, { text: "🏠 القائمة", callback_data: "menu" }],
  ];
}

async function sendMenu(chatId: number, firstName?: string) {
  const name = firstName ? ` ${firstName}` : "";
  await tgApi("sendMessage", {
    chat_id: chatId,
    text:
      `🏛 <b>المؤسسة الوطنية للتنمية الشاملة</b>\n` +
      `أهلاً${name}! أنا <b>ناصر</b>، مستشارك الأكاديمي الذكي 👋\n\n` +
      `يمكنني مساعدتك في:\n` +
      `• اختيار الجامعة والتخصص المناسب لمعدلك\n` +
      `• الحصول على تخفيضات استثنائية على الرسوم\n` +
      `• التسجيل هنا مباشرة — بدون زيارة الموقع!\n\n` +
      `<b>اكتب تخصصك ومعدلك الآن وسأحلّل وضعك فوراً:</b>`,
    parse_mode: "HTML",
    link_preview_options: { is_disabled: true },
    reply_markup: {
      inline_keyboard: [
        [{ text: "🎓 المنح الدراسية", callback_data: "grants" }, { text: "📚 التخفيضات", callback_data: "discounts" }],
        [{ text: "🏥 التأمين الصحي", callback_data: "insurance" }, { text: "💡 الدورات", callback_data: "training" }],
        [{ text: "📝 سجّل الآن عبر ناصر", callback_data: "register" }, { text: "📞 تواصل معنا", callback_data: "contact" }],
        [{ text: "🏛 الجامعات الشريكة", callback_data: "universities" }, { text: "💬 اسأل ناصر", callback_data: "chat" }],
      ],
    },
  });
}

async function sendUniversities(chatId: number) {
  await tgApi("sendMessage", {
    chat_id: chatId,
    text:
      "🏛 <b>الجامعات الشريكة (35+)</b>\n\n" +
      "<b>طب بشري:</b> الحضارة | اليمنية | السعيدة | الرازي | الحكمة | العلوم والتكنولوجيا\n\n" +
      "<b>طب أسنان:</b> الحضارة | اليمنية | السعيدة | الناصر | الوطنية | بن النفيس | سبأ | أروى\n\n" +
      "<b>صيدلة وصحة:</b> الحضارة | اليمنية | السعيدة | الرازي | بن النفيس\n\n" +
      "<b>هندسة وتقنية:</b> العلوم والتكنولوجيا | اليمنية | المستقبل | الأندلس\n\n" +
      "<b>إدارة وأعمال:</b> اللبنانية الدولية | الأندلس | دار السلام | أروى | المستقبل | الجيل الجديد | آزال | وغيرها\n\n" +
      "💬 اكتب تخصصك وسأرشّح لك أفضل جامعة بأقل سعر!",
    parse_mode: "HTML",
    link_preview_options: { is_disabled: true },
  });
}

export default router;
