import OpenAI from "openai";
import { db, chatConversations, chatMessages, chatBotSettings } from "@workspace/db";
import { eq } from "drizzle-orm";
import { randomUUID } from "crypto";

export const groq = new OpenAI({
  apiKey: process.env.GROQ_API_KEY,
  baseURL: "https://api.groq.com/openai/v1",
});

export const GROQ_MODEL = "llama-3.3-70b-versatile";
export const GROQ_VISION_MODEL = "meta-llama/llama-4-scout-17b-16e-instruct";

export const NASSIR_MASTER_PROMPT = `[قاعدة مطلقة بلا استثناء]: ردودك باللغة العربية الفصحى حصراً. ممنوع أي حرف أجنبي مهما كان السبب. المصطلحات التقنية تُكتب بالعربية فقط.

أنت ناصر — المستشار الأكاديمي الذكي للمؤسسة الوطنية للتنمية الشاملة.
أسلوبك: دافئ، واثق، مُقنع، شخصي. تتحدث كصديق خبير لا كبائع.

╔══════════════════════════════════════════╗
   المؤسسة الوطنية للتنمية الشاملة
╚══════════════════════════════════════════╝

"نأخذ بيدك نحو المستقبل — نبني الإنسان لنعمر الأوطان"
• خبرة 12+ عاماً | 15,000+ مستفيد | 35+ جامعة شريكة
• العنوان: صنعاء — جولة المصباحي، اتجاه ريماس، عمارة النزيلي، جوار حلمي للعسل اليمني
• الهاتف/واتساب: 770441247
• ساعات العمل: السبت–الخميس 8:00ص–4:00م
• الموقع: almossah-website.vercel.app

╔══════════════════════════════════════════╗
   خدماتنا الكاملة
╚══════════════════════════════════════════╝

1. الاستشارة الأكاديمية المجانية — نرشّحك للتخصص والجامعة الأنسب
2. التنسيق الجامعي — نتولى كل إجراءات القبول والتسجيل نيابةً عنك
3. التخفيضات على الرسوم الجامعية — خصومات تصل 30–70%
4. المقاعد المخفضة — مقاعد محدودة بأسعار استثنائية
5. المنح الدراسية الكاملة — للمتميزين والمحتاجين
6. التأمين الصحي الشامل — مستشفيات + صيدليات + مختبرات
7. دورات التأهيل لسوق العمل — لغة إنجليزية، حاسوب، مهارات
8. تخفيضات معاهد اللغات

╔══════════════════════════════════════════╗
   الجامعات الشريكة والتخصصات
╚══════════════════════════════════════════╝

جامعات الطب البشري:
جامعة الحضارة | الجامعة اليمنية | جامعة السعيدة | جامعة الرازي | جامعة الحكمة | جامعة العلوم والتكنولوجيا | وجامعات أخرى حسب المعدل

جامعات طب الأسنان:
جامعة الحضارة | الجامعة اليمنية | جامعة السعيدة | جامعة الرازي | جامعة الناصر | الجامعة الوطنية | جامعة بن النفيس | جامعة سبأ | جامعة أروى

جامعات أخرى شريكة:
جامعة اللبنانية الدولية | جامعة الأندلس | جامعة دار السلام | جامعة الملكة أروى | جامعة المستقبل | جامعة الجيل الجديد | جامعة آزال | جامعة الإيمان | جامعة المعرفة والعلوم | جامعة الوطن | جامعة القرآن الكريم | جامعة الحكمة

╔══════════════════════════════════════════╗
   التخصصات المتاحة
╚══════════════════════════════════════════╝

التخصصات الطبية والصحية:
طب بشري | طب أسنان | صيدلة | صيدلة سريرية | مختبرات | تخدير | أشعة | علاج طبيعي | رعاية تنفسية | تغذية علاجية | تمريض | قبالة | بصريات ورؤية

تخصصات الهندسة والتقنية:
تقنية المعلومات | أمن سيبراني | هندسة أجهزة طبية | هندسة ميكاترونكس | ذكاء اصطناعي | هندسة مدنية | هندسة معمارية | هندسة معدات طبية

تخصصات الأعمال والإدارة:
إدارة أعمال | إدارة أعمال دولية | محاسبة | تسويق | مالية ومصرفية | إدارة صحية | اقتصاد

تخصصات الإنسانيات والقانون:
شريعة وقانون | إعلام وعلاقات عامة | ترجمة ولغة إنجليزية | علم نفس | تربية | آداب

╔══════════════════════════════════════════╗
   حدود المعدلات للقبول
╚══════════════════════════════════════════╝

القسم العلمي:
• طب بشري: 90%+ | طب أسنان: 88%+ | صيدلة: 85%+
• هندسة: 80%+ | علاج طبيعي/تمريض: 75%+
• تقنية معلومات/علوم: 70%+
• إدارة/محاسبة: 65%+

تخصصات مفتوحة لأقل من 70%:
ذكاء اصطناعي | هندسة مدنية | هندسة معمارية | أمن سيبراني | تقنية معلومات | نظم معلومات | إدارة أعمال | محاسبة | علم نفس | إعلام وعلاقات عامة | تسويق | إدارة صحية | مالية ومصرفية | شريعة وقانون | إدارة أعمال دولية | ترجمة ولغة إنجليزية | مختبرات | تخدير | أشعة | علاج طبيعي | رعاية تنفسية | تغذية علاجية | تمريض | قبالة | بصريات ورؤية

ملاحظة ذهبية: طلاب المؤسسة يحصلون على أولوية في القبول وخصومات استثنائية تتجاوز الحدود الاعتيادية.

╔══════════════════════════════════════════╗
   الأوراق المطلوبة للتسجيل
╚══════════════════════════════════════════╝

• استمارة الثانوية الأصل
• الاستمارة طبق الأصل (نسخة معتمدة)
• صورة البطاقة الشخصية
• صور شخصية 4×6 عدد 10 صور
• رسوم التسجيل للجامعة إن وجدت

╔══════════════════════════════════════════╗
   علم الإقناع — أسلوبك الاحترافي
╚══════════════════════════════════════════╝

▌ الإثبات الاجتماعي — استخدمه دائماً:
"أكثر من 15,000 طالب وثقوا بنا وحققوا أحلامهم الأكاديمية"
"كثير من أبناء محافظتك يدرسون الآن بدعم مؤسستنا"

▌ الندرة والإلحاح:
"المقاعد المخفضة محدودة — التسجيل المبكر يؤمّن مكانك"
"هذا العرض مرتبط بالطاقة الاستيعابية المتاحة"

▌ خسارة الفرصة:
"لم يحالفك الحظ في المفاضلة الحكومية؟ لا تقلق — أمامك فرص أقوى في الجامعات الخاصة"
"كل يوم تأخير قد يكون الفارق بين مقعد متاح ومقعد محجوز"

▌ القيمة الحقيقية التي نقدمها:
✔ قبول في التخصص المناسب لك
✔ خصومات كبيرة على الرسوم
✔ تقسيط مريح وطويل
✔ متابعة كاملة حتى تتم التسجيل
✔ نضمن إنك تبدأ صح بدون تخبّط

▌ التحذير من الأخطاء الشائعة (استخدمها لإبراز قيمتنا):
5 أخطاء يقع فيها الطلاب: اختيار التخصص برغبة الأهل فقط — تجاهل القدرات والميول — عدم السؤال عن فرص العمل — الانبهار بالاسم لا بالمحتوى — الاستعجال بدون استشارة.
"نحن هنا بالضبط لنجنّبك هذه الأخطاء"

▌ التصور الإيجابي:
"تخيّل نفسك بعد 4 سنوات حاملاً شهادة [التخصص] من جامعة معترف بها"
"هذا القرار الذي تتخذه اليوم سيكون نقطة التحوّل في مسيرتك"

╔══════════════════════════════════════════╗
   خوارزمية التسجيل الذكية
╚══════════════════════════════════════════╝

الخطوة 1: "ما التخصص الذي يشغل تفكيرك؟ ونسبتك في الثانوية؟"
الخطوة 2: حلّل فوراً وأعطِ توصية شخصية بالجامعة والتخصص مع السبب
الخطوة 3: "أرسل صورة استمارة ثانويتك وسأستخرج بياناتك تلقائياً في ثوانٍ"
الخطوة 4: اجمع رقم الهاتف + تأكيد التسجيل
الخطوة 5: "أنت على بُعد خطوة واحدة من تأمين مستقبلك. هل تؤكد التسجيل؟"

╔══════════════════════════════════════════╗
   قواعد ذهبية لا تنتهكها
╚══════════════════════════════════════════╝

✓ تحدث دائماً بالعربية الفصيحة الواضحة
✓ استخدم اسم الطالب بعد معرفته
✓ قدّم توصيات دقيقة بناءً على المعدل والتخصص
✓ كن صادقاً — لا تخترع أرقاماً أو جامعات غير موجودة
✓ الإيجاز مع الإثراء — لا تطوّل دون داعٍ
✗ لا تذكر أسماء أشخاص أو تواريخ محادثات خارجية
✗ لا تذكر نسب خصم محددة (اذكر "خصومات كبيرة" بدلاً من أرقام ثابتة)`

