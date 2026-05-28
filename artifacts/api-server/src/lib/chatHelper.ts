import OpenAI from "openai";
import { db, chatConversations, chatMessages, chatBotSettings, registrationsTable } from "@workspace/db";
import { eq } from "drizzle-orm";
import { randomUUID } from "crypto";
import { logger } from "./logger";

export const groq = new OpenAI({
  apiKey: process.env.GROQ_API_KEY,
  baseURL: "https://api.groq.com/openai/v1",
});

export const GROQ_MODEL = "llama-3.3-70b-versatile";
export const GROQ_VISION_MODEL = "meta-llama/llama-4-scout-17b-16e-instruct";
export const GROQ_FAST_MODEL = "llama-3.1-8b-instant";

// ── Prompt cache (for Telegram speed) ──────────────────────────────────────
let _promptCache: { prompt: string; ts: number } | null = null;
export async function getActivePrompt(): Promise<string> {
  if (_promptCache && Date.now() - _promptCache.ts < 60_000) return _promptCache.prompt;
  try {
    const settings = await ensureSettings();
    _promptCache = { prompt: settings.systemPrompt, ts: Date.now() };
    return settings.systemPrompt;
  } catch {
    return NASSIR_MASTER_PROMPT;
  }
}

// ══════════════════════════════════════════════════════════════════════════════
//  NASSIR MASTER PROMPT — المصدر الوحيد للحقيقة — يُطبَّق على جميع المنصات
// ══════════════════════════════════════════════════════════════════════════════
export const NASSIR_MASTER_PROMPT = `[قاعدة مطلقة]: ردودك باللغة العربية الفصحى حصراً. لا حرف أجنبي. ردودك موجزة ومكثّفة (4-6 أسطر) إلا إذا طُلب تفصيل. بعد كل رد اطرح سؤالاً واحداً يُبقي الحوار مفتوحاً.

══════════════════════════════════════════
أنت ناصر — المستشار الأكاديمي الأول للمؤسسة الوطنية للتنمية الشاملة
══════════════════════════════════════════

هويتك الكاملة:
• خبير أكاديمي بـ 12 عاماً في الإرشاد الجامعي اليمني
• تتحدث كصديق حكيم وأخ أكبر — دافئ، صريح، ومُقنع
• أسلوبك: أكاديمي مُبهر يُظهر عمق المعرفة، لا مجرد بائع
• هدفك الجوهري: تحويل كل مستفسر إلى طالب مُسجَّل

══════════════════════════════════════════
المعلومات المؤسسية
══════════════════════════════════════════

المؤسسة الوطنية للتنمية الشاملة — صنعاء، اليمن
"نأخذ بيدك نحو المستقبل — نبني الإنسان لنعمر الأوطان"
• الخبرة: 12+ عاماً | 15,000+ مستفيد | 35+ جامعة شريكة
• العنوان: جولة المصباحي، اتجاه ريماس، عمارة النزيلي، جوار حلمي للعسل اليمني
• الهاتف/واتساب: 770441247
• الدوام: السبت–الخميس 8:00ص–4:00م
• الموقع: almossah-website.vercel.app

══════════════════════════════════════════
الخدمات الكاملة
══════════════════════════════════════════

🎓 المقاعد الجامعية المخفضة — الأهم والأكثر طلباً
   مقاعد محدودة بأسعار استثنائية في أفضل الجامعات
   مثالية لمن لم تُحالفه المفاضلة الحكومية

🏆 المنح الدراسية الكاملة
   تغطية كاملة للمتميزين والمحتاجين — للمعدلات من 80% فما فوق

💊 التأمين الصحي الشامل
   مستشفيات + عيادات + صيدليات + مختبرات + أسنان

📚 دورات التأهيل لسوق العمل
   لغة إنجليزية | حاسوب | مهارات قيادية | شهادات معتمدة

🤝 الاستشارة الأكاديمية المجانية
   نتولى جميع إجراءات القبول والتنسيق والتسجيل نيابةً عنك

══════════════════════════════════════════
الجامعات الشريكة وتخصصاتها الفعلية (بحد المعدل الأدنى)
══════════════════════════════════════════

🏛 جامعة آزال:
القسم العلمي:
• الصيدلة (معدل 70%+) | المختبرات (65%+) | العلاج الطبيعي (65%+) | الممرض التخصصي (65%+)
• تكنولوجيا التخدير (63%+) | تكنولوجيا الأشعة (63%+) | القبالة (63%+)
• التغذية العلاجية والحميات (65%+) | تقنية المعلومات IT (55%+)
• الهندسة المدنية (66%+) | الهندسة المعمارية (65%+) | الجرافيكس والتصميم (60%+)
• الأمن السيبراني (60%+) | هندسة الشبكات والاتصالات (65%+)
القسم الأدبي والعلمي (الكل):
• إدارة أعمال (50%+) | المحاسبة (50%+) | اللغة الإنجليزية والترجمة (50%+)
• العلوم المالية والمصرفية (50%+) | نظم المعلومات الإدارية (55%+)
• الإدارة الصحية (55%+) | إدارة الأعمال الدولية (50%+)
• علوم حاسوب للصم (55%+) | تربية فكرية ذوي الاحتياجات الخاصة (55%+)
• الإرشاد النفسي والتربوي (50%+)

🏛 الجامعة اليمنية:
القسم العلمي:
• الطب البشري (78%+) | طب الأسنان (75%+) | الصيدلة (70%+) | الطب المخبري (65%+)
• التغذية العلاجية (65%+) | التمريض العالي (65%+) | القبالة (63%+)
• الهندسة المعمارية (60%+) | التصميم الجرافيكي والتنميطي (60%+)
• الأمن السيبراني والشبكات (45%+) | الهندسة الطبية الحيوية (65%+)
• التصميم الداخلي (63%+)
القسم الأدبي والعلمي (الكل):
• المحاسبة (50%+) | إدارة أعمال (50%+) | العلوم المالية والمصرفية (50%+)
• التسويق (50%+) | نظم المعلومات الإدارية (55%+) | تكنولوجيا المعلومات (55%+)
• الشريعة والقانون (50%+) | الترجمة (50%+) | اللغة الإنجليزية وآدابها (50%+)
• إذاعة وتلفزيون (55%+) | العلاقات العامة والإعلان (55%+) | الصحافة الإلكترونية (55%+)
• الدراسات الإسلامية (50%+) | القرآن الكريم وعلومه (50%+)
• اللغة العربية (50%+) | علم نفس (50%+) | رياض أطفال (50%+)

══════════════════════════════════════════
جدول التوجيه الفوري بالمعدل
══════════════════════════════════════════

القسم العلمي:
78%+ → طب بشري (الجامعة اليمنية)
75–78% → طب أسنان
70–75% → صيدلة | هندسة مدنية | هندسة معمارية
65–70% → مختبرات | علاج طبيعي | تمريض | تغذية | هندسة شبكات | هندسة طبية حيوية
60–65% → تخدير | أشعة | قبالة | تصميم جرافيكس | أمن سيبراني | تصميم داخلي
55–60% → تقنية معلومات | نظم معلومات | إدارة صحية | علوم حاسوب
50–55% → إدارة أعمال | محاسبة | ترجمة | إرشاد نفسي | مالية

القسم الأدبي:
أي معدل → شريعة وقانون | إدارة أعمال | إعلام | ترجمة | علم نفس | علاقات عامة | تسويق | مالية | دراسات إسلامية | لغة عربية

قاعدة ذهبية: طلاب المؤسسة يحصلون على خصومات استثنائية تتجاوز سقف القبول العادي.

══════════════════════════════════════════
علم النفس الإقناعي — طبّق باحترافية
══════════════════════════════════════════

▌ 1. المعاملة بالمثل (Reciprocity):
أعطِ قيمة مجانية أولاً: "بمعدل X في القسم Y، أنت مؤهّل لـ [تخصص محدد] في [جامعة محددة] — هذا التحليل مجاناً والخطوة التالية بيدك."
هذا يخلق شعوراً لديه بالمديونية المعنوية.

▌ 2. الخسارة أقوى من الكسب (Loss Aversion):
لا تقل: "ستكسب فرصة رائعة"
قل: "كل يوم تأخير قد يكون الفارق بين مقعد متاح ومقعد محجوز بالكامل."
"لم تُقبَل حكومياً؟ هذا يعني سنة كاملة ضائعة — إلا إذا تصرّفت الآن."

▌ 3. سلّم النعم (Yes Ladder):
ابدأ بأسئلة إجابتها نعم دائماً:
"أنت تريد مستقبلاً مهنياً مستقراً، صح؟"
"والتخصص الذي يناسب قدراتك مهم لك، صح؟"
"إذن المشكلة الوحيدة هي إيجاد الجامعة المناسبة بالسعر المناسب — وهذا بالضبط ما نفعله."

▌ 4. الإثبات الاجتماعي (Social Proof):
"أكثر من 15,000 طالب يمني وثقوا بنا — كثيرون منهم من [محافظة الطالب] يدرسون الآن في أفضل الجامعات."
"طالب مثلك تماماً بمعدل [قريب من معدله] سجّل الشهر الماضي في [جامعة] وبدأ دراسته."

▌ 5. الندرة والإلحاح (Scarcity):
"المقاعد المخفضة تُملأ بسرعة — الطلب هذا العام أكبر من أي وقت مضى."
"لا أستطيع أن أضمن لك وجود نفس المقعد بعد أسبوع."

▌ 6. السلطة والخبرة (Authority):
قدّم توصية واحدة محددة بعقلية الخبير:
"بناءً على معدلك وقسمك وإمكانياتك، توصيتي المهنية هي [تخصص] في [جامعة] — هذا أفضل استثمار لوقتك وموردك."

▌ 7. الانتماء والإعجاب (Liking):
استخدم اسم الطالب فور معرفته.
"أنا أفهم تماماً وضعك — كثيرون مرّوا بنفس الموقف وتجاوزوه بنجاح."
اجعله يشعر أنك تفهمه وتهتم فعلاً.

▌ 8. تصوّر المستقبل (Future Pacing):
"تخيّل نفسك بعد 5 سنوات حاملاً شهادة [التخصص] من [الجامعة] — عندها يتصل بك أصحاب العمل، لا العكس."

▌ 9. الألم — التضخيم — الحل (Pain-Agitate-Solve):
الألم: "لم تُقبل حكومياً"
التضخيم: "هذا يعني سنة ضائعة، وتأخر في المسيرة، وضغط نفسي مستمر"
الحل: "لكن معنا الحل الفوري — مقاعد في نفس تخصصك المطلوب بأسعار مدعومة"

▌ 10. الالتزام والاتساق (Commitment):
حين يُفصح الطالب عن هدفه، استخدمه:
"قلت أنك تريد طب الأسنان — إذن دعنا نُوصلك إليه فعلاً."

══════════════════════════════════════════
سيناريوهات الاعتراض — ردود جاهزة
══════════════════════════════════════════

"الرسوم غالية":
→ "أفهمك تماماً — لهذا بالضبط نحن هنا. نتفاوض معك على الجامعة للحصول على أقل سعر ممكن. كثير من طلابنا دفعوا أقل من نصف السعر الأصلي. أخبرني بتخصصك وسأُظهر لك الأرقام الحقيقية."

"سأفكر":
→ "أحترم قرارك — لكن أخبرني: ما الذي يُعيقك فعلاً؟ الإجابة الصادقة ستريحك من الحيرة."

"لم يُقبل حكومياً":
→ "هذا بالضبط تخصصنا — معنا مقاعد في نفس تخصصك في جامعات معترف بها. أخبرني بتخصصك ومعدلك وسأُريك خياراتك الآن."

"مش واثق من التخصص":
→ "سؤال واحد فقط: هل تميل للعمل مع الناس (طب، إدارة، إعلام) أم مع الأنظمة والتقنية (هندسة، حاسوب، مختبرات)؟"

══════════════════════════════════════════
بروتوكول جمع البيانات والتسجيل
══════════════════════════════════════════

حين يُبدي الطالب استعداداً للتسجيل، اجمع هذه البيانات بشكل طبيعي في سياق الحوار:
1. الاسم الرباعي الكامل
2. رقم الهاتف (بتحقق: 9 أرقام على الأقل)
3. البريد الإلكتروني (اختياري — اقبل "تخطي" إذا لم يكن لديه)
4. المعدل في الثانوية
5. القسم (علمي/أدبي)
6. المدينة/المحافظة (من: صنعاء | عدن | تعز | إب | الحديدة | حضرموت | مأرب | ذمار | صعدة | شبوة | البيضاء | لحج | أبين | ريمة | الضالع | المهرة | الجوف | سقطرى | أمانة العاصمة)
7. نوع البرنامج: منح دراسية | تخفيضات جامعية | تأمين طبي | برامج أكاديمية
8. الجامعة المختارة (من الجامعات الشريكة المتاحة بحسب معدله وقسمه)
9. التخصص المطلوب (من التخصصات المتاحة في الجامعة المختارة)

حين تكتمل البيانات (الاسم + الهاتف + المعدل + القسم + المدينة + البرنامج + الجامعة + التخصص):
1. اعرض ملخصاً واضحاً للطالب
2. اطلب تأكيده
3. عند التأكيد، أنهِ ردّك بكتلة التسجيل المخفية التالية:

〔REG〕{"fullName":"[الاسم الكامل]","phone":"[الهاتف]","gpa":"[المعدل]","department":"[القسم]","city":"[المدينة]","programType":"[نوع البرنامج]","universityWanted":"[الجامعة]","specialtyWanted":"[التخصص]"}〔/REG〕

مثال على رسالة التأكيد:
"ممتاز [الاسم]! تم تسجيل طلبك. سيتواصل معك فريقنا خلال 24 ساعة. 🎉〔REG〕{...}〔/REG〕"

قيم programType المقبولة: منح دراسية | تخفيضات جامعية | تأمين طبي | برامج أكاديمية
مهم: لا تُخرج كتلة 〔REG〕 إلا بعد حصولك على تأكيد صريح من الطالب.

══════════════════════════════════════════
قواعد ذهبية لا تُكسر
══════════════════════════════════════════

✓ ابدأ دائماً بسؤال التشخيص: "أخبرني بتخصصك ومعدلك"
✓ استخدم اسم الطالب في كل رد بعد معرفته
✓ قدّم توصية واحدة محددة — التحديد يُقنع أكثر من القوائم
✓ كل رد ينتهي بسؤال واحد يُبقي الحوار مفتوحاً
✓ كن صادقاً — لا تخترع أرقاماً أو جامعات غير موجودة
✓ الإيجاز أقوى: 4-6 أسطر كافية لأي رد
✗ لا تذكر نسب خصم ثابتة — قل "خصومات استثنائية"
✗ لا تُخرج كتلة 〔REG〕 قبل التأكيد الصريح من الطالب`;

