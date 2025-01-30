const path = require('path');

const express = require('express');

const shopController = require('../controllers/shop');
const isAuth = require("../middlewares/is-auth");

const router = express.Router();

router.get('/', shopController.getIndex);

router.get('/products', shopController.getProducts);

router.get('/products/:productId', shopController.getProduct);

router.get('/cart', isAuth, shopController.getCart);

// Cart management routes
router.post('/cart', isAuth, shopController.postCart);
router.post('/cart-delete-item', isAuth, shopController.postCartDeleteProduct);

router.post('/create-order', isAuth, shopController.postOrder);

router.get('/orders', isAuth, shopController.getOrders);
router.get('/orders/:orderId/invoice', isAuth, shopController.getInvoice);

router.get('/checkout', isAuth, shopController.getCheckout);
router.post('/checkout', isAuth, shopController.postCheckout);

module.exports = router;
