const jwt = require("jsonwebtoken");

const protect = (req, res, next) => {
    try {
        const header = req.headers.authorization || "";
        const token = header.startsWith("Bearer ") ? header.slice(7) : null;
        if (!token) return res.status(401).json({ success: false, message: "No token provided" });

        const payload = jwt.verify(token, process.env.JWT_SECRET || 'wdp_group5_secret_key_2026');
        req.user = payload; 
        next();
    } catch (err) {
        return res.status(401).json({ success: false, message: "Invalid/Expired token" });
    }
};

module.exports = { protect };