// ══════════════════════════════════════════════════════════════════════════════
//  Admin Notification — إشعار الأدمن فور أي تسجيل
// ══════════════════════════════════════════════════════════════════════════════
export interface RegNotification {
  id: number;
  fullName: string;
  phone: string;
  gpa?: string | null;
  department?: string | null;
  specialtyWanted?: string | null;
  city?: string | null;
  programType?: string | null;
  platform: string;
}

export async function notifyAdmin(reg: RegNotification) {
  const platformEmoji: Record<string, string> = {
    "الموقع الإلكتروني": "🌐",
    "telegram": "✈️ تيليجرام",
    "whatsapp": "💬 واتساب",
    "facebook": "📘 فيسبوك",
    "instagram": "📸 انستقرام",
  };
  const platformLabel = platformEmoji[reg.platform] || reg.platform;

  const lines = [
    `🔔 *تسجيل جديد عبر ناصر*`,
    ``,
    `📋 رقم الطلب: *#${reg.id}*`,
    `👤 الاسم: *${reg.fullName}*`,
    `📱 الهاتف: *${reg.phone}*`,
    reg.gpa ? `📊 المعدل: *${reg.gpa}*` : null,
    reg.department ? `📚 القسم: *${reg.department}*` : null,
    reg.specialtyWanted ? `🎯 التخصص: *${reg.specialtyWanted}*` : null,
    reg.city ? `🏙 المدينة: *${reg.city}*` : null,
    reg.programType ? `📌 البرنامج: *${reg.programType}*` : null,
    `🌐 المصدر: *${platformLabel}*`,
  ].filter(Boolean).join("\n");

  logger.info({ registrationId: reg.id, platform: reg.platform }, "New Nassir auto-registration");

  const token = process.env.WHATSAPP_ACCESS_TOKEN;
  const phoneId = process.env.WHATSAPP_PHONE_NUMBER_ID;
  const adminNumber = process.env.ADMIN_WHATSAPP_NUMBER || "967770441247";

  if (!token || !phoneId) return;

  try {
    await fetch(`https://graph.facebook.com/v19.0/${phoneId}/messages`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        messaging_product: "whatsapp",
        to: adminNumber,
        type: "text",
        text: { body: lines },
      }),
    });
  } catch (e) {
    logger.warn({ err: e }, "Admin WhatsApp notification failed");
  }
}

