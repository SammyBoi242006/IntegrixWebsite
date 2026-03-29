const nodemailer = require('nodemailer');
require('dotenv').config();

const SMTP_USER = process.env.EMAIL || 'contact@integrixai.me';
const SMTP_PASS = (process.env.GMAIL || '').replace(/\s/g, '');
const FROM_EMAIL = 'contact@integrixai.me';

console.log('--- SMTP DIAGNOSTIC ---');
console.log('Auth User:', SMTP_USER);
console.log('Display From:', FROM_EMAIL);
console.log('Pass Length:', SMTP_PASS ? SMTP_PASS.length : 0);
console.log('Pass Prefix:', SMTP_PASS ? SMTP_PASS.substring(0, 2) + '...' : 'none');
console.log('-----------------------');

if (!SMTP_PASS) {
    console.error('ERROR: GMAIL environment variable is missing in .env');
    process.exit(1);
}

const transporter = nodemailer.createTransport({
    service: 'gmail',
    auth: {
        user: SMTP_USER,
        pass: SMTP_PASS,
    },
});

const mailOptions = {
    from: `"Integrix" <${FROM_EMAIL}>`,
    to: FROM_EMAIL, // Send to the display email for testing
    subject: 'Integrix SMTP Test (Custom Sender)',
    text: `If you are reading this, your SMTP configuration is correct!\nAuth User: ${SMTP_USER}\nFrom: ${FROM_EMAIL}`,
};

console.log('Attempting to send test email...');

transporter.sendMail(mailOptions, (error, info) => {
    if (error) {
        console.error('FAILED to send email:');
        console.error(error);
    } else {
        console.log('SUCCESS! Email sent:', info.response);
    }
});
