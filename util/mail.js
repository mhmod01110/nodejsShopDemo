// fnfm apsw vsqn lnsr

const nodemailer = require('nodemailer');

// Create transporter
const transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    user: 'mhmod.mhmod01110@gmail.com', // Your Gmail address
    pass: 'fnfm apsw vsqn lnsr',   // Your Gmail App Password
  },
});

// Email options
const mailOptions = {
  from: 'mhmod.mhmod01110@gmail.com', // Sender's email
  to: 'mohamedadly2031@gmail.com', // Receiver's email
  subject: 'Test Email from Node.js',
  text: 'Hello! This is a test email sent from Node.js using Gmail SMTP.', // Plain text
};

// Send email
transporter.sendMail(mailOptions, (error, info) => {
  if (error) {
    return console.log('Error:', error);
  }
  console.log('Email sent:', info.response);
});

