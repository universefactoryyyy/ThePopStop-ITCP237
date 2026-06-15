const express = require('express');
const app = express();
const cors = require('cors');
const path = require('path');

const products = require('./routes/product');
const users = require('./routes/user');
const orders = require('./routes/order');
const reviews = require('./routes/review');
const carts = require('./routes/cart');
const dashboard = require('./routes/dashboard');
const discounts = require('./routes/discount');

app.use(cors());
app.use(express.json());
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// Serve frontend static files
app.use(express.static(path.join(__dirname, '../frontend')));

app.use('/api/v1', products);
app.use('/api/v1', users);
app.use('/api/v1', orders);
app.use('/api/v1', reviews);
app.use('/api/v1', carts);
app.use('/api/v1', dashboard);
app.use('/api/v1', discounts);



module.exports = app;
