const express = require("express");
const mongoose = require("mongoose");
const Comment = require("../models/commentsModel");
const router = express.Router();

router.post("/comments", async (req, res) => {
  //
  const { postId, userPosted } = req.body;
  if (
    !mongoose.isValidObjectId(postId) ||
    !mongoose.isValidObjectId(userPosted)
  ) {
    res
      .status(400)
      .json({ message: "Provide valid post ID and valid user ID." });
    return;
  }

  Comment.create(req.body)
    .then((data) => res.status(201).json(data))
    .catch((err) =>
      res.status(500).json({ message: "Internal server error", error: err })
    );
});

router.get("/comments/post/:id", async (req, res) => {
  const { id } = req.params;
  if (!mongoose.isValidObjectId(id)) {
    res.status(400).json({ message: "Provide a valid post ID." });
    return;
  }
  Comment.find()
    .where({ postId: id })
    .then((data) => res.status(200).json(data))
    .catch((err) =>
      res.status(500).json({ message: "Internal server error", error: err })
    );
});

router.get("/comments/user/:id", async (req, res) => {
  const { id } = req.params;
  if (!mongoose.isValidObjectId(id)) {
    res.status(400).json({ message: "Provide a valid user ID." });
    return;
  }
  Comment.find()
    .where({ userPosted: id })
    .then((data) => res.status(200).json(data))
    .catch((err) =>
      res.status(500).json({ message: "Internal server error", error: err })
    );
});

router.put("/comments/:id", async (req, res) => {
  const { id } = req.params;
  if (!mongoose.isValidObjectId(id)) {
    res.status(400).json({ message: "Provide a valid comment ID." });
    return;
  }
  Comment.findByIdAndUpdate(id, req.body, { new: true })
    .then((data) => res.status(200).json(data))
    .catch((err) =>
      res.status(5000).json({ message: "Internal server error", error: err })
    );
});

router.delete("/comments/:id", async (req, res) => {
  const { id } = req.params;
  if (!mongoose.isValidObjectId(id)) {
    res.status(400).json({ message: "Provide a valid comment ID." });
    return;
  }
  Comment.findByIdAndDelete(id)
    .then(() => res.status(200).send())
    .catch((err) =>
      res.status(500).json({ message: "Internal server error", error: err })
    );
});

router.put("/comments/:id/reactions", async (req, res) => {
  const { id } = req.params;
  const { userId } = req.body;
  if (!mongoose.isValidObjectId(id)) {
    res.status(400).json({ message: "Provide a valid comment ID." });
    return;
  }
  if (!mongoose.isValidObjectId(userId)) {
    res.status(400).json({ message: "Provide a valid user ID." });
    return;
  }
  Comment.findByIdAndUpdate(id, { $push: { reactions: userId } })
    .then((data) => res.status(200).json(data))
    .catch((err) =>
      res.status(500).json({ message: "Internal server error", error: err })
    );
});

router.delete("/comments/:id/reactions", async (req, res) => {
  const { id } = req.params;
  const { userId } = req.body;
  if (!mongoose.isValidObjectId(id)) {
    res.status(400).json({ message: "Provide a valid comment ID." });
    return;
  }
  if (!mongoose.isValidObjectId(userId)) {
    res.status(400).json({ message: "Provide a valid user ID." });
    return;
  }
  Comment.findByIdAndUpdate(id, { $pull: { reactions: userId } })
    .then((data) => res.status(200).json(data))
    .catch((err) =>
      res.status(500).json({ message: "Internal server error", error: err })
    );
});

module.exports = router;
