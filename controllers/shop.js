const { where } = require("sequelize");
const Product = require("../models/product");
const Order = require("../models/order");
const mongoose = require("mongoose");

function isAuth(req, res, next) {
    if (!req.session.isLoggedIn) {
        return res.redirect("/login"); // Redirect to login if not authenticated
    }
    next();
}

exports.getProducts = (req, res, next) => {
    Product.find()
        .then((products) => {
            res.render("shop/product-list", {
                prods: products,
                pageTitle: "All Products",
                path: "/products",
                isAuth: req.session.isLoggedIn,
            });
        })
        .catch((err) => {
            console.log(err);
        });
};

exports.getProduct = async (req, res, next) => {
    try {
        const prodId = req.params.productId;

        if (!mongoose.Types.ObjectId.isValid(prodId)) {
            return res.status(400).render("404", {
                pageTitle: "Invalid Product ID",
                path: "/404",
                isAuth: req.session.isLoggedIn,
            });
        }

        Product.findById(prodId)
            .then((product) => {
                if (!product) {
                    return res.status(404).render("404", {
                        pageTitle: "Product Not Found",
                        path: "/404",
                        isAuth: req.session.isLoggedIn,
                    });
                }

                res.render("shop/product-detail", {
                    product,
                    pageTitle: product.title,
                    path: "/products",
                    isAuth: req.session.isLoggedIn,
                });
            })
            .catch((err) => {
                console.log(err);
            });
    } catch (err) {
        console.error("Error fetching product:", err);
        next(err);
    }
};

exports.getIndex = (req, res, next) => {
    Product.find()
        .then((products) => {
            res.render("shop/index", {
                prods: products,
                pageTitle: "Shop",
                path: "/",
                isAuth: req.session.isLoggedIn,
            });
        })
        .catch((err) => {
            console.log(err);
        });
};

// Apply middleware to protected routes
exports.getCart = [
    isAuth,
    (req, res, next) => {
        const cart = req.session.user.cart || { items: [], totalPrice: 0 };
        res.render("shop/cart", {
            path: "/cart",
            pageTitle: "Your Cart",
            products: cart.items,
            totalPrice: cart.totalPrice,
            isAuth: req.session.isLoggedIn,
        });
    },
];

exports.postCart = [
    isAuth,
    (req, res, next) => {
        const prodId = req.body.productId;
        Product.findById(prodId)
            .then((product) => {
                if (!product) {
                    return res
                        .status(404)
                        .json({ message: "Product not found" });
                }
                return req.session.user.addToCart(product);
            })
            .then(() => {
                console.log("Product added to cart");
                res.redirect("/cart");
            })
            .catch((err) => {
                console.error("Error adding product to cart:", err);
                res.status(500).json({ error: "Failed to update the cart" });
            });
    },
];

exports.postCartDeleteProduct = [
    isAuth,
    (req, res, next) => {
        const prodId = req.body.productId;
        req.session.user
            .deleteItemFromCart(prodId)
            .then(() => {
                console.log("Product removed from cart");
                res.redirect("/cart");
            })
            .catch((err) => {
                console.log(err);
                res.status(500).json({
                    error: "Failed to delete product from cart",
                });
            });
    },
];

exports.postOrder = [
    isAuth,
    (req, res, next) => {
        req.session.user
            .createOrder()
            .then(() => {
                // res.render("shop/orders", {
                //     path: "/orders",
                //     pageTitle: "Your Orders",
                //     orders: req.session.user.orders,
                res.redirect("/orders");
                // });
            })
            .catch((err) => {
                console.log(err);
            });
    },
];

exports.getOrders = [
    isAuth,
    (req, res, next) => {
        res.render("shop/orders", {
            path: "/orders",
            pageTitle: "Your Orders",
            orders: req.session.user.orders,
            isAuth: req.session.isLoggedIn,
        });
    },
];

exports.getCheckout = [
    isAuth,
    (req, res, next) => {
        res.render("shop/checkout", {
            path: "/checkout",
            pageTitle: "Checkout",
            isAuth: req.session.isLoggedIn,
        });
    },
];
