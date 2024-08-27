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
    unique: true,
  },
  uniqueKey: {
    type: String,
    default: "c001k3y",
  },
});

const User = mongoose.model("User", userSchema);

module.exports = User;
