const mongoose = require("mongoose");
const { BaseSchema } = require('./base');
const Schema = mongoose.Schema;

const userSchema = new Schema({
    email: {
        type: String,
        required: true,
        unique: true
    },
    password: {
        type: String,
        required: true,
    },
    isAdmin: {
        type: Boolean,
        default: false
    },
    isOwner: {
        type: Boolean,
        default: false
    },
    resetToken: String,
    resetTokenExpiration: Date,
    cart: {
        items: [
            {
                product: {
                    title: { type: String, required: true },
                    price: { type: Number, required: true },
                    description: String,
                    imageUrl: String,
                    _id: { type: Schema.Types.ObjectId, required: true },
                },
                quantity: { type: Number, required: true },
                _id: false,
            },
        ],
        totalPrice: { type: Number, default: 0 },
    },
    orders: [
        {
            items: [
                {
                    product: {
                        title: { type: String, required: true },
                        price: { type: Number, required: true },
                        description: String,
                        imageUrl: String,
                        _id: { type: Schema.Types.ObjectId, required: true },
                    },
                    quantity: { type: Number, required: true },
                    _id: false,
                },
            ],
            totalPrice: { type: Number, required: true },
            paymentId: { type: String },
            paymentStatus: { type: String, default: 'completed' },
            orderStatus: { type: String, default: 'processing' },
            createdAt: { type: Date, default: Date.now },
            userId: { type: Schema.Types.ObjectId, ref: 'User', required: true }
        },
    ],
    // Base schema fields
    created_by: {
        type: Schema.Types.ObjectId,
        ref: 'User',
        required: function() {
            return false; // Never required for users as they create themselves
        }
    },
    updated_by: {
        type: Schema.Types.ObjectId,
        ref: 'User',
        required: function() {
            return false; // Never required for users as they update themselves
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
        index: true
    }
});

userSchema.methods.addToCart = function (product) {
    // Initialize cart if it doesn't exist
    if (!this.cart) {
        this.cart = { items: [], totalPrice: 0 };
    }

    // Ensure cart items is an array
    if (!Array.isArray(this.cart.items)) {
        this.cart.items = [];
    }

    // Ensure all existing orders have userId
    if (this.orders && Array.isArray(this.orders)) {
        this.orders.forEach(order => {
            if (!order.userId) {
                order.userId = this._id;
            }
        });
    }

    // Find existing product in cart
    const cartProductIndex = this.cart.items.findIndex(
        (item) => item.product._id.toString() === product._id.toString()
    );

    // Initialize cart total price if it doesn't exist
    let currentTotalPrice = parseFloat(this.cart.totalPrice || 0);
    const productPrice = parseFloat(product.price || 0);

    // Update cart items
    if (cartProductIndex >= 0) {
        // Product exists in cart - increment quantity
        this.cart.items[cartProductIndex].quantity += 1;
        currentTotalPrice += productPrice;
    } else {
        // Product not in cart - add new item
        this.cart.items.push({
            product: {
                _id: product._id,
                title: product.title,
                price: productPrice,
                description: product.description,
                imageUrl: product.imageUrl,
            },
            quantity: 1,
        });
        currentTotalPrice += productPrice;
    }

    // Update total price with 2 decimal precision
    this.cart.totalPrice = parseFloat(currentTotalPrice.toFixed(2));

    // Save and return promise
    return this.save()
        .then(result => {
            return result;
        })
        .catch(err => {
            console.error('Error in addToCart:', err);
            return Promise.reject(err);
        });
};

userSchema.methods.deleteItemFromCart = function (prodId) {
    const updatedCartItems = this.cart.items.filter(
        (item) => item.product._id.toString() !== prodId.toString()
    );

    const updatedTotalPrice = updatedCartItems.reduce(
        (total, item) => total + item.product.price * item.quantity,
        0
    );

    this.cart.items = updatedCartItems;
    this.cart.totalPrice = updatedTotalPrice;

    return this.save();
};

userSchema.methods.createOrder = function () {
    if (!this.cart || this.cart.items.length === 0) {
        return Promise.reject(new Error("Cart is empty."));
    }

    const order = {
        items: [...this.cart.items],
        totalPrice: this.cart.totalPrice,
        createdAt: new Date(),
        userId: this._id // Add reference to user
    };

    this.orders.push(order);
    this.cart = { items: [], totalPrice: 0 };

    return this.save();
};

// Add soft delete methods
userSchema.methods.softDelete = async function(userId) {
    this.isDeleted = true;
    this.deleted_at = new Date();
    this.deleted_by = userId;
    this.updated_by = userId;
    return this.save();
};

userSchema.methods.restore = async function(userId) {
    this.isDeleted = false;
    this.deleted_at = null;
    this.deleted_by = null;
    this.updated_by = userId;
    return this.save();
};

// Add middleware to handle created_by and updated_by
userSchema.pre('save', function(next) {
    if (this.isNew) {
        this.created_by = this._id;
    }
    this.updated_by = this._id;
    next();
});

// Create a new schema that inherits from BaseSchema
const UserSchema = new Schema({}, { collection: 'users', timestamps: true });
UserSchema.add(userSchema);

// Add the methods to the new schema
Object.assign(UserSchema.methods, userSchema.methods);

module.exports = mongoose.model("User", UserSchema);
