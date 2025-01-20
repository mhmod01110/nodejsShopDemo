const User = require("../models/user");

exports.getLogin = (req, res, next) => {
    console.log(req.session.isLoggedIn);
    res.render("auth/login", {
        path: "/login",
        pageTitle: "Login",
        isAuth: false,
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
