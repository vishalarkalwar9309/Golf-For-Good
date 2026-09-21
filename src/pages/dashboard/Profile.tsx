import React, { useState } from 'react';
import { motion } from 'motion/react';
import { User, Mail, Shield, Loader2, CheckCircle2, AlertCircle, Save, Award } from 'lucide-react';
import { useAuth } from '../../components/auth/AuthProvider';
import { usePageTitle } from '../../hooks/usePageTitle';
import { supabase } from '../../lib/supabase';
import { cn } from '../../lib/utils';
import { AbstractGraphic } from '../../components/ui/AbstractGraphic';

const Profile: React.FC = () => {
  const { profile, refreshProfile } = useAuth();
  usePageTitle('Account Settings');
  const [fullName, setFullName] = useState(profile?.full_name || '');
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  const handleUpdateProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!profile) return;
    
    setLoading(true);
    setMessage(null);

    try {
      const { error } = await supabase
        .from('profiles')
        .update({ full_name: fullName.trim() })
        .eq('id', profile.id);

      if (error) throw error;
      
      await refreshProfile();
      setMessage({ type: 'success', text: 'Profile updated successfully.' });
    } catch (err: any) {
      console.error(err);
      setMessage({ type: 'error', text: err.message || 'Failed to update profile.' });
    } finally {
      setLoading(false);
    }
  };

  if (!profile) return null;

  const initials = profile.full_name
    ? profile.full_name
        .split(' ')
        .map((n) => n[0])
        .join('')
        .toUpperCase()
    : 'U';

  const planBadgeText = profile.role === 'admin'
    ? 'System Administrator'
    : profile.subscription_tier === 'yearly'
    ? 'Annual Member'
    : profile.subscription_tier === 'monthly'
    ? 'Monthly Member'
    : 'Community Member';

  return (
    <div className="relative min-h-screen bg-background pb-20">
      <AbstractGraphic variant="ambient-glow" className="opacity-30" />

      <div className="max-w-4xl mx-auto px-6 py-10 relative z-10 space-y-10">
        {/* Header */}
        <div className="flex items-center gap-5 pb-6 border-b border-white/10">
          <div className="w-14 h-14 bg-primary/10 rounded-2xl flex items-center justify-center text-primary shrink-0">
            <User className="w-7 h-7" />
          </div>
          <div>
            <div className="flex items-center gap-3">
              <h1 className="text-3xl font-display font-bold tracking-tight text-foreground">
                Account & Profile
              </h1>
              <span className="px-3 py-1 rounded-full bg-primary/10 border border-primary/20 text-primary text-xs font-semibold">
                {planBadgeText}
              </span>
            </div>
            <p className="text-muted-foreground text-xs sm:text-sm mt-1">
              Manage your personal information and membership preferences.
            </p>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Avatar & Summary Card */}
          <div className="space-y-6">
            <div className="bg-surface-container border border-white/10 rounded-3xl p-6 text-center shadow-xl">
              <div className="w-20 h-20 mx-auto rounded-2xl bg-surface-container-high border border-white/10 flex items-center justify-center mb-4 font-display font-black text-2xl text-primary overflow-hidden">
                {profile.avatar_url ? (
                  <img src={profile.avatar_url} alt={profile.full_name} className="w-full h-full object-cover" />
                ) : (
                  initials
                )}
              </div>

              <h3 className="font-display font-bold text-lg text-foreground mb-0.5">
                {profile.full_name}
              </h3>
              <p className="text-xs text-muted-foreground mb-4 font-sans">
                {profile.email}
              </p>

              <div className="pt-4 border-t border-white/10 flex items-center justify-between text-xs">
                <span className="text-muted-foreground">Account Standing</span>
                <span className={cn(
                  "font-semibold capitalize",
                  profile.subscription_status === 'active' ? "text-primary" : "text-destructive"
                )}>
                  {profile.subscription_status || 'Inactive'}
                </span>
              </div>
            </div>

            <div className="bg-surface-container border border-white/10 rounded-2xl p-5 space-y-2">
              <div className="flex items-center gap-2 text-xs font-semibold text-foreground">
                <Shield className="w-4 h-4 text-primary" />
                <span>Security & Privacy</span>
              </div>
              <p className="text-[11px] text-muted-foreground leading-relaxed">
                Your data is securely authenticated with Supabase. Email addresses and score records are strictly protected.
              </p>
            </div>
          </div>

          {/* Form Area */}
          <div className="lg:col-span-2">
            <div className="bg-surface-container border border-white/10 rounded-3xl p-6 sm:p-8 shadow-xl">
              <form onSubmit={handleUpdateProfile} className="space-y-6">
                {message && (
                  <div className={cn(
                    "p-3.5 rounded-xl flex items-center gap-3 text-xs font-medium",
                    message.type === 'success' 
                      ? "bg-primary/10 border border-primary/20 text-primary" 
                      : "bg-destructive/10 border border-destructive/20 text-destructive"
                  )}>
                    {message.type === 'success' ? <CheckCircle2 className="w-4 h-4 shrink-0" /> : <AlertCircle className="w-4 h-4 shrink-0" />}
                    <span>{message.text}</span>
                  </div>
                )}

                <div>
                  <label className="text-xs font-medium text-muted-foreground block mb-1.5">
                    Full Name
                  </label>
                  <div className="relative">
                    <User className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                    <input 
                      type="text" 
                      value={fullName}
                      onChange={(e) => setFullName(e.target.value)}
                      placeholder="e.g. Jane Doe"
                      required
                      className="w-full bg-surface-container-high border border-white/10 rounded-xl py-2.5 pl-10 pr-4 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:border-primary transition-colors"
                    />
                  </div>
                </div>

                <div>
                  <label className="text-xs font-medium text-muted-foreground block mb-1.5">
                    Email Address
                  </label>
                  <div className="relative">
                    <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                    <input 
                      type="email" 
                      value={profile.email}
                      disabled
                      className="w-full bg-surface-container-high/50 border border-white/5 rounded-xl py-2.5 pl-10 pr-4 text-sm text-muted-foreground cursor-not-allowed"
                    />
                  </div>
                  <span className="text-[11px] text-muted-foreground mt-1 block">
                    Account email is locked to your auth provider.
                  </span>
                </div>

                <div className="pt-4 border-t border-white/10 flex justify-end">
                  <button 
                    type="submit"
                    disabled={loading}
                    className="px-6 py-2.5 rounded-xl bg-primary text-primary-foreground font-semibold text-xs hover:opacity-90 transition-opacity shadow-md shadow-primary/10 disabled:opacity-50 flex items-center gap-2"
                  >
                    {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
                    <span>Save Profile</span>
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Profile;
