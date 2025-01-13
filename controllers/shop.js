const Cart = require("../models/cart");
const Product = require("../models/product");

exports.getProducts = (req, res, next) => {
    Product.fetchAll()
        .then(([rows, metaData]) => {
            res.render("shop/product-list", {
                prods: rows,
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
    Product.findByID(prodId)
        .then(([rows, metaDara]) => {
            res.render("shop/product-detail", {
                path: "/products",
                pageTitle: rows[0].title,
                product: rows[0],
            });
        })
        .catch((err) => {
            console.log(err);
        });
};

exports.getIndex = (req, res, next) => {
    Product.fetchAll()
        .then(([rows, metaData]) => {
            res.render("shop/index", {
                prods: rows,
                pageTitle: "Shop",
                path: "/",
            });
        })
        .catch((err) => {
            console.log(err);
        });
};

exports.getCart = (req, res, next) => {
    res.render("shop/cart", {
        path: "/cart",
        pageTitle: "Your Cart",
    });
};

exports.postCart = (req, res, next) => {
    const prodId = req.body.productId;
    Product.findByID(prodId, (product) => {
        Cart.addProducts(prodId, product.price);
    });
    res.redirect("/cart");
};

exports.getOrders = (req, res, next) => {
    res.render("shop/orders", {
        path: "/orders",
        pageTitle: "Your Orders",
    });
};

exports.getCheckout = (req, res, next) => {
    res.render("shop/checkout", {
        path: "/checkout",
        pageTitle: "Checkout",
    });
};
