const mongoose = require('mongoose');
const Product = require('../models/product');
const User = require('../models/user');

async function migrateDocuments() {
    try {
        console.log('Starting database migration...');

        // Migrate Users first (since products depend on users)
        console.log('Migrating users...');
        const users = await User.find({}).lean();
        let ownerExists = false;
        
        for (const user of users) {
            const updates = {};
            
            // Check base schema fields
            if (user.created_by === undefined || user.created_by === null) {
                updates.created_by = user._id; // For users, they create themselves
            }
            if (user.updated_by === undefined || user.updated_by === null) {
                updates.updated_by = user._id;
            }
            if (user.deleted_by === undefined) {
                updates.deleted_by = null;
            }
            if (user.deleted_at === undefined) {
                updates.deleted_at = null;
            }
            if (user.isDeleted === undefined) {
                updates.isDeleted = false;
            }

            // Check user-specific fields
            if (user.isAdmin === undefined) {
                updates.isAdmin = false;
            }
            if (user.isOwner === undefined) {
                updates.isOwner = false;
            }

            // Handle cart
            if (!user.cart) {
                updates.cart = { items: [], totalPrice: 0 };
            } else {
                // Ensure cart has totalPrice
                if (user.cart.totalPrice === undefined) {
                    const totalPrice = user.cart.items.reduce(
                        (total, item) => total + (item.product.price * item.quantity),
                        0
                    );
                    updates['cart.totalPrice'] = totalPrice;
                }
                // Ensure cart items array exists
                if (!Array.isArray(user.cart.items)) {
                    updates['cart.items'] = [];
                    updates['cart.totalPrice'] = 0;
                }
            }

            // Handle orders
            if (!user.orders) {
                updates.orders = [];
            } else if (Array.isArray(user.orders)) {
                // Ensure each order has required fields
                const updatedOrders = user.orders.map(order => {
                    const updatedOrder = { ...order };
                    if (!updatedOrder.userId) {
                        updatedOrder.userId = user._id;
                    }
                    if (!updatedOrder.createdAt) {
                        updatedOrder.createdAt = new Date();
                    }
                    if (!updatedOrder.orderStatus) {
                        updatedOrder.orderStatus = 'processing';
                    }
                    if (!updatedOrder.paymentStatus) {
                        updatedOrder.paymentStatus = 'completed';
                    }
                    if (!updatedOrder.totalPrice) {
                        updatedOrder.totalPrice = updatedOrder.items.reduce(
                            (total, item) => total + (item.product.price * item.quantity),
                            0
                        );
                    }
                    return updatedOrder;
                });
                updates.orders = updatedOrders;
            }

            // Check if this user is owner
            if (user.isOwner) {
                ownerExists = true;
            }

            // If there are updates, apply them
            if (Object.keys(updates).length > 0) {
                console.log(`Updating user ${user._id} (${user.email}) with missing fields:`, updates);
                await User.updateOne({ _id: user._id }, { $set: updates });
            }
        }

        // If no owner exists, make the first admin user the owner
        if (!ownerExists) {
            const firstAdmin = await User.findOne({ isAdmin: true });
            if (firstAdmin) {
                console.log(`Setting first admin user ${firstAdmin.email} as owner`);
                await User.updateOne(
                    { _id: firstAdmin._id },
                    { $set: { isOwner: true } }
                );
            } else {
                // If no admin exists, make the first user admin and owner
                const firstUser = await User.findOne();
                if (firstUser) {
                    console.log(`No admin found. Setting first user ${firstUser.email} as admin and owner`);
                    await User.updateOne(
                        { _id: firstUser._id },
                        { $set: { isAdmin: true, isOwner: true } }
                    );
                }
            }
        }

        // Migrate Products
        console.log('Migrating products...');
        const products = await Product.find({}).lean();
        
        for (const product of products) {
            const updates = {};
            
            // Check base schema fields
            if (product.created_by === undefined || product.created_by === null) {
                updates.created_by = product.userId;
            }
            if (product.updated_by === undefined || product.updated_by === null) {
                updates.updated_by = product.userId;
            }
            if (product.deleted_by === undefined) {
                updates.deleted_by = null;
            }
            if (product.deleted_at === undefined) {
                updates.deleted_at = null;
            }
            if (product.isDeleted === undefined) {
                updates.isDeleted = false;
            }

            // Check product-specific fields
            if (!product.userId) {
                // If no userId, try to find an admin user
                const adminUser = await User.findOne({ isAdmin: true });
                if (adminUser) {
                    updates.userId = adminUser._id;
                    updates.created_by = adminUser._id;
                    updates.updated_by = adminUser._id;
                }
            }

            // If there are updates, apply them
            if (Object.keys(updates).length > 0) {
                console.log(`Updating product ${product._id} (${product.title}) with missing fields:`, updates);
                await Product.updateOne({ _id: product._id }, { $set: updates });
            }
        }

        console.log('Migration completed successfully!');
    } catch (error) {
        console.error('Migration failed:', error);
        throw error;
    }
}

module.exports = migrateDocuments; 