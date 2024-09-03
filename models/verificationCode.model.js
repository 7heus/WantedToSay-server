const mongoose = require("mongoose");
const { Schema, model } = mongoose;

const verifyCodesSchema = new Schema({
  email: { type: String, required: true, unique: true },
  code: { type: String, required: true, maxLength: 6 },
  expiry: { type: Date, expires: 60 },
});

const verifyModel = model("VerifyCode", verifyCodesSchema);

module.exports = verifyModel;
