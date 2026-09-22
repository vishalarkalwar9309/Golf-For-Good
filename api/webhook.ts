import crypto from 'crypto';
import { VercelRequest, VercelResponse } from '@vercel/node';
import { createClient } from '@supabase/supabase-js';

const supabaseAdmin = createClient(
  process.env.VITE_SUPABASE_URL as string,
  process.env.SUPABASE_SERVICE_ROLE_KEY as string
);

export const config = {
  api: {
    bodyParser: false,
  },
};

const buffer = (req: any) =>
  new Promise<Buffer>((resolve, reject) => {
    const chunks: any[] = [];
    req.on('data', (chunk: any) => chunks.push(chunk));
    req.on('end', () => resolve(Buffer.concat(chunks)));
    req.on('error', reject);
  });

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const rawBodyBuffer = await buffer(req);
  const rawBody = rawBodyBuffer.toString('utf8');
  const signature = req.headers['x-razorpay-signature'] as string;
  const webhookSecret = process.env.RAZORPAY_WEBHOOK_SECRET;

  if (!signature || !webhookSecret) {
    return res.status(400).json({ error: 'Missing signature or webhook secret' });
  }

  // 1. Verify Razorpay webhook cryptographic signature
  const expectedSignature = crypto
    .createHmac('sha256', webhookSecret)
    .update(rawBody)
    .digest('hex');

  if (expectedSignature !== signature) {
    console.error('Invalid Razorpay webhook signature');
    return res.status(400).json({ error: 'Invalid webhook signature' });
  }

  let event: any;
  try {
    event = JSON.parse(rawBody);
  } catch (err) {
    return res.status(400).json({ error: 'Malformed payload' });
  }

  const eventType = event.event;
  const subEntity = event.payload?.subscription?.entity;
  const paymentEntity = event.payload?.payment?.entity;

  if (!subEntity) {
    // Acknowledge non-subscription events gracefully
    return res.status(200).json({ received: true, ignored: true });
  }

  const subscriptionId = subEntity.id;
  const notes = subEntity.notes || {};
  let userId = notes.userId;

  // If notes did not contain userId, fallback to looking up existing subscription record
  if (!userId) {
    const { data: existingSub } = await supabaseAdmin
      .from('subscriptions')
      .select('user_id')
      .eq('stripe_subscription_id', subscriptionId)
      .maybeSingle();

    if (existingSub?.user_id) {
      userId = existingSub.user_id;
    }
  }

  if (!userId) {
    console.warn(`Webhook received for subscription ${subscriptionId} without associated user.`);
    return res.status(200).json({ received: true, unmatched: true });
  }

  const yearlyPlanId = process.env.RAZORPAY_PLAN_YEARLY || 'plan_Tf6Qq7eQCd7tyO';
  const isYearly = subEntity.plan_id === yearlyPlanId || notes.planType === 'yearly';
  const planType: 'monthly' | 'yearly' = isYearly ? 'yearly' : 'monthly';
  const planAmount = isYearly ? 4999 : 499;

  const currentStart = subEntity.current_start
    ? new Date(subEntity.current_start * 1000).toISOString()
    : new Date().toISOString();

  const renewalDate = subEntity.current_end
    ? new Date(subEntity.current_end * 1000).toISOString()
    : new Date(Date.now() + (isYearly ? 365 : 30) * 24 * 60 * 60 * 1000).toISOString();

  try {
    switch (eventType) {
      case 'subscription.activated': {
        // Initial payment success & mandate activated
        await supabaseAdmin.from('subscriptions').upsert(
          {
            user_id: userId,
            stripe_subscription_id: subscriptionId,
            status: 'active',
            plan_type: planType,
            amount: planAmount,
            start_date: currentStart,
            renewal_date: renewalDate,
          },
          { onConflict: 'user_id' }
        );

        await supabaseAdmin.from('profiles').update({
          subscription_status: 'active',
          subscription_tier: planType,
        }).eq('id', userId);
        break;
      }

      case 'subscription.charged': {
        // Recurring renewal cycle charged
        await supabaseAdmin.from('subscriptions').update({
          status: 'active',
          renewal_date: renewalDate,
          amount: planAmount,
        }).eq('stripe_subscription_id', subscriptionId);

        await supabaseAdmin.from('profiles').update({
          subscription_status: 'active',
          subscription_tier: planType,
        }).eq('id', userId);
        break;
      }

      case 'subscription.halted':
      case 'subscription.pending': {
        // Payment failed / mandate halted -> lapsed
        await supabaseAdmin.from('subscriptions').update({
          status: 'lapsed',
        }).eq('stripe_subscription_id', subscriptionId);

        await supabaseAdmin.from('profiles').update({
          subscription_status: 'lapsed',
        }).eq('id', userId);
        break;
      }

      case 'subscription.cancelled':
      case 'subscription.completed':
      case 'subscription.expired': {
        // Termination
        await supabaseAdmin.from('subscriptions').update({
          status: 'cancelled',
        }).eq('stripe_subscription_id', subscriptionId);

        await supabaseAdmin.from('profiles').update({
          subscription_status: 'cancelled',
          subscription_tier: 'none',
        }).eq('id', userId);
        break;
      }

      default:
        console.log(`Unhandled Razorpay event: ${eventType}`);
        break;
    }

    return res.status(200).json({ received: true });
  } catch (err: any) {
    console.error('Razorpay webhook processing error:', err);
    return res.status(500).json({ error: err.message || 'Database sync failed' });
  }
}
