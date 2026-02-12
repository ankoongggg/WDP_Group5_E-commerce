const express = require("express");
const router = express.Router();

const auth = require("../middlewares/auth");
const userController = require("../controllers/user.controller");

router.get("/me", auth, userController.getMe);
router.put("/me", auth, userController.updateMe);

module.exports = router;
