require("dotenv").config();
const express = require("express");
const cors = require("cors");
const connectDB = require("./src/configs/db");

// Import routes
const authRoutes = require('./src/routes/authRoutes'); // Của Bách
const userRoutes = require("./src/routes/user.routes"); // Của Ann
const devRoutes = require("./src/routes/dev.routes"); // Của Ann
const productRoutes = require('./src/routes/productRoutes'); // Của Thắng
const categoryRoutes = require('./src/routes/categoryRoutes'); // Của Tú

const app = express();

// Kết nối Database
connectDB();

// Cấu hình CORS (Gộp theo cách linh hoạt của Bách)
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

// Route Products (Tú & Thắng)
// Thống nhất dùng tiền tố /api/products cho chuẩn RESTful
app.use('/api/products', productRoutes); 
app.use('/api/categories', categoryRoutes);

// Dự phòng route cũ của Thắng để không lỗi Frontend cũ
app.use('/product', productRoutes);

const PORT = process.env.PORT || 9999;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));