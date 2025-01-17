const getDb = require("../util/db").getDb;
const mongodb = require("mongodb");
const mongoose = require("mongoose");
class Product {
    constructor(title, price, imageUrl, description, id, userId) {
        this.title = title;
        this.price = price;
        this.imageUrl = imageUrl;
        this.description = description;
        this._id = id ? new mongodb.ObjectId(id) : null; // Convert id to ObjectId if provided
        this.userId = userId;
    }

    save() {
        const db = getDb();
        if (this._id) {
            // Update existing product
            return db
                .collection("products")
                .updateOne(
                    { _id: this._id },
                    { $set: { title: this.title, price: this.price, imageUrl: this.imageUrl, description: this.description } }
                )
                .then((result) => {
                    console.log("Updated Product");
                    return result;
                })
                .catch((err) => {
                    console.log(err);
                });
        } else {
            // Insert new product
            return db
                .collection("products")
                .insertOne(this)
                .then((result) => {
                    console.log("Added Product");
                    return result;
                })
                .catch((err) => {
                    console.log(err);
                });
        }
    }

    static fetchAll() {
        const db = getDb();
        return db
            .collection("products")
            .find()
            .toArray()
            .then((products) => {
                console.log(products);
                return products;
            })
            .catch((err) => {
                console.log(err);
                return [];
            });
    }

    static findbyId(prodId) {
        const db = getDb();
        return db
            .collection("products")
            .find({ _id: new mongodb.ObjectId(prodId) })
            .next()
            .then((result) => {
                return result;
            })
            .catch((err) => {
                console.log(err);
                return null;
            });
    }

    static delete(prodId) {
        const db = getDb();
        return db
            .collection("products")
            .deleteOne({ _id: new mongodb.ObjectId(prodId) })
            .then(() => {
                console.log("Deleted");
            })
            .catch((err) => {
                console.log(err);
            });
    }
}

module.exports = Product;
