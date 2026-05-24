import { Router } from "express";
  import { getOrCreateConversation, processMessage } from "../../lib/chatHelper";
  import {
    sendWAText,
    sendWAMainMenu,
    sendWAButtons,
    MENU_RESPONSES,
  } from "../../lib/whatsappSender";

  const router = Router();
  const VERIFY_TOKEN = process.env.WEBHOOK_VERIFY_TOKEN || "almossah_nassir_2024";
  const WA_TOKEN = () => process.env.WHATSAPP_ACCESS_TOKEN || "";
  const PHONE_ID = () => process.env.WHATSAPP_PHONE_NUMBER_ID || "";

  // ── Verification ─────────────────────────────────────────────────────────────
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

  // ── Incoming messages ────────────────────────────────────────────────────────
  router.post("/nassir/webhooks/whatsapp", async (req, res) => {
    res.sendStatus(200); // Always respond fast
    try {
      const body = req.body;
      if (body.object !== "whatsapp_business_account") return;

      for (const entry of body.entry || []) {
        for (const change of entry.changes || []) {
          const messages = change.value?.messages || [];
          for (const msg of messages) {
            const from: string = msg.from;
            const token = WA_TOKEN();
            const phoneId = PHONE_ID();
            if (!token || !phoneId) continue;

            await handleWAMessage(from, msg, token, phoneId);
          }
        }
      }
    } catch (e) {
      console.error("WhatsApp webhook error:", e);
    }
  });

  async function handleWAMessage(
    from: string,
    msg: Record<string, unknown>,
    token: string,
    phoneId: string,
  ) {
    // ── Interactive reply (list or button) ──
    if (msg.type === "interactive") {
      const interactive = msg.interactive as Record<string, unknown>;
      const listReply = interactive?.list_reply as Record<string, string> | undefined;
      const buttonReply = interactive?.button_reply as Record<string, string> | undefined;
      const selectedId = listReply?.id || buttonReply?.id || "";

      if (selectedId === "menu") {
        await sendWAMainMenu(from, token, phoneId);
        return;
      }

      if (selectedId === "ai_chat") {
        await sendWAText(from, "💬 تفضّل، اكتب سؤالك وسأجيبك على الفور:", token, phoneId);
        return;
      }

      const menuItem = MENU_RESPONSES[selectedId];
      if (menuItem) {
        await sendWAText(from, menuItem.text, token, phoneId);
        await sendWAButtons(from, token, phoneId, "ماذا تريد أن تفعل الآن؟", menuItem.buttons);
        return;
      }
    }

    // ── Text message ──
    if (msg.type === "text") {
      const text = (msg.text as Record<string, string>).body?.trim() || "";

      // Keywords that trigger main menu
      const menuTriggers = ["مرحبا", "مرحباً", "هلا", "السلام", "اهلا", "أهلاً", "أهلا", "menu", "قائمة", "ابدأ", "start", "مساء", "صباح", "hi", "hello"];
      const isGreeting = menuTriggers.some((t) => text.includes(t)) || text.length < 8;

      if (isGreeting) {
        await sendWAMainMenu(from, token, phoneId);
        return;
      }

      // Free text → AI response
      const convo = await getOrCreateConversation("whatsapp", from);
      const reply = await processMessage(convo.id, text);

      // Split long replies
      const chunks = splitMessage(reply, 1000);
      for (const chunk of chunks) {
        await sendWAText(from, chunk, token, phoneId);
      }

      // Always offer menu after AI reply
      await sendWAButtons(from, token, phoneId, "هل يمكنني مساعدتك بشيء آخر؟", [
        { id: "menu", title: "🏠 القائمة الرئيسية" },
        { id: "register", title: "📝 التسجيل" },
        { id: "contact", title: "📞 تواصل معنا" },
      ]);
      return;
    }

    // Any other message type → show menu
    await sendWAMainMenu(from, token, phoneId);
  }

  function splitMessage(text: string, maxLen: number): string[] {
    if (text.length <= maxLen) return [text];
    const chunks: string[] = [];
    let i = 0;
    while (i < text.length) {
      let end = Math.min(i + maxLen, text.length);
      // Try to break at a sentence boundary
      if (end < text.length) {
        const lastBreak = text.lastIndexOf("\n", end);
        if (lastBreak > i + maxLen / 2) end = lastBreak + 1;
      }
      chunks.push(text.slice(i, end).trim());
      i = end;
    }
    return chunks.filter(Boolean);
  }

  export default router;
  