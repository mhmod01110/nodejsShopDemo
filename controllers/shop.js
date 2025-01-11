const Product = require("../models/product");

exports.getProducts = (req, res, next) => {
    Product.fetchAll((products) => {
        res.render("shop/product-list", {
            prods: products,
            pageTitle: "All Products",
            path: "/products",
        });
    });
};

exports.getProduct = (req, res, next) => {
    const prodId = req.params.productId;
    Product.findByID(prodId, (product) => {
        res.render("shop/product-detail", {
            path: "/products",
            pageTitle: product.title,
            product: product,
        });
    });
};

exports.getIndex = (req, res, next) => {
    Product.fetchAll((products) => {
        res.render("shop/index", {
            prods: products,
            pageTitle: "Shop",
            path: "/",
        });
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
    console.log(product);
  });
  res.redirect('/cart');
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
