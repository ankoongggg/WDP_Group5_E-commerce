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

const isSeller = (req, res, next) => {
    // Middleware này phải được chạy sau 'protect' để có req.user
    if (req.user && Array.isArray(req.user.role) && req.user.role.includes('seller')) {
        return next();
    }
    return res.status(403).json({ success: false, message: 'Truy cập bị từ chối. Yêu cầu quyền người bán (seller).' });
};

const isAdmin = (req, res, next) => {
    if (req.user && Array.isArray(req.user.role) && req.user.role.includes('admin')) {
        return next();
    }
    return res.status(403).json({ success: false, message: 'Truy cập bị từ chối. Yêu cầu quyền quản trị viên (admin).' });
};

const optionalAuth = (req, res, next) => {
    const authHeader = req.headers.authorization;
    if (authHeader && authHeader.startsWith('Bearer ')) {
        const token = authHeader.split(' ')[1];
        try {
            // Dịch token ra để lấy thông tin user
            const decoded = jwt.verify(token, process.env.JWT_SECRET || 'wdp_group5_secret_key_2026');
            req.user = decoded; // Gán user vào req để productController đọc được
        } catch (error) {
            // Nếu token hết hạn hoặc sai, cứ lờ đi, coi như khách vãng lai
            req.user = null; 
        }
    }
    next(); // Luôn luôn cho đi tiếp
};

module.exports = { protect, isSeller, isAdmin, optionalAuth};