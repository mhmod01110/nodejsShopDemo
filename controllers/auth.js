const bcrypt = require('bcryptjs');
const User = require("../models/user");

exports.getLogin = (req, res, next) => {
    console.log(req.session.isLoggedIn);
    res.render("auth/login", {
        path: "/login",
        pageTitle: "Login",
        isAuth: false,
    });
};

exports.getSignup = (req, res, next) => {
    res.render("auth/signup", {
        path: "/signup",
        pageTitle: "Signup",
        isAuthenticated: false,
    });
};

exports.postSignup = (req, res, next) => {
    const email = req.body.email;
    const password = req.body.password;
    const confirmPassword = req.body.confirmPassword;
    User.findOne({ email: email })
        .then((userDoc) => {
            if (userDoc) {
                return res.redirect("/signup");
            }
            return bcrypt.hash(password, 12);
        })
        .then((hashedPassword) => {
            const user = new User({
                email: email,
                password: hashedPassword,
                cart: { items: [] },
            });
            return user.save();
        })
        .then((result) => {
            res.redirect("/login");
        })
        .catch((err) => {
            console.log(err);
        });
};



exports.postLogin = (req, res, next) => {
    const userId = "678c19ab3ba2330088491dd7";
    User.findById(userId)
        .then((user) => {
            if (user) {
                req.session.user = user;
                req.session.user.isLoggedIn = true;
                req.session.isLoggedIn = true;
                res.redirect("/");
            } else {
                req.user = null;
            }
        })
        .catch((err) => {
            console.error("Error fetching user:", err);
            next();
        });
};

exports.postLogout = (req, res, next) => {
    req.session.destroy((err) => {
        if (err) {
            console.log(err);
        }
        res.redirect("/");
    });
};
