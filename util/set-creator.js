require('dotenv').config();
const mongoose = require('mongoose');
const User = require('../models/user');
const Product = require('../models/product');

async function setCreator() {
    try {
        // Connect to MongoDB using the correct environment variable
        const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/shop';
        await mongoose.connect(MONGODB_URI);
        console.log('Connected to MongoDB');

        // Find the owner user
        const owner = await User.findOne({ isOwner: true });

        if (!owner) {
            throw new Error('No owner found in the database');
        }

        console.log('Found owner:', owner.email);

        // Get all products that don't have created_by or createdAt set
        const products = await Product.find({
            $or: [
                { created_by: { $exists: false } },
                { created_by: null },
                { createdAt: { $exists: false } },
                { createdAt: null }
            ]
        });

        console.log(`Found ${products.length} products to update`);

        // Update each product
        const now = new Date();
        let updatedCount = 0;

        for (const product of products) {
            const updateData = {};
            
            if (!product.created_by) {
                updateData.created_by = owner._id;
            }
            
            if (!product.createdAt) {
                updateData.createdAt = now;
            }
            
            if (!product.updated_by) {
                updateData.updated_by = owner._id;
            }
            
            if (!product.updatedAt) {
                updateData.updatedAt = now;
            }

            if (Object.keys(updateData).length > 0) {
                await Product.updateOne(
                    { _id: product._id },
                    { $set: updateData }
                );
                updatedCount++;
                console.log(`Updated product: ${product.title}`);
            }
        }

        console.log(`Successfully updated ${updatedCount} products`);
        console.log('Migration completed successfully');

        // Close the database connection
        await mongoose.connection.close();
        console.log('Database connection closed');
        process.exit(0);
    } catch (error) {
        console.error('Migration failed:', error);
        if (mongoose.connection.readyState === 1) {
            await mongoose.connection.close();
            console.log('Database connection closed due to error');
        }
        process.exit(1);
    }
}

// Run the migration
setCreator(); 