const User = require('../models/User');

const getProfile = async (req, res) => {
    try {
        const user = await User.findById(req.user.id).select('-password');
        res.json({ success: true, data: user });
    } catch (error) { 
        res.status(500).json({ success: false, message: 'Lỗi lấy thông tin profile' }); 
    }
};

const updateProfile = async (req, res) => {
    try {
        const { full_name, phone, gender, dob, addresses } = req.body;
        
        // Fix lỗi Mongoose không lưu được nếu dob bị sai định dạng hoặc chuỗi rỗng
        const validDob = dob ? new Date(dob) : null;

        // Dùng $set để ÉP MongoDB cập nhật toàn bộ các trường này
        const updatedUser = await User.findByIdAndUpdate(
            req.user.id,
            { 
                $set: {
                    full_name: full_name, 
                    phone: phone, 
                    gender: gender, 
                    dob: validDob, 
                    addresses: addresses
                }
            },
            { new: true, runValidators: true }
        ).select('-password');

        if (!updatedUser) {
            return res.status(404).json({ success: false, message: 'User không tồn tại' });
        }

        res.json({ success: true, message: 'Cập nhật thành công', data: updatedUser });
    } catch (error) {
        console.error("Lỗi Update Profile:", error);
        res.status(500).json({ success: false, message: error.message });
    }
};

module.exports = { getProfile, updateProfile };