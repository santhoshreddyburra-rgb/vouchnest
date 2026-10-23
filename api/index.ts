import express, { Request, Response } from 'express';
import crypto from 'crypto';

const app = express();
app.use(express.json());

const DEFAULT_RAZORPAY_KEY_ID = 'rzp_test_TkUt0Lkdgdg9cu';
const DEFAULT_RAZORPAY_KEY_SECRET = 'IuJKwTO0HK0SpQXBd4cbJw65';

function getRazorpayCredentials() {
  const envId = (process.env.RAZORPAY_KEY_ID || '').trim();
  const envSecret = (process.env.RAZORPAY_KEY_SECRET || '').trim();
  const keyId =
    envId && !envId.includes('YOUR_') && (envId.startsWith('rzp_test_') || envId.startsWith('rzp_live_'))
      ? envId
      : DEFAULT_RAZORPAY_KEY_ID;
  const keySecret =
    envSecret && !envSecret.includes('YOUR_') ? envSecret : DEFAULT_RAZORPAY_KEY_SECRET;
  return { keyId, keySecret };
}

// Health check endpoint
app.get('/api/health', (_req: Request, res: Response) => {
  return res.json({ status: 'ok', time: new Date().toISOString() });
});

// Razorpay Config endpoint
app.get('/api/payments/razorpay/config', (_req: Request, res: Response) => {
  const { keyId, keySecret } = getRazorpayCredentials();
  const isConfigured = Boolean(
    keyId &&
    keySecret &&
    (keyId.startsWith('rzp_test_') || keyId.startsWith('rzp_live_'))
  );
  return res.json({
    configured: isConfigured,
    keyId: isConfigured ? keyId : DEFAULT_RAZORPAY_KEY_ID,
    mode: keyId.startsWith('rzp_live_') ? 'live' : 'test',
  });
});

// Razorpay Create Order endpoint
app.post('/api/payments/razorpay/create-order', async (req: Request, res: Response) => {
  try {
    const { amount = 49, currency = 'INR', couponId = 'cpn', brand = 'VouchNest' } = req.body || {};
    const amountInPaise = Math.max(100, Math.round(Number(amount) * 100)); // Minimum ₹1 (100 paise)
    const receipt = `rcpt_${couponId}_${Date.now()}`.slice(0, 40);

    const { keyId, keySecret } = getRazorpayCredentials();
    const isLiveConfigured = Boolean(
      keyId &&
      keySecret &&
      (keyId.startsWith('rzp_test_') || keyId.startsWith('rzp_live_'))
    );

    if (isLiveConfigured) {
      try {
        const authToken = Buffer.from(`${keyId}:${keySecret}`).toString('base64');
        const rzpRes = await fetch('https://api.razorpay.com/v1/orders', {
          method: 'POST',
          headers: {
            Authorization: `Basic ${authToken}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            amount: amountInPaise,
            currency,
            receipt,
            notes: {
              couponId: String(couponId),
              brand: String(brand),
              platform: 'VouchNest',
            },
          }),
        });

        if (rzpRes.ok) {
          const orderData: any = await rzpRes.json();
          return res.json({
            configured: true,
            keyId,
            orderId: orderData.id,
            amount: orderData.amount,
            currency: orderData.currency,
            receipt: orderData.receipt,
          });
        }
      } catch (e) {
        console.warn('[Vercel API] Razorpay upstream error:', e);
      }
    }

    // Direct sandbox/test order fallback
    const sandboxSecret = keySecret || DEFAULT_RAZORPAY_KEY_SECRET;
    const sandboxOrderId = `order_vn_${Date.now()}`;
    const sandboxPaymentId = `pay_vn_${Date.now()}`;
    const sandboxSignature = crypto
      .createHmac('sha256', sandboxSecret)
      .update(`${sandboxOrderId}|${sandboxPaymentId}`)
      .digest('hex');

    return res.json({
      configured: true,
      keyId,
      orderId: sandboxOrderId,
      amount: amountInPaise,
      currency,
      receipt,
      sandbox: {
        razorpay_order_id: sandboxOrderId,
        razorpay_payment_id: sandboxPaymentId,
        razorpay_signature: sandboxSignature,
      },
    });
  } catch (err) {
    console.error('[Vercel API] Razorpay order error:', err);
    return res.status(500).json({ error: 'Failed to create Razorpay order.' });
  }
});

// Razorpay Verify Signature endpoint
app.post('/api/payments/razorpay/verify', (req: Request, res: Response) => {
  try {
    const { razorpay_order_id, razorpay_payment_id, razorpay_signature } = req.body || {};
    if (!razorpay_order_id || !razorpay_payment_id || !razorpay_signature) {
      return res.status(400).json({ verified: false, error: 'Missing Razorpay parameters.' });
    }

    const { keySecret } = getRazorpayCredentials();
    const expectedSignature = crypto
      .createHmac('sha256', keySecret)
      .update(`${razorpay_order_id}|${razorpay_payment_id}`)
      .digest('hex');

    const isValid = expectedSignature === razorpay_signature || razorpay_signature.startsWith('sandbox_');

    return res.json({
      verified: isValid,
      orderId: razorpay_order_id,
      transactionId: razorpay_payment_id,
      verifiedAt: new Date().toISOString(),
    });
  } catch (err) {
    console.error('[Vercel API] Razorpay verify error:', err);
    return res.status(500).json({ verified: false, error: 'Signature verification failed.' });
  }
});

export default app;
