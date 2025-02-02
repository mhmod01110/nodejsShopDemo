require('dotenv').config();
const mongoose = require('mongoose');
const migrateDocuments = require('./util/migration');

async function runMigration() {
    try {
        // Connect to MongoDB
        await mongoose.connect(process.env.DB_URI);
        console.log('Connected to MongoDB');

        // Run migration
        await migrateDocuments();

        // Close connection
        await mongoose.connection.close();
        console.log('MongoDB connection closed');
        process.exit(0);
    } catch (error) {
        console.error('Migration script failed:', error);
        process.exit(1);
    }
}

runMigration(); 