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
            userId: req.session.user._id,
            created_by: req.session.user._id,
            updated_by: req.session.user._id
        });

        await product.save();
        res.redirect("/admin/products");
    } catch (err) {
        console.error('Error creating product:', err);
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
        
        // Ensure created_by is set if it's missing (for existing products)
        if (!product.created_by) {
            product.created_by = product.userId || req.session.user._id;
        }
        
        // Update the updated_by field
        product.updated_by = req.session.user._id;

        await product.save();
        req.flash('success', 'Product updated successfully');
        res.redirect("/admin/products");
    } catch (err) {
        console.error('Error updating product:', err);
        const error = new Error(err);
        error.httpStatusCode = 500;
        return next(error);
    }
};

exports.postDeleteProduct = async (req, res, next) => {
    if (!req.session.user) {
        return res.redirect("/login");
    }

    try {
        const prodId = req.params.productId;
        const product = await Product.findById(prodId);

        if (!product) {
            req.flash('error', 'Product not found');
            return res.redirect("/admin/products");
        }

        // Check if user is authorized to delete this product (either creator or admin)
        const isCreator = product.userId.toString() === req.session.user._id.toString();
        const isAdmin = req.session.user.isAdmin;
        
        if (!isCreator && !isAdmin) {
            req.flash('error', 'Not authorized to delete this product');
            return res.redirect("/admin/products");
        }

        // Soft delete the product
        await product.softDelete(req.session.user._id);
        req.flash('success', 'Product deleted successfully');
        res.redirect("/admin/products");
    } catch (err) {
        console.error('Error deleting product:', err);
        const error = new Error(err);
        error.httpStatusCode = 500;
        return next(error);
    }
};

exports.getProducts = async (req, res, next) => {
    try {
        const page = parseInt(req.query.page) || 1;
        const itemsPerPage = 6; // You can adjust this number

        // Get total count of non-deleted products for this user
        const totalItems = await Product.countDocuments({ 
            userId: req.session.user._id,
            isDeleted: false 
        });

        // Calculate pagination values
        const totalPages = Math.ceil(totalItems / itemsPerPage);

        // Fetch paginated products
        const products = await Product.find({ 
            userId: req.session.user._id,
            isDeleted: false 
        })
        .skip((page - 1) * itemsPerPage)
        .limit(itemsPerPage)
        .sort({ updatedAt: -1 });

        res.render('admin/products', {
            prods: products,
            pageTitle: 'Admin Products',
            path: '/admin/products',
            currentPage: page,
            hasNextPage: page < totalPages,
            hasPreviousPage: page > 1,
            nextPage: page + 1,
            previousPage: page - 1,
            lastPage: totalPages,
            itemsPerPage
        });
    } catch (err) {
        console.error('Get Products Error:', err);
        const error = new Error(err);
        error.httpStatusCode = 500;
        return next(error);
    }
};

