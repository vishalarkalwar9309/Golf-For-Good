import Stripe from 'stripe';
import { VercelRequest, VercelResponse } from '@vercel/node';
import { createClient } from '@supabase/supabase-js';

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY as string, {
  apiVersion: '2023-10-16' as any,
});

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

  const buf = await buffer(req);
  const sig = req.headers['stripe-signature'] as string;
  const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;

  let event: Stripe.Event;

  try {
    if (!sig || !webhookSecret) return res.status(400).json({ error: 'Missing signature or webhook secret' });
    event = stripe.webhooks.constructEvent(buf, sig, webhookSecret);
  } catch (err: any) {
    console.error(`Webhook signature verification failed: ${err.message}`);
    return res.status(400).send(`Webhook Error: ${err.message}`);
  }

  try {
    switch (event.type) {
      case 'checkout.session.completed': {
        const session = event.data.object as Stripe.Checkout.Session;
        const userId = session.client_reference_id || session.metadata?.userId;
        if (!userId) break;

        const subscriptionId = session.subscription as string;
        const subscription = await stripe.subscriptions.retrieve(subscriptionId) as any;
        const planType = subscription.items.data[0].plan.interval === 'year' ? 'yearly' : 'monthly';
        
        await supabaseAdmin.from('subscriptions').upsert({
          user_id: userId,
          stripe_customer_id: session.customer as string,
          stripe_subscription_id: subscriptionId,
          status: 'active',
          plan_type: planType,
          amount: subscription.items.data[0].plan.amount! / 100,
          renewal_date: new Date(subscription.current_period_end * 1000).toISOString(),
          start_date: new Date(subscription.current_period_start * 1000).toISOString(),
        }, { onConflict: 'user_id' });

        // Synchronize profiles table
        await supabaseAdmin.from('profiles').update({
          subscription_status: 'active',
          subscription_tier: planType,
        }).eq('id', userId);
        break;
      }

      case 'customer.subscription.updated': {
        const subscription = event.data.object as any;
        const userId = subscription.metadata?.userId;
        
        let appStatus: 'active' | 'inactive' | 'cancelled' | 'lapsed' = 'inactive';
        if (subscription.status === 'active') appStatus = 'active';
        else if (subscription.status === 'past_due' || subscription.status === 'unpaid') appStatus = 'lapsed';
        else if (subscription.status === 'canceled') appStatus = 'cancelled';

        await supabaseAdmin.from('subscriptions').update({
          status: appStatus,
          renewal_date: new Date(subscription.current_period_end * 1000).toISOString(),
        }).eq('stripe_subscription_id', subscription.id);

        if (userId) {
          await supabaseAdmin.from('profiles').update({
            subscription_status: appStatus,
          }).eq('id', userId);
        } else {
          // Fallback lookup by stripe_subscription_id
          const { data: sub } = await supabaseAdmin.from('subscriptions')
            .select('user_id')
            .eq('stripe_subscription_id', subscription.id)
            .maybeSingle();
          if (sub?.user_id) {
            await supabaseAdmin.from('profiles').update({
              subscription_status: appStatus,
            }).eq('id', sub.user_id);
          }
        }
        break;
      }

      case 'customer.subscription.deleted': {
        const subscription = event.data.object as Stripe.Subscription;
        await supabaseAdmin.from('subscriptions').update({
          status: 'cancelled',
        }).eq('stripe_subscription_id', subscription.id);

        const { data: sub } = await supabaseAdmin.from('subscriptions')
          .select('user_id')
          .eq('stripe_subscription_id', subscription.id)
          .maybeSingle();
        if (sub?.user_id) {
          await supabaseAdmin.from('profiles').update({
            subscription_status: 'cancelled',
            subscription_tier: 'none'
          }).eq('id', sub.user_id);
        }
        break;
      }
    }

    return res.status(200).json({ received: true });
  } catch (err: any) {
    console.error('Webhook processing failed:', err);
    return res.status(500).json({ error: err.message });
  }
}
