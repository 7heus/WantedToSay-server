const mongoose = require("mongoose");

const emailSchema = new mongoose.Schema({
  sentTo: { type: String, required: true },
  data: {
    receiver: { type: String, required: true },
    content: { type: String },
  },
  sender: { type: mongoose.SchemaTypes.ObjectId, required: true, ref: "User" },
});

const Email = mongoose.model("Email", emailSchema);

module.exports = Email;
