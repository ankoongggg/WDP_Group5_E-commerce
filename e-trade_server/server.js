require("dotenv").config();
const express = require("express");
const cors = require("cors");
const connectDB = require("./src/configs/db");
require("./src/configs/passport");

// Khởi tạo app trước tiên!
const app = express();

// Kết nối Database
connectDB();

// Cấu hình CORS
const corsOptions = {
    origin: process.env.CLIENT_URL || "http://localhost:3000",
    credentials: true,
};
app.use(cors(corsOptions));
app.use(express.json());

// Import routes
const authRoutes = require('./src/routes/authRoutes'); 
const userRoutes = require("./src/routes/user.routes"); 
const devRoutes = require("./src/routes/dev.routes"); 
const productRoutes = require('./src/routes/productRoutes'); 
const storeRoutes = require('./src/routes/storeRoutes'); 
const sellerProductRoutes = require('./src/routes/sellerProductRoutes');
const categoryRoutes = require('./src/routes/categoryRoutes'); 
const shopRoutes = require('./src/routes/shopRoutes'); 
const orderRoutes = require('./src/routes/orderRoutes'); 
const blacklistRoutes = require('./src/routes/blacklistRoutes'); 
const cartRoutes = require('./src/routes/cartRoutes'); // Import giỏ hàng

// Test route
app.get("/", (req, res) => {
    res.json({ message: "E-Trade API is running - Welcome to Practical Exam!" });
});

// --- MOUNT ROUTES ---

// Route Giỏ hàng (Mới thêm)
app.use('/api/cart', cartRoutes);

// Route Auth (Bách)
app.use('/api/auth', authRoutes);

// Route User & Dev (Ann)
app.use("/api/users", userRoutes);
app.use("/api/dev", devRoutes);

// Route Shop - Orders & Payments (Ann)
app.use('/api/shop', shopRoutes);
app.use('/api/blacklist', blacklistRoutes); 

// Route Products (Tú & Thắng)
app.use('/api/products', productRoutes); 
app.use('/api/categories', categoryRoutes);

// Use store routes
app.use('/api/store', storeRoutes);

// Use order routes & seller product routes
app.use('/api/orders', orderRoutes);
app.use('/api/seller', sellerProductRoutes); 

const PORT = process.env.PORT || 9999;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));