import { Router } from "express";
import { getOrCreateConversation, processMessageFast } from "../../lib/chatHelper";

const router = Router();
const TG_TOKEN = () => process.env.TELEGRAM_BOT_TOKEN || "";
const TGAPI = () => `https://api.telegram.org/bot${TG_TOKEN()}`;

// Short system prompt for Telegram — keep concise to fit within Vercel timeout
const TELEGRAM_PROMPT = `[قاعدة مطلقة]: رد بالعربية الفصحى فقط. لا حرف أجنبي واحد.

أنت ناصر، المستشار الأكاديمي للمؤسسة الوطنية للتنمية الشاملة (اليمن).
أسلوبك: دافئ، مُقنع، موجز. ردودك 3-5 جمل. تقنع الطالب بالتسجيل بذكاء.

خدماتنا: استشارة أكاديمية | تنسيق جامعي | تخفيضات كبيرة على الرسوم | مقاعد مخفضة | منح دراسية | تأمين صحي | دورات تأهيل | تخفيضات معاهد لغات

جامعات شريكة (35+): الحضارة، اليمنية، السعيدة، الرازي، الحكمة، العلوم والتكنولوجيا، بن النفيس، سبأ، أروى، اللبنانية الدولية، الأندلس، الناصر، المستقبل، وغيرها
معدلات القبول: طب 90%+ | هندسة 80%+ | تقنية معلومات 70%+ | إدارة/أدبي 65%+
تخصصات مفتوحة لأقل من 70%: ذكاء اصطناعي، أمن سيبراني، إدارة، محاسبة، إعلام، تمريض، علاج طبيعي وغيرها

للتسجيل: almossah-website.vercel.app/register
العنوان: صنعاء — جولة المصباحي، اتجاه ريماس، عمارة النزيلي، جوار حلمي للعسل اليمني
الهاتف/واتساب: 770441247 — السبت-الخميس 8ص-4م

أسلوب الإقناع: ذكّر الطالب بأن المقاعد محدودة، وأن التأخير قد يُضيع الفرصة.
إذا سألك الطالب عن التسجيل أو التخصص أو الجامعة — أجبه ثم وجّهه فوراً للتسجيل.`;

import OpenAI from "openai";

const groqFast = new OpenAI({
  apiKey: process.env.GROQ_API_KEY,
  baseURL: "https://api.groq.com/openai/v1",
});

