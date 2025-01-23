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

// // Email options
// const mailOptions = {
//   from: 'mhmod.mhmod01110@gmail.com', // Sender's email
//   to: 'mohamedadly2031@gmail.com', // Receiver's email
//   subject: 'Test Email from Node.js',
//   text: 'Hello! This is a test email sent from Node.js using Gmail SMTP.', // Plain text
// };

// // Send email
// transporter.sendMail(mailOptions, (error, info) => {
//   if (error) {
//     return console.log('Error:', error);
//   }
//   console.log('Email sent:', info.response);
// });

