import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  X, Heart, CreditCard, ShieldCheck, 
  CheckCircle2, Loader2, AlertCircle, 
  ArrowRight 
} from 'lucide-react';
import { supabase } from '../../lib/supabase';
import { useAuth } from '../auth/AuthProvider';
import { cn, formatCurrency } from '../../lib/utils';
import type { Charity } from '../../types';

interface DonationModalProps {
  isOpen: boolean;
  onClose: () => void;
  charity: Charity;
  onSuccess?: () => void;
}

const DonationModal: React.FC<DonationModalProps> = ({ isOpen, onClose, charity, onSuccess }) => {
  const { user, refreshProfile } = useAuth();
  const [amount, setAmount] = useState<string>('25');
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const presets = ['10', '25', '50', '100'];

  const handleDonate = async () => {
    if (!user) {
      setError('Please sign in to make a direct donation.');
      return;
    }

    const numAmount = parseFloat(amount);
    if (isNaN(numAmount) || numAmount <= 0) {
      setError('Please enter a valid donation amount.');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const { error: donationError } = await supabase
        .from('donations')
        .insert({
          user_id: user.id,
          charity_id: charity.id,
          amount: numAmount,
          donation_type: 'independent'
        });

      if (donationError) throw donationError;

      // Refresh profile to reflect new donation totals
      await refreshProfile();
      
      setSuccess(true);
      if (onSuccess) onSuccess();
    } catch (err: any) {
      console.error('Donation error:', err);
      setError(err.message || 'Failed to record your donation. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-6">
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="absolute inset-0 bg-background/80 backdrop-blur-sm"
          />
          
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 15 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 15 }}
            className="relative w-full max-w-lg bg-surface-container border border-white/10 rounded-3xl overflow-hidden shadow-2xl"
          >
            {/* Header */}
            <div className="p-6 sm:p-8 border-b border-white/10 flex items-center justify-between bg-surface-container-high/50">
              <div className="flex items-center gap-3.5">
                <div className="w-10 h-10 bg-primary/10 rounded-xl flex items-center justify-center text-primary">
                  <Heart className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-xl font-display font-bold text-foreground">Direct Donation</h3>
                  <p className="text-xs text-muted-foreground">Independent Charitable Giving</p>
                </div>
              </div>
              <button 
                onClick={onClose}
                className="p-2 hover:bg-white/5 rounded-full transition-colors text-muted-foreground hover:text-foreground"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-6 sm:p-8">
              {!success ? (
                <div className="space-y-6">
                  {/* Charity Preview */}
                  <div className="flex items-center gap-3.5 p-4 bg-surface-container-high rounded-2xl border border-white/10">
                    <div className="w-11 h-11 rounded-xl overflow-hidden flex-shrink-0 bg-surface-container flex items-center justify-center font-display font-bold text-primary">
                      {charity.logo_url ? (
                        <img src={charity.logo_url} alt="" className="w-full h-full object-contain p-1" />
                      ) : (
                        charity.name.charAt(0)
                      )}
                    </div>
                    <div>
                      <p className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">Beneficiary</p>
                      <p className="font-display font-bold text-sm text-foreground">{charity.name}</p>
                    </div>
                  </div>

                  {/* Amount Selection */}
                  <div className="space-y-3">
                    <label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                      Select Amount
                    </label>
                    <div className="grid grid-cols-4 gap-2.5">
                      {presets.map((p) => (
                        <button
                          key={p}
                          type="button"
                          onClick={() => setAmount(p)}
                          className={cn(
                            "py-2.5 rounded-xl text-xs font-semibold transition-all border",
                            amount === p 
                              ? "bg-primary text-primary-foreground border-primary shadow-sm" 
                              : "bg-surface-container-high text-foreground border-white/10 hover:border-white/20"
                          )}
                        >
                          ${p}
                        </button>
                      ))}
                    </div>
                    <div className="relative">
                      <span className="absolute left-4 top-1/2 -translate-y-1/2 text-muted-foreground font-semibold text-sm">$</span>
                      <input 
                        type="number"
                        placeholder="Custom amount"
                        value={amount}
                        onChange={(e) => setAmount(e.target.value)}
                        className="w-full pl-8 pr-4 py-3 bg-surface-container-high border border-white/10 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent transition-all text-sm text-foreground"
                      />
                    </div>
                  </div>

                  {/* Trust Badge */}
                  <div className="p-4 bg-primary/10 border border-primary/20 rounded-xl flex items-start gap-3">
                    <ShieldCheck className="w-5 h-5 text-primary flex-shrink-0 mt-0.5" />
                    <p className="text-xs text-muted-foreground leading-relaxed">
                      <strong className="text-foreground font-semibold">100% Direct Pass-Through:</strong> All contributions go directly to {charity.name}, completely independent of monthly draw prize pools.
                    </p>
                  </div>

                  {error && (
                    <div className="p-4 bg-destructive/10 border border-destructive/20 rounded-xl flex items-start gap-3 text-destructive text-xs">
                      <AlertCircle className="w-4 h-4 flex-shrink-0 mt-0.5" />
                      <p>{error}</p>
                    </div>
                  )}

                  <button
                    onClick={handleDonate}
                    disabled={loading || !amount || parseFloat(amount) <= 0}
                    className="w-full py-4 rounded-xl bg-primary text-primary-foreground font-semibold text-xs hover:opacity-90 active:scale-[0.99] disabled:opacity-50 transition-all flex items-center justify-center gap-2 shadow-lg shadow-primary/20"
                  >
                    {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <><CreditCard className="w-4 h-4" /> Confirm Donation ({formatCurrency(parseFloat(amount) || 0)})</>}
                  </button>
                </div>
              ) : (
                <div className="py-10 flex flex-col items-center text-center">
                  <div className="w-16 h-16 bg-primary/20 text-primary rounded-full flex items-center justify-center mb-6">
                    <CheckCircle2 className="w-8 h-8 text-primary" />
                  </div>
                  <h3 className="text-2xl font-display font-bold text-foreground mb-2">Donation Received</h3>
                  <p className="text-muted-foreground text-xs leading-relaxed max-w-sm mb-8">
                    Your direct donation of <strong className="text-foreground">{formatCurrency(parseFloat(amount) || 0)}</strong> to <strong className="text-foreground">{charity.name}</strong> has been confirmed. Thank you for your support!
                  </p>
                  <button
                    onClick={onClose}
                    className="px-6 py-3 rounded-xl bg-surface-container-high border border-white/10 text-foreground font-semibold text-xs hover:bg-surface-container-highest transition-colors flex items-center gap-2"
                  >
                    <span>Return to Dashboard</span>
                    <ArrowRight className="w-4 h-4" />
                  </button>
                </div>
              )}
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
};

export default DonationModal;
