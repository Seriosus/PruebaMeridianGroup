/**
 * Modulo shop para realizar compras
 */

const { CartItems, Cart, Item, Coupon, Bill, Sale } = require('../database/models');
const { generateId } = require('../util');

const Router = require('express').Router;

const shopRouter = Router({ mergeParams: true });

/**
 * En body:
 *  - couponCode
 *  - cartId
 */
shopRouter.post('/', async (req, res) => {

  if (typeof req.headers['x-customer-id'] !== 'string' || !req.headers['x-customer-id'].length) {
    return res.json({
      status: false,
      error: 'Missing customer ID',
      data: null
    });
  }

  const customerId = req.headers['x-customer-id'];

  /**
   * Debe retornar 200
   *  - status: true/false
   *  - Id de factura (billing)
   */

  const { cartId, couponCode } = req.body;

  if (typeof cartId !== 'string') {
    return res.json({
      status: false,
      error: 'Missing cart ID',
      data: null
    });
  }

  const yetSale = await Sale.findOne({ cartId });
  if (yetSale) {
    const yetBill = await Bill.findOne({ saleId: yetSale.id });
    if (yetBill) {
      return res.json({
        status: false,
        error: 'Cannot continue as there is a existent bill of the same cart',
        data: null
      });
    }
  }


  const coupon = await Coupon.findOne({ id: couponCode });
  if (typeof couponCode === 'string' && !coupon) {
    return res.json({
      status: false,
      error: 'Coupon is not valid or it has expired',
      data: null
    });
  }

  if (coupon) {
    const timeNow = new Date();
    const couponExpirationDate = new Date(coupon.expiresAt);

    if (couponExpirationDate <= timeNow) {
      return res.json({
        status: false,
        error: 'Coupon is not valid or it has expired',
        data: null
      });
    }
  }

  try {
    const cart = await Cart.findOne({
      customerId: req.headers['x-customer-id'],
      id: cartId
    });

    if (!cart) {
      return res.json({
        status: false,
        error: 'Cart not found',
        data: null
      });
    }

    const cartItems = await CartItems.find({ cartId });

    const detailedItems = await Promise.all(cartItems
      .map((cartItem) => Item
        .findOne({ id: cartItem.itemId })
        .then(({ __internalId, ...item }) => ({ amount: cartItem.amount, ...item, total: item.price * cartItem.amount }))
      ))

    const discount = coupon?.discount || 0;
    const subTotal = detailedItems.reduce((acc, curr) => {
      return acc + curr.total
    }, 0);
    const discountedByCoupon = subTotal * (discount / 100);
    const total = subTotal - discountedByCoupon;

    const sale = await Sale.insertOne({
      id: generateId(),
      cartId,
      customerId,
    });
    const bill = await Bill.insertOne({
      id: generateId(),
      saleId: sale.id,
      customerId,
      usedCoupon: coupon ? couponCode : null,
      subTotal,
      discountedByCoupon,
      total
    })

    return res.json({ status: true, data: { generatedBillingId: bill.id } })

  } catch (error) {
    console.error(error);
    return res.json({
      status: false,
      error: 'Sorry, something just went wrong, please try again',
      data: null
    });
  }
});

module.exports.shopRouter = shopRouter;