const { body } = require('express-validator');

exports.productValidator = [
    body('title')
        .trim()
        .isLength({ min: 3, max: 100 })
        .withMessage('Title must be between 3 and 100 characters long'),
    
    body('price')
        .trim()
        .isFloat({ min: 0.01 })
        .withMessage('Price must be a positive number'),
    
    body('imageUrl')
        .trim()
        .isURL()
        .withMessage('Please enter a valid URL for the image'),
    
    body('description')
        .trim()
        .isLength({ min: 5, max: 500 })
        .withMessage('Description must be between 5 and 500 characters long')
];