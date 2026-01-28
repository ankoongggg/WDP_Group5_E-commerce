const express = require('express');
const app = express();
const connectDB = require('./src/configs/db');
const apiRoutes = require('./src/routes'); 
connectDB();

app.use(express.json());

app.get('/', async(req, res)=>{
    try {
        res.send({message: 'Welcome to Practical Exam!'});
    } catch (error) {
        res.send({error: error.message});
    }
});

app.use('/api', apiRoutes);

const PORT = process.env.PORT || 9999;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));