/**
 * Modulo Cart para agregar elementos/items
 * a un carrito de compras
 */
const crypto = require('crypto');
const { Cart, CartItems, Item } = require('../database/models');

const Router = require('express').Router;

const cartRouter = Router({ mergeParams: true });

cartRouter.get('/:cartId', async (req, res) => {

  if (typeof req.headers['x-customer-id'] !== 'string' || !req.headers['x-customer-id'].length) {
    return res.json({
      status: false,
      error: 'Missing customer ID',
      data: null
    });
  }

  /**
   * Debe retornar 200
   *  - status: true/false
   *  - data: Array de items
   *      - itemId
   *      - amount
   */
  try {
    const cart = await Cart.findOne({
      customerId: req.headers['x-customer-id'],
      id: req.params.cartId
    });

    if (!cart) {
      res.json({
        status: false,
        error: 'Cart not found',
        data: null
      });
    }

    const cartItems = await CartItems.find({ cartId: req.params.cartId });

    const promisesDetailedItems = [];
    for (const cartItem of cartItems) {
      promisesDetailedItems.push(
        Item
          .findOne({ id: cartItem.itemId })
          .then(({ __internalId, ...item }) => ({ amount: cartItem.amount, ...item }))
      )
    }

    const detailedItems = await Promise.all(promisesDetailedItems);
    return res.json({
      status: true,
      data: {
        cartId: req.params.cartId,
        items: detailedItems
      }
    });
  } catch (error) {
    console.error(error);
    return res.json({
      status: false,
      error: 'Sorry, something just went wrong, please try again',
      data: null
    });
  }
});

/**
 * En body:
 *  - Array de items
 *    - itemId
 *    - amount
 */
cartRouter.post('/', async (req, res) => {

  if (typeof req.headers['x-customer-id'] !== 'string' || !req.headers['x-customer-id'].length) {
    return res.json({
      status: false,
      error: 'Missing customer ID',
      data: null
    });
  }

  /**
   * Debe retornar 200
   *  - status: true/false
   *  - Id del carrito
   */
  try {
    const cartId = crypto.randomBytes(12).toString('hex');

    await Cart.insertOne({
      customerId: req.headers['x-customer-id'],
      id: cartId
    });

    return res.json({
      status: true,
      data: { createdCart: cartId }
    });
  } catch (error) {
    console.error(error);
    return res.json({
      status: false,
      error: 'Sorry, something just went wrong, please try again',
      data: null
    });
  }
});

/**
 * En body:
 *  - Cupon de descuento (si lo tiene)
 *  - Array de items
 *    - itemId
 *    - amount
 */
cartRouter.put('/:cartId', async (req, res) => {

  if (typeof req.headers['x-customer-id'] !== 'string' || !req.headers['x-customer-id'].length) {
    return res.json({
      status: false,
      error: 'Missing customer ID',
      data: null
    });
  }

  /**
   * Debe retornar 200
   *  - status: true/false
   */
  try {
    const cart = await Cart.findOne({
      customerId: req.headers['x-customer-id'],
      id: req.params.cartId
    });

    if (!cart) {
      return res.json({
        status: false,
        error: 'Cart not found',
        data: null
      });
    }

    const { items = [] } = req.body;

    const checkItemPromises = [];
    for (const item of items) {
      checkItemPromises.push(Item.findOne({ id: item.id }));
    }

    const checkedItems = await Promise.all(checkItemPromises);
    const notFoundItems = checkedItems.filter((item) => !item).length;

    if (notFoundItems) {
      return res.json({
        status: false,
        error: 'Items could not be added to cart, some of them does not exist',
        data: null
      });
    }

    // Clean cart before putting new items
    await CartItems.deleteMany({ cartId: req.params.cartId });

    const promises = items.map((item) => CartItems.insertOne({
      cartId: req.params.cartId,
      itemId: item.id,
      amount: item.amount
    }).then(({ __internalId, cartId, ...cartItem }) => cartItem));

    await Promise.all(promises);

    return res.json({
      status: true,
      data: { updatedCart: req.params.cartId }
    })
  } catch (error) {
    console.error(error);
    return res.json({
      status: false,
      error: 'Sorry, something just went wrong, please try again',
      data: null
    });
  }
})

cartRouter.delete('/:cartId', async (req, res) => {

  if (typeof req.headers['x-customer-id'] !== 'string' || !req.headers['x-customer-id'].length) {
    return res.json({
      status: false,
      error: 'Missing customer ID',
      data: null
    });
  }

  /**
   * Debe retornar 200
   *  - status: true/false
   */
  try {
    const cart = await Cart.findOne({
      customerId: req.headers['x-customer-id'],
      id: req.params.cartId
    });

    if (!cart) {
      return res.json({
        status: false,
        error: 'Cart not found',
        data: null
      });
    }

    const deletedCart = await Cart.deleteOne({
      customerId: req.headers['x-customer-id'],
      id: req.params.cartId
    });

    return res.json({
      status: true,
      data: { deletedCart: deletedCart.id }
    });
  } catch (error) {
    console.error(error);
    return res.json({
      status: false,
      error: 'Sorry, something just went wrong, please try again',
      data: null
    });
  }
});

module.exports.cartRouter = cartRouter;