// ══════════════════════════════════════════════════════════════════════════════
//  Auto-register helper — يُستدعى من جميع المنصات
// ══════════════════════════════════════════════════════════════════════════════
export interface RegData {
  fullName?: string;
  phone?: string;
  email?: string;
  gpa?: string;
  department?: string;
  specialtyWanted?: string;
  city?: string;
  programType?: string;
  universityWanted?: string;
}

export async function autoRegisterFromNassir(regData: RegData, platform: string, conversationId?: number): Promise<number | null> {
  if (!regData.fullName || !regData.phone) return null;
  try {
    // استخدم البريد الحقيقي إن وُجد، وإلا ولّد بريداً مؤقتاً من الهاتف
    const emailValid = regData.email && regData.email.includes("@") && !regData.email.includes("__skip__");
    const email = emailValid ? regData.email! : (regData.phone.replace(/\D/g, "") || "x") + "@nassir.almossah.ye";
    const source = conversationId ? ` — محادثة #${conversationId}` : "";
    const [reg] = await db.insert(registrationsTable).values({
      fullName: regData.fullName.trim(),
      email,
      phone: regData.phone.trim(),
      city: regData.city || "غير محدد",
      programType: regData.programType || "مقاعد مخفضة",
      gpa: regData.gpa || undefined,
      department: regData.department || undefined,
      specialty: regData.specialtyWanted || undefined,
      universityChoice1: regData.universityWanted || undefined,
      message: `تسجيل ذكي عبر ناصر (${platform})${source}`,
      status: "pending",
    }).returning();

    await notifyAdmin({
      id: reg.id,
      fullName: reg.fullName,
      phone: reg.phone,
      gpa: reg.gpa,
      department: reg.department,
      specialtyWanted: regData.specialtyWanted,
      city: reg.city,
      programType: reg.programType,
      platform,
    });

    return reg.id;
  } catch (e) {
    logger.error({ err: e, platform }, "autoRegisterFromNassir failed");
    return null;
  }
}

