const express = require("express");
const app = express();
app.use(express.json());

const TOKEN = process.env.WA_TOKEN;
const PHONE_ID = process.env.PHONE_NUMBER_ID;
const VERIFY = process.env.VERIFY_TOKEN;
const BOOK = "https://hormowell.opdpilot.in/patient-portal/";

const DOCS = {
  kas_dur: {
    name: "Dr. Rajeev Kasliwal", role: "Endocrinologist",
    place: "Hormowell Centre, Durgapura",
    map: "https://maps.app.goo.gl/Q5RfziscZRPVmuC38",
  },
  kas_pra: {
    name: "Dr. Rajeev Kasliwal", role: "Endocrinologist",
    place: "Hormowell Centre, Pratap Nagar",
    map: "https://share.google/cS3E2eXmx1JhAIxJW",
  },
  sri_dur: {
    name: "Dr. Srishti Jain", role: "Pulmonologist & Critical Care Specialist",
    place: "Hormowell Centre, Durgapura",
    map: "https://maps.app.goo.gl/Q5RfziscZRPVmuC38",
  },
};

const TRIGGERS = ["hi","hello","hey","namaste","नमस्ते","appointment",
  "book appointment","doctor","location","menu","back"];

async function send(to, payload) {
  await fetch(`https://graph.facebook.com/v20.0/${PHONE_ID}/messages`, {
    method: "POST",
    headers: { Authorization: `Bearer ${TOKEN}`, "Content-Type": "application/json" },
    body: JSON.stringify({ messaging_product: "whatsapp", to, ...payload }),
  });
}

const menu = (to) => send(to, {
  type: "interactive",
  interactive: {
    type: "button",
    body: { text: "नमस्ते! 👋\nHormowell Centre में आपका स्वागत है।\n\nआप किस डॉक्टर से और किस centre पर मिलना चाहते हैं?" },
    action: { buttons: [
      { type: "reply", reply: { id: "kas_dur", title: "Kasliwal-Durgapura" } },
      { type: "reply", reply: { id: "kas_pra", title: "Kasliwal-Pratap Ngr" } },
      { type: "reply", reply: { id: "sri_dur", title: "Srishti-Durgapura" } },
    ]},
  },
});

const details = (to, id) => {
  const d = DOCS[id];
  return send(to, { type: "text", text: { preview_url: false, body:
`${d.name}
${d.role}

📍 ${d.place}

🗺️ Google Maps Location:
${d.map}

📅 Book Appointment:
${BOOK}` }});
};

app.get("/webhook", (req, res) => {
  if (req.query["hub.verify_token"] === VERIFY)
    return res.send(req.query["hub.challenge"]);
  res.sendStatus(403);
});

app.post("/webhook", async (req, res) => {
  res.sendStatus(200);
  const msg = req.body?.entry?.[0]?.changes?.[0]?.value?.messages?.[0];
  if (!msg) return;
  const from = msg.from;

  if (msg.type === "interactive") {
    const id = msg.interactive?.button_reply?.id;
    if (DOCS[id]) await details(from, id);
  } else if (msg.type === "text") {
    const t = msg.text.body.trim().toLowerCase();
    if (TRIGGERS.includes(t)) await menu(from);
  }
});

app.listen(process.env.PORT || 3000);