router.post("/nassir/webhooks/telegram", async (req, res) => {
  // CRITICAL: Do NOT send 200 early — Vercel kills the function after response!
  // We process everything first, then send 200 at the end.
  if (!TG_TOKEN()) { res.sendStatus(200); return; }

  try {
    const update = req.body as Record<string, unknown>;

    // ─── Callback query (button clicks) ─────────────────────────────────────
    const callbackQuery = update.callback_query as Record<string, unknown> | undefined;
    if (callbackQuery) {
      const chatId = ((callbackQuery.message as Record<string, unknown>)?.chat as Record<string, unknown>)?.id as number;
      const data = (callbackQuery.data as string) || "";
      const callbackId = callbackQuery.id as string;

      void tgApi("answerCallbackQuery", { callback_query_id: callbackId });

      switch (data) {
        case "menu":   await sendMenu(chatId); break;
        case "chat":   await sendHtml(chatId, "💬 اكتب سؤالك مباشرة وسأجيبك!\n\n<i>مثال: ما الجامعة المناسبة لمعدل 85%؟</i>"); break;
        case "grants": await sendHtml(chatId,
            "🎓 <b>المنح الدراسية الكاملة</b>\n\n" +
            "✅ تغطية كاملة للرسوم للمتميزين والمحتاجين\n" +
            "✅ أكثر من 15,000 طالب مستفيد\n" +
            "✅ 35+ جامعة شريكة — 8 محافظات\n\n" +
            "📝 التسجيل: almossah-website.vercel.app/register");
          await sendKeyboard(chatId, "هل تريد شيئاً آخر؟", mainKeyboard()); break;
        case "discounts": await sendHtml(chatId,
            "📚 <b>التخفيضات الجامعية</b>\n\n" +
            "✅ خصومات 30% إلى 70%\n" +
            "✅ 16 جامعة شريكة في صنعاء\n" +
            "✅ جميع التخصصات: طب، هندسة، إدارة، قانون...\n\n" +
            "💬 اكتب تخصصك ومعدلك وسأجد لك أفضل خيار!");
          await sendKeyboard(chatId, "هل تريد شيئاً آخر؟", mainKeyboard()); break;
        case "insurance": await sendHtml(chatId,
            "🏥 <b>التأمين الصحي الشامل</b>\n\n" +
            "✅ شبكة واسعة من أفضل المستشفيات\n" +
            "✅ صيدليات ومختبرات معتمدة\n" +
            "✅ باقات للفرد والأسرة\n\n" +
            "🌐 almossah-website.vercel.app/training-register");
          await sendKeyboard(chatId, "هل تريد شيئاً آخر؟", mainKeyboard()); break;
        case "training": await sendHtml(chatId,
            "💡 <b>الدورات التدريبية المعتمدة</b>\n\n" +
            "✅ اللغة الإنجليزية — جميع المستويات\n" +
            "✅ مهارات الحاسوب والتقنية\n" +
            "✅ مهارات سوق العمل\n\n" +
            "🌐 almossah-website.vercel.app/training-register");
          await sendKeyboard(chatId, "هل تريد شيئاً آخر؟", mainKeyboard()); break;
        case "register": await sendHtml(chatId,
            "📝 <b>سجّل الآن</b>\n\n" +
            "🎓 <b>تسجيل جامعي:</b>\nalmossah-website.vercel.app/register\n\n" +
            "💡 <b>دورات وتأمين:</b>\nalmossah-website.vercel.app/training-register\n\n" +
            "💬 أو اكتب <b>سجّلني</b> وسأساعدك خطوة بخطوة!"); break;
        case "contact": await sendHtml(chatId,
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

    // ─── Regular text messages ───────────────────────────────────────────────
    const message = (update.message || update.edited_message) as Record<string, unknown> | undefined;
    if (!message) { res.sendStatus(200); return; }

    const chatId = (message.chat as Record<string, unknown>)?.id as number;
    const text = ((message.text as string) || "").trim();
    if (!chatId || !text) { res.sendStatus(200); return; }

    const userId = String((message.from as Record<string, unknown>)?.id || chatId);
    const firstName = ((message.from as Record<string, unknown>)?.first_name as string) || "";

    // ─── Commands ────────────────────────────────────────────────────────────
    if (text === "/start") { await sendMenu(chatId, firstName); res.sendStatus(200); return; }
    if (text === "/register") {
      await sendHtml(chatId,
        "📝 <b>سجّل في المؤسسة الوطنية</b>\n\n" +
        "🎓 almossah-website.vercel.app/register\n\n" +
        "أو أخبرني بتخصصك ومعدلك وسأرشدك!");
      res.sendStatus(200); return;
    }
    if (text === "/universities") { await sendUniversities(chatId); res.sendStatus(200); return; }
    if (text === "/contact") {
      await sendHtml(chatId,
        "📞 <b>تواصل معنا</b>\n\n" +
        "📍 صنعاء — جولة المصباحي، اتجاه ريماس، عمارة النزيلي، جوار حلمي للعسل اليمني\n" +
            "📞 واتساب/اتصال: 770441247\n" +
        "⏰ السبت-الخميس: 8:00ص - 4:00م\n\n" +
        "🌐 almossah-website.vercel.app");
      res.sendStatus(200); return;
    }

    // ─── AI Conversation ─────────────────────────────────────────────────────
    // Step 1: Send "thinking" placeholder
    const thinkingResult = await tgApi("sendMessage", {
      chat_id: chatId,
      text: "⏳ ناصر يفكر...",
    }) as { ok: boolean; result?: { message_id: number } };

    const thinkingMsgId = thinkingResult?.result?.message_id;

    try {
      // Step 2: Get/create conversation
      const convo = await getOrCreateConversation("telegram", userId);

      // Step 3: Call Groq directly with SHORT Telegram prompt for speed
      const reply = await callGroqFast(userId, text, convo.id);

      // Step 4: Edit "thinking" message with real reply
      if (thinkingMsgId) {
        await tgApi("editMessageText", {
          chat_id: chatId,
          message_id: thinkingMsgId,
          text: reply.slice(0, 4000),
        });
      } else {
        await tgApi("sendMessage", { chat_id: chatId, text: reply.slice(0, 4000) });
      }

      // Step 5: Quick action buttons
      await sendKeyboard(chatId, "هل تريد شيئاً آخر؟", mainKeyboard());

    } catch (aiErr) {
      console.error("[Nassir AI error]", aiErr instanceof Error ? aiErr.message : String(aiErr));
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

  // ALWAYS respond to Telegram LAST to keep Vercel function alive during processing
  res.sendStatus(200);
});

// Direct Groq call with short Telegram prompt — bypasses processMessageFast for speed
async function callGroqFast(userId: string, userText: string, _convId: number): Promise<string> {
  const response = await groqFast.chat.completions.create({
    model: "llama-3.1-8b-instant",
    max_tokens: 400,
    temperature: 0,
    messages: [
      { role: "system", content: TELEGRAM_PROMPT },
      { role: "user", content: userText },
    ],
  });
  return response.choices[0]?.message?.content?.trim()
    || "عذراً، حاول مرة أخرى.";
}

// ─── Helper functions ────────────────────────────────────────────────────────

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

async function sendKeyboard(chatId: number, text: string, keyboard: Array<Array<{ text: string; callback_data: string }>>) {
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
      `• اختيار الجامعة والتخصص المناسب لمعدلك\n` +
      `• معرفة التخفيضات والمنح المتاحة\n` +
      `• التسجيل خطوة بخطوة\n\n` +
      `<b>اختر ما يهمك أو اكتب سؤالك مباشرة:</b>`,
    parse_mode: "HTML",
    link_preview_options: { is_disabled: true },
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
      "1. الجامعة اللبنانية الدولية\n" +
      "2. جامعة العلوم والتكنولوجيا\n" +
      "3. جامعة سبأ\n" +
      "4. جامعة الملكة أروى\n" +
      "5. جامعة الأندلس\n" +
      "6. جامعة الحكمة\n" +
      "7. جامعة دار السلام\n" +
      "8. جامعة الناصر\n" +
      "9. جامعة المستقبل\n" +
      "10. جامعة الجيل الجديد\n" +
      "11. جامعة آزال\n" +
      "12. جامعة الإيمان\n" +
      "13. جامعة المعرفة والعلوم\n" +
      "14. جامعة الوطن\n" +
      "15. جامعة القرآن الكريم\n" +
      "16. جامعة الرازي\n\n" +
      "💬 اكتب تخصصك لأوجّهك للأنسب!",
    parse_mode: "HTML",
  });
  await sendKeyboard(chatId, "هل تريد شيئاً آخر؟", mainKeyboard());
}

export default router;