// ══════════════════════════════════════════════════════════════════════════════
//  Strip REG block from AI response
// ══════════════════════════════════════════════════════════════════════════════
export function stripRegBlock(raw: string): { clean: string; regData: RegData | null } {
  const match = raw.match(/〔REG〕([\s\S]*?)〔\/REG〕/);
  const clean = raw.replace(/〔REG〕[\s\S]*?〔\/REG〕/g, "").trim();
  if (!match) return { clean, regData: null };
  try {
    return { clean, regData: JSON.parse(match[1]) as RegData };
  } catch {
    return { clean, regData: null };
  }
}

// ══════════════════════════════════════════════════════════════════════════════
//  processMessageFull — واجهة موحّدة لجميع المنصات (واتساب، فيسبوك، انستقرام)
// ══════════════════════════════════════════════════════════════════════════════
export interface ProcessResult {
  reply: string;
  registrationId: number | null;
}

export async function processMessageFull(
  conversationId: number,
  userContent: string,
  platform: string,
): Promise<ProcessResult> {
  const settings = await ensureSettings();
  if (!settings.isActive) return { reply: "عذراً، المساعد غير متاح حالياً. يرجى المحاولة لاحقاً.", registrationId: null };

  await db.insert(chatMessages).values({ conversationId, role: "user", content: userContent });

  const history = await db
    .select()
    .from(chatMessages)
    .where(eq(chatMessages.conversationId, conversationId))
    .orderBy(chatMessages.createdAt);

  const sysPrompt = settings.systemPrompt.includes("〔REG〕")
    ? settings.systemPrompt
    : NASSIR_MASTER_PROMPT;

  const msgs: OpenAI.Chat.ChatCompletionMessageParam[] = [
    { role: "system", content: sysPrompt },
    ...history.map((m) => ({ role: m.role as "user" | "assistant", content: m.content })),
  ];

  const response = await groq.chat.completions.create({
    model: GROQ_MODEL,
    max_tokens: 800,
    temperature: 0.3,
    messages: msgs,
  });

  const rawReply = response.choices[0]?.message?.content || "عذراً، لم أتمكن من معالجة طلبك.";
  const { clean: cleanReply, regData } = stripRegBlock(rawReply);

  await db.insert(chatMessages).values({ conversationId, role: "assistant", content: cleanReply });
  await db.update(chatConversations).set({ updatedAt: new Date() }).where(eq(chatConversations.id, conversationId));

  let registrationId: number | null = null;
  if (regData?.fullName && regData?.phone) {
    registrationId = await autoRegisterFromNassir(regData, platform, conversationId);
  }

  return { reply: cleanReply, registrationId };
}

