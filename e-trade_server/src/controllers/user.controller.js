const User = require("../models/User");

// helper: pick allowed fields only
function pick(obj, allowedKeys) {
  const out = {};
  for (const k of allowedKeys) {
    if (obj[k] !== undefined) out[k] = obj[k];
  }
  return out;
}

exports.getMe = async (req, res) => {
  try {
    const user = await User.findById(req.user.id)
      .select("-password -refresh_token");
    if (!user) return res.status(404).json({ message: "User not found" });
    return res.json(user);
  } catch (e) {
    return res.status(500).json({ message: "Server error" });
  }
};

exports.updateMe = async (req, res) => {
  try {
    const allowed = ["avatar", "addresses", "dob", "gender", "phone", "name"];
    const updates = pick(req.body, allowed);

    // normalize dob nếu FE gửi string "yyyy-mm-dd"
    if (updates.dob) {
      const d = new Date(updates.dob);
      if (isNaN(d.getTime())) {
        return res.status(400).json({ message: "Invalid dob" });
      }
      updates.dob = d;
    }

    // addresses basic check (optional nhưng giúp đỡ lỗi bậy)
    if (updates.addresses && !Array.isArray(updates.addresses)) {
      return res.status(400).json({ message: "addresses must be an array" });
    }

    updates.updated_at = new Date();

    const user = await User.findByIdAndUpdate(
      req.user.id,
      { $set: updates },
      { new: true }
    ).select("-password -refresh_token");

    if (!user) return res.status(404).json({ message: "User not found" });
    return res.json(user);
  } catch (e) {
    return res.status(500).json({ message: "Server error" });
  }
};
