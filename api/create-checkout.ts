import { VercelRequest, VercelResponse } from '@vercel/node';
import { createClient } from '@supabase/supabase-js';

const supabaseAdmin = createClient(
  process.env.VITE_SUPABASE_URL as string,
  process.env.SUPABASE_SERVICE_ROLE_KEY as string
);

// Fixed demo pricing per specification
const PLAN_CONFIG = {
  monthly: {
    planId: process.env.RAZORPAY_PLAN_MONTHLY || 'plan_Tf6PeME6ndUhKv',
    amount: 499,
    totalCount: 60,
    name: 'Monthly Membership (₹499/month)',
  },
  yearly: {
    planId: process.env.RAZORPAY_PLAN_YEARLY || 'plan_Tf6Qq7eQCd7tyO',
    amount: 4999,
    totalCount: 5,
    name: 'Annual Membership (₹4,999/year)',
  },
} as const;

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  // 1. Authenticate user server-side from Supabase JWT (Zero-trust)
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ error: 'Authentication required' });
  }

  const token = authHeader.split(' ')[1];
  const { data: { user }, error: authError } = await supabaseAdmin.auth.getUser(token);

  if (authError || !user) {
    return res.status(401).json({ error: 'Invalid or expired session' });
  }

  const planType: 'monthly' | 'yearly' = req.body?.planType === 'yearly' ? 'yearly' : 'monthly';
  const plan = PLAN_CONFIG[planType];

  const keyId = process.env.RAZORPAY_KEY_ID;
  const keySecret = process.env.RAZORPAY_KEY_SECRET;

  if (!keyId || !keySecret) {
    return res.status(500).json({
      error: 'Razorpay credentials not configured. Please set RAZORPAY_KEY_ID and RAZORPAY_KEY_SECRET.',
    });
  }

  try {
    const authString = Buffer.from(`${keyId}:${keySecret}`).toString('base64');
    const response = await fetch('https://api.razorpay.com/v1/subscriptions', {
      method: 'POST',
      headers: {
        'Authorization': `Basic ${authString}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        plan_id: plan.planId,
        total_count: plan.totalCount,
        quantity: 1,
        customer_notify: 1,
        notes: {
          userId: user.id,
          userEmail: user.email || '',
          planType,
        },
      }),
    });

    const data = await response.json();

    if (!response.ok) {
      console.error('Razorpay API error:', data);
      return res.status(response.status).json({
        error: data.error?.description || 'Failed to initialize subscription with payment provider',
      });
    }

    return res.status(200).json({
      subscriptionId: data.id,
      keyId,
      planType,
      amount: plan.amount,
      currency: 'INR',
      name: 'Golf For Good',
      description: plan.name,
      userEmail: user.email || '',
      userName: (user.user_metadata as any)?.full_name || '',
    });
  } catch (err: any) {
    console.error('Checkout initialization error:', err);
    return res.status(500).json({ error: err.message || 'Internal server error' });
  }
}