exports.deleteProduct = async (req, res, next) => {
    if (!req.session.user) {
        return res.status(401).json({ message: 'Not authenticated' });
    }

    try {
        const prodId = req.params.productId;
        
        // First find the product, including deleted ones
        const product = await Product.findById(prodId);

        if (!product) {
            return res.status(404).json({ message: 'Product not found' });
        }

        // Check if user is authorized (either creator or admin)
        const isCreator = product.created_by && product.created_by.toString() === req.session.user._id.toString();
        const isAdmin = req.session.user.isAdmin;
        
        if (!isCreator && !isAdmin) {
            return res.status(403).json({ message: 'Not authorized' });
        }

        // For restoration, only allow admins
        if (product.isDeleted && !isAdmin) {
            return res.status(403).json({ message: 'Only admins can restore products' });
        }

        // Update the product using findOneAndUpdate to get the updated document
        const updateData = {
            isDeleted: !product.isDeleted,
            updated_by: req.session.user._id
        };

        if (!product.isDeleted) {
            // If we're deleting
            updateData.deleted_by = req.session.user._id;
            updateData.deleted_at = new Date();
        } else {
            // If we're restoring
            updateData.$unset = { deleted_by: "", deleted_at: "" }; // Properly remove these fields
        }

        const updatedProduct = await Product.findOneAndUpdate(
            { _id: prodId },
            product.isDeleted ? 
                { $set: { ...updateData }, $unset: updateData.$unset } : 
                { $set: updateData },
            { 
                new: true, // Return the updated document
                runValidators: true
            }
        ).populate('created_by', 'email')
         .populate('updated_by', 'email')
         .populate('deleted_by', 'email');

        if (!updatedProduct) {
            return res.status(404).json({ message: 'Error updating product' });
        }

        // Get updated counts using countDocuments for better performance
        const [activeCount, deletedCount] = await Promise.all([
            Product.countDocuments({ isDeleted: false }),
            Product.countDocuments({ isDeleted: true })
        ]);

        return res.status(200).json({ 
            message: 'Success',
            isDeleted: updatedProduct.isDeleted,
            action: updatedProduct.isDeleted ? 'deleted' : 'restored',
            activeCount,
            deletedCount,
            updated_by: updatedProduct.updated_by,
            deleted_by: updatedProduct.deleted_by,
            deleted_at: updatedProduct.deleted_at
        });
    } catch (err) {
        console.error('Error toggling product delete status:', err);
        return res.status(500).json({ 
            message: 'Error updating product',
            error: err.message 
        });
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
        // Include deleted users in the dashboard by explicitly querying for all
        const users = await mongoose.model('User').find({})
            .select('email isAdmin isOwner orders cart isDeleted');

        let errorMessage = req.flash('error')[0];
        let successMessage = req.flash('success')[0];
        
        // Ensure only one type of message is shown
        if (errorMessage) successMessage = null;
        if (successMessage) errorMessage = null;

        res.render('admin/dashboard-users', {
            pageTitle: 'Manage Users',
            path: '/admin/dashboard/users',
            users,
            errorMessage: errorMessage,
            successMessage: successMessage
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
        const page = parseInt(req.query.page) || 1;
        const itemsPerPage = 10; // You can adjust this number

        // Get total counts for both active and deleted products
        const activeCount = await Product.countDocuments({ isDeleted: false });
        const deletedCount = await Product.countDocuments({ isDeleted: true });
        const totalPages = Math.ceil(activeCount / itemsPerPage);

        // Fetch paginated active products and all deleted products separately
        const [activeProducts, deletedProducts] = await Promise.all([
            Product.find({ isDeleted: false })
                .populate('created_by', 'email')
                .populate('updated_by', 'email')
                .populate('deleted_by', 'email')
                .skip((page - 1) * itemsPerPage)
                .limit(itemsPerPage)
                .sort({ updatedAt: -1 })
                .exec(),
            
            Product.find({ isDeleted: true })
                .populate('created_by', 'email')
                .populate('updated_by', 'email')
                .populate('deleted_by', 'email')
                .sort({ updatedAt: -1 })
                .exec()
        ]);

        // Combine the products for rendering
        const products = [...activeProducts, ...deletedProducts];

        res.render('admin/dashboard-products', {
            pageTitle: 'Manage Products',
            path: '/admin/dashboard/products',
            products,
            activeCount,
            deletedCount,
            currentPage: page,
            hasNextPage: page < totalPages,
            hasPreviousPage: page > 1,
            nextPage: page + 1,
            previousPage: page - 1,
            lastPage: totalPages,
            itemsPerPage
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
        const user = await mongoose.model('User').findById(userId);
        
        if (!user) {
            req.flash('error', 'User not found');
            return res.redirect('/admin/dashboard/users');
        }

        // Soft delete the user
        await user.softDelete(req.session.user._id);
        req.flash('success', 'User successfully deleted');
        res.redirect('/admin/dashboard/users');
    } catch (err) {
        const error = new Error(err);
        error.httpStatusCode = 500;
        return next(error);
    }
};

exports.restoreUser = async (req, res, next) => {
    try {
        const userId = req.params.userId;
        const user = await mongoose.model('User').findById(userId);
        
        if (!user) {
            req.flash('error', 'User not found');
            return res.redirect('/admin/dashboard/users');
        }

        await user.restore();
        req.flash('success', 'User successfully restored');
        res.redirect('/admin/dashboard/users');
    } catch (err) {
        const error = new Error(err);
        error.httpStatusCode = 500;
        return next(error);
    }
};

exports.toggleUserAdmin = async (req, res, next) => {
    try {
        // Check if the current user is the owner
        if (!req.session.user.isOwner) {
            req.flash('error', 'Only the website owner can manage admin privileges');
            req.flash('success', null); // Clear any success message
            return res.redirect('/admin/dashboard/users');
        }

        const userId = req.params.userId;

        // Validate userId
        if (!mongoose.Types.ObjectId.isValid(userId)) {
            req.flash('error', 'Invalid user ID');
            req.flash('success', null); // Clear any success message
            return res.redirect('/admin/dashboard/users');
        }

        // Find and update user
        const user = await mongoose.model('User').findById(userId);
        
        if (!user) {
            req.flash('error', 'User not found');
            req.flash('success', null); // Clear any success message
            return res.redirect('/admin/dashboard/users');
        }

        // Don't allow changing owner's admin status
        if (user.isOwner) {
            req.flash('error', 'Cannot modify owner privileges');
            req.flash('success', null); // Clear any success message
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
        user.updated_by = req.session.user._id;

        // Use updateOne to avoid validation issues
        await mongoose.model('User').updateOne(
            { _id: user._id },
            { 
                $set: { 
                    isAdmin: user.isAdmin,
                    orders: user.orders,
                    updated_by: req.session.user._id
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
        req.flash('error', null); // Clear any error message
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
        
        const user = await mongoose.model('User').findOne({ 'orders._id': orderId });
        if (!user) {
            req.flash('error', 'Order not found');
            return res.redirect('/admin/dashboard/orders');
        }

        await mongoose.model('User').updateOne(
            { 'orders._id': orderId },
            { 
                $set: { 
                    'orders.$.orderStatus': status,
                    updated_by: req.session.user._id
                } 
            }
        );
        
        req.flash('success', 'Order status updated successfully');
        return res.redirect('/admin/dashboard/orders');
    } catch (err) {
        console.error('Update Order Status Error:', err);
        const error = new Error(err);
        error.httpStatusCode = 500;
        return next(error);
    }
};

exports.deleteDashboardOrder = async (req, res, next) => {
    try {
        const { orderId } = req.params;
        
        const user = await mongoose.model('User').findOne({ 'orders._id': orderId });
        if (!user) {
            req.flash('error', 'Order not found');
            return res.redirect('/admin/dashboard/orders');
        }

        await mongoose.model('User').updateOne(
            { 'orders._id': orderId },
            { 
                $pull: { orders: { _id: orderId } },
                $set: { updated_by: req.session.user._id }
            }
        );
        
        req.flash('success', 'Order deleted successfully');
        res.redirect('/admin/dashboard/orders');
    } catch (err) {
        console.error('Delete Order Error:', err);
        const error = new Error(err);
        error.httpStatusCode = 500;
        return next(error);
    }
};

exports.restoreProduct = async (req, res, next) => {
    if (!req.session.user) {
        return res.status(401).json({ message: 'Not authenticated' });
    }

    try {
        const prodId = req.params.productId;
        
        // Find the product
        const product = await Product.findById(prodId)
            .populate('created_by', 'email')
            .populate('updated_by', 'email')
            .populate('deleted_by', 'email');

        if (!product) {
            return res.status(404).json({ message: 'Product not found' });
        }

        // Only admins can restore products
        if (!req.session.user.isAdmin) {
            return res.status(403).json({ message: 'Only admins can restore products' });
        }

        // Update the product
        const updateData = {
            isDeleted: false,
            updated_by: req.session.user._id,
            $unset: { deleted_by: "", deleted_at: "" }
        };

        const updatedProduct = await Product.findOneAndUpdate(
            { _id: prodId },
            { $set: { isDeleted: false, updated_by: req.session.user._id }, $unset: { deleted_by: "", deleted_at: "" } },
            { 
                new: true,
                runValidators: true
            }
        ).populate('created_by', 'email')
         .populate('updated_by', 'email');

        if (!updatedProduct) {
            return res.status(404).json({ message: 'Error restoring product' });
        }

        // Get updated counts
        const [activeCount, deletedCount] = await Promise.all([
            Product.countDocuments({ isDeleted: false }),
            Product.countDocuments({ isDeleted: true })
        ]);

        return res.status(200).json({ 
            message: 'Success',
            isDeleted: false,
            action: 'restored',
            activeCount,
            deletedCount,
            updated_by: updatedProduct.updated_by,
            deleted_by: null,
            deleted_at: null
        });
    } catch (err) {
        console.error('Error restoring product:', err);
        return res.status(500).json({ 
            message: 'Error restoring product',
            error: err.message 
        });
    }
};

exports.restoreDashboardProduct = async (req, res, next) => {
    try {
        const prodId = req.params.productId;
        
        // Find and update the product in one operation
        const updatedProduct = await Product.findOneAndUpdate(
            { _id: prodId },
            { 
                $set: { 
                    isDeleted: false,
                    updated_by: req.session.user._id,
                    updatedAt: new Date()
                },
                $unset: { 
                    deleted_by: 1,
                    deleted_at: 1
                }
            },
            { new: true }
        );

        if (!updatedProduct) {
            req.flash('error', 'Product not found');
            return res.redirect('/admin/dashboard/products');
        }

        req.flash('success', 'Product restored successfully');
        res.redirect('/admin/dashboard/products');
    } catch (err) {
        console.error('Restore Product Error:', err);
        req.flash('error', 'Error restoring product');
        res.redirect('/admin/dashboard/products');
    }
};

exports.deleteDashboardProduct = async (req, res, next) => {
    try {
        const prodId = req.params.productId;
        
        // Find and update the product in one operation
        const updatedProduct = await Product.findOneAndUpdate(
            { _id: prodId },
            { 
                $set: { 
                    isDeleted: true,
                    deleted_by: req.session.user._id,
                    deleted_at: new Date(),
                    updated_by: req.session.user._id,
                    updatedAt: new Date()
                }
            },
            { new: true }
        );

        if (!updatedProduct) {
            req.flash('error', 'Product not found');
            return res.redirect('/admin/dashboard/products');
        }

        req.flash('success', 'Product deleted successfully');
        res.redirect('/admin/dashboard/products');
    } catch (err) {
        console.error('Delete Product Error:', err);
        req.flash('error', 'Error deleting product');
        res.redirect('/admin/dashboard/products');
    }
};