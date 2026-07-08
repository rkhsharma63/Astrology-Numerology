// Creates a Razorpay order on the server, where the price can't be tampered with.
// Requires environment variables RAZORPAY_KEY_ID and RAZORPAY_KEY_SECRET to be set
// in your Netlify site settings (Site configuration > Environment variables).

const https = require('https');

exports.handler = async function (event) {
  if (event.httpMethod !== 'POST') {
    return { statusCode: 405, body: 'Method Not Allowed' };
  }

  const keyId = process.env.RAZORPAY_KEY_ID;
  const keySecret = process.env.RAZORPAY_KEY_SECRET;

  if (!keyId || !keySecret) {
    return {
      statusCode: 500,
      body: JSON.stringify({ error: 'Razorpay keys are not configured on the server yet.' }),
    };
  }

  // The real price lives here, server-side — change this to update the price everywhere.
  const amount = 99900; // ₹999.00, in paise
  const currency = 'INR';

  const auth = Buffer.from(`${keyId}:${keySecret}`).toString('base64');
  const payload = JSON.stringify({
    amount,
    currency,
    receipt: `kundli_${Date.now()}`,
  });

  return new Promise((resolve) => {
    const req = https.request(
      {
        hostname: 'api.razorpay.com',
        path: '/v1/orders',
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Content-Length': Buffer.byteLength(payload),
          Authorization: `Basic ${auth}`,
        },
      },
      (res) => {
        let data = '';
        res.on('data', (chunk) => (data += chunk));
        res.on('end', () => {
          resolve({
            statusCode: res.statusCode,
            body: data,
          });
        });
      }
    );

    req.on('error', (err) => {
      resolve({ statusCode: 500, body: JSON.stringify({ error: err.message }) });
    });

    req.write(payload);
    req.end();
  });
};
