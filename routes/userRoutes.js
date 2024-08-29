const express = require("express");
const router = express.Router();
const User = require("../models/userModels");

// Create a new user
router.post("/users", async (req, res) => {
  try {
    const user = new User(req.body);
    await user.save();
    res.status(201).send(user);
  } catch (error) {
    res.status(400).send(error);
  }
});

router.put("/users/:id", async (req, res) => {
  const { id } = req.params;
  User.findByIdAndUpdate(id, req.body)
    .then((data) => res.status(200).json(data))
    .catch((err) =>
      res.status(500).json({ message: `500 Internal server error`, error: err })
    );
});

// Get all users
router.get("/users", async (req, res) => {
  try {
    const users = await User.find();
    res.send(users);
  } catch (error) {
    res.status(500).send(error);
  }
});

router.get("/users/:id", async (req, res) => {
  const { id } = req.params;

  await User.findById(id)
    .then((data) => res.status(200).json(data))
    .catch((err) =>
      res.status(500).json({ message: "internal server error", error: err })
    );
});

module.exports = router;
