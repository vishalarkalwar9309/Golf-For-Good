import React from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Check, Loader2, ShieldCheck, CreditCard, ArrowRight, X, Star, Zap } from 'lucide-react';
import { cn, formatCurrency } from '../../lib/utils';
import type { Charity } from '../../types';

interface CheckoutConfirmationProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => Promise<void>;
  planType: 'monthly' | 'yearly';
  amount: number;
  selectedCharity?: Charity;
}

const CheckoutConfirmation: React.FC<CheckoutConfirmationProps> = ({
  isOpen,
  onClose,
  onConfirm,
  planType,
  amount,
  selectedCharity
}) => {
  const [status, setStatus] = React.useState<'idle' | 'processing' | 'success'>('idle');
  const [error, setError] = React.useState<string | null>(null);

  const handleConfirm = async () => {
    setStatus('processing');
    setError(null);
    try {
      // Add a small artificial delay for "premium processing" feel
      await new Promise(resolve => setTimeout(resolve, 2000));
      await onConfirm();
      setStatus('success');
    } catch (err: any) {
      setError(err.message || 'Activation failed. Please try again.');
      setStatus('idle');
    }
  };

  const planName = planType === 'yearly' ? 'Annual Membership' : 'Monthly Membership';

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-6">
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={status === 'processing' ? undefined : onClose}
            className="absolute inset-0 bg-background/80 backdrop-blur-xl"
          />

          {/* Modal */}
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 15 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 15 }}
            className="relative w-full max-w-lg bg-surface-container border border-white/10 rounded-3xl shadow-2xl overflow-hidden"
          >
            {status === 'success' ? (
              <div className="p-10 text-center">
                <div className="w-16 h-16 bg-primary/20 text-primary rounded-full flex items-center justify-center mx-auto mb-6">
                  <motion.div
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    transition={{ type: 'spring', damping: 12, stiffness: 200, delay: 0.2 }}
                  >
                    <Check className="w-8 h-8 text-primary" />
                  </motion.div>
                </div>
                <h2 className="text-3xl font-display font-bold text-foreground tracking-tight mb-3">Membership Active</h2>
                <p className="text-muted-foreground text-sm mb-8 leading-relaxed">
                  Your membership is confirmed. Your participation in the upcoming monthly draw and charitable contribution is officially activated.
                </p>
                <button
                  onClick={onClose}
                  className="w-full py-4 rounded-xl bg-primary text-primary-foreground font-semibold text-sm hover:opacity-90 transition-all shadow-lg shadow-primary/20"
                >
                  Go to Dashboard
                </button>
              </div>
            ) : (
              <>
                {/* Close Button */}
                <button
                  onClick={onClose}
                  disabled={status === 'processing'}
                  className="absolute top-6 right-6 text-muted-foreground hover:text-foreground transition-colors disabled:opacity-0"
                >
                  <X className="w-5 h-5" />
                </button>

                <div className="p-8 sm:p-10">
                  <div className="flex items-center gap-3.5 mb-8">
                    <div className="w-11 h-11 bg-primary/10 rounded-2xl flex items-center justify-center text-primary">
                      <ShieldCheck className="w-6 h-6" />
                    </div>
                    <div>
                      <h2 className="text-2xl font-display font-bold text-foreground">Confirm Membership</h2>
                      <p className="text-xs text-muted-foreground">Official Plan Activation</p>
                    </div>
                  </div>

                  {/* Plan Summary */}
                  <div className="bg-surface-container-high rounded-2xl p-6 mb-6 border border-white/10">
                    <div className="flex justify-between items-start mb-6">
                      <div>
                        <span className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground block mb-1">Selected Plan</span>
                        <h3 className="text-xl font-display font-bold text-foreground flex items-center gap-2">
                          {planType === 'yearly' ? <Star className="w-5 h-5 text-secondary" /> : <Zap className="w-5 h-5 text-primary" />}
                          {planName}
                        </h3>
                      </div>
                      <div className="text-right">
                        <span className="text-xl font-display font-bold text-foreground">
                          {amount > 0 ? formatCurrency(amount) : 'Standard Plan Rate'}
                        </span>
                        <span className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground block mt-0.5">
                          / {planType === 'monthly' ? 'Month' : 'Year'}
                        </span>
                      </div>
                    </div>

                    <div className="space-y-3 pt-5 border-t border-white/10 text-xs">
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">Direct Charity Impact</span>
                        <span className="text-foreground font-semibold">100% Direct Pass-Through</span>
                      </div>
                      <div className="flex justify-between text-primary font-medium">
                        <span>Draw Eligibility</span>
                        <span>Included</span>
                      </div>
                    </div>
                  </div>

                  {selectedCharity && (
                    <div className="flex items-center gap-3.5 px-4 py-3 bg-surface-container-high rounded-xl border border-white/10 mb-8">
                      <div className="w-9 h-9 rounded-lg overflow-hidden flex-shrink-0 bg-surface-container flex items-center justify-center font-display font-bold text-primary">
                        {selectedCharity.logo_url ? (
                          <img src={selectedCharity.logo_url} alt={selectedCharity.name} className="w-full h-full object-contain p-1" />
                        ) : (
                          selectedCharity.name.charAt(0)
                        )}
                      </div>
                      <div className="min-w-0">
                        <span className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground block">Supporting</span>
                        <p className="text-xs font-bold truncate text-foreground">{selectedCharity.name}</p>
                      </div>
                    </div>
                  )}

                  {error && (
                    <div className="p-4 rounded-xl bg-destructive/10 border border-destructive/20 text-destructive text-xs text-center mb-6">
                      {error}
                    </div>
                  )}

                  <button
                    onClick={handleConfirm}
                    disabled={status === 'processing'}
                    className="w-full py-4 rounded-xl bg-primary text-primary-foreground font-semibold text-sm transition-all hover:opacity-90 active:scale-[0.99] shadow-lg shadow-primary/20 flex items-center justify-center gap-2 disabled:opacity-50 group"
                  >
                    {status === 'processing' ? (
                      <>
                        <Loader2 className="w-5 h-5 animate-spin" />
                        <span>Activating Membership...</span>
                      </>
                    ) : (
                      <>
                        <span>Confirm & Activate</span>
                        <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                      </>
                    )}
                  </button>

                  <p className="mt-6 text-[11px] text-center text-muted-foreground leading-relaxed">
                    By activating, you agree to the Membership Terms. <br />
                    No recurring charges in demonstration mode.
                  </p>
                </div>
              </>
            )}
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
};

export default CheckoutConfirmation;
