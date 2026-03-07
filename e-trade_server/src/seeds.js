const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
require('dotenv').config();

// 1. Import Models
const User = require('./models/User');
const Store = require('./models/Store');
const Product = require('./models/Product');
const Category = require('./models/Category');
const Administration = require('./models/Administration');
const BlacklistKeyword = require('./models/BlacklistKeyword');

// 2. Cấu hình URI kết nối
// Lưu ý: Đã thêm /e_shop_trading vào giữa domain và ?appName để trỏ đúng DB
const MONGO_URI = process.env.MONGO_URI || 'mongodb+srv://eShopTradingUser:dinhtu2004@eshoptrading.pfiotvo.mongodb.net/e_shop_trading?appName=EShopTrading';

const connectDB = async () => {
    try {
        await mongoose.connect(MONGO_URI);
        console.log('✅ MongoDB Connected to database: e_shop_trading');
    } catch (err) {
        console.error('❌ Connection failed:', err.message);
        process.exit(1);
    }
};

const seedData = async () => {
    try {
        // --- BƯỚC 1: CLEAN DATA (Xóa dữ liệu cũ) ---
        console.log('🧹 Cleaning old data...');
        await User.deleteMany({});
        await Store.deleteMany({});
        await Product.deleteMany({});
        await Category.deleteMany({});
        await Administration.deleteMany({});
        await BlacklistKeyword.deleteMany({});

        // --- BƯỚC 2: TẠO ADMIN (Trong bảng Administration) ---
        const salt = await bcrypt.genSalt(10);
        const hashedPassword = await bcrypt.hash('123456', salt);

        await Administration.create({
            username: 'superadmin',
            password: hashedPassword,
            refresh_token: ''
        });
        console.log('✅ Admin created (Administration table)...');

        // --- BƯỚC 3: TẠO CATEGORIES ---
        const categories = await Category.insertMany([
            { name: 'Đồ Điện Tử', is_active: true },
            { name: 'Thời Trang', is_active: true },
            { name: 'Gia Dụng', is_active: true },
            { name: 'Sách & Văn Phòng Phẩm', is_active: true }
        ]);
        console.log('✅ Categories created...');

        // --- BƯỚC 4: TẠO USERS & STORES ---

        // CASE A: Pure Customer (Khách hàng thuần túy)
        // Role: ['customer']
        const customer = await User.create({
            full_name: 'Nguyễn Văn Khách',     // Schema yêu cầu full_name
            account_name: 'customer_01',       // Schema yêu cầu account_name
            email: 'customer@gmail.com',
            password: hashedPassword,
            phone: '0901000001',
            gender: 'Nam',
            role: ['customer'],                // Chỉ có quyền mua
            status: 'active',
            addresses: [{
                city: 'Hà Nội',
                district: 'Cầu Giấy',
                street: 'Xuân Thủy',
                label: 'Nhà riêng',
                recipient_name: 'Nguyễn Văn Khách',
                phone: '0901000001',
                is_default: true
            }]
        });

        // CASE B: Hybrid User (Vừa mua vừa bán - Cá nhân)
        // Role: ['customer', 'seller']
        const hybridUser = await User.create({
            full_name: 'Trần Văn Bán',
            account_name: 'seller_individual',
            email: 'seller@gmail.com',
            password: hashedPassword,
            phone: '0902000002',
            gender: 'Nam',
            role: ['customer', 'seller'],       // Mảng 2 quyền
            status: 'active',
            addresses: [{
                city: 'Đà Nẵng',
                district: 'Hải Châu',
                street: 'Lê Duẩn',
                label: 'Cửa hàng',
                recipient_name: 'Trần Văn Bán',
                phone: '0902000002',
                is_default: true
            }]
        });

        // Tạo Store cho Hybrid User
        const hybridStore = await Store.create({
            user_id: hybridUser._id,
            shop_name: 'Tiệm Đồ Cũ Anh Bán',
            description: 'Chuyên thanh lý đồ cá nhân giá rẻ',
            identity_card: '00123456789',
            pickup_address: 'Số 10 Lê Duẩn, Đà Nẵng',
            total_sales: 15,
            status: 'active'
        });

        // CASE C: Enterprise (Doanh nghiệp - Chỉ bán)
        // Role: ['seller']
        const enterpriseUser = await User.create({
            full_name: 'Công Ty TNHH Thương Mại ABC',
            account_name: 'enterprise_official',
            email: 'enterprise@abc.com',
            password: hashedPassword,
            phone: '0903000003',
            gender: 'Khác',
            role: ['seller'],                   // Chỉ có quyền bán (theo yêu cầu của bạn)
            status: 'active',
            addresses: [{
                city: 'TP. Hồ Chí Minh',
                district: 'Quận 1',
                street: 'Nguyễn Huệ',
                label: 'Văn phòng chính',
                recipient_name: 'Admin Doanh Nghiệp',
                phone: '0903000003',
                is_default: true
            }]
        });

        // Tạo Store cho Enterprise
        const enterpriseStore = await Store.create({
            user_id: enterpriseUser._id,
            shop_name: 'ABC Official Store',
            description: 'Phân phối hàng chính hãng, bảo hành 24 tháng',
            identity_card: 'MSDN-01020304',
            pickup_address: 'Tòa nhà Bitexco, TP.HCM',
            total_sales: 1500,
            status: 'active'
        });

        console.log('✅ Users & Stores created...');

        // --- BƯỚC 5: TẠO PRODUCTS ---
        
        await Product.create([
            {
                store_id: hybridStore._id,
                category_id: [categories[1]._id], // Thời trang
                name: 'Áo Khoác Denim 2nd-hand',
                description: 'Áo còn mới 90%, size L',
                main_image: 'https://placehold.co/600x400?text=Ao+Denim',
                display_files: ['https://placehold.co/600x400?text=Ao+Denim+Back'],
                price: 150000,
                original_price: 500000,
                product_type: [{
                    description: 'Size L - Xanh đậm',
                    stock: 0, // <-- Đã sửa thành 0 để test logic hết hàng
                    price_difference: 0
                }],
                condition: 'Used',
                status: 'active'
            },
            {
                store_id: enterpriseStore._id,
                category_id: [categories[0]._id], // Điện tử
                name: 'Laptop Gaming Asus ROG (Mới 100%)',
                description: 'Hàng chính hãng, full box, bảo hành 2 năm',
                main_image: 'https://placehold.co/600x400?text=Asus+ROG',
                display_files: ['https://placehold.co/600x400?text=Asus+ROG+Detail'],
                price: 25000000,
                original_price: 28000000,
                product_type: [
                    {
                        description: 'RAM 16GB / SSD 512GB',
                        stock: 50,
                        price_difference: 0
                    },
                    {
                        description: 'RAM 32GB / SSD 1TB',
                        stock: 20,
                        price_difference: 5000000
                    }
                ],
                condition: 'New',
                status: 'active'
            }
        ]);
        console.log('✅ Products created...');

        // --- BƯỚC 6: TẠO BLACKLIST KEYWORDS ---
        await BlacklistKeyword.create([
            { keyword: 'súng', level: 'high' },
            { keyword: 'ma túy', level: 'critical' },
            { keyword: 'lừa đảo', level: 'medium' }
        ]);
        console.log('✅ Blacklist keywords created...');

        console.log('---------------------------------------');
        console.log('🎉 SEEDING COMPLETED SUCCESSFULLY!');
        console.log('---------------------------------------');
        process.exit();
    } catch (err) {
        console.error('❌ Seeding Error:', err);
        process.exit(1);
    }
};

// Chạy script
connectDB().then(() => {
    seedData();
});