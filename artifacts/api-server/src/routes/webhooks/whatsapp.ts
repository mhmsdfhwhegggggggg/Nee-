import { Router } from "express";
  import { getOrCreateConversation, processMessage } from "../../lib/chatHelper";

  const router = Router();
  const VERIFY_TOKEN = process.env.WEBHOOK_VERIFY_TOKEN || "almossah_nassir_2024";
  const WHATSAPP_TOKEN = process.env.WHATSAPP_ACCESS_TOKEN;
  const PHONE_NUMBER_ID = process.env.WHATSAPP_PHONE_NUMBER_ID;

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

  router.post("/nassir/webhooks/whatsapp", async (req, res) => {
    res.sendStatus(200);
    try {
      const body = req.body;
      if (body.object !== "whatsapp_business_account") return;
      for (const entry of body.entry || []) {
        for (const change of entry.changes || []) {
          for (const msg of change.value?.messages || []) {
            if (msg.type !== "text") continue;
            const from: string = msg.from;
            const text: string = msg.text.body;
            const convo = await getOrCreateConversation("whatsapp", from);
            const reply = await processMessage(convo.id, text);
            await sendWhatsApp(from, reply);
          }
        }
      }
    } catch (e) {
      console.error("WhatsApp webhook error:", e);
    }
  });

  async function sendWhatsApp(to: string, message: string) {
    if (!WHATSAPP_TOKEN || !PHONE_NUMBER_ID) return;
    await fetch(`https://graph.facebook.com/v19.0/${PHONE_NUMBER_ID}/messages`, {
      method: "POST",
      headers: { Authorization: `Bearer ${WHATSAPP_TOKEN}`, "Content-Type": "application/json" },
      body: JSON.stringify({ messaging_product: "whatsapp", to, type: "text", text: { body: message } }),
    });
  }

  export default router;
  