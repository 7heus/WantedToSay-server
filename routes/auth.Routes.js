const express = require("express");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const User = require("../models/userModels");
const { default: mongoose } = require("mongoose");
const isAuthenticated = require("../middleware/jwt.middleware").isAuthenticated;
const Resend = require("resend").Resend;
const VerifyCode = require("../models/verificationCode.model");

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
      return User.create({
        email,
        password: hashedPassword,
        name,
        uniqueKey: uniqueKey != "" ? uniqueKey : "c001k3y",
      });
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
        subject: `Verify Your Email Address for WantedToSay`,
        html: `<body style="font-family: Arial, sans-serif; background-color: #f4f4f4; margin: 0; padding: 20px;">
    <div style="max-width: 600px; margin: 0 auto; background-color: #ffffff; padding: 20px; border-radius: 8px; box-shadow: 0 0 10px rgba(0, 0, 0, 0.1);">
        <h2 style="color: #333333;">Verify Your Email Address</h2>
        <p>Hi <strong>${user.name}</strong>,</p>
        <p>Thank you for signing up for WantedToSay! To complete your registration, please verify your email address by clicking the button below:</p>
        <div style="text-align: center; margin: 20px 0;">
            <a href="http://localhost:5173/email/verify/${user._id}" style="display: inline-block; background-color: #28a745; color: #ffffff; font-size: 18px; padding: 10px 20px; text-decoration: none; border-radius: 4px;">Verify My Email</a>
        </div>
        <p>If the above button doesn't work, please copy and paste the following URL into your browser:</p>
        <p style="text-align: center; color: #007bff;">http://localhost:5173/email/verify/${user._id}</p>
        <p>If you didn’t sign up for WantedToSay, please ignore this email.</p>
        <p style="margin-top: 40px;">Thank you for joining our community! We’re excited to have you with us.</p>
        <p>Best regards,<br>The WantedToSay Team</p>
        <hr style="border: none; border-top: 1px solid #dddddd; margin: 40px 0;">
        <p style="font-size: 12px; color: #999999; text-align: center;">Please do not reply to this email. If you need help, contact us at <a href="mailto:support@wantedtosay.thecoded.tech" style="color: #007bff;">support@wantedtosay.thecoded.tech</a>.</p>
    </div>
</body>`,
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

router.post("/create-code", async (req, res) => {
  const { email } = req.body;
  if (!email) {
    res.status(400).json({ message: "Please provide email" });
    return;
  }
  const possibleChars = "ABCDEFGHIKJLMNOPQRSTUVWXYZ0123456789".split("");
  let code = "";
  for (let i = 0; i < 6; i++) {
    const rand = Math.floor(Math.random() * possibleChars.length);
    code = `${code}${possibleChars[rand]}`;
  }
  User.findOne({ email: email })
    .then((user) => {
      if (!user) {
        res.status(404).json({ message: "User not found." });
        return;
      }
      VerifyCode.create({ email, code })
        .then(() => {
          res.status(201).json({ message: "Code Sent" });
          resend.emails.send({
            from: "WantedToSay <onboarding@wantedtosay.thecoded.tech>",
            to: [email],
            subject: `Your WantedToSay Password Reset Code`,
            html: `<body style="font-family: Arial, sans-serif; background-color: #f4f4f4; margin: 0; padding: 20px;">
    <div style="max-width: 600px; margin: 0 auto; background-color: #ffffff; padding: 20px; border-radius: 8px; box-shadow: 0 0 10px rgba(0, 0, 0, 0.1);">
        <h2 style="color: #333333;">Password Reset Request</h2>
        <p>Hi <strong>${user.name}</strong>,</p>
        <p>We received a request to reset your password for your WantedToSay account. To proceed, please use the following 6-digit verification code:</p>
        <div style="text-align: center; margin: 20px 0;">
            <span style="display: inline-block; background-color: #007bff; color: #ffffff; font-size: 24px; padding: 10px 20px; border-radius: 4px; letter-spacing: 4px;">${code}</span>
        </div>
        <p>Keep in mind that your code expires in <strong>1 Minute</strong>.</p>
        <p>Enter this code on the password reset page to set a new password for your account.</p>
        <p>If you did not request a password reset, you can safely ignore this email—your account remains secure.</p>
        <p>If you have any questions or need further assistance, please contact our support team.</p>
        <p style="margin-top: 40px;">Best regards,<br>The WantedToSay Team</p>
        <hr style="border: none; border-top: 1px solid #dddddd; margin: 40px 0;">
        <p style="font-size: 12px; color: #999999; text-align: center;">Please do not reply to this email. If you need help, contact us at <a href="mailto:support@wantedtosay.thecoded.tech" style="color: #007bff;">support@wantedtosay.thecoded.tech</a>.</p>
    </div>
</body>`,
          });
          return code;
        })
        .catch((err) => res.status(500).json(err));
    })
    .catch((err) =>
      res.status(500).json({
        message: "500 Internal Server Error when creating code",
        error: err,
      })
    );
});

