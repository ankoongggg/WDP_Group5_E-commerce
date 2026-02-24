const express = require('express');
const app = express();
const connectDB = require('./src/configs/db');
const cors = require("cors");

connectDB();

const productRoutes = require('./src/routes/productRoutes');

app.use(express.json());

app.get('/', async (req, res) => {
    try {
        res.send({ message: 'Welcome to Practical Exam!' });
    } catch (error) {
        res.send({ error: error.message });
    }
});

// Cấu hình CORS
const corsOptions = {
    origin: 'http://localhost:3000',
    credentials: true,
};
app.use(cors(corsOptions));

// Use product routes
app.use('/product', productRoutes);

const PORT = process.env.PORT || 9999;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));