const path = require("path");
const mongoose = require("mongoose");

const express = require("express");
const bodyParser = require("body-parser");

const errorController = require("./controllers/error");
const User = require("./models/user");
const app = express();

app.set("view engine", "ejs");
app.set("views", "views");

const adminRoutes = require("./routes/admin");
const shopRoutes = require("./routes/shop");
const user = require("./models/user");

app.use(bodyParser.urlencoded({ extended: false }));
app.use(express.static(path.join(__dirname, "public")));

app.use((req, res, next) => {
    const userId = "678c19ab3ba2330088491dd7"; // Replace with actual logic to fetch user ID
    User.findById(userId)
        .then((user) => {
            if (user) {
                req.user = user;
            } else {
                req.user = null;
            }
            next();
        })
        .catch((err) => {
            console.error("Error fetching user:", err);
            next();
        });
});

app.use("/admin", adminRoutes);
app.use(shopRoutes);

app.use(errorController.get404);

mongoose
    .connect("mongodb://localhost:27017/shop", {
        useNewUrlParser: true,
        useUnifiedTopology: true,
    })
    .then(() => {
        console.log("Connected to MongoDB");
        return User.findOne({ email: "mohamed@gmail.com" });
    })
    .then((existingUser) => {
        if (!existingUser) {
            const user = new User({
                name: "mhmod",
                email: "mohamed@gmail.com",
                cart: { items: [] },
            });
            return user.save();
        }
        return existingUser; // Return the existing user if found
    })
    .then((user) => {
        console.log("User ready:", user.name);
        app.listen(3000, "0.0.0.0", () => {
            console.log("Server is running on http://0.0.0.0:3000");
        });
    })
    .catch((err) => {
        console.error("Error:", err);
    });
