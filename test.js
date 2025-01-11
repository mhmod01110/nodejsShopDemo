const fs = require('fs');
const path = require('path');

class Product {
    constructor(id, price) {
        this.id = id;
        this.price = Number(price);
    }
}

class Cart {
    static addProducts(id, price) {
        const filePath = './cart.json';

        // Read the cart.json file
        fs.readFile(filePath, 'utf-8', (err, content) => {
            let cart = { products: [], totalPrice: 0 };

            if (!err && content.trim() !== "") {
                try {
                    cart = JSON.parse(content);
                } catch (parseErr) {
                    console.error("Error parsing cart.json. Resetting cart to default.");
                }
            }

            // Check if the product already exists in the cart
            const existingProduct = cart.products.find(prod => prod.id === id);

            if (existingProduct) {
                // If the product exists, increment its quantity
                existingProduct.quantity += 1;
            } else {
                // If the product doesn't exist, add it with quantity 1
                cart.products.push({ id, price, quantity: 1 });
            }

            // Update the total price
            cart.totalPrice += price;

            // Write the updated cart back to the file
            fs.writeFile(filePath, JSON.stringify(cart, null, 2), (writeErr) => {
                if (writeErr) {
                    console.error("Error writing to cart.json:", writeErr);
                } else {
                    console.log("Cart updated successfully:", cart);
                }
            });
        });
    }
}

const listOfProducts = [new Product(1, 20), new Product(2, 30), new Product(3, 40)];
console.log("List of Products:", listOfProducts);

const filePath = path.resolve(__dirname, 'test.json');

fs.readFile(filePath, 'utf-8', (err, content) => {
    if (err) {
        console.error("Error reading file:", err);
        return;
    }

    // If the file is empty or contains invalid JSON
    let data = null;
    if (content.trim() === "") {
        console.log("File is empty. Writing default products.");
        data = listOfProducts;

        // Write the list of products to the file
        fs.writeFile(filePath, JSON.stringify(data, null, 2), (writeErr) => {
            if (writeErr) {
                console.error("Error writing to file:", writeErr);
            } else {
                console.log("Default products written to file.");
            }
        });
    } else {
        try {
            data = JSON.parse(content);
            console.log("File contents:", data);
        } catch (parseErr) {
            console.error("Error parsing JSON. Writing default products.");
            data = listOfProducts;

            // Write the list of products to the file
            fs.writeFile(filePath, JSON.stringify(data, null, 2), (writeErr) => {
                if (writeErr) {
                    console.error("Error writing to file:", writeErr);
                } else {
                    console.log("Default products written to file.");
                }
            });
        }
    }
});

Cart.addProducts("id1", 50);