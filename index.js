require("dotenv").config();
const express = require("express");
const mongoose = require("mongoose");
const userRoutes = require("./routes/userRoutes");
const messageRoutes = require("./routes/messageRoutes");
const cors = require("cors");
const logger = require("morgan");
const authRoutes = require("./routes/auth.Routes");

// Connect to MongoDB
mongoose
  .connect("mongodb://127.0.0.1:27017/wanted-to-say")
  .then((x) =>
    console.log(`Connected to Mongo! Database name: "${x.connections[0].name}"`)
  )
  .catch((err) => console.error("Error connecting to mongo", err));

const app = express();

// Middleware
app.use(cors());
app.use(express.json());
app.use(logger("dev"));

app.use("/api", userRoutes);
app.use("/api", messageRoutes);
app.use("/auth", authRoutes);

// Basic route
app.get("/", (req, res) => {
  res.send("Hello World!");
});

// Start server
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
