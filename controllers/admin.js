const mongoose = require("mongoose");
const mongodb = require("mongodb");
const Product = require("../models/product");
// const Cart = require("../models/cart");
// const User = require("../models/user");

exports.getAddProduct = (req, res, next) => {
    const editMode = req.query.edit;
    res.render("admin/edit-product", {
        pageTitle: "Add Product",
        path: "/admin/add-product",
        formsCSS: true,
        productCSS: true,
        activeAddProduct: true,
        isEdit: editMode,
        isAuth: req.session.isLoggedIn
    });
};

exports.postAddProduct = (req, res, next) => {
    const title = req.body.title;
    const price = req.body.price;
    const imageUrl = req.body.imageUrl;
    const description = req.body.description;
    const product = new Product({
        title: title,
        price: price,
        imageUrl: imageUrl,
        description: description,
        userId: req.session.user
    });
    product
        .save()
        .then((result) => {
            console.log("Product Created");
            res.redirect("/admin/products");
        })
        .catch((err) => {
            console.log(err);
        });
};

exports.getEditProduct = (req, res, next) => {
    const editMode = req.query.edit;
    if (editMode !== "true") {
        return res.redirect("/");
    }
    const prodId = req.params.productId;
    Product.findById(prodId)
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
                product: product,
                isAuth: req.session.isLoggedIn
            });
        })
        .catch((err) => {
            console.error(err);
            res.redirect("/");
        });
};

exports.postEditProduct = (req, res, next) => {
    const prodId = req.body.productId;
    const updatedTitle = req.body.title;
    const updatedImageUrl = req.body.imageUrl;
    const updatedPrice = req.body.price;
    const updatedDescription = req.body.description;

    Product.updateOne(
        { _id: new mongodb.ObjectId(prodId) }, // Filter
        { // Update
            $set: {
                title: updatedTitle,
                imageUrl: updatedImageUrl,
                price: updatedPrice,
                description: updatedDescription,
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
    const prodId = req.body.productId;
    Product.findByIdAndDelete(prodId)
        .then(() => {
            console.log("Product deleted");
            res.redirect("/admin/products");
        })
        .catch((err) => {
            console.error("Error deleting product:", err);
            res.redirect("/");
        });
};

exports.getProducts = (req, res, next) => {
    Product.find({userId: req.user._id}) // retutn all products
        .then((products) => {
            res.render("admin/products", {
                prods: products,
                pageTitle: "Admin Products",
                path: "/admin/products",
                isAuth: req.session.isLoggedIn,
            });
        })
        .catch((err) => {
            console.log(err);
        });
};
