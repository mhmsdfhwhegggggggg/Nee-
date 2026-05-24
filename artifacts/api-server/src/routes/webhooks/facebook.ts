import { Router } from "express";
  import { getOrCreateConversation, processMessage } from "../../lib/chatHelper";

  const router = Router();
  const VERIFY_TOKEN = process.env.WEBHOOK_VERIFY_TOKEN || "almossah_nassir_2024";
  const FB_PAGE_TOKEN = process.env.FACEBOOK_PAGE_ACCESS_TOKEN;
  const IG_TOKEN = process.env.INSTAGRAM_ACCESS_TOKEN;

  router.get("/nassir/webhooks/facebook", (req, res) => {
    const mode = req.query["hub.mode"];
    const token = req.query["hub.verify_token"];
    const challenge = req.query["hub.challenge"];
    if (mode === "subscribe" && token === VERIFY_TOKEN) {
      res.status(200).send(challenge);
    } else {
      res.status(403).json({ error: "Verify token mismatch" });
    }
  });

  router.post("/nassir/webhooks/facebook", async (req, res) => {
    res.sendStatus(200);
    try {
      const body = req.body;
      if (body.object === "page") {
        for (const entry of body.entry || []) {
          for (const event of entry.messaging || []) {
            if (!event.message?.text) continue;
            const convo = await getOrCreateConversation("facebook", event.sender.id);
            const reply = await processMessage(convo.id, event.message.text);
            await sendFacebook(event.sender.id, reply);
          }
        }
      }
      if (body.object === "instagram") {
        for (const entry of body.entry || []) {
          for (const event of entry.messaging || []) {
            if (!event.message?.text) continue;
            const convo = await getOrCreateConversation("instagram", event.sender.id);
            const reply = await processMessage(convo.id, event.message.text);
            await sendInstagram(event.sender.id, reply);
          }
        }
      }
    } catch (e) {
      console.error("Facebook webhook error:", e);
    }
  });

  async function sendFacebook(recipientId: string, message: string) {
    if (!FB_PAGE_TOKEN) return;
    await fetch("https://graph.facebook.com/v19.0/me/messages", {
      method: "POST",
      headers: { Authorization: `Bearer ${FB_PAGE_TOKEN}`, "Content-Type": "application/json" },
      body: JSON.stringify({ recipient: { id: recipientId }, message: { text: message } }),
    });
  }

  async function sendInstagram(recipientId: string, message: string) {
    if (!IG_TOKEN) return;
    await fetch("https://graph.facebook.com/v19.0/me/messages", {
      method: "POST",
      headers: { Authorization: `Bearer ${IG_TOKEN}`, "Content-Type": "application/json" },
      body: JSON.stringify({ recipient: { id: recipientId }, message: { text: message } }),
    });
  }

  export default router;
  