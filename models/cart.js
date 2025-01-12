const path = require("path");
const fs = require('fs');
const p = path.join(path.dirname(require.main.filename), "data", "cart.json");

module.exports = class Cart {
    static addProducts(id, price) {
        // Read the cart.json file
        fs.readFile(p, "utf-8", (err, content) => {
            let cart = { products: [], totalPrice: 0 };

            if (!err && content.trim() !== "") {
                try {
                    cart = JSON.parse(content);
                } catch (parseErr) {
                    console.error(
                        "Error parsing cart.json. Resetting cart to default."
                    );
                }
            }

            // Check if the product already exists in the cart
            const existingProduct = cart.products.find(
                (prod) => prod.id === id
            );

            if (existingProduct) {
                // If the product exists, increment its quantity
                existingProduct.quantity += 1;
            } else {
                // If the product doesn't exist, add it with quantity 1
                cart.products.push({ id, price, quantity: 1 });
            }

            // Update the total price
            cart.totalPrice += Number(price);

            // Write the updated cart back to the file
            fs.writeFile(p, JSON.stringify(cart, null, 2), (writeErr) => {
                if (writeErr) {
                    console.error("Error writing to cart.json:", writeErr);
                } else {
                    console.log("Cart updated successfully:", cart);
                }
            });
        });
    }
};
