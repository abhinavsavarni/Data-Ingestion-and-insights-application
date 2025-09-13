import crypto from 'crypto';

/**
 * Verify Shopify webhook signature
 * @param {string} body - Raw request body
 * @param {string} signature - X-Shopify-Hmac-Sha256 header
 * @param {string} secret - Webhook secret
 * @returns {boolean} - Whether signature is valid
 */
export function verifyWebhookSignature(body, signature, secret) {
  if (!signature || !secret) {
    console.warn('Missing signature or secret for webhook verification');
    return false;
  }

  try {
    const hmac = crypto.createHmac('sha256', secret);
    hmac.update(body, 'utf8');
    const calculatedSignature = hmac.digest('base64');
    
    return crypto.timingSafeEqual(
      Buffer.from(signature, 'base64'),
      Buffer.from(calculatedSignature, 'base64')
    );
  } catch (error) {
    console.error('Error verifying webhook signature:', error);
    return false;
  }
}

/**
 * Middleware to verify webhook requests
 */
export function webhookVerificationMiddleware(req, res, next) {
  const signature = req.headers['x-shopify-hmac-sha256'];
  const webhookSecret = process.env.SHOPIFY_WEBHOOK_SECRET;
  
  if (!webhookSecret) {
    console.warn('SHOPIFY_WEBHOOK_SECRET not configured, skipping verification');
    return next();
  }

  if (!verifyWebhookSignature(req.body, signature, webhookSecret)) {
    console.error('Invalid webhook signature');
    return res.status(401).json({ error: 'Unauthorized' });
  }

  next();
}
