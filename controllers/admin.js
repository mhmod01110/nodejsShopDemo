const mongoose = require("mongoose");
const mongodb = require("mongodb");
const Product = require("../models/product");

exports.getAddProduct = (req, res, next) => {
    if (!req.session.user) {
        return res.redirect("/login");
    }
    const editMode = req.query.edit;
    res.render("admin/edit-product", {
        pageTitle: "Add Product",
        path: "/admin/add-product",
        formsCSS: true,
        productCSS: true,
        activeAddProduct: true,
        isEdit: editMode,
    });
};

exports.postAddProduct = (req, res, next) => {
    if (!req.session.user) {
        return res.redirect("/login");
    }
    const { title, price, imageUrl, description } = req.body;
    const product = new Product({
        title,
        price,
        imageUrl,
        description,
        userId: req.session.user._id,
    });
    product
        .save()
        .then(() => {
            console.log("Product Created");
            res.redirect("/admin/products");
        })
        .catch((err) => {
            console.error("Error creating product:", err);
        });
};

exports.getEditProduct = (req, res, next) => {
    if (!req.session.user) {
        return res.redirect("/login");
    }
    const editMode = req.query.edit;
    if (editMode !== "true") {
        return res.redirect("/");
    }
    const prodId = req.params.productId;
    Product.findOne({
        _id: new mongodb.ObjectId(prodId),
        userId: req.session.user._id,
    })
        .then((product) => {
            if (!product) {
                return res.redirect("/");
            }
            res.render("admin/edit-product", {
                pageTitle: "Edit Product",
                path: "/admin/edit-product",
                formsCSS: true,
                productCSS: true,
                activeAddProduct: true,
                isEdit: editMode,
                product,
            });
        })
        .catch((err) => {
            console.error(err);
            res.redirect("/");
        });
};

exports.postEditProduct = (req, res, next) => {
    if (!req.session.user) {
        return res.redirect("/login");
    }
    const { productId, title, imageUrl, price, description } = req.body;

    Product.updateOne(
        { _id: new mongodb.ObjectId(productId), userId: req.session.user._id },
        {
            $set: {
                title,
                imageUrl,
                price,
                description,
            },
        }
    )
        .then(() => {
            console.log("Product updated");
            res.redirect("/admin/products");
        })
        .catch((err) => {
            console.error("Error updating product:", err);
            res.redirect("/admin/products");
        });
};

exports.postDeleteProduct = (req, res, next) => {
    if (!req.session.user) {
        return res.redirect("/login");
    }
    const prodId = req.body.productId;
    Product.deleteOne({ _id: new mongodb.ObjectId(prodId), userId: req.session.user._id })
        .then(() => {
            console.log("Product deleted");
            res.redirect("/admin/products");
        })
        .catch((err) => {
            console.error("Error deleting product:", err);
            res.redirect("/admin/products");
        });
};

exports.getProducts = (req, res, next) => {
    if (!req.session.user) {
        return res.redirect("/login");
    }
    Product.find({ userId: req.session.user._id })
        .then((products) => {
            res.render("admin/products", {
                prods: products,
                pageTitle: "Admin Products",
                path: "/admin/products",
            });
        })
        .catch((err) => {
            console.error("Error fetching products:", err);
        });
};
