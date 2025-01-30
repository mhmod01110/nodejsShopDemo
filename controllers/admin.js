const mongoose = require("mongoose");
const { validationResult } = require("express-validator");
const Product = require("../models/product");
const cloudinary = require('cloudinary').v2;
const fs = require('fs');
const path = require('path');
const nodemailer = require('nodemailer');
const transporter = require('../util/sendMail');

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
    if (!editMode) {
        return res.redirect("/");
    }

    const prodId = req.params.productId;
    try {
        const product = await Product.findById(prodId);
        
        if (!product) {
            return res.redirect("/");
        }

        // Check if user is authorized to edit this product (either creator or admin)
        const isCreator = product.userId.toString() === req.session.user._id.toString();
        const isAdmin = req.session.user.isAdmin;
        
        if (!isCreator && !isAdmin) {
            req.flash('error', 'Not authorized to edit this product');
            return res.redirect("/admin/products");
        }

        res.render("admin/edit-product", {
            pageTitle: "Edit Product",
            path: "/admin/edit-product",
            isEdit: editMode,
            product: product,
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

        // Check if user is authorized to edit this product (either creator or admin)
        const isCreator = product.userId.toString() === req.session.user._id.toString();
        const isAdmin = req.session.user.isAdmin;
        
        if (!isCreator && !isAdmin) {
            req.flash('error', 'Not authorized to edit this product');
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
        req.flash('success', 'Product updated successfully');
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
    
    // If user is admin, allow deletion of any product, otherwise only their own
    const query = req.session.user.isAdmin 
        ? { _id: new mongoose.Types.ObjectId(prodId) }
        : { _id: new mongoose.Types.ObjectId(prodId), userId: req.session.user._id };

    Product.deleteOne(query)
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

    // If user is admin, show all products, otherwise show only their products
    const query = req.session.user.isAdmin ? {} : { userId: req.session.user._id };

    Product.find(query)
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

        // Check if user is authorized to delete this product (either creator or admin)
        const isCreator = product.userId.toString() === req.session.user._id.toString();
        const isAdmin = req.session.user.isAdmin;
        
        if (!isCreator && !isAdmin) {
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

        // If user is admin, allow deletion of any product, otherwise only their own
        const query = req.session.user.isAdmin 
            ? { _id: prodId }
            : { _id: prodId, userId: req.session.user._id };

        await Product.deleteOne(query);
        res.status(200).json({ message: 'Success' });
    } catch (err) {
        res.status(500).json({ message: 'Deleting product failed.' });
    }
};

exports.getDashboard = async (req, res, next) => {
    try {
        // Get basic stats
        const [users, products] = await Promise.all([
            mongoose.model('User').find(),
            Product.find()
        ]);

        // Initialize stats
        let stats = {
            totalUsers: users.length,
            totalProducts: products.length,
            totalOrders: 0,
            totalRevenue: 0
        };

        // Get orders stats
        const ordersStats = await mongoose.model('User').aggregate([
            {
                $match: {
                    'orders.0': { $exists: true } // Only users with at least one order
                }
            },
            {
                $project: {
                    orderCount: { $size: '$orders' },
                    totalRevenue: {
                        $reduce: {
                            input: '$orders',
                            initialValue: 0,
                            in: { $add: ['$$value', '$$this.totalPrice'] }
                        }
                    }
                }
            },
            {
                $group: {
                    _id: null,
                    totalOrders: { $sum: '$orderCount' },
                    totalRevenue: { $sum: '$totalRevenue' }
                }
            }
        ]).exec();

        // Update stats with orders data if exists
        if (ordersStats && ordersStats[0]) {
            stats.totalOrders = ordersStats[0].totalOrders;
            stats.totalRevenue = ordersStats[0].totalRevenue;
        }

        // Get recent orders
        const recentOrders = await mongoose.model('User').aggregate([
            {
                $match: {
                    'orders.0': { $exists: true }
                }
            },
            { $unwind: '$orders' },
            {
                $project: {
                    _id: '$orders._id',
                    userEmail: '$email',
                    createdAt: '$orders.createdAt',
                    totalPrice: '$orders.totalPrice',
                    orderStatus: '$orders.orderStatus'
                }
            },
            {
                $sort: { createdAt: -1 }
            },
            {
                $limit: 10
            }
        ]).exec();

        res.render('admin/dashboard', {
            pageTitle: 'Admin Dashboard',
            path: '/admin/dashboard',
            stats,
            recentOrders: recentOrders || []
        });
    } catch (err) {
        console.error('Dashboard Error:', err);
        const error = new Error(err);
        error.httpStatusCode = 500;
        return next(error);
    }
};

exports.getDashboardUsers = async (req, res, next) => {
    try {
        const users = await mongoose.model('User').find()
            .select('email isAdmin orders cart');

        res.render('admin/dashboard-users', {
            pageTitle: 'Manage Users',
            path: '/admin/dashboard/users',
            users,
            errorMessage: req.flash('error')[0],
            successMessage: req.flash('success')[0]
        });
    } catch (err) {
        const error = new Error(err);
        error.httpStatusCode = 500;
        return next(error);
    }
};

exports.getDashboardOrders = async (req, res, next) => {
    try {
        const orders = await mongoose.model('User').aggregate([
            {
                $match: {
                    'orders.0': { $exists: true }
                }
            },
            { $unwind: '$orders' },
            {
                $project: {
                    'orders._id': 1,
                    'orders.items': 1,
                    'orders.totalPrice': 1,
                    'orders.orderStatus': 1,
                    'orders.createdAt': 1,
                    'orders.paymentStatus': 1,
                    userEmail: '$email',
                    userId: '$_id'
                }
            },
            { $sort: { 'orders.createdAt': -1 } }
        ]).exec();

        // Transform the data structure to match the view expectations
        const transformedOrders = orders.map(order => ({
            userEmail: order.userEmail,
            userId: order.userId,
            orders: {
                _id: order.orders._id,
                items: order.orders.items,
                totalPrice: order.orders.totalPrice,
                orderStatus: order.orders.orderStatus,
                createdAt: order.orders.createdAt,
                paymentStatus: order.orders.paymentStatus
            }
        }));

        res.render('admin/dashboard-orders', {
            pageTitle: 'Manage Orders',
            path: '/admin/dashboard/orders',
            orders: transformedOrders
        });
    } catch (err) {
        console.error('Dashboard Orders Error:', err);
        const error = new Error(err);
        error.httpStatusCode = 500;
        return next(error);
    }
};

exports.getDashboardProducts = async (req, res, next) => {
    try {
        const products = await Product.find();

        res.render('admin/dashboard-products', {
            pageTitle: 'Manage Products',
            path: '/admin/dashboard/products',
            products
        });
    } catch (err) {
        const error = new Error(err);
        error.httpStatusCode = 500;
        return next(error);
    }
};

exports.deleteDashboardUser = async (req, res, next) => {
    try {
        const userId = req.params.userId;
        await mongoose.model('User').findByIdAndDelete(userId);
        res.redirect('/admin/dashboard/users');
    } catch (err) {
        const error = new Error(err);
        error.httpStatusCode = 500;
        return next(error);
    }
};

exports.toggleUserAdmin = async (req, res, next) => {
    try {
        const userId = req.params.userId;

        // Validate userId
        if (!mongoose.Types.ObjectId.isValid(userId)) {
            req.flash('error', 'Invalid user ID');
            return res.redirect('/admin/dashboard/users');
        }

        // Find and update user
        const user = await mongoose.model('User').findById(userId);
        
        if (!user) {
            req.flash('error', 'User not found');
            return res.redirect('/admin/dashboard/users');
        }

        // Don't allow admin to remove their own admin status
        if (user._id.toString() === req.session.user._id.toString() && user.isAdmin) {
            req.flash('error', 'You cannot remove your own admin status');
            return res.redirect('/admin/dashboard/users');
        }

        // Ensure all orders have userId
        if (user.orders && Array.isArray(user.orders)) {
            user.orders.forEach(order => {
                if (!order.userId) {
                    order.userId = user._id;
                }
            });
        }

        // Toggle admin status
        user.isAdmin = !user.isAdmin;

        // Use updateOne to avoid validation issues
        await mongoose.model('User').updateOne(
            { _id: user._id },
            { 
                $set: { 
                    isAdmin: user.isAdmin,
                    orders: user.orders 
                } 
            }
        );

        // Send email notification using the existing transporter
        const mailOptions = {
            from: process.env.GMAIL_USER,
            to: user.email,
            subject: 'Admin Status Update',
            html: `
                <h1>Admin Status Update</h1>
                <p>Dear ${user.email},</p>
                <p>Your account status has been updated. You are ${user.isAdmin ? 'now an administrator' : 'no longer an administrator'} on our platform.</p>
                <p>If you have any questions, please contact support.</p>
                <p>Best regards,<br>Your Shop Team</p>
            `
        };

        await transporter.sendMail(mailOptions);

        // Flash success message
        req.flash('success', `User ${user.email} is now ${user.isAdmin ? 'an admin' : 'no longer an admin'}`);
        res.redirect('/admin/dashboard/users');
    } catch (err) {
        console.error('Toggle Admin Error:', err);
        const error = new Error(err);
        error.httpStatusCode = 500;
        return next(error);
    }
};

exports.updateOrderStatus = async (req, res, next) => {
    try {
        const { orderId } = req.params;
        const { status } = req.body;
        
        await mongoose.model('User').updateOne(
            { 'orders._id': orderId },
            { $set: { 'orders.$.orderStatus': status } }
        );
        
        res.redirect('/admin/dashboard/orders');
    } catch (err) {
        const error = new Error(err);
        error.httpStatusCode = 500;
        return next(error);
    }
};

exports.deleteDashboardOrder = async (req, res, next) => {
    try {
        const { orderId } = req.params;
        
        await mongoose.model('User').updateOne(
            { 'orders._id': orderId },
            { $pull: { orders: { _id: orderId } } }
        );
        
        res.redirect('/admin/dashboard/orders');
    } catch (err) {
        const error = new Error(err);
        error.httpStatusCode = 500;
        return next(error);
    }
};