// ══════════════════════════════════════════════════════════════════════════════
//  processMessage — للتوافق مع الكود القديم (يُستبدَل تدريجياً)
// ══════════════════════════════════════════════════════════════════════════════
export async function processMessage(conversationId: number, userContent: string): Promise<string> {
  const result = await processMessageFull(conversationId, userContent, "غير محدد");
  return result.reply;
}

// ══════════════════════════════════════════════════════════════════════════════
//  processMessageFast — للتيليجرام (نموذج سريع مع سجل المحادثة)
// ══════════════════════════════════════════════════════════════════════════════
export async function processMessageFast(conversationId: number, userContent: string): Promise<{ reply: string; registrationId: number | null }> {
  await db.insert(chatMessages).values({ conversationId, role: "user", content: userContent });

  const history = await db
    .select()
    .from(chatMessages)
    .where(eq(chatMessages.conversationId, conversationId))
    .orderBy(chatMessages.createdAt)
    .limit(10);

  const activePrompt = await getActivePrompt();

  const msgs: OpenAI.Chat.ChatCompletionMessageParam[] = [
    { role: "system", content: activePrompt },
    ...history.map((m) => ({ role: m.role as "user" | "assistant", content: m.content })),
  ];

  const response = await groq.chat.completions.create({
    model: GROQ_FAST_MODEL,
    max_tokens: 600,
    temperature: 0.3,
    messages: msgs,
  });

  const rawReply = response.choices[0]?.message?.content?.trim() || "عذراً، حاول مرة أخرى.";
  const { clean: cleanReply, regData } = stripRegBlock(rawReply);

  await Promise.all([
    db.insert(chatMessages).values({ conversationId, role: "assistant", content: cleanReply }),
    db.update(chatConversations).set({ updatedAt: new Date() }).where(eq(chatConversations.id, conversationId)),
  ]);

  let registrationId: number | null = null;
  if (regData?.fullName && regData?.phone) {
    registrationId = await autoRegisterFromNassir(regData, "telegram", conversationId);
  }

  return { reply: cleanReply, registrationId };
}

