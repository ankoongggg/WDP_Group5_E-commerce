const express = require('express');
const cors = require('cors');
require('dotenv').config();

const connectDB = require('./src/configs/db');
const authRoutes = require('./src/routes/authRoutes');

const app = express();

connectDB();

const corsOptions = {
    origin: process.env.CLIENT_URL || 'http://localhost:3000',
    credentials: true,
};
app.use(cors(corsOptions));
app.use(express.json());

app.get('/', (req, res) => {
    res.json({ message: 'E-Trade API is running' });
});

app.use('/api/auth', authRoutes);

const PORT = process.env.PORT || 9999;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