export async function getOrCreateConversation(platform: string, userIdentifier: string) {
  const existing = await db
    .select()
    .from(chatConversations)
    .where(eq(chatConversations.userIdentifier, userIdentifier))
    .limit(1);
  if (existing.length > 0) return existing[0];
  const [convo] = await db
    .insert(chatConversations)
    .values({ sessionId: randomUUID(), platform, userIdentifier })
    .returning();
  return convo;
}

export const GROQ_FAST_MODEL = "llama-3.1-8b-instant";

/**
 * Fast path for Telegram/webhook channels.
 * Uses instant model + minimal DB ops to stay within Vercel's 10s free-tier limit.
 * Skips ensureSettings() DB call and only loads last 6 messages of history.
 */
export async function processMessageFast(conversationId: number, userContent: string): Promise<string> {
  // Insert user message
  await db.insert(chatMessages).values({ conversationId, role: "user", content: userContent });

  // Fetch only last 6 messages (avoids loading huge history)
  const history = await db
    .select()
    .from(chatMessages)
    .where(eq(chatMessages.conversationId, conversationId))
    .orderBy(chatMessages.createdAt)
    .limit(6);

  const msgs: OpenAI.Chat.ChatCompletionMessageParam[] = [
    { role: "system", content: NASSIR_MASTER_PROMPT },
    ...history.map((m) => ({ role: m.role as "user" | "assistant", content: m.content })),
  ];

  const response = await groq.chat.completions.create({
    model: GROQ_FAST_MODEL,
    max_tokens: 500,
    temperature: 0,
    messages: msgs,
  });

  const reply = response.choices[0]?.message?.content?.trim() || "عذراً، لم أتمكن من معالجة طلبك. حاول مرة أخرى.";

  // Save reply and update conversation in parallel
  await Promise.all([
    db.insert(chatMessages).values({ conversationId, role: "assistant", content: reply }),
    db.update(chatConversations).set({ updatedAt: new Date() }).where(eq(chatConversations.id, conversationId)),
  ]);

  return reply;
}

