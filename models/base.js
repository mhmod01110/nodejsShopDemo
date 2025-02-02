const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const baseOptions = {
    discriminatorKey: '__type',
    timestamps: true // This adds createdAt and updatedAt automatically
};

const BaseSchema = new Schema({
    created_by: {
        type: Schema.Types.ObjectId,
        ref: 'User',
        required: function() {
            // Skip validation during user creation to avoid infinite loop
            return this.constructor.modelName !== 'User';
        }
    },
    updated_by: {
        type: Schema.Types.ObjectId,
        ref: 'User',
        required: function() {
            // Skip validation during user creation to avoid infinite loop
            return this.constructor.modelName !== 'User';
        }
    },
    deleted_by: {
        type: Schema.Types.ObjectId,
        ref: 'User',
        default: null
    },
    deleted_at: {
        type: Date,
        default: null
    },
    isDeleted: {
        type: Boolean,
        default: false,
        index: true // Add index for better query performance
    }
}, baseOptions);

// Add a method for soft delete
BaseSchema.methods.softDelete = async function(userId) {
    // Ensure created_by and updated_by are set if they're missing
    if (!this.created_by) {
        this.created_by = this.userId || userId;
    }
    this.updated_by = userId;
    this.isDeleted = true;
    this.deleted_at = new Date();
    this.deleted_by = userId;
    return this.save();
};

// Add a method for restore
BaseSchema.methods.restore = async function(userId) {
    // Ensure created_by and updated_by are set if they're missing
    if (!this.created_by) {
        this.created_by = this.userId || userId;
    }
    this.updated_by = userId;
    this.isDeleted = false;
    this.deleted_at = null;
    this.deleted_by = null;
    return this.save();
};

// Add a static method to find non-deleted documents
BaseSchema.statics.findNonDeleted = function(conditions = {}) {
    return this.find({ ...conditions, isDeleted: false });
};

// Middleware to automatically exclude deleted documents unless explicitly requested
BaseSchema.pre('find', function() {
    if (!this.getQuery().hasOwnProperty('isDeleted')) {
        this.where({ isDeleted: false });
    }
});

BaseSchema.pre('findOne', function() {
    if (!this.getQuery().hasOwnProperty('isDeleted')) {
        this.where({ isDeleted: false });
    }
});

// Middleware to ensure created_by and updated_by are set before saving
BaseSchema.pre('save', function(next) {
    if (this.isNew && !this.created_by && this.constructor.modelName !== 'User') {
        this.created_by = this.userId;
    }
    if (!this.updated_by && this.constructor.modelName !== 'User') {
        this.updated_by = this.created_by;
    }
    next();
});

module.exports = { BaseSchema }; 