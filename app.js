const path = require("path");
const mongoose = require("mongoose");
const express = require("express");
const bodyParser = require("body-parser");
const session = require("express-session");
const MongoDBStore = require("connect-mongodb-session")(session);

const errorController = require("./controllers/error");
const User = require("./models/user");

const MONGODB_URL = "mongodb://localhost:27017/shop";

const app = express();

const store = new MongoDBStore({
    uri: MONGODB_URL,
    collection: "sessions",
});

app.set("view engine", "ejs");
app.set("views", "views");

const adminRoutes = require("./routes/admin");
const shopRoutes = require("./routes/shop");
const authRoutes = require("./routes/auth");

app.use(bodyParser.urlencoded({ extended: false }));
app.use(express.static(path.join(__dirname, "public")));
app.use(
    session({
        secret: "secret key",
        resave: false,
        saveUninitialized: false,
        store: store,
    })
);

app.use((req, res, next) => {
    if (!req.session.user) {
        return next();
    }
    User.findById(req.session.user._id)
        .then((user) => {
            if (user) {
                req.user = user;
                req.session.user = user;
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
app.use(authRoutes);

mongoose
    .connect(MONGODB_URL, {
        // useNewUrlParser: true,
        // useUnifiedTopology: true,
    })
    .then((result) => {
        console.log("Connected to MongoDB");
        User.findOne({ name: "mhmod" })
            .then((existingUser) => {
                if (!existingUser) {
                    const user = new User({
                        name: "new user",
                        email: "new_user@gmail.com",
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
    });
