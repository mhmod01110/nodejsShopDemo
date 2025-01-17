const getDb = require("../util/db").getDb;
const mongodb = require("mongodb");

class User {
    constructor(username, email, id = null) {
        this.username = username;
        this.email = email;
        this._id = id ? new mongodb.ObjectId(id) : null; // Convert id to ObjectId if provided
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
                    { $set: { username: this.username, email: this.email } }
                )
                .then(result => {
                    console.log("User updated");
                    return result;
                })
                .catch(err => {
                    console.error("Error updating user:", err);
                });
        } else {
            // Create new user
            return db
                .collection("users")
                .insertOne({ username: this.username, email: this.email })
                .then(result => {
                    console.log("User created");
                    return result;
                })
                .catch(err => {
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
            .then(users => {
                console.log("Fetched all users:", users);
                return users;
            })
            .catch(err => {
                console.error("Error fetching users:", err);
                return [];
            });
    }

    // Read a user by ID
    static findById(userId) {
        const db = getDb();
        return db
            .collection("users")
            .find({ _id: new mongodb.ObjectId(userId) })
            .next()
            .then(user => {
                console.log("User found:", user);
                return user;
            })
            .catch(err => {
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
            .catch(err => {
                console.error("Error deleting user:", err);
            });
    }
}

module.exports = User;
