const Product = require("../models/product");
const Cart = require("../models/cart");

exports.getAddProduct = (req, res, next) => {
    const editMode = req.query.edit;
    res.render("admin/edit-product", {
        pageTitle: "Add Product",
        path: "/admin/add-product",
        formsCSS: true,
        productCSS: true,
        activeAddProduct: true,
        isEdit: editMode,
    });
};

exports.postAddProduct = (req, res, next) => {
    const title = req.body.title;
    const imageUrl = req.body.imageUrl;
    const price = req.body.price;
    const description = req.body.description;
    const product = new Product(title, imageUrl, description, price);
    product
        .save()
        .then(() => {
            res.redirect("/");
        })
        .catch((err) => {
            console.log(err);
        });
};

exports.getEditProduct = (req, res, next) => {
    const editMode = req.query.edit;
    if (editMode != "true") {
        return res.redirect("/");
    }
    const prodId = req.params.productId;
    console.log(editMode);
    console.log(prodId);
    Product.findByID(prodId, (product) => {
        console.log(product);
        if (!product) {
            return res.redirect("/");
        }
        res.render("admin/edit-product", {
            pageTitle: "Edit Product",
            path: "/admin/edit-product",
            formsCSS: true,
            productCSS: true,
            activeAddProduct: true,
            isEdit: editMode,
            product: product,
        });
    });
};

exports.postEditProduct = (req, res, next) => {
    const prodId = req.body.productId;
    const updatedTitle = req.body.title;
    const updatedImageUrl = req.body.imageUrl;
    const updatedPrice = req.body.price;
    const updatedDescription = req.body.description;
    const updatedProduct = new Product(
        prodId,
        updatedTitle,
        updatedImageUrl,
        updatedDescription,
        updatedPrice
    );
    updatedProduct.save();

    res.redirect("/admin/products");

    console.log(prodId);
};

exports.postDeleteProduct = (req, res, next) => {
    const prodId = req.body.productId;

    Product.findByID(prodId, (product) => {
        if (!product) {
            console.log(`Product with ID ${prodId} not found.`);
            return res.redirect("/admin/products");
        }

        Product.deleteByID(prodId, (success) => {
            if (success) {
                console.log(`Product with ID ${prodId} successfully deleted.`);

                // Delete the product from the cart
                Cart.deleteProduct(prodId, product.price);

                res.redirect("/admin/products");
            } else {
                console.log(`Failed to delete product with ID ${prodId}.`);
                res.redirect("/admin/products");
            }
        });
    });
};

exports.getProducts = (req, res, next) => {
    Product.fetchAll((products) => {
        res.render("admin/products", {
            prods: products,
            pageTitle: "Admin Products",
            path: "/admin/products",
        });
    });
};
