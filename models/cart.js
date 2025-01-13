const path = require("path");
const fs = require("fs");

const p = path.join(path.dirname(require.main.filename), "data", "cart.json");

module.exports = class Cart {
    static addProducts(id, price) {
        fs.readFile(p, "utf-8", (err, content) => {
            let cart = { products: [], totalPrice: 0 };

            if (!err && content.trim() !== "") {
                try {
                    cart = JSON.parse(content);
                } catch (parseErr) {
                    console.error("Error parsing cart.json. Resetting cart to default.");
                }
            }

            const existingProduct = cart.products.find((prod) => prod.id === id);

            if (existingProduct) {
                existingProduct.quantity += 1;
            } else {
                cart.products.push({ id, price, quantity: 1 });
            }

            cart.totalPrice += Number(price);

            fs.writeFile(p, JSON.stringify(cart, null, 2), (writeErr) => {
                if (writeErr) {
                    console.error("Error writing to cart.json:", writeErr);
                } else {
                    console.log("Cart updated successfully:", cart);
                }
            });
        });
    }

    static deleteProduct(id, price) {
        fs.readFile(p, "utf-8", (err, content) => {
            let cart = { products: [], totalPrice: 0 };

            if (!err && content.trim() !== "") {
                try {
                    cart = JSON.parse(content);
                } catch (parseErr) {
                    console.error("Error parsing cart.json. Resetting cart to default.");
                }
            }

            const productIndex = cart.products.findIndex((prod) => prod.id === id);

            if (productIndex >= 0) {
                const product = cart.products[productIndex];

                // Update total price by subtracting the price of all quantities of the product
                cart.totalPrice -= product.price * product.quantity;

                // Remove the product from the cart
                cart.products.splice(productIndex, 1);

                // Write the updated cart back to the file
                fs.writeFile(p, JSON.stringify(cart, null, 2), (writeErr) => {
                    if (writeErr) {
                        console.error("Error writing to cart.json:", writeErr);
                    } else {
                        console.log(`Product with ID ${id} removed from cart.`);
                    }
                });
            } else {
                console.log(`Product with ID ${id} not found in the cart.`);
            }
        });
    }
};
