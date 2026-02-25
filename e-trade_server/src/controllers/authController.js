const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
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
        if (!user || !(await bcrypt.compare(password, user.password))) {
            return res.status(401).json({ success: false, message: 'Sai pass' });
        }
        const accessToken = generateAccessToken(user);
        res.json({ success: true, user, accessToken });
    } catch (error) { res.status(500).json({ success: false, message: 'Error' }); }
};

const logout = async (req, res) => { res.json({ success: true, message: 'Logged out' }); };

module.exports = { register, login, logout };