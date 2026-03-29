const http = require('http');
const nodemailer = require('nodemailer');
require('dotenv').config();

const PORT = 3000;

// Replace these with your actual SMTP credentials
const SMTP_HOST = 'smtp.gmail.com';
const SMTP_PORT = 587;
const SMTP_USER = process.env.EMAIL || 'contact@integrixai.me';
const SMTP_PASS = (process.env.GMAIL || '').replace(/\s/g, '');
const FROM_EMAIL = 'contact@integrixai.me';

console.log('Environment Debug:', {
  auth_user: SMTP_USER,
  display_email: FROM_EMAIL,
  passLength: SMTP_PASS ? SMTP_PASS.length : 0,
  passPrefix: SMTP_PASS ? SMTP_PASS.substring(0, 2) + '...' : 'none'
});

const transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    user: SMTP_USER,
    pass: SMTP_PASS,
  },
  logger: true,
  debug: true
});

const server = http.createServer((req, res) => {
  // Add CORS headers so the frontend can call this API
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  // Handle OPTIONS request for CORS preflight
  if (req.method === 'OPTIONS') {
    res.writeHead(204);
    res.end();
    return;
  }

  if (req.method === 'POST' && req.url === '/send-email') {
    let body = '';

    req.on('data', chunk => {
      body += chunk.toString();
    });

    req.on('end', async () => {
      try {
        const data = JSON.parse(body);
        const { name, email, phone, query } = data;

        // Message to the user who filled the form
        const userMailOptions = {
          from: `"Integrix" <${FROM_EMAIL}>`,
          to: email, // send to the user's email
          subject: 'Thank you for reaching out to Integrix',
          text: `Hi ${name},\n\nThank of reaching out to us, out team will contact you shortly\n\nThanking\nIntegrix`,
        };

        // Message to the internal team (optional, keeping it here so the website owner gets the lead)
        const teamMailOptions = {
          from: `"Integrix Website" <${FROM_EMAIL}>`,
          to: FROM_EMAIL, // send to yourself
          subject: 'New Discovery Call Request',
          text: `New request received:\nName: ${name}\nEmail: ${email}\nPhone: ${phone}\nQuery: ${query}`,
        };

        // Send both emails
        await transporter.sendMail(userMailOptions);
        await transporter.sendMail(teamMailOptions);

        res.writeHead(200, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ success: true, message: 'Emails sent successfully' }));
      } catch (err) {
        console.error('Error sending email:', err);
        res.writeHead(500, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ success: false, error: 'Failed to send email' }));
      }
    });
  } else {
    res.writeHead(404);
    res.end();
  }
});

server.listen(PORT, () => {
  console.log(`SMTP Server running on http://localhost:${PORT}`);
});
