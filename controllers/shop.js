const Product = require("../models/product");
const mongoose = require("mongoose");
const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY);
const fs = require('fs');
const path = require('path');
const generateInvoice = require('../util/invoice');

exports.getProducts = async (req, res, next) => {
    try {
        const page = +req.query.page || 1;
        const itemsPerPage = 6;

        // Get total count of products
        const totalItems = await Product.countDocuments();

        // Get products for current page
        const products = await Product.find()
            .skip((page - 1) * itemsPerPage)
            .limit(itemsPerPage);

        res.render("shop/product-list", {
            prods: products,
            pageTitle: "All Products",
            path: "/products",
            currentPage: page,
            hasNextPage: itemsPerPage * page < totalItems,
            hasPreviousPage: page > 1,
            nextPage: page + 1,
            previousPage: page - 1,
            lastPage: Math.ceil(totalItems / itemsPerPage)
        });
    } catch (err) {
        const error = new Error(err);
        error.httpStatusCode = 500;
        return next(error);
    }
};

exports.getProduct = async (req, res, next) => {
    try {
        const prodId = req.params.productId;

        if (!mongoose.Types.ObjectId.isValid(prodId)) {
            return res.status(400).render("404", {
                pageTitle: "Invalid Product ID",
                path: "/404",
            });
        }

        const product = await Product.findById(prodId);
        
        if (!product) {
            return res.status(404).render("404", {
                pageTitle: "Product Not Found",
                path: "/404",
            });
        }

        res.render("shop/product-detail", {
            product,
            pageTitle: product.title,
            path: "/products",
        });

    } catch (err) {
        const error = new Error(err);
        error.httpStatusCode = 500;
        return next(error);
    }
};

exports.getIndex = async (req, res, next) => {
    try {
        const page = +req.query.page || 1;
        const itemsPerPage = 6;

        // Get total count of products
        const totalItems = await Product.countDocuments();

        // Get products for current page
        const products = await Product.find()
            .skip((page - 1) * itemsPerPage)
            .limit(itemsPerPage);

        res.render("shop/index", {
            prods: products,
            pageTitle: "Shop",
            path: "/",
            currentPage: page,
            hasNextPage: itemsPerPage * page < totalItems,
            hasPreviousPage: page > 1,
            nextPage: page + 1,
            previousPage: page - 1,
            lastPage: Math.ceil(totalItems / itemsPerPage)
        });
    } catch (err) {
        const error = new Error(err);
        error.httpStatusCode = 500;
        return next(error);
    }
};

exports.getCart = (req, res, next) => {
    const cart = req.session.user.cart || { items: [], totalPrice: 0 };
    res.render("shop/cart", {
        path: "/cart",
        pageTitle: "Your Cart",
        products: cart.items,
        totalPrice: cart.totalPrice,
    });
};

exports.postCart = async (req, res, next) => {
    try {
        const prodId = req.body.productId;
        
        // Validate product ID
        if (!mongoose.Types.ObjectId.isValid(prodId)) {
            return res.status(400).json({ message: "Invalid product ID" });
        }

        // Get fresh user data
        const user = await mongoose.model('User').findById(req.session.user._id);
        if (!user) {
            return res.status(404).json({ message: "User not found" });
        }

        // Find the product
        const product = await Product.findById(prodId);
        if (!product) {
            return res.status(404).json({ message: "Product not found" });
        }

        // Add to cart
        await user.addToCart(product);
        
        // Update session user
        req.session.user = user;
        await req.session.save();

        res.redirect("/cart");
    } catch (err) {
        console.error('Error adding to cart:', err);
        const error = new Error(err);
        error.httpStatusCode = 500;
        return next(error);
    }
};

exports.postCartDeleteProduct = (req, res, next) => {
    const prodId = req.body.productId;
    req.session.user
        .deleteItemFromCart(prodId)
        .then(() => {
            res.redirect("/cart");
        })
        .catch((err) => {
            const error = new Error(err);
            error.httpStatusCode = 500;
            return next(error);
        });
};

