const nodemailer = require('nodemailer');
require('dotenv').config({ path: './.env' });

// Create and export transporter directly
module.exports = nodemailer.createTransport({
    service: 'gmail',
    auth: {
        user: process.env.GMAIL_USER,
        pass: process.env.GMAIL_PASS,
    },
});

