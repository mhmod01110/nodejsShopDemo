const mongoose = require("mongoose");
const Schema = mongoose.Schema;

const userSchema = new Schema({
    name: {
        type: String,
        required: true,
    },
    email: {
        type: String,
        required: true,
    },
    cart: {
        items: [
            {
                product: {
                    title: { type: String, required: true },
                    price: { type: Number, required: true },
                    description: String,
                    imageUrl: String,
                    // Add any other product fields you need
                    _id: { type: Schema.Types.ObjectId, required: true },
                },
                quantity: { type: Number, required: true },
                _id: false,
            },
        ],
        totalPrice: { type: Number, default: 0 },
    },
});

userSchema.methods.addToCart = function (product) {
    // Initialize cart if it doesn't exist
    if (!this.cart) {
        this.cart = { items: [], totalPrice: 0 };
    }

    const cartProductIndex = this.cart.items.findIndex(
        (item) => item.product._id.toString() === product._id.toString()
    );

    let updatedCartItems = [...this.cart.items];
    let newTotalPrice = this.cart.totalPrice;

    if (cartProductIndex >= 0) {
        // Increment quantity if product exists
        updatedCartItems[cartProductIndex].quantity += 1;
        newTotalPrice = this.cart.totalPrice + product.price;
    } else {
        // Add new product if it doesn't exist
        updatedCartItems.push({
            product: {
                _id: product._id,
                title: product.title,
                price: product.price,
                description: product.description,
                imageUrl: product.imageUrl,
                // Add any other product fields you want to store
            },
            quantity: 1,
        });
        newTotalPrice = this.cart.totalPrice + product.price;
    }

    this.cart.items = updatedCartItems;
    this.cart.totalPrice = newTotalPrice;

    return this.save();
};

userSchema.methods.deleteItemFromCart = function (prodId) {
    // Filter out the item to be deleted
    const updatedCartItems = this.cart.items.filter(
        (item) => item.product._id.toString() !== prodId.toString()
    );

    // Recalculate the total price using the product price from stored product object
    const updatedTotalPrice = updatedCartItems.reduce(
        (total, item) => total + item.product.price * item.quantity,
        0
    );

    // Update the cart directly on this document
    this.cart.items = updatedCartItems;
    this.cart.totalPrice = updatedTotalPrice;

    // Save the document using Mongoose
    return this.save()
        .then(() => {
            console.log("Product removed from cart");
        })
        .catch((err) => {
            console.error("Error removing product from cart:", err);
            throw err; // Propagate the error
        });
};
module.exports = mongoose.model("User", userSchema);
