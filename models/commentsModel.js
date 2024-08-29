const mongoose = require("mongoose");
const { Schema, model } = mongoose;

const commentSchema = new Schema({
  content: { type: String, required: true },
  postId: {
    type: mongoose.SchemaTypes.ObjectId,
    required: true,
  },
  userPosted: {
    type: mongoose.SchemaTypes.ObjectId,
    required: true,
  },
  reactions: [{ type: mongoose.SchemaTypes.ObjectId, unique: true }],
  timePosted: { type: Date, default: Date.now },
});

const Comment = model("Comment", commentSchema);

module.exports = Comment;
