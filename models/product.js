const mongoose = require("mongoose");
const Schema = mongoose.Schema;

const productSchema = new Schema({
    title: {
        type: String,
        required: true,
    },

    price: {
        type: Number,
        required: true,
    },
    imageUrl: {
        type: String,
        required: true,
    },
    description: {
        type: String,
        required: true,
    },
    userId: {
        type: Schema.Types.ObjectId,
        ref: "User",
        required: true,
        },
});
module.exports = mongoose.model('Product', productSchema);  //export the model


// class Product {
//     constructor(title, price, imageUrl, description, id, userId) {
//         this.title = title;
//         this.price = price;
//         this.imageUrl = imageUrl;
//         this.description = description;
//         this._id = id ? new mongodb.ObjectId(id) : null; // Convert id to ObjectId if provided
//         this.userId = userId;
//     }

//     save() {
//         const db = getDb();
//         if (this._id) {
//             // Update existing product
//             return db
//                 .collection("products")
//                 .updateOne(
//                     { _id: this._id },
//                     {
//                         $set: {
//                             title: this.title,
//                             price: this.price,
//                             imageUrl: this.imageUrl,
//                             description: this.description,
//                         },
//                     }
//                 )
//                 .then((result) => {
//                     console.log("Updated Product");
//                     return result;
//                 })
//                 .catch((err) => {
//                     console.log(err);
//                 });
//         } else {
//             // Insert new product
//             return db
//                 .collection("products")
//                 .insertOne(this)
//                 .then((result) => {
//                     console.log("Added Product");
//                     return result;
//                 })
//                 .catch((err) => {
//                     console.log(err);
//                 });
//         }
//     }

//     static fetchAll() {
//         const db = getDb();
//         return db
//             .collection("products")
//             .find()
//             .toArray()
//             .then((products) => {
//                 return products;
//             })
//             .catch((err) => {
//                 console.log(err);
//                 return [];
//             });
//     }

//     static findbyId(prodId) {
//         const db = getDb();
//         try {
//             const objectId = new mongodb.ObjectId(prodId); // Validate and convert to ObjectId
//             return db
//                 .collection("products")
//                 .findOne({ _id: objectId })
//                 .then((result) => {
//                     return result;
//                 })
//                 .catch((err) => {
//                     console.error("Error finding product by ID:", err);
//                     return null;
//                 });
//         } catch (err) {
//             console.error("Invalid ObjectId format:", err);
//             return Promise.reject("Invalid ObjectId format");
//         }
//     }

//     static delete(prodId) {
//         const db = getDb();
//         const productObjectId = new mongodb.ObjectId(prodId);

//         return db
//             .collection("products")
//             .deleteOne({ _id: productObjectId })
//             .then(() => {
//                 console.log("Deleted product");
//                 // Find all users who have this product in their cart
//                 return db
//                     .collection("users")
//                     .find({ "cart.items._id": productObjectId })
//                     .toArray();
//             })
//             .then((usersWithProduct) => {
//                 const updatePromises = usersWithProduct.map((user) => {
//                     // Filter out the product from the cart items
//                     const updatedCartItems = user.cart.items.filter(
//                         (item) => item._id.toString() !== prodId
//                     );

//                     // Recalculate the total price
//                     const updatedTotalPrice = updatedCartItems.reduce(
//                         (total, item) => total + item.price * item.quantity,
//                         0
//                     );

//                     // Update the user's cart in the database
//                     return db.collection("users").updateOne(
//                         { _id: user._id },
//                         {
//                             $set: {
//                                 cart: {
//                                     items: updatedCartItems,
//                                     totalPrice: updatedTotalPrice,
//                                 },
//                             },
//                         }
//                     );
//                 });

//                 // Execute all the update promises
//                 return Promise.all(updatePromises);
//             })
//             .then((results) => {
//                 console.log(
//                     `Updated carts for ${results.length} user(s) after product deletion`
//                 );
//             })
//             .catch((err) => {
//                 console.error("Error deleting product or updating carts:", err);
//             });
//     }
// }

// module.exports = Product;
