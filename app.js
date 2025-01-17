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
    User.findById("678a661eb389c89329b939bc")
        .then((user) => {
            req.user = user;
            next();
        })
        .catch((err) => {
            console.log("Error finding user:", err);
            next(err); // Pass error to Express's error-handling mechanism
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
