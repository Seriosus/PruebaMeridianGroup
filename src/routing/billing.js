/**
 * Modulo Billing para revisar facturas
 * Este modulo es solo para retornar factura
 * o eliminar factura, no las edita, porque
 * una factura conserva su información como
 * permanente.
 */

const { Bill, Sale, Cart, CartItems, Item } = require('../database/models');
const { inspect } = require('../util');

const Router = require('express').Router;

const billingRouter = Router({ mergeParams: true });

const getCartItems = async (cart, bill) => {
  const cartItems = await CartItems.find({ cartId: cart.id });

  cart.items = [];
  for (const cartItem of cartItems) {
    cart.items.push(await Item.findOne({ id: cartItem.itemId }).then(({ __internalId, ...item }) => ({ ...cartItem, ...item })))
  }
}

const getCart = async (sale, bill) => {
  sale.cart = await Cart
    .findOne({ id: sale.cartId });

  await getCartItems(sale.cart, bill);
}

const getSale = async (bill) => {
  bill.sale = await Sale
    .findOne({ id: bill.saleId })

  inspect({ saleId: bill.saleId, sale: bill.sale })
  await getCart(bill.sale, bill);
}

billingRouter.get('/', async (req, res) => {
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
   *  - bill: Array de facturas
   *      - Array de items
   *          - itemId
   *          - itemName
   *          - itemCategory
   *          - itemPrice
   *          - amount
   *      - Cupon usado (id) y cantidad de descuento en %
   *      - Valor descontado con el uso del cupón
   *      - Subtotal
   *      - Total
   */
  try {
    const bills = await Bill.find({ customerId });
    for (const bill of bills) await getSale(bill);
    return res.json({ status: true, data: { bills } })
  } catch (error) {
    console.error(error);
    return res.json({
      status: false,
      error: 'Sorry, something just went wrong, please try again',
      data: null
    });
  }
});

billingRouter.get('/:billId', async (req, res) => {
  if (typeof req.headers['x-customer-id'] !== 'string' || !req.headers['x-customer-id'].length) {
    return res.json({
      status: false,
      error: 'Missing customer ID',
      data: null
    });
  }

  if (typeof req.params.billId !== 'string') {
    return res.json({
      status: false,
      error: 'Invalid bill ID',
      data: null
    });
  }
  /**
   * Debe retornar 200
   *  - status: true/false
   *  - bill: Datos de la factura
   *      - Array de items
   *          - itemId
   *          - itemName
   *          - itemCategory
   *          - itemPrice
   *          - amount
   *      - Cupon usado (id) y cantidad de descuento en %
   *      - Valor descontado con el uso del cupón
   *      - Subtotal
   *      - Total
   */
  try {
    const bill = await Bill.findOne({ id: req.params.billId });
    await getSale(bill);
    return res.json({ status: true, data: bill });
  } catch (error) {
    console.error(error);
    return res.json({
      status: false,
      error: 'Sorry, something just went wrong, please try again',
      data: null
    });
  }
});

billingRouter.delete('/:billId', async (req, res) => {
  if (typeof req.headers['x-customer-id'] !== 'string' || !req.headers['x-customer-id'].length) {
    return res.json({
      status: false,
      error: 'Missing customer ID',
      data: null
    });
  }

  if (typeof req.params.billId !== 'string') {
    return res.json({
      status: false,
      error: 'Invalid bill ID',
      data: null
    });
  }
  /**
   * Debe retornar 200
   *  - status: true/false
   */
  try {
    const bill = await Bill.findOne({ id: req.params.billId });

    if (!bill) {
      return res.json({
        status: false,
        error: 'Bill does not exist',
        data: null
      });
    }

    await Bill.deleteOne({ id: req.params.billId });
    return res.json({ status: true, data: { deletedBill: req.params.billId } })
  } catch (error) {
    console.error(error);
    return res.json({
      status: false,
      error: 'Sorry, something just went wrong, please try again',
      data: null
    });
  }
});

module.exports.billingRouter = billingRouter;