router.post("/get-code", async (req, res) => {
  const { email } = req.body;
  if (!email) {
    res.status(400).json({ message: "Please provide email" });
    return;
  }
  VerifyCode.findOne({ email: email })
    .then((data) => {
      if (!data) {
        res.status(400).json({ message: "No code found" });
        return;
      }
      res.status(200).json({ code: data.code });
    })
    .catch((err) => res.status(500).json(err));
});

router.put("/update-pass", async (req, res) => {
  const { email, code, newPass } = req.body;
  if (!email || !code || !newPass) {
    res
      .status(400)
      .json({ message: "Please provide email, code, and new password." });
    return;
  }
  const passwordRegex = /(?=.*\d)(?=.*[a-z])(?=.*[A-Z]).{6,}/;
  if (!passwordRegex.test(newPass)) {
    res.status(400).json({ message: "Please provide valid password" });
    return;
  }

  const salt = bcrypt.genSaltSync(saltRounds);
  const hashedPassword = bcrypt.hashSync(newPass, salt);

  VerifyCode.findOne({ code: code })
    .then((data) => {
      if (data && data.code === code) {
        return User.findOneAndUpdate(
          { email: email },
          { password: hashedPassword },
          { new: true }
        )
          .then((usr) => {
            if (!usr) {
              res.status(404).json({ message: "User not found" });
              return;
            }
            // const { email, name, _id, uniqueKey } = usr;
            // create an object that doesnot expose the password
            const user = {
              email: usr.email,
              name: usr.name,
              _id: usr._id,
              uniqueKey: usr.uniqueKey,
            };
            resend.emails.send({
              from: "WantedToSay <onboarding@wantedtosay.thecoded.tech>",
              to: [email],
              subject: `Your WantedToSay Password Has Been Changed`,
              html: `<body style="font-family: Arial, sans-serif; background-color: #f4f4f4; margin: 0; padding: 20px;">
    <div style="max-width: 600px; margin: 0 auto; background-color: #ffffff; padding: 20px; border-radius: 8px; box-shadow: 0 0 10px rgba(0, 0, 0, 0.1);">
        <h2 style="color: #333333;">Your Password Has Been Changed</h2>
        <p>Hi <strong>${user.name}</strong>,</p>
        <p>We wanted to let you know that your WantedToSay account password was successfully changed. If you made this change, no further action is needed.</p>
        <p>If you did not change your password, please reset it immediately by clicking the link below:</p>
        <div style="text-align: center; margin: 20px 0;">
            <a href="http://localhost:5173/reset-password" style="display: inline-block; background-color: #dc3545; color: #ffffff; font-size: 18px; padding: 10px 20px; text-decoration: none; border-radius: 4px;">Reset My Password</a>
        </div>
        <p>For added security, we recommend reviewing your account settings and updating your security information.</p>
        <p>If you need any help or have concerns, feel free to reach out to our support team.</p>
        <p style="margin-top: 40px;">Thank you for being a part of WantedToSay!</p>
        <p>Best regards,<br>The WantedToSay Team</p>
        <hr style="border: none; border-top: 1px solid #dddddd; margin: 40px 0;">
        <p style="font-size: 12px; color: #999999; text-align: center;">Please do not reply to this email. If you need help, contact us at <a href="mailto:support@wantedtosay.thecoded.tech" style="color: #007bff;">support@wantedtosay.thecoded.tech</a>.</p>
    </div>
</body>`,
            });
            return user;
          })
          .catch((err) => {
            res.status(500).json(err);
            return;
          });
      } else {
        res.status(403).json({ message: "Invalid or expired code." });
        return;
      }
    })
    .then((user) => {
      if (!user) return;
      VerifyCode.findOneAndDelete({ email: user.email }).then((dat) =>
        console.log(dat)
      );
    });
});

module.exports = router;
