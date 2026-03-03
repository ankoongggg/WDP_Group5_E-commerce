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


// Admin User functions
const getUserList = async (req,res) => {
    try{

    }catch (err){
        console.error("Lỗi get account", err);
        res.status(500).json({ success: false, message: err.message });
    }
}
const banAccount = async (req,res) => {
    try{}catch (err){
console.error("Lỗi ban account", err);
        res.status(500).json({ success: false, message: err.message });
    }
}
const upSellerRequest = async (req,res) => {
    try{}catch (err){
        console.error("Lỗi up seller request", err);
        res.status(500).json({ success: false, message: err.message });
    }
}

// admin dashboard functions
// lấy số lượng user và so sánh tăng giảm so với tháng trước
const getTotalUsersNumberAndComparison = async (req,res) => {
    try{
        const totalUsers = await User.countDocuments();
        const lastMonth = new Date();
        lastMonth.setMonth(lastMonth.getMonth() - 1);
        const usersLastMonth = await User.countDocuments({ createdAt: { $gte: lastMonth } });
        const comparison = totalUsers - usersLastMonth;

        res.json({ success: true, data: { totalUsers, comparison } });
    }catch(err){
        console.error("Lỗi get total users", err);
        res.status(500).json({ success: false, message: err.message });
    }
}

module.exports = { getProfile, updateProfile, banAccount, upSellerRequest, getTotalUsersNumberAndComparison };

