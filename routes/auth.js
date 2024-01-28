const express = require("express");
const { body } = require("express-validator");
const authController = require("../controllers/auth");
const User = require("../models/user");
const isAuth = require("../middleware/is-Auth");

const router = express.Router();

router.put(
  "/signup",
  [
    body("email")
      .isEmail()
      .withMessage("Please Enter Valid Email!")
      .normalizeEmail()
      .custom((value, { req }) => {
        return User.checkEmail(value).then((userDoc) => {
          if (userDoc) {
            return false;
          }
        });
      })
      .withMessage("This email already exist"),
    body("password").trim().isLength({ min: 5 }),
    body("name").not().isEmpty(),
  ],
  authController.signup,
);

router.post("/login", authController.login);

router.get("/status", isAuth, authController.getStatus);
router.put(
  "/status",
  isAuth,
  [
    body("status")
      .trim()
      .not()
      .isEmpty()
      .withMessage("Status cannot be empty")
      .custom((value, { req }) => {
        User.checkStatus(req.userId)
          .then((result) => {
            if (value === result.status) {
                return false;
            } else {
              return true;
            }
          })
          .catch((err) => {
            err.statusCode = 500;
            throw err;
          });
      }),
  ],
  authController.updateStatus,
);

module.exports = router;
