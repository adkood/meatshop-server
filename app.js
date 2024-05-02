require('dotenv').config();
const express = require("express");
const cors = require('cors');
const cookieParser = require("cookie-parser");
const errorHandler = require("./utils/errorHandler");
const db = require('./db');
const startCluster = require('./utils/clusterManager');

// routes
const outletRoutes = require('./routes/OutletRoutes');
const meatRoutes = require('./routes/MeatRoutes');
const inventoryRoutes = require('./routes/InventoryRoutes');
const expiredRoutes = require('./routes/ExpiredRoutes');
const refillRoutes = require('./routes/RefillRoutes');
const transactionRoutes = require('./routes/TransactionRoutes');

const app = express();

db();

// middlewares
app.use(cookieParser());
app.use(express.json());
app.use(cors());

// All routes
app.use('/api', outletRoutes);
app.use('/api', meatRoutes);
app.use('/api', inventoryRoutes);
app.use('/api', expiredRoutes);
app.use('/api', refillRoutes);
app.use('/api', transactionRoutes);

// global error handling 
app.use(errorHandler);

// app.get('/', (req, res) => {
//     res.send(`processId: ${process.pid}`);
// });

// startCluster(() => {
const PORT = process.env.PORT || 5000;

app.listen(PORT, () => {
    console.log(`Worker ${process.pid} is listening at port ${PORT}...`);
});
// });

module.exports = app;
