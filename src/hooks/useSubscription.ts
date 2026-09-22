import { useState, useEffect, useCallback } from 'react';
import { supabase } from '../lib/supabase';
import { useAuth } from '../components/auth/AuthProvider';
import type { UserSubscription } from '../types';
import { 
  fetchUserSubscription, 
  getCachedUserSubscription, 
  invalidateSubscription 
} from '../services/dataService';

export const useSubscription = () => {
  const { user, refreshProfile } = useAuth();
  
  // Instant cache-first initialization: 0ms perceived load if previously fetched
  const [subscription, setSubscription] = useState<UserSubscription | null>(() => 
    user ? getCachedUserSubscription(user.id) : null
  );
  const [loading, setLoading] = useState<boolean>(() => 
    user ? !getCachedUserSubscription(user.id) : false
  );
  const [error, setError] = useState<string | null>(null);

  const fetchSubscription = useCallback(async (force = false) => {
    if (!user) {
      setSubscription(null);
      setLoading(false);
      return;
    }

    // Only set loading true if no cached data is present to prevent layout shift
    if (!getCachedUserSubscription(user.id) || force) {
      setLoading(true);
    }

    try {
      const data = await fetchUserSubscription(user.id, force);
      setSubscription(data);
      setError(null);
    } catch (err: any) {
      console.error('Error fetching subscription:', err);
      setError(err.message || 'Failed to load subscription status.');
    } finally {
      setLoading(false);
    }
  }, [user]);

  useEffect(() => {
    fetchSubscription();
  }, [fetchSubscription]);

  const createCheckoutSession = async (planType: 'monthly' | 'yearly' = 'monthly'): Promise<void> => {
    if (!user) {
      throw new Error('Please sign in to activate your membership.');
    }

    const { data: { session } } = await supabase.auth.getSession();
    const token = session?.access_token;

    // Strict 8-second frontend timeout for the API call
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 8000);

    let checkoutData: any = {};
    try {
      const response = await fetch('/api/create-checkout', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(token ? { 'Authorization': `Bearer ${token}` } : {}),
        },
        body: JSON.stringify({ planType }),
        signal: controller.signal,
      });

      const responseText = await response.text();
      try {
        checkoutData = JSON.parse(responseText);
      } catch {
        checkoutData = { error: responseText || 'Invalid server response' };
      }

      if (!response.ok || checkoutData.error) {
        throw new Error(checkoutData.error || `Checkout failed (${response.status})`);
      }
    } catch (fetchErr: any) {
      if (fetchErr.name === 'AbortError') {
        throw new Error('Activation is taking longer than expected');
      }
      throw fetchErr;
    } finally {
      clearTimeout(timeoutId);
    }

    const { subscriptionId, keyId, name, description, userEmail, userName } = checkoutData;

    if (!keyId || !subscriptionId) {
      throw new Error(
        'Unable to activate membership: Razorpay test configuration is missing on the server.'
      );
    }

    if (typeof window === 'undefined' || !(window as any).Razorpay) {
      throw new Error(
        'Unable to activate membership: Razorpay checkout script failed to load. Please disable ad-blockers and try again.'
      );
    }

    const rzp = new (window as any).Razorpay({
      key: keyId,
      subscription_id: subscriptionId,
      name: name || 'Golf For Good',
      description: description || 'Membership Subscription',
      prefill: {
        name: userName || '',
        email: userEmail || user.email || '',
      },
      theme: {
        color: '#10b981',
      },
      handler: async function () {
        try {
          invalidateSubscription(user.id);
          await fetchSubscription(true);
          await refreshProfile();
        } catch (refreshErr) {
          console.warn('Subscription post-payment refresh warning:', refreshErr);
        }
        window.location.href = '/dashboard/subscription?success=true';
      },
    });

    rzp.on('payment.failed', function (resp: any) {
      console.error('Payment failed:', resp?.error?.description);
    });

    try {
      rzp.open();
    } catch (openErr: any) {
      throw new Error(openErr?.message || 'Failed to open Razorpay checkout modal.');
    }
  };

  const createPortalSession = async () => {
    // In Razorpay Test Mode, subscription management is in-app
    window.location.href = '/dashboard/subscription';
  };

  const updateCharityDetails = async (charityId: string, percentage: number) => {
    if (!user || !subscription) return;
    try {
      const { error: updateError } = await supabase
        .from('subscriptions')
        .update({ charity_id: charityId, charity_percentage: percentage })
        .eq('id', subscription.id);

      if (updateError) throw updateError;
      invalidateSubscription(user.id);
      await fetchSubscription(true);
    } catch (err: any) {
      console.error('Update charity error:', err);
      throw err;
    }
  };

  const activateMembership = async (planType: 'monthly' | 'yearly', amount: number) => {
    if (!user) return;
    try {
      // First check if it exists
      const { data: existing } = await supabase
        .from('subscriptions')
        .select('id')
        .eq('user_id', user.id)
        .maybeSingle();

      const renewalDays = planType === 'monthly' ? 30 : 365;
      const subData = {
        user_id: user.id,
        status: 'active',
        plan_type: planType,
        amount: amount,
        charity_percentage: 10,
        renewal_date: new Date(Date.now() + renewalDays * 24 * 60 * 60 * 1000).toISOString(),
        start_date: new Date().toISOString(),
      };

      if (existing) {
        const { error: upError } = await supabase
          .from('subscriptions')
          .update(subData)
          .eq('id', existing.id);
        if (upError) throw upError;
      } else {
        const { error: inError } = await supabase
          .from('subscriptions')
          .insert([subData]);
        if (inError) throw inError;
      }

      // Also update the profile for quick access status
      const { error: profileError } = await supabase
        .from('profiles')
        .update({
          subscription_status: 'active',
          subscription_tier: planType
        })
        .eq('id', user.id);

      if (profileError) throw profileError;

      invalidateSubscription(user.id);
      await refreshProfile();
      await fetchSubscription(true);
    } catch (err: any) {
      console.error('Membership activation error:', err);
      throw err;
    }
  };

  const cancelMembership = async () => {
    if (!user || !subscription) return;
    try {
      const { data: { session } } = await supabase.auth.getSession();
      const token = session?.access_token;

      // Attempt server-side cancellation via Razorpay API (with cancel_at_cycle_end preference)
      const res = await fetch('/api/cancel-subscription', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(token ? { 'Authorization': `Bearer ${token}` } : {}),
        },
      });

      if (!res.ok) {
        // Fallback direct update if backend endpoint is unavailable
        const { error: subError } = await supabase
          .from('subscriptions')
          .update({ status: 'cancelled' })
          .eq('id', subscription.id);
        if (subError) throw subError;

        const { error: profileError } = await supabase
          .from('profiles')
          .update({ subscription_status: 'cancelled', subscription_tier: 'none' })
          .eq('id', user.id);
        if (profileError) throw profileError;
      }

      invalidateSubscription(user.id);
      await refreshProfile();
      await fetchSubscription(true);
    } catch (err: any) {
      console.error('Cancellation error:', err);
      throw err;
    }
  };

  return {
    subscription,
    loading,
    error,
    refresh: fetchSubscription,
    createCheckoutSession,
    createPortalSession,
    updateCharityDetails,
    activateMembership,
    cancelMembership,
    isActive: subscription?.status === 'active',
    isPremium: subscription?.status === 'active' && subscription?.plan_type !== 'free',
  };
};
