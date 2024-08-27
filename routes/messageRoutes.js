const express = require("express");
const router = express.Router();
const Message = require("../models/messageModels");
const User = require("../models/userModels");

// Anonymous Sender
router.post("/messages", async (req, res) => {
  try {
    const { receiver, content } = req.body;

    // receiver
    const receiverUser = await User.findById(receiver);

    if (!receiverUser) {
      return res.status(404).send("Receiver not found");
    }

    const message = new Message({ receiver, content });
    await message.save();
    res.status(201).send(message);
  } catch (error) {
    res.status(400).send(error);
  }
});

// messages for a user
router.get("/messages", async (req, res) => {
  try {
    const { userId } = req.query;
    if (!userId) {
      return res.status(400).send("User ID is required");
    }

    const messages = await Message.find({ receiver: userId });

    res.send(messages);
  } catch (error) {
    res.status(500).send(error);
  }
});

module.exports = router;
