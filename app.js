const path = require("path");
const mongoose = require("mongoose");
const express = require("express");
const bodyParser = require("body-parser");
const session = require("express-session");
const MongoDBStore = require("connect-mongodb-session")(session);
const csrf = require("csurf");
const flash = require("connect-flash");
const errorController = require("./controllers/error");
const User = require("./models/user");
const multer = require("multer");
const fs = require("fs");
require("dotenv").config({ path: "./.env" });

const adminRoutes = require("./routes/admin");
const shopRoutes = require("./routes/shop");
const authRoutes = require("./routes/auth");

// const MONGODB_URI = "mongodb://localhost:27017/shop";
const MONGODB_URI = process.env.DB_URI;
const PORT = process.env.PORT || 8080;

const app = express();

const store = new MongoDBStore({
    uri: MONGODB_URI,
    collection: "sessions",
});

const csrfProtection = csrf();

// Multer storage configuration
const fileStorage = multer.diskStorage({
    destination: (req, file, cb) => {
        const uploadDir = "temp/uploads";
        // Create directory if it doesn't exist
        if (!fs.existsSync(uploadDir)) {
            fs.mkdirSync(uploadDir, { recursive: true });
        }
        cb(null, uploadDir);
    },
    filename: (req, file, cb) => {
        const uniqueSuffix = Date.now() + "-" + Math.round(Math.random() * 1e9);
        cb(null, uniqueSuffix + "-" + file.originalname);
    },
});

// Multer file filter
const fileFilter = (req, file, cb) => {
    if (
        file.mimetype === "image/png" ||
        file.mimetype === "image/jpg" ||
        file.mimetype === "image/jpeg"
    ) {
        cb(null, true);
    } else {
        cb(null, false);
    }
};

app.set("view engine", "ejs");
app.set("views", "views");

app.use(bodyParser.urlencoded({ extended: false }));
app.use(
    multer({
        storage: fileStorage,
        fileFilter: fileFilter,
    }).single("image")
);
app.use(express.static(path.join(__dirname, "public")));
app.use(
    session({
        secret: "secret key",
        resave: false,
        saveUninitialized: false,
        store: store,
    })
);
app.use(csrfProtection);

app.use(flash());
// Middleware to make flash messages available to all views
app.use((req, res, next) => {
    res.locals.errorMessage = req.flash("error");
    res.locals.successMessage = req.flash("success");
    res.locals.isAuth = req.session.isLoggedIn;
    res.locals.csrfToken = req.csrfToken();
    next();
});

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

app.get("/500", errorController.get500);

app.use(errorController.get404);

app.use((error, req, res, next) => {
    res.redirect("/500");
});

mongoose
    .connect(MONGODB_URI, {
        serverSelectionTimeoutMS: 5000,
        socketTimeoutMS: 45000,
        family: 4, // Force IPv4
    })
    .then(() => {
        console.log("MongoDB connected successfully");
        app.listen(PORT, "0.0.0.0", () => {
            console.log(`Server running on port ${PORT}`);
        });
    })
    .catch((err) => {
        console.error("MongoDB connection error:", err);
    });
