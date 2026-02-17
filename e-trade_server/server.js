const express = require('express');
const app = express();
const connectDB = require('./src/configs/db');
const cors = require("cors"); // Import cors

connectDB();

app.use(cors({
  credentials: true 
}));

app.use(express.json());

// Test Route
app.get('/', async (req, res) => {
    try {
        res.send({ message: 'Welcome to Practical Exam!' });
    } catch (error) {
        res.send({ error: error.message });
    }
});

// Routes API (Đặt sau CORS)
app.use('/api/products', require('./src/routes/ProductRoutes'));
app.use('/api/categories', require('./src/routes/categoryRoutes'));

const PORT = process.env.PORT || 9999;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));