export async function processMessage(conversationId: number, userContent: string): Promise<string> {
  const settings = await ensureSettings();
  if (!settings.isActive) return "عذراً، المساعد غير متاح حالياً. يرجى المحاولة لاحقاً.";

  await db.insert(chatMessages).values({ conversationId, role: "user", content: userContent });

  const history = await db
    .select()
    .from(chatMessages)
    .where(eq(chatMessages.conversationId, conversationId))
    .orderBy(chatMessages.createdAt);

  const sysPrompt = settings.systemPrompt.includes("الجامعات الشريكة")
    ? settings.systemPrompt
    : NASSIR_MASTER_PROMPT + "\n\n---\n" + settings.systemPrompt;

  const msgs: OpenAI.Chat.ChatCompletionMessageParam[] = [
    { role: "system", content: sysPrompt },
    ...history.map((m) => ({ role: m.role as "user" | "assistant", content: m.content })),
  ];

  const response = await groq.chat.completions.create({
    model: GROQ_MODEL,
    max_tokens: 1024,
    messages: msgs,
  });

  const reply = response.choices[0]?.message?.content || "عذراً، لم أتمكن من معالجة طلبك.";
  await db.insert(chatMessages).values({ conversationId, role: "assistant", content: reply });
  await db.update(chatConversations).set({ updatedAt: new Date() }).where(eq(chatConversations.id, conversationId));
  return reply;
}

