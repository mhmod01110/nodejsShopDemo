const { check, body } = require('express-validator');
const User = require('../models/user'); // Assuming you have a User model

exports.signupValidator = [
  check('email')
    .isEmail()
    .withMessage('Please enter a valid email.')
    .custom(async (value) => {
      const user = await User.findOne({ email: value });
      if (user) {
        return Promise.reject('E-Mail address already exists!');
      }
    }),
  
  body('password')
    .isLength({ min: 6, max: 20 })
    .withMessage('Password must be between 6 and 20 characters.')
    .isAlphanumeric()
    .withMessage('Password must contain only letters and numbers.')
    .trim(),
  
  body('confirmPassword')
    .custom((value, { req }) => {
      if (value !== req.body.password) {
        throw new Error('Passwords do not match.');
      }
      return true;
    })
    .trim(),
];

exports.loginValidator = [
  check('email')
    .isEmail()
    .withMessage('Please enter a valid email.'),
  
  body('password')
    .exists()
    .withMessage('Password is required.')
    .trim(),
];