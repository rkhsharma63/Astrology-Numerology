// Verifies that a payment really succeeded, using Razorpay's signature check.
// This is the step that makes the "only submit after payment" rule trustworthy —
// without it, anyone could fake a success message in the browser.

const crypto = require('crypto');

exports.handler = async function (event) {
  if (event.httpMethod !== 'POST') {
    return { statusCode: 405, body: 'Method Not Allowed' };
  }

  const keySecret = process.env.RAZORPAY_KEY_SECRET;
  if (!keySecret) {
    return {
      statusCode: 500,
      body: JSON.stringify({ verified: false, error: 'Server is not configured yet.' }),
    };
  }

  let body;
  try {
    body = JSON.parse(event.body || '{}');
  } catch (e) {
    return { statusCode: 400, body: JSON.stringify({ verified: false, error: 'Bad request.' }) };
  }

  const { razorpay_order_id, razorpay_payment_id, razorpay_signature } = body;

  if (!razorpay_order_id || !razorpay_payment_id || !razorpay_signature) {
    return {
      statusCode: 400,
      body: JSON.stringify({ verified: false, error: 'Missing payment fields.' }),
    };
  }

  const expectedSignature = crypto
    .createHmac('sha256', keySecret)
    .update(`${razorpay_order_id}|${razorpay_payment_id}`)
    .digest('hex');

  const verified = expectedSignature === razorpay_signature;

  return {
    statusCode: 200,
    body: JSON.stringify({ verified }),
  };
};
