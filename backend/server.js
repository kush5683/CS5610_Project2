
import express from 'express';
import dataRoutes from './data.js';
const app = express();
const PORT = process.env.PORT || 3000;

console.log("Backend JS loaded successfully.");

app.use(express.static('frontend'));
app.use(express.json());
app.use('/api', dataRoutes);

app.listen(PORT, () => {
    console.log(`Server is running on port http://localhost:${PORT}`);
});
