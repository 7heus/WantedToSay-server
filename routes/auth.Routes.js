const express = require("express");
const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");
const User = require("../models/User.model");

const Router = express.Router();
const saltRounds = 12;

// POST - auth/signup - creating a new user in database
router.post("/signup", (req, res, next) => {
  const { email, password, name } = req.body;

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
    res.status(400).json({ message: "Please ptovide valid password" });
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
      return User.create({ email, password: hashedPassword, name });
    })
    .then((createdUser) => {
      const { email, name, _id } = createdUser;

      // create an object that doesnot expose the password
      const user = { email, name, _id };
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
router.post("./login", (req, res, next) => {
  const { email, password } = req.body;

  // checking if there is email and password
  if (email === "" || password === "") {
    res.status(400).json({ message: "Please provide emailid and password" });
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
        const { _id, email, name } = foundUser;

        // creating an object that will be same as  token payload
        const payload = { _id, email, name };

        // creating and signing the token
        const authToken = jwt.sign(payload, process.env.TOKEN_SECRET);
        // Send the token as the response
        res.status(200).json({ authToken: authToken });
      } else {
        res.status(401).json({ message: "Unable to authenticate the user" });
      }
    })
    .catch((err) => res.status(500).json({ message: "Internal Server Error" }));
});
