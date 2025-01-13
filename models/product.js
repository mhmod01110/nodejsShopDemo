const fs = require("fs");
const path = require("path");

const p = path.join(
    path.dirname(require.main.filename),
    "data",
    "products.json"
);

const getProductsFromFile = (cb) => {
    fs.readFile(p, (err, fileContent) => {
        if (err) {
            cb([]);
        } else {
            cb(JSON.parse(fileContent));
        }
    });
};

module.exports = class Product {
    constructor(id, title, imageUrl, description, price) {
        this.id = id; // Add `id` to the constructor
        this.title = title;
        this.imageUrl = imageUrl;
        this.description = description;
        this.price = price;
    }

    save() {
        getProductsFromFile((products) => {
            if (this.id) {
                // Update existing product
                const existingProductIndex = products.findIndex(
                    (prod) => prod.id === this.id
                );
                if (existingProductIndex >= 0) {
                    products[existingProductIndex] = this;
                } else {
                    console.log("Product ID not found for update. Adding as new.");
                    products.push(this);
                }
            } else {
                // Add a new product
                this.id = Math.random().toString();
                products.push(this);
            }

            fs.writeFile(p, JSON.stringify(products, null, 2), (err) => {
                if (err) {
                    console.log("Error saving product:", err);
                }
            });
        });
    }

    static fetchAll(cb) {
        getProductsFromFile(cb);
    }

    static findByID(id, cb) {
        getProductsFromFile((products) => {
            const product = products.find((p) => p.id === id);
            cb(product);
        });
    }

    static deleteByID(id, cb) {
        getProductsFromFile((products) => {
            const updatedProducts = products.filter((prod) => prod.id !== id);
            if (updatedProducts.length === products.length) {
                console.log("Product not found for deletion.");
                cb(false); // Optional callback indicating failure
                return;
            }

            fs.writeFile(p, JSON.stringify(updatedProducts, null, 2), (err) => {
                if (err) {
                    console.log("Error deleting product:", err);
                    cb(false); // Optional callback indicating failure
                } else {
                    console.log(`Product with ID ${id} deleted.`);
                    cb(true); // Optional callback indicating success
                }
            });
        });
    }
};
