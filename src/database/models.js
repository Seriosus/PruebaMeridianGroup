const { DataStorage } = require(".");

module.exports.Sale = new DataStorage('sales', ['id', 'cartId', 'customerId']);
module.exports.Bill = new DataStorage('bills', ['id', 'saleId', 'customerId', 'usedCoupon', 'subTotal', 'discountedByCoupon', 'total']);
module.exports.Cart = new DataStorage('carts', ['id', 'customerId']);
module.exports.CartItems = new DataStorage('cart-items', ['cartId', 'itemId', 'amount']);
module.exports.Coupon = new DataStorage('coupons', ['id', 'discount', 'expiresAt']);
module.exports.Item = new DataStorage('shopping-items', ['id', 'name', 'price']);
module.exports.ItemCategory = new DataStorage('item-categories', ['itemId', 'categoryId']);
module.exports.Category = new DataStorage('categories', ['id', 'name']);