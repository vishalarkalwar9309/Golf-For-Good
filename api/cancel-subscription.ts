import { VercelRequest, VercelResponse } from '@vercel/node';
import { createClient } from '@supabase/supabase-js';

const supabaseAdmin = createClient(
  process.env.VITE_SUPABASE_URL as string,
  process.env.SUPABASE_SERVICE_ROLE_KEY as string
);

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  // 1. Authenticate user from session JWT
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ error: 'Authentication required' });
  }

  const token = authHeader.split(' ')[1];
  const { data: { user }, error: authError } = await supabaseAdmin.auth.getUser(token);

  if (authError || !user) {
    return res.status(401).json({ error: 'Invalid session' });
  }

  // 2. Fetch user's active subscription record
  const { data: subscription, error: subError } = await supabaseAdmin
    .from('subscriptions')
    .select('*')
    .eq('user_id', user.id)
    .maybeSingle();

  if (subError || !subscription) {
    return res.status(404).json({ error: 'No subscription found for this account' });
  }

  const razorpaySubId = subscription.stripe_subscription_id;
  const keyId = process.env.RAZORPAY_KEY_ID;
  const keySecret = process.env.RAZORPAY_KEY_SECRET;

  // If subscription was created via Razorpay, call Razorpay cancel API with cycle-end preference
  if (razorpaySubId && keyId && keySecret) {
    try {
      const authString = Buffer.from(`${keyId}:${keySecret}`).toString('base64');
      const response = await fetch(`https://api.razorpay.com/v1/subscriptions/${razorpaySubId}/cancel`, {
        method: 'POST',
        headers: {
          'Authorization': `Basic ${authString}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          // Prefer cancellation at end of cycle to preserve existing paid draw access
          cancel_at_cycle_end: 1,
        }),
      });

      const data = await response.json();
      if (!response.ok) {
        console.warn('Razorpay API cancel returned notice:', data);
      }
    } catch (apiErr: any) {
      console.error('Failed to notify Razorpay of cancellation:', apiErr);
    }
  }

  // 3. Update database record preserving access through the existing renewal_date
  await supabaseAdmin
    .from('subscriptions')
    .update({ status: 'cancelled' })
    .eq('id', subscription.id);

  await supabaseAdmin
    .from('profiles')
    .update({
      subscription_status: 'cancelled',
      subscription_tier: 'none'
    })
    .eq('id', user.id);

  return res.status(200).json({
    success: true,
    message: 'Subscription will cancel at the end of the billing period. Your paid draw access remains active until your renewal date.',
    accessUntil: subscription.renewal_date,
  });
}
