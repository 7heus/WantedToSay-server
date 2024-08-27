const express = require("express");
const mongoose = require("mongoose");
const dotenv = require("dotenv");
const userRoutes = require("./routes/userRoutes");
const messageRoutes = require("./routes/messageRoutes");
const cors = require("cors");
const logger = require("morgan");

dotenv.config();

const app = express();

// Middleware
app.use(express.json());
app.use(cors());
app.use(logger("dev"));

app.use("/api", userRoutes);
app.use("/api", messageRoutes);

// Connect to MongoDB
mongoose
  .connect("mongodb://127.0.0.1:27017/wanted-to-say")
  .then((x) =>
    console.log(`Connected to Mongo! Database name: "${x.connections[0].name}"`)
  )
  .catch((err) => console.error("Error connecting to mongo", err));

// Basic route
app.get("/", (req, res) => {
  res.send("Hello World!");
});

// Start server
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
