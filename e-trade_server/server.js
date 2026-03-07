require("dotenv").config();
const express = require("express");
const cors = require("cors");
const connectDB = require("./src/configs/db");
require("./src/configs/passport");

// Import routes
const authRoutes = require('./src/routes/authRoutes'); // Của Bách
const userRoutes = require("./src/routes/user.routes"); // Của Ann
const devRoutes = require("./src/routes/dev.routes"); // Của Ann
const productRoutes = require('./src/routes/productRoutes'); // Của Thắng
const storeRoutes = require('./src/routes/storeRoutes'); // Của Thắng
const categoryRoutes = require('./src/routes/categoryRoutes'); // Của Tú
const shopRoutes = require('./src/routes/shopRoutes'); // Của Ann - Order, Payment
const orderRoutes = require('./src/routes/orderRoutes'); // Của Thắng - quan lý đơn hàng

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

// Test route
app.get("/", (req, res) => {
    res.json({ message: "E-Trade API is running - Welcome to Practical Exam!" });
});

// --- MOUNT ROUTES ---

// Route Auth (Bách)
app.use('/api/auth', authRoutes);

// Route User & Dev (Ann)
app.use("/api/users", userRoutes);
app.use("/api/dev", devRoutes);

// Route Shop - Orders & Payments (Ann)
app.use('/api/shop', shopRoutes);

// Route Products (Tú & Thắng)
// Thống nhất dùng tiền tố /api/products cho chuẩn RESTful
app.use('/api/products', productRoutes); 
app.use('/api/categories', categoryRoutes);

// Use store routes
app.use('/api/store', storeRoutes);
// Use order routes
app.use('/api/seller', orderRoutes); // Các route liên quan đến quản lý đơn hàng của người bán

const PORT = process.env.PORT || 9999;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));