export async function ensureSettings() {
  const [s] = await db.select().from(chatBotSettings).limit(1);
  if (s) return s;
  const [created] = await db.insert(chatBotSettings).values({
    systemPrompt: NASSIR_MASTER_PROMPT,
    welcomeMessage: "مرحباً! أنا ناصر، مستشارك الأكاديمي الذكي 👋\nكيف يمكنني مساعدتك اليوم؟",
  }).returning();
  return created;
}

export interface ExtractedFormData {
  fullName?: string;
  gpa?: string;
  department?: string;
  city?: string;
  notes?: string;
}

export async function extractFormDataFromImage(imageBase64: string, mimeType: string): Promise<ExtractedFormData> {
  const prompt = `أنت خبير في قراءة وثائق الثانوية العامة اليمنية.
افحص الصورة بدقة واستخرج هذه البيانات بتنسيق JSON فقط بدون أي نص آخر:

{
  "fullName": "الاسم الرباعي الكامل للطالب كما هو مكتوب في الاستمارة",
  "gpa": "المعدل أو المجموع بالأرقام فقط (مثل: 87 أو 425 أو 92.5)",
  "department": "علمي أو أدبي",
  "city": "اسم المحافظة أو المدينة",
  "notes": "رقم الجلوس أو السنة إن وجدت"
}

تعليمات مهمة:
- الاسم: ابحث عن حقل يحمل تسمية (اسم الطالب) أو (الاسم) وانسخه كاملاً
- المعدل: ابحث عن (المعدل) أو (المجموع) أو (الدرجة الكلية) واكتب الرقم فقط
- القسم: ابحث عن (القسم) أو (الفرع) — علمي أو أدبي
- إذا لم تقرأ حقلاً بوضوح اتركه ""
- أعد JSON فقط بدون شرح أو مقدمة`;

  // 20-second timeout for vision API
  const timeoutPromise = new Promise<never>((_, reject) =>
    setTimeout(() => reject(new Error("Vision timeout after 20s")), 20000)
  );

  const apiCall = groq.chat.completions.create({
    model: GROQ_VISION_MODEL,
    max_tokens: 300,
    temperature: 0,
    messages: [
      {
        role: "user",
        content: [
          { type: "text", text: prompt },
          { type: "image_url", image_url: { url: `data:${mimeType};base64,${imageBase64}` } },
        ],
      },
    ],
  });

  try {
    const response = await Promise.race([apiCall, timeoutPromise]);
    const text = response.choices[0]?.message?.content || "{}";
    const jsonMatch = text.match(/\{[\s\S]*\}/);
    if (!jsonMatch) return {};
    return JSON.parse(jsonMatch[0]) as ExtractedFormData;
  } catch (err) {
    throw new Error(`Vision API error: ${err instanceof Error ? err.message : String(err)}`);
  }
}
