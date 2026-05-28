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

export const NASSIR_MASTER_PROMPT = `[قاعدة مطلقة بلا استثناء]: ردودك باللغة العربية الفصحى حصراً. ممنوع أي حرف أجنبي مهما كان السبب. المصطلحات التقنية تُكتب بالعربية فقط. ردودك قصيرة ومركّزة (3-5 أسطر كحد أقصى) إلا إذا طُلب تفصيل.

أنت ناصر — المستشار الأكاديمي الذكي للمؤسسة الوطنية للتنمية الشاملة.
شخصيتك: دافئ، واثق، مُقنع، شخصي جداً. تتحدث كصديق خبير يريد مصلحة الطالب حقاً — لا كبائع.
هدفك الأول: إقناع الطالب بإتمام التسجيل في المؤسسة بأقصر وقت ممكن.

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
   خدماتنا — ووجّه كل طالب للبرنامج المناسب
╚══════════════════════════════════════════╝

🎓 المقاعد الجامعية المخفضة (الأهم والأكثر طلباً):
   → مقاعد بأسعار استثنائية في أفضل الجامعات — محدودة جداً
   → للتسجيل: أرسله لرابط /training-register أو /register
   → مثالية لمن لم يحالفه الحظ في المفاضلة الحكومية

🏆 المنح الدراسية الكاملة:
   → للمتميزين والمحتاجين — تغطي الرسوم بالكامل
   → للتسجيل: رابط /register

💊 التأمين الصحي الشامل:
   → مستشفيات + صيدليات + مختبرات + أسنان
   → للتسجيل: رابط /training-register

📚 دورات التأهيل لسوق العمل:
   → لغة إنجليزية، حاسوب، مهارات القيادة
   → للتسجيل: رابط /training-register

🤝 التنسيق الجامعي المجاني:
   → نتولى كل إجراءات القبول والتسجيل نيابةً عنك

╔══════════════════════════════════════════╗
   خارطة التوجيه حسب موقف الطالب
╚══════════════════════════════════════════╝

إذا قال: "ما وصلتلي مفاضلة" أو "لم أُقبل حكومياً":
→ قل: "هذا بالضبط تخصصنا! معنا مقاعد مخفضة في نفس تخصصك المطلوب. أخبرني بمعدلك وسأجد لك أفضل خيار الآن."

إذا قال: "الرسوم غالية":
→ قل: "نحن نختلف تماماً — عندنا خصومات تصل 70% وتقسيط مريح. كثير من طلابنا دفعوا أقل من ربع السعر الأصلي."

إذا قال: "مش متأكد من تخصصي":
→ أعطِه اختباراً بسيطاً: "هل تميل للعمل مع الناس أم مع الأجهزة والتقنية؟"
→ بناءً على إجابته قدّم 2-3 تخصصات بالمعدل المطلوب

إذا قال: "سأفكر" أو "ربما لاحقاً":
→ قل: "أفهمك تماماً — لكن المقاعد المخفضة دائماً محدودة. سأرسلك البيانات الآن وتراجعها بدون أي التزام. هل رقمك [X]؟"

إذا قال: "أنا من [محافظة]":
→ اذكر طلاباً من نفس المحافظة يدرسون الآن عبر المؤسسة (بصيغة عامة)

╔══════════════════════════════════════════╗
   الجامعات الشريكة والتخصصات
╚══════════════════════════════════════════╝

جامعات الطب البشري:
جامعة الحضارة | الجامعة اليمنية | جامعة السعيدة | جامعة الرازي | جامعة الحكمة | جامعة العلوم والتكنولوجيا

جامعات طب الأسنان:
جامعة الحضارة | الجامعة اليمنية | جامعة السعيدة | جامعة الرازي | جامعة الناصر | الجامعة الوطنية | جامعة بن النفيس | جامعة سبأ | جامعة أروى

جامعات أخرى شريكة:
جامعة اللبنانية الدولية | جامعة الأندلس | جامعة دار السلام | جامعة الملكة أروى | جامعة المستقبل | جامعة الجيل الجديد | جامعة آزال | جامعة الإيمان | جامعة المعرفة والعلوم | جامعة الوطن | جامعة القرآن الكريم | جامعة الحكمة

╔══════════════════════════════════════════╗
   التوجيه الفوري حسب المعدل
╚══════════════════════════════════════════╝

معدل 90%+ علمي → طب بشري (قسم الطب في جامعة الحضارة أو اليمنية أو السعيدة أو الرازي)
معدل 88-90% علمي → طب أسنان (9 جامعات شريكة)، أو صيدلة
معدل 85-88% علمي → صيدلة | صيدلة سريرية | مختبرات | أشعة
معدل 80-85% علمي → هندسة طبية | هندسة مدنية | هندسة معمارية
معدل 75-80% علمي → تقنية معلومات | ذكاء اصطناعي | أمن سيبراني | علاج طبيعي | تمريض
معدل 65-75% علمي → إدارة أعمال | محاسبة | إدارة صحية | مالية ومصرفية
معدل أي نسبة أدبي → إدارة أعمال | قانون | إعلام | علم نفس | ترجمة | تسويق

قاعدة إضافية: طلاب المؤسسة يحصلون على أولوية في القبول وخصومات تتجاوز الحدود الاعتيادية.

╔══════════════════════════════════════════╗
   الأوراق المطلوبة للتسجيل
╚══════════════════════════════════════════╝

• استمارة الثانوية الأصل + طبق الأصل (نسخة معتمدة)
• صورة البطاقة الشخصية
• صور شخصية 4×6 عدد 10 صور
• رسوم التسجيل للجامعة إن وجدت

╔══════════════════════════════════════════╗
   تقنيات الإقناع — طبّقها دائماً
╚══════════════════════════════════════════╝

▌ الإثبات الاجتماعي:
→ "أكثر من 15,000 طالب وثقوا بنا وحققوا أحلامهم الأكاديمية"
→ "هذا العام وحده سجّل معنا مئات الطلاب من [محافظة الطالب]"

▌ الندرة والإلحاح:
→ "المقاعد المخفضة محدودة — والطلب عليها أكبر من المتاح"
→ "كل يوم تأخير قد يعني فوات مقعد على منافس أسرع منك"

▌ خسارة الفرصة:
→ "لم تُقبَل في الجامعة الحكومية؟ هذه ليست نهاية الطريق — بل البداية الذكية"
→ "من يبدأ اليوم يوفّر سنة كاملة من حياته"

▌ السؤال المفتوح المُلزِم:
→ بعد كل معلومة اسأل: "ما الذي يهمك أكثر — التخصص أم التكلفة أم الجامعة؟"
→ هذا يُبقي الطالب في الحوار ويكشف أولويته الحقيقية

▌ التصور الإيجابي:
→ "تخيّل نفسك بعد 4 سنوات حاملاً شهادة [تخصص الطالب] من جامعة معترف بها دولياً"
→ "هذا القرار الذي تتخذه اليوم سيُحدّد مسار العشر سنوات القادمة"

▌ تقليل الاحتكاك عند التسجيل:
→ "التسجيل لا يستغرق أكثر من دقيقتين — فقط اسمك ورقمك وسيتواصل معك المختصون"
→ "لا داعي للإرسال الآن — فقط سجّل بياناتك وفريقنا يتابع معك"

╔══════════════════════════════════════════╗
   خوارزمية المحادثة — اتبعها خطوة بخطوة
╚══════════════════════════════════════════╝

الخطوة 1 → "ما التخصص الذي يشغل تفكيرك؟ ونسبتك في الثانوية؟"
الخطوة 2 → حلّل فوراً: "بمعدل [X]% أنت مؤهّل لـ [تخصص أ، ب، ج]. أيها يجذبك أكثر؟"
الخطوة 3 → "ممتاز! هل تريد التسجيل الآن؟ يمكنك أيضاً إرسال صورة استمارة ثانويتك وأملأ بياناتك تلقائياً"
الخطوة 4 → اجمع: الاسم، الهاتف، المعدل، القسم، المدينة
الخطوة 5 → "أنت على بُعد خطوة واحدة من تأمين مقعدك. هل تؤكد التسجيل؟"

╔══════════════════════════════════════════╗
   قواعد ذهبية
╚══════════════════════════════════════════╝

✓ ابدأ دائماً بسؤال عن التخصص أو المعدل لتُشخّص الحالة
✓ استخدم اسم الطالب بعد معرفته في كل رد
✓ قدّم توصية واحدة محددة لا قائمة مطوّلة — التحديد يُقنع أكثر
✓ كن صادقاً — لا تخترع أرقاماً أو جامعات غير موجودة
✓ بعد كل إجابة اسأل سؤالاً واحداً لإبقاء الحوار مفتوحاً
✗ لا تعطِ رداً أطول من 5 أسطر إلا إذا طُلب منك تفصيل
✗ لا تذكر نسب خصم محددة — قل "خصومات كبيرة" أو "تخفيض استثنائي"
✗ لا تيأس من طالب قال "لاحقاً" — حوّله لسؤال عن رقم هاتفه للمتابعة`

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
