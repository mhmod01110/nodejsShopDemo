const mongoose = require("mongoose");
const { validationResult } = require("express-validator");
const Product = require("../models/product");
const cloudinary = require('cloudinary').v2;
const fs = require('fs');
const path = require('path');

// Configure Cloudinary
cloudinary.config({
    secure: true
});

// Helper function to upload to Cloudinary
const uploadToCloudinary = async (file) => {
    try {
        const result = await cloudinary.uploader.upload(file.path, {
            folder: 'shop_products',
            use_filename: true
        });
        // Delete local file after upload
        fs.unlink(file.path, (err) => {
            if (err) console.error('Error deleting local file:', err);
        });
        return result.secure_url;
    } catch (error) {
        console.error('Cloudinary upload error:', error);
        throw error;
    }
};

exports.getAddProduct = (req, res, next) => {
    if (!req.session.user) {
        return res.redirect("/login");
    }

    res.render("admin/edit-product", {
        pageTitle: "Add Product",
        path: "/admin/add-product",
        isEdit: false,
        errorMessage: null,
        oldInput: {
            title: '',
            imageUrl: '',
            price: '',
            description: ''
        },
        validationErrors: []
    });
};

exports.postAddProduct = async (req, res, next) => {
    if (!req.session.user) {
        return res.redirect("/login");
    }

    const { title, price, description, imageUrl } = req.body;
    const image = req.file;
    const errors = validationResult(req);

    if (!errors.isEmpty()) {
        return res.status(422).render("admin/edit-product", {
            pageTitle: "Add Product",
            path: "/admin/add-product",
            isEdit: false,
            errorMessage: errors.array()[0].msg,
            oldInput: { title, imageUrl, price, description },
            validationErrors: errors.array()
        });
    }

    try {
        // Handle image upload
        let finalImageUrl = imageUrl;
        if (image) {
            finalImageUrl = await uploadToCloudinary(image);
        } else if (!imageUrl) {
            return res.status(422).render("admin/edit-product", {
                pageTitle: "Add Product",
                path: "/admin/add-product",
                isEdit: false,
                errorMessage: 'Please provide either an image file or an image URL',
                oldInput: { title, imageUrl, price, description },
                validationErrors: []
            });
        }

        const product = new Product({
            title,
            price,
            description,
            imageUrl: finalImageUrl,
            userId: req.session.user._id
        });

        await product.save();
        res.redirect("/admin/products");
    } catch (err) {
        const error = new Error(err);
        error.httpStatusCode = 500;
        return next(error);
    }
};

exports.getEditProduct = async (req, res, next) => {
    if (!req.session.user) {
        return res.redirect("/login");
    }

    const editMode = req.query.edit;
    if (editMode !== "true") {
        return res.redirect("/");
    }

    try {
        const prodId = req.params.productId;
        const product = await Product.findOne({
            _id: new mongoose.Types.ObjectId(prodId),
            userId: req.session.user._id
        });

        if (!product) {
            return res.redirect("/");
        }

        res.render("admin/edit-product", {
            pageTitle: "Edit Product",
            path: "/admin/edit-product",
            isEdit: true,
            product,
            errorMessage: null,
            oldInput: {
                title: product.title,
                imageUrl: product.imageUrl,
                price: product.price,
                description: product.description
            },
            validationErrors: []
        });
    } catch (err) {
        const error = new Error(err);
        error.httpStatusCode = 500;
        return next(error);
    }
};

exports.postEditProduct = async (req, res, next) => {
    if (!req.session.user) {
        return res.redirect("/login");
    }

    const { productId, title, price, description, imageUrl } = req.body;
    const image = req.file;
    const errors = validationResult(req);

    if (!errors.isEmpty()) {
        return res.status(422).render("admin/edit-product", {
            pageTitle: "Edit Product",
            path: "/admin/edit-product",
            isEdit: true,
            errorMessage: errors.array()[0].msg,
            product: {
                _id: productId,
                title,
                imageUrl,
                price,
                description
            },
            oldInput: { title, imageUrl, price, description },
            validationErrors: errors.array()
        });
    }

    try {
        const product = await Product.findById(productId);
        
        if (!product) {
            return res.redirect("/admin/products");
        }

        // Check if user is authorized to edit this product
        if (product.userId.toString() !== req.session.user._id.toString()) {
            return res.redirect("/admin/products");
        }

        // Handle image update
        let finalImageUrl = imageUrl;
        if (image) {
            // Upload new image to Cloudinary
            finalImageUrl = await uploadToCloudinary(image);
            
            // Delete old image from Cloudinary if it exists
            if (product.imageUrl && product.imageUrl.includes('cloudinary.com')) {
                const publicId = product.imageUrl.split('/').pop().split('.')[0];
                try {
                    await cloudinary.uploader.destroy('shop_products/' + publicId);
                } catch (err) {
                    console.error('Error deleting old image from Cloudinary:', err);
                }
            }
        }

        // Update product
        product.title = title;
        product.price = price;
        product.description = description;
        if (finalImageUrl) {
            product.imageUrl = finalImageUrl;
        }

        await product.save();
        res.redirect("/admin/products");
    } catch (err) {
        const error = new Error(err);
        error.httpStatusCode = 500;
        return next(error);
    }
};

exports.postDeleteProduct = (req, res, next) => {
    if (!req.session.user) {
        return res.redirect("/login");
    }

    const prodId = req.body.productId;
    Product.deleteOne({
        _id: new mongoose.Types.ObjectId(prodId),
        userId: req.session.user._id
    })
        .then(() => {
            res.redirect("/admin/products");
        })
        .catch(err => {
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
        .then(products => {
            res.render("admin/products", {
                prods: products,
                pageTitle: "Admin Products",
                path: "/admin/products"
            });
        })
        .catch(err => {
            const error = new Error(err);
            error.httpStatusCode = 500;
            return next(error);
        });
};

exports.deleteProduct = async (req, res, next) => {
    try {
        const prodId = req.params.productId;
        const product = await Product.findById(prodId);

        if (!product) {
            return res.status(404).json({ message: 'Product not found' });
        }

        // Check if user is authorized to delete this product
        if (product.userId.toString() !== req.session.user._id.toString()) {
            return res.status(403).json({ message: 'Not authorized' });
        }

        // Delete image from Cloudinary if it exists
        if (product.imageUrl && product.imageUrl.includes('cloudinary.com')) {
            const publicId = product.imageUrl.split('/').pop().split('.')[0];
            try {
                await cloudinary.uploader.destroy('shop_products/' + publicId);
            } catch (err) {
                console.error('Error deleting image from Cloudinary:', err);
            }
        }

        await Product.deleteOne({ _id: prodId, userId: req.session.user._id });
        res.status(200).json({ message: 'Success' });
    } catch (err) {
        res.status(500).json({ message: 'Deleting product failed.' });
    }
};
