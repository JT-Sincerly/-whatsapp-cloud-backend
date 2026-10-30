require("dotenv").config();
const express = require("express");

const app = express();
app.use(express.json());

const PORT = process.env.PORT || 3000;
const VERIFY_TOKEN = process.env.WEBHOOK_VERIFY_TOKEN;
const ACCESS_TOKEN = process.env.WHATSAPP_ACCESS_TOKEN;
const PHONE_NUMBER_ID = process.env.WHATSAPP_PHONE_NUMBER_ID;
const GRAPH_VERSION = process.env.GRAPH_API_VERSION || "v23.0";

// Meta uses this GET endpoint to verify your webhook URL.
app.get("/webhook", (req, res) => {
  const mode = req.query["hub.mode"];
  const token = req.query["hub.verify_token"];
  const challenge = req.query["hub.challenge"];

  if (mode === "subscribe" && token === VERIFY_TOKEN) {
    return res.status(200).send(challenge);
  }
  return res.sendStatus(403);
});

// Meta sends incoming messages and status updates here.
app.post("/webhook", async (req, res) => {
  // Acknowledge quickly so Meta does not retry the webhook.
  res.sendStatus(200);

  try {
    const entry = req.body.entry || [];
    for (const item of entry) {
      for (const change of (item.changes || [])) {
        const value = change.value || {};
        const messages = value.messages || [];

        for (const message of messages) {
          if (!message.from || message.type !== "text") continue;

          const incomingText = (message.text?.body || "").trim();
          console.log("Incoming WhatsApp message:", {
            from: message.from,
            text: incomingText
          });

          // Basic automatic reply. Customize this text whenever you want.
          const reply = `Thanks for messaging us! We received: "${incomingText}". A team member will get back to you shortly.`;

          await sendWhatsAppText(message.from, reply);
        }
      }
    }
  } catch (error) {
    console.error("Webhook processing error:", error.message);
  }
});

async function sendWhatsAppText(to, body) {
  if (!ACCESS_TOKEN || !PHONE_NUMBER_ID) {
    console.error("Missing WHATSAPP_ACCESS_TOKEN or WHATSAPP_PHONE_NUMBER_ID.");
    return;
  }

  const url = `https://graph.facebook.com/${GRAPH_VERSION}/${PHONE_NUMBER_ID}/messages`;
  const response = await fetch(url, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${ACCESS_TOKEN}`,
      "Content-Type": "application/json"
    },
    body: JSON.stringify({
      messaging_product: "whatsapp",
      recipient_type: "individual",
      to,
      type: "text",
      text: { preview_url: false, body }
    })
  });

  const result = await response.json();
  if (!response.ok) {
    console.error("WhatsApp send failed:", result);
    return;
  }
  console.log("WhatsApp reply sent:", result);
}

// Optional endpoint for sending a notification from your own system.
// Protect this endpoint with API_SECRET before exposing it publicly.
app.post("/send-message", async (req, res) => {
  const suppliedSecret = req.get("x-api-secret");
  if (!process.env.API_SECRET || suppliedSecret !== process.env.API_SECRET) {
    return res.sendStatus(401);
  }

  const { to, message } = req.body || {};
  if (!to || !message) {
    return res.status(400).json({ error: "Provide 'to' and 'message'." });
  }

  try {
    const result = await sendWhatsAppText(to, message);
    return res.status(200).json({
      success: true,
      note: "Request processed. Check server logs for the Meta API result."
    });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ error: "Message request failed." });
  }
});

app.get("/", (_req, res) => {
  res.status(200).send("WhatsApp Cloud API backend is running.");
});

app.listen(PORT, () => {
  console.log(`Server listening on port ${PORT}`);
});
