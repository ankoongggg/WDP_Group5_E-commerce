require("dotenv").config();

const express = require("express");
const app = express();
const connectDB = require("./src/configs/db");
const cors = require("cors");

// routes
const userRoutes = require("./src/routes/user.routes");
const devRoutes = require("./src/routes/dev.routes");

connectDB();

// middleware
app.use(express.json());

// CORS (đặt trước routes)
app.use(
  cors({
    origin: "http://localhost:3000",
    credentials: true,
  })
);

// test route
app.get("/", (req, res) => {
  res.json({ message: "Welcome to Practical Exam!" });
});

// mount routes
app.use("/api/users", userRoutes);
app.use("/api/dev", devRoutes);

const PORT = process.env.PORT || 9999;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
