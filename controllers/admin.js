const mongoose = require("mongoose");
const mongodb = require("mongodb");
const Product = require("../models/product");
const { validationResult } = require("express-validator");

exports.getAddProduct = (req, res, next) => {
    const editMode = req.query.edit;
    res.render("admin/edit-product", {
        pageTitle: "Add Product",
        path: "/admin/add-product",
        formsCSS: true,
        productCSS: true,
        activeAddProduct: true,
        isEdit: editMode,
        oldInput: {
            title: "",
            price: "",
            imageUrl: "",
            description: "",
        },
        validationErrors: [],
        errorMessage: null,
    });
};

exports.postAddProduct = (req, res, next) => {
    if (!req.session.user) {
        return res.redirect("/login");
    }

    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        return res.status(422).render("admin/edit-product", {
            pageTitle: "Add Product",
            path: "/admin/add-product",
            formsCSS: true,
            productCSS: true,
            activeAddProduct: true,
            isEdit: false,
            errorMessage: errors.array()[0].msg,
            oldInput: {
                title: req.body.title,
                price: req.body.price,
                imageUrl: req.body.imageUrl,
                description: req.body.description,
            },
            validationErrors: errors.array(),
        });
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
            const error = new Error(err);
            error.httpStatusCode = 500;
            return next(error);
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
        _id: new mongoose.Types.ObjectId(prodId),
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
                oldInput: {
                    title: product.title,
                    price: product.price,
                    imageUrl: product.imageUrl,
                    description: product.description,
                },
                validationErrors: [],
                errorMessage: null,
            });
        })
        .catch((err) => {
            const error = new Error(err);
            error.httpStatusCode = 500;
            return next(error);
        });
};

exports.postEditProduct = (req, res, next) => {
    if (!req.session.user) {
        return res.redirect("/login");
    }

    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        return res.status(422).render("admin/edit-product", {
            pageTitle: "Edit Product",
            path: "/admin/edit-product",
            formsCSS: true,
            productCSS: true,
            activeAddProduct: true,
            isEdit: true,
            errorMessage: errors.array()[0].msg,
            product: {
                _id: req.body.productId,
                title: req.body.title,
                price: req.body.price,
                imageUrl: req.body.imageUrl,
                description: req.body.description,
            },
            oldInput: {
                title: req.body.title,
                price: req.body.price,
                imageUrl: req.body.imageUrl,
                description: req.body.description,
            },
            validationErrors: errors.array(),
        });
    }

    const { productId, title, imageUrl, price, description } = req.body;

    Product.updateOne(
        { _id: new mongoose.Types.ObjectId(productId), userId: req.session.user._id },
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
            const error = new Error(err);
            error.httpStatusCode = 500;
            return next(error);
        });
};

exports.postDeleteProduct = (req, res, next) => {
    const prodId = req.body.productId;
    Product.deleteOne({
        _id: new mongoose.Types.ObjectId(prodId),
        userId: req.session.user._id,
    })
        .then(() => {
            console.log("Product deleted");
            res.redirect("/admin/products");
        })
        .catch((err) => {
            const error = new Error(err);
            error.httpStatusCode = 500;
            return next(error);
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
            const error = new Error(err);
            error.httpStatusCode = 500;
            return next(error);
        });
};
