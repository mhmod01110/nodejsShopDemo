const mongoose = require("mongoose");
const Schema = mongoose.Schema;

const userSchema = new Schema({
    email: {
        type: String,
        required: true,
    },
    password: {
        type: String,
        required: true,
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
            createdAt: { type: Date, default: Date.now },
        },
    ],
});

userSchema.methods.addToCart = function (product) {
    if (!this.cart) {
        this.cart = { items: [], totalPrice: 0 };
    }

    const cartProductIndex = this.cart.items.findIndex(
        (item) => item.product._id.toString() === product._id.toString()
    );

    let updatedCartItems = [...this.cart.items];
    let newTotalPrice = this.cart.totalPrice;

    if (cartProductIndex >= 0) {
        updatedCartItems[cartProductIndex].quantity += 1;
        newTotalPrice += product.price;
    } else {
        updatedCartItems.push({
            product: {
                _id: product._id,
                title: product.title,
                price: product.price,
                description: product.description,
                imageUrl: product.imageUrl,
            },
            quantity: 1,
        });
        newTotalPrice += product.price;
    }

    this.cart.items = updatedCartItems;
    this.cart.totalPrice = newTotalPrice;

    return this.save();
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

// Add method to create order and save it in orders list
userSchema.methods.createOrder = function () {
    if (!this.cart || this.cart.items.length === 0) {
        return Promise.reject(new Error("Cart is empty."));
    }

    const order = {
        items: [...this.cart.items],
        totalPrice: this.cart.totalPrice,
        createdAt: new Date(),
    };

    // Add the order to the orders array
    this.orders.push(order);

    // Clear the cart
    this.cart = { items: [], totalPrice: 0 };

    return this.save();
};

module.exports = mongoose.model("User", userSchema);
