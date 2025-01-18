const { where } = require("sequelize");
const Product = require("../models/product");
const Order = require("../models/order");

exports.getProducts = (req, res, next) => {
    Product.fetchAll()
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

exports.getProduct = (req, res, next) => {
    const prodId = req.params.productId;

    Product.findbyId(prodId)
        .then((product) => {
            if (!product) {
                return res.status(404).render("404", {
                    pageTitle: "Product Not Found",
                    path: "/404",
                });
            }
            res.render("shop/product-detail", {
                product: product,
                pageTitle: product.title,
                path: "/products",
            });
        })
        .catch((err) => {
            console.error("Error fetching product:", err);
            res.status(500).render("500", {
                pageTitle: "Error",
                path: "/500",
            });
        });
};

exports.getIndex = (req, res, next) => {
    Product.fetchAll()
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
    const cart = req.user.cart || { items: [], totalPrice: 0 };
    res.render("shop/cart", {
        path: "/cart",
        pageTitle: "Your Cart",
        products: cart.items, // Use the items array from the user's cart
        totalPrice: cart.totalPrice, // Use the total price from the user's cart
    });
};

exports.postCart = (req, res, next) => {
    const prodId = req.body.productId;
    Product.findbyId(prodId) // Find the product by ID
        .then((product) => {
            if (!product) {
                return res.status(404).json({ message: "Product not found" });
            }
            return req.user.addToCart(product); // Use the `addToCart` method
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
    // Update the user's cart in the database
    req.user
        .deleteItemFromCart(prodId)
        .then(() => {
            console.log("Product removed from cart");
        })
        .then(() => {
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
    let fetchedCart;
    req.user
        .addOrder()
        .then((result) => {
            res.redirect("/orders");
        })
        .catch((err) => {
            console.log(err);
        });
};

exports.getOrders = (req, res, next) => {
    req.user
        .getOrders()
        .then((orders) => {
            res.render("shop/orders", {
                path: "/orders",
                pageTitle: "Your Orders",
                orders: orders,
            });
        })
        .catch((err) => console.log(err));
};

exports.getCheckout = (req, res, next) => {
    res.render("shop/checkout", {
        path: "/checkout",
        pageTitle: "Checkout",
    });
};
