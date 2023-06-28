const express = require('express');
const { cartRouter } = require('./routing/cart');
const { billingRouter } = require('./routing/billing');
const { shopRouter } = require('./routing/shop');

require('./seed-database');

const app = express();
app.use(express.json());
app.use(express.urlencoded({ extended: true }))
app.use('/shop', shopRouter);
app.use('/cart', cartRouter);
app.use('/bill', billingRouter);
app.listen(process.env.PORT, () => console.log('Running API at :' + process.env.PORT))