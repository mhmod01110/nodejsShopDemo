const express = require('express');
const path = require('path');
const { body } = require('express-validator');

const adminController = require('../controllers/admin');
const isAuth = require("../middlewares/is-auth");
const isAdmin = require('../middlewares/is-admin');
const { productValidator } = require('../validators/productValidators');

const router = express.Router();

// Dashboard routes - only accessible by admin
router.get('/dashboard', isAuth, isAdmin, adminController.getDashboard);
router.get('/dashboard/users', isAuth, isAdmin, adminController.getDashboardUsers);
router.get('/dashboard/orders', isAuth, isAdmin, adminController.getDashboardOrders);
router.get('/dashboard/products', isAuth, isAdmin, adminController.getDashboardProducts);

// User management routes
router.post('/dashboard/user/delete/:userId', isAuth, isAdmin, adminController.deleteDashboardUser);
router.post('/dashboard/user/toggle-admin/:userId', isAuth, isAdmin, adminController.toggleUserAdmin);

// Order management routes
router.post('/dashboard/order/update-status/:orderId', isAuth, isAdmin, adminController.updateOrderStatus);
router.post('/dashboard/order/delete/:orderId', isAuth, isAdmin, adminController.deleteDashboardOrder);

router.get('/add-product', isAuth, adminController.getAddProduct);

router.get('/products', isAuth, adminController.getProducts);

router.post('/add-product', isAuth, productValidator, adminController.postAddProduct);

router.get('/edit-product/:productId', isAuth, adminController.getEditProduct);

router.post('/edit-product', isAuth, productValidator, adminController.postEditProduct);

router.post('/delete-product', isAuth, adminController.postDeleteProduct);

module.exports = router;
