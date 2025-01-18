const getDb = require("../util/db").getDb;
const mongodb = require("mongodb");

class User {
    constructor(name, email, id = null, cart = { items: [], totalPrice: 0 }) {
        this.name = name;
        this.email = email;
        this._id = id ? new mongodb.ObjectId(id) : null;
        this.cart = cart; // Properly initialize cart
    }

    // Create or Update (Save)
    save() {
        const db = getDb();
        if (this._id) {
            // Update existing user
            return db
                .collection("users")
                .updateOne(
                    { _id: this._id },
                    { $set: { name: this.name, email: this.email } }
                )
                .then((result) => {
                    console.log("User updated");
                    return result;
                })
                .catch((err) => {
                    console.error("Error updating user:", err);
                });
        } else {
            // Create new user
            return db
                .collection("users")
                .insertOne({ name: this.name, email: this.email })
                .then((result) => {
                    console.log("User created");
                    return result;
                })
                .catch((err) => {
                    console.error("Error creating user:", err);
                });
        }
    }

    // Read all users
    static fetchAll() {
        const db = getDb();
        return db
            .collection("users")
            .find()
            .toArray()
            .then((users) => {
                return users;
            })
            .catch((err) => {
                console.error("Error fetching users:", err);
                return [];
            });
    }

    addToCart(product) {
        const db = getDb();
        const cart = this.cart || { items: [], totalPrice: 0 };

        // Check if the product already exists in the cart
        const cartProductIndex = cart.items.findIndex(
            (cp) => cp._id.toString() === product._id.toString()
        );

        let newQuantity = 1;
        const updatedCartItems = [...cart.items];

        if (cartProductIndex >= 0) {
            // Product exists, update quantity
            newQuantity = cart.items[cartProductIndex].quantity + 1;
            updatedCartItems[cartProductIndex].quantity = newQuantity;
        } else {
            // Add new product to cart
            updatedCartItems.push({
                _id: new mongodb.ObjectId(product._id),
                title: product.title,
                price: product.price,
                quantity: newQuantity,
            });
        }

        // Recalculate total price
        const updatedTotalPrice = updatedCartItems.reduce(
            (total, item) => total + item.price * item.quantity,
            0
        );

        const updatedCart = {
            items: updatedCartItems,
            totalPrice: updatedTotalPrice,
        };

        // Update the user's cart in the database
        return db
            .collection("users")
            .updateOne({ _id: this._id }, { $set: { cart: updatedCart } })
            .then(() => {
                // Update the cart in the current user object
                this.cart = updatedCart;
                console.log("Cart updated successfully");
            })
            .catch((err) => {
                console.error("Error updating cart:", err);
            });
    }

    addOrder() {
        const db = getDb();
        // Create a new order document in the database
        const order = {
            userId: this._id,
            items: this.cart.items,
            totalPrice: this.cart.totalPrice,
            date: new Date(),
        };
        return db
            .collection("orders")
            .insertOne(order)
            .then(() => {
                // Clear the cart after the order is placed
                this.cart = {
                    items: [],
                    totalPrice: 0,
                };
                console.log("Order placed successfully");
            })
            .then(() => {
                // Update the user's cart in the database
                return db
                    .collection("users")
                    .updateOne(
                        { _id: this._id },
                        { $set: { cart: this.cart } }
                    );
            })
            .catch((err) => {
                console.error("Error placing order:", err);
            });
    }

    getOrders() {
        const db = getDb();
        return db
            .collection("orders")
            .find({ userId: this._id })
            .toArray()
            .then((orders) => {
                console.log("Orders retrieved successfully");
                return orders;
            })
            .catch((err) => {
                console.error("Error retrieving orders:", err);
            });
    }
    deleteItemFromCart(prodId) {
        const db = getDb();
        // Filter out the product to be deleted
        const updatedCartItems = this.cart.items.filter(
            (item) => item._id.toString() !== prodId.toString()
        );

        // Recalculate the total price
        const updatedTotalPrice = updatedCartItems.reduce(
            (total, item) => total + item.price * item.quantity,
            0
        );

        console.log(updatedTotalPrice);
        // Update the user's cart in the database
        return db
            .collection("users")
            .updateOne(
                { _id: this._id }, // Use this._id for the current user
                {
                    $set: {
                        cart: {
                            items: updatedCartItems,
                            totalPrice: updatedTotalPrice,
                        },
                    },
                }
            )
            .then(() => {
                // Update the cart in the current user object
                this.cart = {
                    items: updatedCartItems,
                    totalPrice: updatedTotalPrice,
                };
                console.log("Product removed from cart");
            })
            .catch((err) => {
                console.error("Error removing product from cart:", err);
            });
    }
    // Read a user by ID
    static findById(userId) {
        const db = getDb();
        return db
            .collection("users")
            .findOne({ _id: new mongodb.ObjectId(userId) }) // Use findOne for clarity
            .then((userData) => {
                if (!userData) return null;
                return new User(
                    userData.name,
                    userData.email,
                    userData._id,
                    userData.cart // Pass the cart data
                );
            })
            .catch((err) => {
                console.error("Error finding user:", err);
                return null;
            });
    }

    // Delete a user by ID
    static delete(userId) {
        const db = getDb();
        return db
            .collection("users")
            .deleteOne({ _id: new mongodb.ObjectId(userId) })
            .then(() => {
                console.log("User deleted");
            })
            .catch((err) => {
                console.error("Error deleting user:", err);
            });
    }
}

module.exports = User;
