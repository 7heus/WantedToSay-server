const express = require("express");
const router = express.Router();
const Message = require("../models/messageModels");
const Email = require("../models/emailsModel");
const sec = require("../lib/encryption");
const Secure = new sec();
require("dotenv").config();
const Resend = require("resend").Resend;
const resend = new Resend(process.env.RESEND_KEY);

// Anonymous Sender
router.post("/messages", async (req, res) => {
  const { receiver, content, secretKey } = req.body;
  if (!secretKey) {
    res.status(400).json({
      message: "MISSING secretKey: Please provide an encryption key",
    });
    return;
  }
  // receiver
  Message.create({
    receiver,
    content: Secure.encryptData(content, secretKey),
    secretKey: secretKey,
  })
    .then((msg) => res.status(201).json(msg))
    .catch((err) => res.status(500).json({ message: err }));
});

// messages for a user
router.get("/messages", async (req, res) => {
  const { q } = req.query;
  if (q) {
    const query = q.replace("_", " ");
    Message.find({ receiver: query })
      .then((messages) => res.status(200).json(messages))
      .catch((err) => res.status(500).json({ message: err }));
    return;
  }
  Message.find()
    .then((messages) => res.status(200).json(messages))
    .catch((err) => res.status(500).json({ message: err }));
});

router.post("/messages/decrypt", async (req, res) => {
  const { secretKey, data } = req.body;
  if (!secretKey || !data || !Array.isArray(data)) {
    res.status(400).json({ message: "Provide key and data" });
    return;
  }
  try {
    const decryptedWithKey = [];
    data.map((msg) => {
      msg.content = Secure.decryptData(msg.content, secretKey);
      decryptedWithKey.push(msg);
    });
    res.status(200).json({ data: decryptedWithKey });
  } catch (error) {
    res.status(500).json({ message: error });
  }
});

router.post("/messages/email", async (req, res) => {
  const { sentTo, data } = req.body;
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;
  if (!sentTo || !data) {
    res.status(400).json({ messsage: "Please provide email and data." });
    return;
  }
  if (!emailRegex.test(sentTo)) {
    res.status(400).json({ message: "Provide a valid email address." });
    return;
  }

  await Promise.all([
    resend.emails.send({
      from: "WantedToSay <onboarding@resend.dev>",
      to: [sentTo],
      subject: `Message for you, ${data.receiver}`,
      html: `<h3>To ${data.receiver},</h3>

      <p>${data.content}</p>`,
    }),
    Email.create(req.body),
  ])
    .then(() => res.status(201).json({ message: "Email sent successfully" }))
    .catch((err) =>
      res.status(500).json({ message: `500 Internal server error: ${err}` })
    );
});

module.exports = router;