exports.postOrder = (req, res, next) => {
    req.session.user
        .createOrder()
        .then(() => {
            res.redirect("/orders");
        })
        .catch((err) => {
            const error = new Error(err);
            error.httpStatusCode = 500;
            return next(error);
        });
};

exports.getOrders = (req, res, next) => {
    // Sort orders by date, most recent first
    const sortedOrders = [...req.session.user.orders].sort((a, b) => 
        new Date(b.createdAt) - new Date(a.createdAt)
    );

    res.render("shop/orders", {
        path: "/orders",
        pageTitle: "Your Orders",
        orders: sortedOrders,
    });
};

exports.getInvoice = async (req, res, next) => {
    try {
        const orderId = req.params.orderId;
        
        // Get user with populated orders
        const user = await mongoose.model('User').findById(req.session.user._id)
            .populate({
                path: 'orders.userId',
                select: 'email'
            });

        const order = user.orders.find(order => 
            order._id.toString() === orderId
        );

        if (!order) {
            return next(new Error('No order found.'));
        }

        const invoiceName = 'invoice-' + orderId + '.pdf';
        const invoicePath = path.join('data', 'invoices', invoiceName);

        // Create invoices directory if it doesn't exist
        const invoicesDir = path.join('data', 'invoices');
        if (!fs.existsSync(invoicesDir)) {
            fs.mkdirSync(invoicesDir, { recursive: true });
        }

        // Generate the invoice
        await generateInvoice({
            ...order.toObject(),
            userId: { email: user.email } // Add user email to order object
        }, invoicePath);

        // Send the file
        const file = fs.createReadStream(invoicePath);
        res.setHeader('Content-Type', 'application/pdf');
        res.setHeader('Content-Disposition', 'attachment; filename="' + invoiceName + '"');
        file.pipe(res);

        // Clean up the file after sending
        file.on('end', () => {
            fs.unlink(invoicePath, (err) => {
                if (err) console.error('Error deleting invoice:', err);
            });
        });

        // Handle stream errors
        file.on('error', (err) => {
            console.error('Error streaming invoice:', err);
            next(err);
        });
    } catch (err) {
        console.error('Error generating invoice:', err);
        next(err);
    }
};

exports.getCheckout = (req, res, next) => {
    const cart = req.session.user.cart || { items: [], totalPrice: 0 };
    
    if (!cart.items.length) {
        return res.redirect('/cart');
    }

    let errorMessage = req.flash('error')[0];
    let successMessage = req.flash('success')[0];
    
    // Ensure only one type of message is shown
    if (errorMessage) successMessage = null;
    if (successMessage) errorMessage = null;

    res.render("shop/checkout", {
        path: "/checkout",
        pageTitle: "Checkout",
        products: cart.items,
        totalPrice: cart.totalPrice,
        stripePublicKey: process.env.STRIPE_PUBLIC_KEY,
        error: errorMessage,
        success: successMessage
    });
};

exports.postCheckout = async (req, res, next) => {
    try {
        const { stripeToken } = req.body;
        const cart = req.session.user.cart;

        if (!cart || cart.items.length === 0) {
            req.flash('error', 'Your cart is empty');
            req.flash('success', null); // Clear any success message
            return res.redirect('/checkout');
        }

        // Create Stripe charge
        const charge = await stripe.charges.create({
            amount: Math.round(cart.totalPrice * 100), // Stripe expects amount in cents
            currency: 'usd',
            description: 'Order payment',
            source: stripeToken,
            metadata: {
                userId: req.session.user._id.toString(),
                orderItems: JSON.stringify(cart.items.map(item => ({
                    productId: item.product._id,
                    quantity: item.quantity
                })))
            }
        });

        // If charge is successful, create order and clear cart
        await req.session.user.createOrder();
        
        req.flash('success', 'Order placed successfully!');
        req.flash('error', null); // Clear any error message
        res.redirect('/orders');
    } catch (err) {
        req.flash('error', err.message || 'An error occurred during checkout');
        req.flash('success', null); // Clear any success message
        res.redirect('/checkout');
    }
};
