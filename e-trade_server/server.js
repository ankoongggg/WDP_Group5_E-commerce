require("dotenv").config();

const express = require("express");
const app = express();

const connectDB = require("./src/configs/db");
const cors = require("cors");

// Import routes (Ann)
const userRoutes = require("./src/routes/user.routes");
const devRoutes = require("./src/routes/dev.routes");

// Import product routes (Thắng)
const productRoutes = require('./src/routes/productRoutes');

// Kết nối Database
connectDB();

// Middleware
app.use(express.json());

// CORS (đặt trước routes)
app.use(
  cors({
    origin: "http://localhost:3000",
    credentials: true,
  })
);

// Test route
app.get("/", (req, res) => {
  res.json({ message: "Welcome to Practical Exam!" });
});

// Mount routes của Ann (User Profile)
app.use("/api/users", userRoutes);
app.use("/api/dev", devRoutes);

// Mount routes của Tu (Searching)
// ⚠️ LƯU Ý: Đang dùng 'ProductRoutes' viết hoa chữ P. Cần check lại xem tên file thật là gì.
app.use('/api/products', require('./src/routes/productRoutes'));
app.use('/api/categories', require('./src/routes/categoryRoutes'));

// Use product routes của Thắng
// ⚠️ LƯU Ý: Cần bàn lại với Tú xem nên gộp '/product' và '/api/products' lại thành 1 route không nhé.
app.use('/product', productRoutes);

const PORT = process.env.PORT || 9999;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));