const { where } = require("sequelize");
const Product = require("../models/product");
const Order = require("../models/order");
const mongoose = require("mongoose");


exports.getProducts = (req, res, next) => {
    Product.find()
        .then((products) => {
            res.render("shop/product-list", {
                prods: products,
                pageTitle: "All Products",
                path: "/products",
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
            });
        }

        Product.findById(prodId)
            .then((product) => {
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
            });
        })
        .catch((err) => {
            console.log(err);
        });
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

exports.postCart = (req, res, next) => {
    const prodId = req.body.productId;
    Product.findById(prodId)
        .then((product) => {
            if (!product) {
                return res.status(404).json({ message: "Product not found" });
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
};

exports.postCartDeleteProduct = (req, res, next) => {
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
};

exports.postOrder = (req, res, next) => {
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
};

exports.getOrders = (req, res, next) => {
    res.render("shop/orders", {
        path: "/orders",
        pageTitle: "Your Orders",
        orders: req.session.user.orders,
    });
};

exports.getCheckout = (req, res, next) => {
    res.render("shop/checkout", {
        path: "/checkout",
        pageTitle: "Checkout",
    });
};