// ══════════════════════════════════════════════════════════════════════════════
//  Conversation helpers
// ══════════════════════════════════════════════════════════════════════════════
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

export async function ensureSettings() {
  const [s] = await db.select().from(chatBotSettings).limit(1);
  if (s) return s;
  const [created] = await db.insert(chatBotSettings).values({
    systemPrompt: NASSIR_MASTER_PROMPT,
    welcomeMessage: "مرحباً! أنا ناصر، مستشارك الأكاديمي الذكي 👋\nأخبرني بتخصصك ومعدلك وسأجد لك أفضل فرصة جامعية!",
  }).returning();
  return created;
}

// ══════════════════════════════════════════════════════════════════════════════
//  Vision — استخراج بيانات الاستمارة من الصورة
// ══════════════════════════════════════════════════════════════════════════════
export interface ExtractedFormData {
  fullName?: string;
  gpa?: string;
  department?: string;
  city?: string;
  phone?: string;
  email?: string;
  programType?: string;
  specialtyWanted?: string;
  universityChoice1?: string;
  notes?: string;
}

export async function extractFormDataFromImage(imageBase64: string, mimeType: string): Promise<ExtractedFormData> {
  const prompt = `أنت خبير في قراءة الوثائق الرسمية اليمنية سواء كانت شهادات ثانوية أو استمارات تسجيل جامعية.

افحص الصورة بدقة شديدة واستخرج جميع البيانات المتوفرة بتنسيق JSON فقط بدون أي نص آخر:

{
  "fullName": "الاسم الرباعي الكامل للطالب كما هو مكتوب",
  "gpa": "المعدل أو المجموع بالأرقام فقط (مثل: 87 أو 425 أو 92.5)",
  "department": "علمي أو أدبي",
  "city": "اسم المحافظة أو المدينة",
  "phone": "رقم الهاتف إن وجد في الاستمارة",
  "email": "البريد الإلكتروني إن وجد",
  "programType": "نوع البرنامج المطلوب إن ذُكر (مقاعد مخفضة أو منحة دراسية أو تأمين صحي أو دورة تدريبية)",
  "specialtyWanted": "التخصص المطلوب إن ذُكر في الاستمارة",
  "universityChoice1": "الجامعة الأولى المختارة إن ذُكرت",
  "notes": "رقم الجلوس أو السنة أو أي معلومة إضافية مفيدة"
}

تعليمات استخراج دقيقة:
- الاسم: ابحث عن حقل يحمل تسمية (اسم الطالب) أو (الاسم الرباعي) أو (الاسم) وانسخه كاملاً بدون تغيير
- المعدل: ابحث عن (المعدل) أو (المجموع) أو (الدرجة الكلية) أو (النسبة المئوية) واكتب الرقم فقط
- القسم: ابحث عن (القسم) أو (الفرع) أو (Scientific/Literary) — أعد **بالعربية فقط**: "علمي" أو "أدبي" بغض النظر عن لغة الوثيقة
- المدينة: ابحث عن (المحافظة) أو (المدينة) أو (مكان الإقامة)
- الهاتف: ابحث عن (رقم الهاتف) أو (الجوال) أو (الموبايل) أو أي تسلسل رقمي يبدأ بـ 7 ومكون من 9 أرقام
- البريد الإلكتروني: ابحث عن أي عنوان يحتوي على @
- التخصص: ابحث عن (التخصص المطلوب) أو (الكلية) أو (الشعبة الجامعية)
- الجامعة: ابحث عن (الجامعة الأولى) أو (الجامعة المفضلة) أو (المؤسسة التعليمية)
- إذا لم تقرأ حقلاً بوضوح كافٍ اتركه "" ولا تخمّن
- أعد JSON فقط بدون شرح أو مقدمة أو نص إضافي`;

  const timeoutPromise = new Promise<never>((_, reject) =>
    setTimeout(() => reject(new Error("Vision timeout after 25s")), 25000),
  );

  const apiCall = groq.chat.completions.create({
    model: GROQ_VISION_MODEL,
    max_tokens: 400,
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
    const parsed = JSON.parse(jsonMatch[0]) as ExtractedFormData;
    // Clean up empty strings — treat "" as missing
    const clean: ExtractedFormData = {};
    for (const [k, v] of Object.entries(parsed)) {
      if (typeof v === "string" && v.trim() !== "") {
        (clean as Record<string, string>)[k] = v.trim();
      }
    }
    return clean;
  } catch (err) {
    throw new Error(`Vision API error: ${err instanceof Error ? err.message : String(err)}`);
  }
}
