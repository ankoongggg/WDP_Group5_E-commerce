const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const passport = require('../configs/passport');
const User = require('../models/User');

const generateAccessToken = (user) => jwt.sign(
    { id: user._id, email: user.email, role: user.role },
    process.env.JWT_SECRET || 'wdp_group5_secret_key_2026', { expiresIn: '15m' }
);

const register = async (req, res) => {
    try {
        const { name, email, password, phone, street, district, city } = req.body;
        if (!phone?.trim() || !street?.trim() || !district?.trim() || !city?.trim()) {
            return res.status(400).json({ success: false, message: 'Phone and address (street, district, city) are required' });
        }
        const hashedPassword = await bcrypt.hash(password, 12);
        const user = await User.create({
            full_name: name,
            account_name: name,
            email: email.toLowerCase(),
            password: hashedPassword,
            phone: phone || '',
            addresses: [{
                street: street || '',
                district: district || '',
                city: city || '',
                phone: phone || '',
                recipient_name: name,
                label: 'Home',
                is_default: true
            }],
            address: `${street}, ${district}, ${city}`,
            role: ['customer'],
            status: 'active'
        });
        res.status(201).json({ success: true, message: 'OK', user });
    } catch (error) { res.status(500).json({ success: false, message: error.message }); }
};

const login = async (req, res) => {
    try {
        const { email, password } = req.body;
        const user = await User.findOne({ email: email.toLowerCase() });
        if (!user) return res.status(401).json({ success: false, message: 'Sai pass' });
        if (user.provider === 'google') {
            return res.status(401).json({ success: false, message: 'Please sign in with Google' });
        }
        if (!user.password || !(await bcrypt.compare(password, user.password))) {
            return res.status(401).json({ success: false, message: 'Sai pass' });
        }
        const accessToken = generateAccessToken(user);
        res.json({ success: true, user, accessToken });
    } catch (error) { res.status(500).json({ success: false, message: 'Error' }); }
};

const logout = async (req, res) => { res.json({ success: true, message: 'Logged out' }); };

const googleAuth = (req, res, next) => {
    // Kiểm tra xem đã cấu hình Google Client ID chưa trước khi gọi passport
    if (!process.env.GOOGLE_CLIENT_ID || !process.env.GOOGLE_CLIENT_SECRET) {
        // Nếu là request từ trình duyệt, redirect về trang login kèm lỗi
        return res.redirect(`${process.env.CLIENT_URL || 'http://localhost:3000'}/#/login?error=google_config_missing`);
    }
    
    // Nếu đã cấu hình thì mới gọi passport
    passport.authenticate('google', { scope: ['profile', 'email'], session: false })(req, res, next);
};

const googleCallback = async (req, res, next) => {
    passport.authenticate('google', { session: false }, async (err, googleUser) => {
        if (err) return res.redirect(`${process.env.CLIENT_URL || 'http://localhost:3000'}/#/login?error=google_auth_failed`);
        if (!googleUser?.email) return res.redirect(`${process.env.CLIENT_URL || 'http://localhost:3000'}/#/login?error=no_email`);

        try {
            let user = await User.findOne({ email: googleUser.email });

            if (!user) {
                user = await User.create({
                    full_name: googleUser.fullName,
                    account_name: googleUser.fullName,
                    email: googleUser.email,
                    avatar: googleUser.avatar,
                    provider: 'google',
                    providerId: googleUser.providerId,
                    password: await bcrypt.hash('google_oauth_' + Date.now(), 12),
                    role: ['customer'],
                    phone: '', // Thêm trường này để đồng bộ với Schema
                    addresses: [], // Khởi tạo mảng rỗng để tránh lỗi khi truy cập profile
                    status: 'active',
                });
            } else if (!user.provider) {
                user.avatar = user.avatar || googleUser.avatar;
                user.provider = 'google';
                user.providerId = googleUser.providerId;
                await user.save();
            }

            const accessToken = generateAccessToken(user);
            const redirectUrl = `${process.env.CLIENT_URL || 'http://localhost:3000'}/#/auth/google-callback?token=${encodeURIComponent(accessToken)}`;
            res.redirect(redirectUrl);
        } catch (error) {
            console.error('Google callback error:', error);
            res.redirect(`${process.env.CLIENT_URL || 'http://localhost:3000'}/#/login?error=server_error`);
        }
    })(req, res, next);
};

module.exports = { register, login, logout, googleAuth, googleCallback };