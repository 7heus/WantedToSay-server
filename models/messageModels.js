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
  color: {
    type: String,
    default: "#FFFFFF",
    required: true,
    validate: /^#?([A-F0-9]{6}|[A-F0-9]{3})$/,
  },
});

const Message = mongoose.model("Message", messageSchema);

module.exports = Message;
