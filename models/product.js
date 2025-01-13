const db = require("../util/db");

module.exports = class Product {
    constructor(title, imageUrl, description, price) {
        this.title = title;
        this.imageUrl = imageUrl;
        this.description = description;
        this.price = price;
    }

    save() {
        return db.execute(
            "INSERT INTO products (title, price, description, imageUrl) VALUES (?, ?, ?, ?)",
            [this.title, this.price, this.description, this.imageUrl]
        );
    }

    static fetchAll() {
        return db.execute("SELECT * FROM products");
    }

    static findByID(id) {
        return db.execute(
            "SELECT * FROM products WHERE products.id = ?",
            [id]
        );
    }

    static deleteByID(id) {}
};
