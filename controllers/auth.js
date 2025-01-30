const bcrypt = require("bcryptjs");
const crypto = require("crypto");
const { validationResult } = require("express-validator");

const User = require("../models/user");
const transporter = require("../util/sendMail");

exports.getLogin = (req, res, next) => {
    res.render("auth/login", {
        path: "/login",
        pageTitle: "Login",
        oldInput: { email: "", password: "" },
        validationErrors: [],
        errorMessage: null,
        successMessage: null
    });
};

exports.getSignup = (req, res, next) => {
    res.render("auth/signup", {
        path: "/signup",
        pageTitle: "Signup",
        errorMessage: null,
        successMessage: null,
        oldInput: { email: "", password: "", confirmPassword: "" },
        validationErrors: []
    });
};

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
            validationErrors: errors.array()
        });
    }

    User.findOne({ email })
        .then(user => {
            if (!user) {
                return res.status(422).render("auth/login", {
                    path: "/login",
                    pageTitle: "Login",
                    oldInput: { email, password },
                    validationErrors: [],
                    errorMessage: "Invalid email or password.",
                    successMessage: null
                });
            }

            return bcrypt.compare(password, user.password)
                .then(doMatch => {
                    if (doMatch) {
                        req.session.isLoggedIn = true;
                        req.session.user = user;
                        return req.session.save(err => {
                            if (err) {
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
                        validationErrors: []
                    });
                });
        })
        .catch(err => {
            const error = new Error(err);
            error.httpStatusCode = 500;
            return next(error);
        });
};

exports.postSignup = (req, res, next) => {
    const { email, password } = req.body;
    const errors = validationResult(req);

    if (!errors.isEmpty()) {
        return res.status(422).render("auth/signup", {
            path: "/signup",
            pageTitle: "Signup",
            errorMessage: errors.array()[0].msg,
            successMessage: null,
            oldInput: { email, password, confirmPassword: req.body.confirmPassword },
            validationErrors: errors.array()
        });
    }

    bcrypt.hash(password, 12)
        .then(hashedPassword => {
            const user = new User({
                email,
                password: hashedPassword,
                cart: { items: [] }
            });
            return user.save();
        })
        .then(() => {
            res.redirect("/login");
        })
        .catch(err => {
            const error = new Error(err);
            error.httpStatusCode = 500;
            return next(error);
        });
};

exports.getReset = (req, res, next) => {
    res.render("auth/reset", {
        path: "/reset",
        pageTitle: "Reset Password"
    });
};

exports.postReset = (req, res, next) => {
    crypto.randomBytes(32, (err, buffer) => {
        if (err) {
            req.flash("error", "An error occurred.");
            return res.redirect("/reset");
        }

        const token = buffer.toString("hex");
        User.findOne({ email: req.body.email })
            .then(user => {
                if (!user) {
                    req.flash("error", "No account with that email found.");
                    return res.redirect("/reset");
                }

                user.resetToken = token;
                user.resetTokenExpiration = Date.now() + 3600000; // 1 hour
                return user.save();
            })
            .then(result => {
                if (!result) return;

                req.flash("success", "Reset link sent to your email!");
                res.redirect("/login");

                return transporter.sendMail({
                    from: "mhmod.mhmod01110@gmail.com",
                    to: req.body.email,
                    subject: "Password Reset",
                    html: `
                        <h1>Password Reset Request</h1>
                        <p>Click this <a href="http://localhost:3000/reset/${token}">link</a> to reset your password.</p>
                        <p>This link will expire in 1 hour.</p>
                    `
                });
            })
            .catch(() => {
                req.flash("error", "An error occurred.");
                res.redirect("/reset");
            });
    });
};

exports.getNewPassword = (req, res, next) => {
    const resetToken = req.params.token;
    User.findOne({
        resetToken,
        resetTokenExpiration: { $gt: Date.now() }
    })
        .then(user => {
            if (!user) {
                req.flash('error', 'Password reset link is invalid or has expired.');
                return res.redirect('/reset');
            }
            
            return res.render("auth/new-password", {
                path: "/new-password",
                pageTitle: "New Password",
                userId: user._id.toString(),
                passwordToken: user.resetToken,
                errorMessage: req.flash('error'),
                successMessage: req.flash('success'),
                validationErrors: []
            });
        })
        .catch(err => {
            const error = new Error(err);
            error.httpStatusCode = 500;
            return next(error);
        });
};

exports.postNewPassword = (req, res, next) => {
    const { password: newPassword, userId, passwordToken } = req.body;
    let resetUser;

    User.findOne({
        resetToken: passwordToken,
        resetTokenExpiration: { $gt: Date.now() },
        _id: userId
    })
        .then(user => {
            if (!user) {
                return res.status(404).render("404", {
                    pageTitle: "Page Not Found",
                    path: "/404"
                });
            }
            resetUser = user;
            return bcrypt.hash(newPassword, 12);
        })
        .then(hashedPassword => {
            if (!hashedPassword) return;

            resetUser.password = hashedPassword;
            resetUser.resetToken = undefined;
            resetUser.resetTokenExpiration = undefined;
            return resetUser.save();
        })
        .then(result => {
            if (result) {
                req.flash("success", "Password updated successfully!");
                res.redirect("/login");
            }
        })
        .catch(err => {
            const error = new Error(err);
            error.httpStatusCode = 500;
            return next(error);
        });
};

exports.postLogout = (req, res, next) => {
    req.session.destroy(err => {
        if (err) {
            const error = new Error(err);
            error.httpStatusCode = 500;
            return next(error);
        }
        res.redirect("/");
    });
};
