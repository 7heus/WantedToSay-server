const express = require("express");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const User = require("../models/userModels");
const { default: mongoose } = require("mongoose");
const isAuthenticated = require("../middleware/jwt.middleware").isAuthenticated;
const Resend = require("resend").Resend;
const resend = new Resend(process.env.RESEND_KEY);
const router = express.Router();
const saltRounds = 12;

// POST - auth/signup - creating a new user in database
router.post("/signup", (req, res, next) => {
  const { email, password, name, uniqueKey } = req.body;

  // checking if there is email and password
  if (email === "" || password === "" || name === "") {
    res.status(400).json({ message: "Please fill in all the fields" });
    return;
  }

  // using regex to validate email format
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;
  if (!emailRegex.test(email)) {
    res.status(400).json({ message: "Please provide valid email id" });
    return;
  }

  // using regex to validate password format
  const passwordRegex = /(?=.*\d)(?=.*[a-z])(?=.*[A-Z]).{6,}/;
  if (!passwordRegex.test(password)) {
    res.status(400).json({ message: "Please provide valid password" });
    return;
  }

  // checking a user with the  same email id exists
  User.findOne({ email })
    .then((foundUser) => {
      if (foundUser) {
        res.status(400).json({ message: "Email already exists" });
        return;
      }

      // If email is okey, proceed to hash the password
      const salt = bcrypt.genSaltSync(saltRounds);
      const hashedPassword = bcrypt.hashSync(password, salt);

      // creating a new user in the databse
      // We return a pending promise, which allows us to chain another `then`
      return User.create({ email, password: hashedPassword, name, uniqueKey });
    })
    .then((createdUser) => {
      const { email, name, _id, uniqueKey } = createdUser;

      // create an object that doesnot expose the password
      const user = {
        email,
        name,
        _id,
        uniqueKey: uniqueKey != "" ? uniqueKey : "c001k3y",
      };
      resend.emails.send({
        from: "WantedToSay <onboarding@wantedtosay.thecoded.tech>",
        to: [email],
        subject: `Verify your email!`,
        html: `<h3>Email Verification for ${name}</h3>
  
        <p>Hello, ${name}! Welcome to WTS.</p>
        <p><a href="http://localhost:5173/email/verify/${_id}" target="_blank">Verify your email</a> here.</p>`,
      });
      // Send a json response containing the user object
      res.status(201).json({ user: user });
    })
    .catch((err) => {
      console.log(err);
      res.status(500).json({ message: "Internal Server Error" });
    });
});

// Post auth-login
// verifies email and password and return JWT
router.post("/login", (req, res, next) => {
  const { email, password } = req.body;

  // checking if there is email and password
  if (email === "" || password === "") {
    res.status(400).json({ message: "Please provide email and password" });
    return;
  }

  // checking if a user with same email id exists
  User.findOne({ email })
    .then((foundUser) => {
      // if no user found
      if (!foundUser) {
        res.status(400).json({ message: "User not found" });
        return;
      }

      // comparing the provided password as same in the database
      const passwordCorrect = bcrypt.compareSync(password, foundUser.password);

      if (passwordCorrect) {
        const { _id, email, name, uniqueKey } = foundUser;

        // creating an object that will be same as  token payload
        const payload = { _id, email, name, uniqueKey };

        // creating and signing the token
        const authToken = jwt.sign(payload, process.env.ENCRYPT_KEY);
        // Send the token as the response
        res.status(200).json({ authToken: authToken, payload: payload });
      } else {
        res.status(401).json({ message: "Unable to authenticate the user" });
      }
    })
    .catch((err) => res.status(500).json({ message: "Internal Server Error" }));
});

// GET  /auth/verify  -  Used to verify JWT stored on the client
router.get("/verify", isAuthenticated, async (req, res, next) => {
  // If JWT token is valid the payload gets decoded by the
  // isAuthenticated middleware and made available on `req.payload`

  // Send back the object with user data
  // previously set as the token payload
  res.status(200).json(req.payload);
});

router.post("/email/verify", async (req, res, next) => {
  const { _id } = req.body;
  if (!mongoose.isValidObjectId(_id)) {
    res.status(400).json({ message: "Provide a valid ID" });
    return;
  }
  let isV = false;
  User.findById(_id)
    .then((usr) => (isV = usr.isVerified))
    .catch((err) => {
      res.status(500).json({
        message: "500 Internal server error when fetching user",
        error: err,
      });
      return;
    });
  if (isV) {
    res.status(418).json({ message: "User is already verified." });
    return;
  }
  User.findByIdAndUpdate(_id, { isVerified: true })
    .then(() => {
      res.status(200).json({ message: "User was verified successfully" });
    })
    .catch((err) =>
      res.status(500).json({
        message: "500 Internal Server Error when updating user",
        error: err,
      })
    );
});

module.exports = router;
