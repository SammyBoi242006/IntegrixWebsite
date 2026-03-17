const http = require('http');
const nodemailer = require('nodemailer');

const PORT = 3000;

// Replace these with your actual SMTP credentials
const SMTP_HOST = 'smtp.gmail.com';
const SMTP_PORT = 587;
const SMTP_USER = 'your-email@gmail.com';
const SMTP_PASS = 'your-app-password';

const transporter = nodemailer.createTransport({
  host: SMTP_HOST,
  port: SMTP_PORT,
  secure: false, // true for 465, false for other ports
  auth: {
    user: SMTP_USER,
    pass: SMTP_PASS,
  },
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
          from: `"Integrix" <${SMTP_USER}>`,
          to: email, // send to the user's email
          subject: 'Thank you for reaching out to Integrix',
          text: `Hi ${name},\n\nThank of reaching out to us, out team will contact you shortly\n\nThanking\nIntegrix`,
        };

        // Message to the internal team (optional, keeping it here so the website owner gets the lead)
        const teamMailOptions = {
          from: `"Integrix Website" <${SMTP_USER}>`,
          to: SMTP_USER, // send to yourself
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
  console.log('Ensure you have installed nodemailer: npm install nodemailer');
});
