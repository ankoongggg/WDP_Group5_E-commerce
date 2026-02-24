const mongoose = require('mongoose');
require('dotenv').config();

const connectDB = async () => {
    try {
        await mongoose.connect(process.env.MONGO_URI, {
            dbName: "e_shop_trading"
        });
        console.log('MongoDB connected successfully');
        console.log("Connected to DB:", mongoose.connection.name);
    } catch (error) {
        console.error("MongoDB connection failed: ", error);
        process.exit(1);
    }
};

module.exports = connectDB;