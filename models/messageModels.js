const mongoose = require("mongoose");

const messageSchema = new mongoose.Schema({
  receiver: {
    type: String,
    default: "Anonymous receiver",
  },
  content: {
    type: String,
    required: true,
  },
  timestamp: {
    type: Date,
    default: Date.now,
  },
});

const Message = mongoose.model("Message", messageSchema);

module.exports = Message;
