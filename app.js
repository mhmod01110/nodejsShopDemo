const path = require("path");

const express = require("express");
const bodyParser = require("body-parser");

const errorController = require("./controllers/error");
const mongoConnect = require("./util/db").mongoConnect;
const User = require('./models/user');
const app = express();

app.set("view engine", "ejs");
app.set("views", "views");

const adminRoutes = require("./routes/admin");
const shopRoutes = require("./routes/shop");

app.use(bodyParser.urlencoded({ extended: false }));
app.use(express.static(path.join(__dirname, "public")));


app.use((req, res, next) => {
    const userId = "678a661eb389c89329b939bc"; // Replace with actual logic to fetch user ID
    User.findById(userId)
        .then(userData => {
            if (userData) {
                req.user = new User(
                    userData.name,
                    userData.email,
                    userData._id,
                    userData.cart
                );
            } else {
                req.user = null;
            }
            next();
        })
        .catch(err => {
            console.error("Error fetching user:", err);
            next();
        });
});


app.use("/admin", adminRoutes);
app.use(shopRoutes);

app.use(errorController.get404);

mongoConnect(() => {
    app.listen(3000, "0.0.0.0", () => {
        console.log("Server is running on http://0.0.0.0:3000");
    });
});
