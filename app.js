const path = require("path");

const express = require("express");
const bodyParser = require("body-parser");

const errorController = require("./controllers/error");
const sequelize = require("./util/db");

const Product = require("./models/product");
const User = require("./models/user");
const Cart = require("./models/cart");
const CartItem = require("./models/cart-item");
const Order = require("./models/order");
const OrderItem = require("./models/order-item");

const app = express();

app.set("view engine", "ejs");
app.set("views", "views");

const adminRoutes = require("./routes/admin");
const shopRoutes = require("./routes/shop");

// const query = db.execute("SELECT * FROM products");
// const promise = query
//     .then((data) => {
//         console.log(data);
//     })
//     .catch((err) => {
//         console.log(err);
//     });

app.use(bodyParser.urlencoded({ extended: false }));
app.use(express.static(path.join(__dirname, "public")));

app.use((req, res, next) => {
    User.findByPk(1)
        .then((user) => {
            req.user = user;
            next();
        })
        .catch((err) => {
            console.log(err);
        });
});
app.use("/admin", adminRoutes);
app.use(shopRoutes);

app.use(errorController.get404);

Product.belongsTo(User, { constraints: true, onDelete: "CASCADE" }); // Creation
User.hasMany(Product);
User.hasOne(Cart);
Cart.belongsTo(User);
Cart.belongsToMany(Product, { through: CartItem });
Product.belongsToMany(Cart, { through: CartItem });
Order.belongsTo(User);
User.hasMany(Order);
Order.belongsToMany(Product, {through: OrderItem});

sequelize
    .sync()
    .then(() => {
        return User.findByPk(1, { include: Cart });
    })
    .then((user) => {
        if (!user) {
            return User.create({
                name: "Default User",
                email: "default@example.com",
                password: "password",
                role: "Admin",
            });
        }
        return user;
    })
    .then((user) => {
        if (!user.cart) {
            return user.createCart();
        }
        return user.cart; // Return the existing cart if it already exists
    })
    .then((cart) => {
        app.listen(3000, "0.0.0.0", () => {
            console.log("Server is running on http://0.0.0.0:3000");
        });
    })
    .catch((err) => {
        console.error(err);
    });
