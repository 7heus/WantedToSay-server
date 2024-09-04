const mongoose = require("mongoose");

const userSchema = new mongoose.Schema({
  email: {
    type: String,
    required: true,
    unique: true,
  },
  password: {
    type: String,
    required: true,
  },
  name: {
    type: String,
    required: true,
  },
  uniqueKey: {
    type: String,
    default: "c001k3y",
  },
  isVerified: {
    type: Boolean,
    default: false,
  },
  avatar: { type: String, required: true },
});

const User = mongoose.model("User", userSchema);

module.exports = User;
