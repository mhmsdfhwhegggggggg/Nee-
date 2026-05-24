import { logger } from "./logger";

  const GRAPH_API = "https://graph.facebook.com/v19.0";

  // ── Send plain text ──────────────────────────────────────────────────────────
  export async function sendWAText(to: string, text: string, token: string, phoneId: string) {
    return sendWAMessage(to, token, phoneId, {
      type: "text",
      text: { body: text, preview_url: false },
    });
  }

  // ── Send interactive LIST menu ────────────────────────────────────────────────
  export async function sendWAMainMenu(to: string, token: string, phoneId: string) {
    return sendWAMessage(to, token, phoneId, {
      type: "interactive",
      interactive: {
        type: "list",
        header: { type: "text", text: "🏛 المؤسسة الوطنية للتنمية الشاملة" },
        body: {
          text: "أهلاً وسهلاً! أنا ناصر، مساعدك الذكي 👋\nاختر ما تريد الاستفسار عنه:",
        },
        footer: { text: "نبني الإنسان لنعمر الأوطان" },
        action: {
          button: "عرض الخيارات",
          sections: [
            {
              title: "الخدمات التعليمية",
              rows: [
                { id: "grants", title: "🎓 المنح الدراسية", description: "منح كاملة للمتميزين والمحتاجين" },
                { id: "discounts", title: "📚 التخفيضات الجامعية", description: "خصومات تصل إلى 70%" },
                { id: "training", title: "💡 الدورات التدريبية", description: "لغة إنجليزية، حاسوب، مهارات" },
              ],
            },
            {
              title: "الخدمات الصحية والتسجيل",
              rows: [
                { id: "insurance", title: "🏥 التأمين الصحي", description: "تغطية شاملة للفرد والأسرة" },
                { id: "register", title: "📝 التسجيل الآن", description: "سجّل في خدماتنا" },
                { id: "contact", title: "📞 تواصل معنا", description: "عناوين وأوقات الدوام" },
              ],
            },
          ],
        },
      },
    });
  }

  // ── Send quick-reply buttons (max 3) ─────────────────────────────────────────
  export async function sendWAButtons(
    to: string,
    token: string,
    phoneId: string,
    bodyText: string,
    buttons: Array<{ id: string; title: string }>,
  ) {
    return sendWAMessage(to, token, phoneId, {
      type: "interactive",
      interactive: {
        type: "button",
        body: { text: bodyText },
        action: {
          buttons: buttons.map((b) => ({ type: "reply", reply: { id: b.id, title: b.title } })),
        },
      },
    });
  }

  // ── Core send function ───────────────────────────────────────────────────────
  async function sendWAMessage(to: string, token: string, phoneId: string, payload: object) {
    try {
      const res = await fetch(`${GRAPH_API}/${phoneId}/messages`, {
        method: "POST",
        headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
        body: JSON.stringify({ messaging_product: "whatsapp", recipient_type: "individual", to, ...payload }),
      });
      if (!res.ok) {
        const err = await res.text();
        logger.error({ status: res.status, body: err }, "WhatsApp send error");
      }
    } catch (e) {
      logger.error({ err: e }, "WhatsApp API exception");
    }
  }

  // ── Menu response content ───────────────────────────────────────────────────
  export const MENU_RESPONSES: Record<string, { text: string; buttons: Array<{ id: string; title: string }> }> = {
    grants: {
      text: `🎓 *المنح الدراسية الكاملة*

  توفر المؤسسة الوطنية منحاً دراسية كاملة تغطي الرسوم الدراسية بالكامل للطلاب المتميزين والمحتاجين.

  ✅ تغطية كاملة للرسوم الدراسية
  ✅ متاحة في أكثر من 35 جامعة ومعهد
  ✅ لمختلف التخصصات العلمية والإنسانية
  ✅ إرشاد أكاديمي متخصص

  للتقديم، زر موقعنا أو اضغط "التسجيل الآن"`,
      buttons: [
        { id: "register", title: "📝 التسجيل الآن" },
        { id: "discounts", title: "📚 التخفيضات" },
        { id: "menu", title: "🏠 القائمة الرئيسية" },
      ],
    },
    discounts: {
      text: `📚 *التخفيضات الجامعية*

  خصومات حصرية بالشراكة مع كبرى الجامعات والمعاهد اليمنية:

  ✅ خصومات تصل إلى 70% على الرسوم
  ✅ شبكة من 35+ جامعة ومعهداً معتمداً
  ✅ تخصصات متنوعة: طب، هندسة، أعمال، تقنية وأكثر
  ✅ شراكات حكومية وخاصة

  سجّل الآن وابدأ مسيرتك الأكاديمية!`,
      buttons: [
        { id: "register", title: "📝 التسجيل الآن" },
        { id: "grants", title: "🎓 المنح الكاملة" },
        { id: "menu", title: "🏠 القائمة الرئيسية" },
      ],
    },
    insurance: {
      text: `🏥 *التأمين الصحي الشامل*

  بطاقة تأمين صحية لك ولأسرتك بأسعار ميسورة:

  ✅ شبكة من أفضل المستشفيات في اليمن
  ✅ زيارات طبية وفحوصات دورية مدعومة
  ✅ مختبرات طبية وتحاليل معتمدة
  ✅ باقات للفرد أو الأسرة بالكامل
  ✅ خصومات في الصيدليات المعتمدة

  احمِ صحتك وصحة عائلتك اليوم!`,
      buttons: [
        { id: "register", title: "📝 سجّل للتأمين" },
        { id: "contact", title: "📞 تواصل معنا" },
        { id: "menu", title: "🏠 القائمة الرئيسية" },
      ],
    },
    training: {
      text: `💡 *الدورات التدريبية*

  دورات مكثفة لتطوير مهاراتك ومستقبلك المهني:

  ✅ اللغة الإنجليزية (مستويات مختلفة)
  ✅ الحاسوب وتقنية المعلومات
  ✅ مهارات سوق العمل والوظيفة
  ✅ شهادات معتمدة
  ✅ مدربون متخصصون

  استثمر في نفسك — سجّل الآن!`,
      buttons: [
        { id: "register", title: "📝 التسجيل في الدورات" },
        { id: "grants", title: "🎓 المنح الدراسية" },
        { id: "menu", title: "🏠 القائمة الرئيسية" },
      ],
    },
    register: {
      text: `📝 *التسجيل في خدمات المؤسسة*

  يمكنك التسجيل عبر موقعنا الرسمي مباشرةً:

  🌐 almossah-website.vercel.app

  - للتسجيل الدراسي: قسم /register
  - للدورات والتأمين: قسم /training-register

  أو تواصل معنا مباشرةً وسيساعدك فريقنا.

  ⏰ ساعات العمل: السبت-الخميس 8ص-4م`,
      buttons: [
        { id: "contact", title: "📞 تواصل مباشر" },
        { id: "ai_chat", title: "💬 اسأل ناصر" },
        { id: "menu", title: "🏠 القائمة الرئيسية" },
      ],
    },
    contact: {
      text: `📞 *معلومات التواصل*

  🏛 المؤسسة الوطنية للتنمية الشاملة

  📍 العنوان: أمانة العاصمة، شارع الزبيري، صنعاء

  ⏰ أوقات الدوام:
  السبت - الخميس: 8:00 صباحاً - 4:00 مساءً
  الجمعة: مغلق

  🌐 الموقع: almossah-website.vercel.app

  يسعدنا خدمتك!`,
      buttons: [
        { id: "grants", title: "🎓 المنح الدراسية" },
        { id: "insurance", title: "🏥 التأمين الصحي" },
        { id: "menu", title: "🏠 القائمة الرئيسية" },
      ],
    },
  };
  