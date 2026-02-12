const express = require("express");
const jwt = require("jsonwebtoken");
const User = require("../models/User");

const router = express.Router();

// POST /api/dev/token { "email": "..." }
router.post("/token", async (req, res) => {
  const { email } = req.body;
  if (!email) return res.status(400).json({ message: "email is required" });

  const user = await User.findOne({ email });
  if (!user) return res.status(404).json({ message: "User not found" });

  const access_token = jwt.sign(
    { id: user._id.toString(), email: user.email, role: user.role || [] },
    process.env.JWT_SECRET,
    { expiresIn: "7d" }
  );

  res.json({ access_token });
});

module.exports = router;
