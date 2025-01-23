const bcrypt = require("bcryptjs");
const crypto = require("crypto");
const User = require("../models/user");
const transporter = require("../util/sendMail");

exports.getLogin = (req, res, next) => {
    res.render("auth/login", {
        path: "/login",
        pageTitle: "Login"
    });
};

exports.getSignup = (req, res, next) => {
    res.render("auth/signup", {
        path: "/signup",
        pageTitle: "Signup"
    });
};

exports.postLogin = (req, res, next) => {
    const email = req.body.email;
    const password = req.body.password;
    
    User.findOne({ email: email })
        .then(user => {
            if (!user) {
                req.flash('error', 'Invalid email or password.');
                return res.redirect('/login');
            }
            
            bcrypt.compare(password, user.password)
                .then(doMatch => {
                    if (doMatch) {
                        req.session.isLoggedIn = true;
                        req.session.user = user;
                        return req.session.save(err => {
                            if (err) console.log(err);
                            res.redirect('/');
                        });
                    }
                    req.flash('error', 'Invalid email or password.');
                    res.redirect('/login');
                })
                .catch(err => {
                    console.log(err);
                    req.flash('error', 'An error occurred. Please try again.');
                    res.redirect('/login');
                });
        })
        .catch(err => {
            console.log(err);
            req.flash('error', 'An error occurred. Please try again.');
            res.redirect('/login');
        });
};

exports.postSignup = (req, res, next) => {
    const email = req.body.email;
    const password = req.body.password;
    const confirmPassword = req.body.confirmPassword;

    if (password !== confirmPassword) {
        req.flash('error', 'Passwords do not match.');
        return res.redirect('/signup');
    }

    User.findOne({ email: email })
        .then(userDoc => {
            if (userDoc) {
                req.flash('error', 'Email exists already.');
                return res.redirect('/signup');
            }
            
            return bcrypt.hash(password, 12)
                .then(hashedPassword => {
                    const user = new User({
                        email: email,
                        password: hashedPassword,
                        cart: { items: [] }
                    });
                    return user.save();
                })
                .then(() => {
                    req.flash('success', 'Account created successfully!');
                    res.redirect('/login');
                });
        })
        .catch(err => {
            console.log(err);
            req.flash('error', 'An error occurred. Please try again.');
            res.redirect('/signup');
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
            console.log(err);
            req.flash('error', 'An error occurred.');
            return res.redirect('/reset');
        }

        const token = buffer.toString('hex');
        User.findOne({ email: req.body.email })
            .then(user => {
                if (!user) {
                    req.flash('error', 'No account with that email found.');
                    return res.redirect('/reset');
                }

                user.resetToken = token;
                user.resetTokenExpiration = Date.now() + 3600000; // 1 hour
                return user.save();
            })
            .then(result => {
                if (!result) return;
                
                req.flash('success', 'Reset link sent to your email!');
                res.redirect('/login');

                const mailOptions = {
                    from: "mhmod.mhmod01110@gmail.com",
                    to: req.body.email,
                    subject: "Password Reset",
                    html: `
                        <h1>Password Reset Request</h1>
                        <p>Click this <a href="http://localhost:3000/reset/${token}">link</a> to reset your password.</p>
                        <p>This link will expire in 1 hour.</p>
                    `
                };

                return transporter.sendMail(mailOptions);
            })
            .catch(err => {
                console.log(err);
                req.flash('error', 'An error occurred.');
                res.redirect('/reset');
            });
    });
};

exports.postLogout = (req, res, next) => {
    req.session.destroy(err => {
        if (err) console.log(err);
        res.redirect('/');
    });
};