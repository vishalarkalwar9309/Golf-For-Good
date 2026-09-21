import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { useAuth } from '../components/auth/AuthProvider';
import type { UserSubscription } from '../types';

export const useSubscription = () => {
  const { user, refreshProfile } = useAuth();
  const [subscription, setSubscription] = useState<UserSubscription | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchSubscription = async () => {
    if (!user) return;
    setLoading(true);
    try {
      const { data, error: subError } = await supabase
        .from('subscriptions')
        .select('*')
        .eq('user_id', user.id)
        .maybeSingle();

      if (subError) throw subError;
      setSubscription(data);
    } catch (err: any) {
      console.error('Error fetching subscription:', err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSubscription();
  }, [user]);

  const createCheckoutSession = async (priceId: string) => {
    if (!user) return;
    try {
      const response = await fetch('/api/create-checkout', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ priceId, userId: user.id, email: user.email }),
      });
      const { url, error: apiError } = await response.json();
      if (apiError) throw new Error(apiError);
      if (url) window.location.href = url;
    } catch (err: any) {
      console.error('Checkout error:', err);
      throw err;
    }
  };

  const createPortalSession = async () => {
    if (!user || !subscription?.stripe_customer_id) return;
    try {
      const response = await fetch('/api/create-portal', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ customerId: subscription.stripe_customer_id }),
      });
      const { url, error: apiError } = await response.json();
      if (apiError) throw new Error(apiError);
      if (url) window.location.href = url;
    } catch (err: any) {
      console.error('Portal error:', err);
      throw err;
    }
  };

  const updateCharityDetails = async (charityId: string, percentage: number) => {
    if (!user || !subscription) return;
    try {
      const { error: updateError } = await supabase
        .from('subscriptions')
        .update({ charity_id: charityId, charity_percentage: percentage })
        .eq('id', subscription.id);

      if (updateError) throw updateError;
      await fetchSubscription();
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

      await refreshProfile();
      await fetchSubscription();
    } catch (err: any) {
      console.error('Membership activation error:', err);
      throw err;
    }
  };

  const cancelMembership = async () => {
    if (!user || !subscription) return;
    try {
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

      await refreshProfile();
      await fetchSubscription();
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
