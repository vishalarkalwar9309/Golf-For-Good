import { VercelRequest, VercelResponse } from '@vercel/node';

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  // With Razorpay Test Mode, customer management is handled in-app via the Membership dashboard
  return res.status(200).json({
    url: `${process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000'}/dashboard/subscription`,
    message: 'Membership details and cancellation are managed directly in your Golf For Good dashboard.',
  });
}
