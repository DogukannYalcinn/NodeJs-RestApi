const { validationResult } = require("express-validator");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const User = require("../models/user");

exports.signup = (req, res, next) => {
  const errors = validationResult(req);
  console.log(errors.array());
  if (!errors.isEmpty()) {
    const error = new Error("Validation Error");
    error.statusCode = 422;
    error.data = errors.array();
    throw error;
  }
  const email = req.body.email;
  const password = req.body.password;
  const name = req.body.name;
  const status = "I am new";

  bcrypt
    .hash(password, 12)
    .then((hashedPw) => {
      const userInstance = new User(email, hashedPw, name, status, []);
      userInstance.save().then((result) => {
        return res
          .status(201)
          .json({ message: "User created", userId: result.insertedId });
      });
    })
    .catch((err) => {
      if (!err.statusCode) err.statusCode = 500;
      next(err);
    });
};

exports.login = (req, res, next) => {
  const email = req.body.email;
  const password = req.body.password;
  let loginUser;
  User.checkEmail(email)
    .then((user) => {
      if (!user) {
        const error = new Error("This email not exist!");
        error.statusCode = 401;
        throw error;
      }
      loginUser = user;
      return bcrypt.compare(password, user.password);
    })
    .then((isEqual) => {
      if (!isEqual) {
        const error = new Error("Password is wrong");
        error.statusCode = 401;
        throw error;
      }
      const token = jwt.sign(
        {
          email: loginUser.email,
          userId: loginUser._id.toString(),
        },
        "somesuperscretmysecret",
        { expiresIn: "1h" },
      );
      res.status(200).json({ token, userId: loginUser._id.toString() });
    })
    .catch((err) => {
      if (!err.statusCode) {
        err.statusCode = 500;
      }
      next(err);
    });
};

exports.getStatus = (req, res, next) => {
  User.findById(req.userId)
    .then((user) => {
      if (!user) {
        const error = new Error("User not found!");
        error.statusCode = 404;
        throw error;
      }
      res.status(200).json({ status: user.status });
    })
    .catch((err) => {
      if (!err.statusCode) {
        err.statusCode = 500;
        throw err;
      }
    });
};

exports.updateStatus = (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    const error = new Error("Validation errors");
    error.statusCode = 402;
    throw error;
  }

  const status = req.body.status;
  User.updateStatus(req.userId, status)
    .then((result) => {
      res.status(201).json({ message: "Status is changed" });
    })
    .catch((err) => {
      if (!err.statusCode) {
        err.statusCode = 500;
        throw err;
      }
    });
};
