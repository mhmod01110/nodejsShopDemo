const bcrypt = require("bcryptjs");
const crypto = require("crypto");
const { validationResult } = require("express-validator");

const User = require("../models/user");
const transporter = require("../util/sendMail");

exports.getLogin = (req, res, next) => {
    res.render("auth/login", {
        path: "/login",
        pageTitle: "Login",
        oldInput: { email: "", password: "", confirmPassword: "" },
        validationErrors: [],
        errorMessage: null,
        successMessage: null,
    });
};

// modified
exports.getSignup = (req, res, next) => {
    res.render("auth/signup", {
        path: "/signup",
        pageTitle: "Signup",
        errorMessage: null,
        successMessage: null,
        oldInput: { email: "", password: "", confirmPassword: "" },
        validationErrors: [],
    });
};

// modified
exports.postLogin = (req, res, next) => {
    const { email, password } = req.body;
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        return res.status(422).render("auth/login", {
            path: "/login",
            pageTitle: "Login",
            errorMessage: errors.array()[0].msg,
            successMessage: null,
            oldInput: { email, password },
            validationErrors: errors.array(),
        });
    }

    User.findOne({ email })
        .then((user) => {
            if (!user) {
                return res.status(422).render("auth/login", {
                    path: "/login",
                    pageTitle: "Login",
                    oldInput: { email, password },
                    validationErrors: [],
                    errorMessage: "Invalid email or password.",
                    successMessage: null,
                });
            }
            return bcrypt.compare(password, user.password).then((doMatch) => {
                if (doMatch) {
                    req.session.isLoggedIn = true;
                    req.session.user = user;
                    return req.session.save((err) => {
                        if (err) {
                            console.error(err);
                            return next(err);
                        }
                        res.redirect("/");
                    });
                }
                return res.status(422).render("auth/login", {
                    path: "/login",
                    pageTitle: "Login",
                    errorMessage: "Invalid email or password.",
                    successMessage: null,
                    oldInput: { email, password },
                    validationErrors: [],
                });
            });
        })
        .catch((err) => {
            next(err);
        });
};

// modified
exports.postSignup = (req, res, next) => {
    const { email, password, confirmPassword } = req.body;

    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        return res.status(422).render("auth/signup", {
            path: "/signup",
            pageTitle: "Signup",
            errorMessage: errors.array()[0].msg,
            successMessage: null,
            oldInput: { email, password, confirmPassword },
            validationErrors: errors.array(),
        });
    }

    bcrypt
        .hash(password, 12)
        .then((hashedPassword) => {
            const user = new User({
                email,
                password: hashedPassword,
                cart: { items: [] },
            });
            return user.save();
        })
        .then((result) => {
            res.redirect("/login");
        })
        .catch((err) => {
            next(err);
        });
};

exports.getReset = (req, res, next) => {
    res.render("auth/reset", {
        path: "/reset",
        pageTitle: "Reset Password",
    });
};

exports.postReset = (req, res, next) => {
    crypto.randomBytes(32, (err, buffer) => {
        if (err) {
            console.log(err);
            req.flash("error", "An error occurred.");
            return res.redirect("/reset");
        }

        const token = buffer.toString("hex");
        User.findOne({ email: req.body.email })
            .then((user) => {
                if (!user) {
                    req.flash("error", "No account with that email found.");
                    return res.redirect("/reset");
                }

                user.resetToken = token;
                user.resetTokenExpiration = Date.now() + 3600000; // 1 hour
                return user.save();
            })
            .then((result) => {
                if (!result) return;

                req.flash("success", "Reset link sent to your email!");
                res.redirect("/login");

                const mailOptions = {
                    from: "mhmod.mhmod01110@gmail.com",
                    to: req.body.email,
                    subject: "Password Reset",
                    html: `
                        <h1>Password Reset Request</h1>
                        <p>Click this <a href="https://frightened-imogen-iti0211-e79b0a9d.koyeb.app/reset/${token}">link</a> to reset your password.</p>
                        <p>This link will expire in 1 hour.</p>
                    `,
                };

                return transporter.sendMail(mailOptions);
            })
            .catch((err) => {
                console.log(err);
                req.flash("error", "An error occurred.");
                res.redirect("/reset");
            });
    });
};

exports.getNewPassword = (req, res, next) => {
    const resetToken = req.params.token;
    User.findOne({
        resetToken: resetToken,
        resetTokenExpiration: { $gt: Date.now() },
    })
        .then((user) => {
            if (!user) {
                console.log(
                    "No such user found for password reset -OR- Expired token"
                );
                return res.status(404).render("404", {
                    pageTitle: "Product Not Found",
                    path: "/404",
                });
            } else {
                return res.render("auth/new-password", {
                    path: "/new-password",
                    pageTitle: "New Password",
                    userId: user._id.toString(),
                    passwordToken: user.resetToken,
                });
            }
        })
        .catch((err) => {
            console.log("Err in finding user: ", err);
        });
};

exports.postNewPassword = (req, res, next) => {
    const newPassword = req.body.password;
    const userId = req.body.userId;
    const passwordToken = req.body.passwordToken;
    let resetUser;

    User.findOne({
        resetToken: passwordToken,
        resetTokenExpiration: { $gt: Date.now() },
        _id: userId,
    })
        .then((user) => {
            if (!user) {
                console.log(
                    "No such user found for password reset -OR- Expired token"
                );
                return res.status(404).render("404", {
                    pageTitle: "Page Not Found",
                    path: "/404",
                });
            }
            resetUser = user;
            return bcrypt.hash(newPassword, 12);
        })
        .then((hashedPassword) => {
            if (!hashedPassword) {
                // Password was not hashed because user was not found; Response already sent
                return;
            }
            resetUser.password = hashedPassword;
            resetUser.resetToken = undefined;
            resetUser.resetTokenExpiration = undefined;
            return resetUser.save();
        })
        .then((result) => {
            if (result) {
                req.flash("success", "Password updated successfully!");
                res.redirect("/login");
            }
        })
        .catch((err) => {
            console.log(err);
            next(err);
        });
};

exports.postLogout = (req, res, next) => {
    req.session.destroy((err) => {
        if (err) console.log(err);
        res.redirect("/");
    });
};
