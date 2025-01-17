const { where } = require("sequelize");
const Product = require("../models/product");
const Order = require("../models/order");

exports.getProducts = (req, res, next) => {
    Product.fetchAll()
        .then((products) => {
            console.log("returned products : ", products);
            res.render("shop/product-list", {
                prods: products,
                pageTitle: "All Products",
                path: "/products",
            });
        })
        .catch((err) => {
            console.log(err);
        });
};

exports.getProduct = (req, res, next) => {
    const prodId = req.params.productId;
    // Product.findAll({ where: { id: prodId } })
    //     .then()
    //     .catch();

    Product.findbyId(prodId)
        .then((product) => {
            res.render("shop/product-detail", {
                path: "/products",
                pageTitle: product.title,
                product: product,
            });
        })
        .catch((err) => {
            console.log(err);
        });
};

exports.getIndex = (req, res, next) => {
    Product.fetchAll()
        .then((products) => {
            console.log("returned products : ", products);
            res.render("shop/index", {
                prods: products,
                pageTitle: "Shop",
                path: "/",
            });
        })
        .catch((err) => {
            console.log(err);
        });
};

// exports.getCart = (req, res, next) => {
//     req.user
//         .getCart()
//         .then((cart) => {
//             return cart
//                 .getProducts()
//                 .then((products) => {
//                     res.render("shop/cart", {
//                         path: "/cart",
//                         pageTitle: "Your Cart",
//                         products: products,
//                     });
//                 })
//                 .catch((err) => {
//                     console.log(err);
//                 });
//         })
//         .catch((err) => {
//             console.log(err);
//         });
// };

// exports.postCart = (req, res, next) => {
//     const prodId = req.body.productId;

//     req.user
//         .getCart() // Get the user's cart
//         .then((cart) => {
//             return cart
//                 .getProducts({ where: { id: prodId } }) // Get products in the cart by ID
//                 .then((products) => ({ cart, products }));
//         })
//         .then(({ cart, products }) => {
//             let product = products.length > 0 ? products[0] : null; // Check if product is in the cart
//             let newQuantity = 1;

//             if (product) {
//                 // If the product is already in the cart, increase its quantity
//                 const oldQuantity = product.cartItem.quantity; // Get the current quantity from CartItem
//                 newQuantity = oldQuantity + 1;
//             }

//             // If product is not in cart, find it and add to cart with quantity
//             return Product.findByPk(prodId) // Ensure the product exists
//                 .then((product) => {
//                     if (!product) {
//                         return res
//                             .status(404)
//                             .json({ message: "Product not found" });
//                     }

//                     return cart.addProduct(product, {
//                         through: { quantity: newQuantity },
//                     });
//                 });
//         })
//         .then(() => {
//             res.redirect("/cart");
//         })
//         .catch((err) => {
//             console.error(err);
//             res.status(500).json({ error: "Failed to update the cart" });
//         });
// };

// exports.postCartDeleteProduct = (req, res, next) => {
//     const prodId = req.body.productId;
//     req.user
//         .getCart()
//         .then((cart) => {
//             return cart.getProducts({ where: { id: prodId } });
//         })
//         .then((products) => {
//             const product = products[0];
//             return product.cartItem.destroy();
//         })
//         .then((result) => {
//             res.redirect("/cart");
//         })
//         .catch((err) => console.log(err));
// };


// exports.postOrder = (req, res, next) => {
//     let fetchedCart;
//     req.user
//       .getCart()
//       .then(cart => {
//         fetchedCart = cart;
//         return cart.getProducts();
//       })
//       .then(products => {
//         return req.user
//           .createOrder()
//           .then(order => {
//             return order.addProducts(
//               products.map(product => {
//                 product.orderItem = { quantity: product.cartItem.quantity };
//                 return product;
//               })
//             );
//           })
//           .catch(err => console.log(err));
//       })
//       .then(result => {
//         return fetchedCart.setProducts(null);
//       })
//       .then(result => {
//         res.redirect('/orders');
//       })
//       .catch(err => console.log(err));
//   };
  
//   exports.getOrders = (req, res, next) => {
//     req.user
//       .getOrders({include: ['products']})
//       .then(orders => {
//         res.render('shop/orders', {
//           path: '/orders',
//           pageTitle: 'Your Orders',
//           orders: orders
//         });
//       })
//       .catch(err => console.log(err));
//   };
// exports.getCheckout = (req, res, next) => {
//     res.render("shop/checkout", {
//         path: "/checkout",
//         pageTitle: "Checkout",
//     });
// };
