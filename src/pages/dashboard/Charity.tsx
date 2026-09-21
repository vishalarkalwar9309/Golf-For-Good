import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Heart, Globe, Target, ShieldCheck, 
  AlertCircle, Loader2, CheckCircle2, Lock,
  Trophy, ExternalLink, ArrowRight, Search, Sparkles
} from 'lucide-react';
import { Link } from 'react-router-dom';
import { supabase } from '../../lib/supabase';
import { useAuth } from '../../components/auth/AuthProvider';
import { useSubscription } from '../../hooks/useSubscription';
import { cn, formatCurrency } from '../../lib/utils';
import { usePageTitle } from '../../hooks/usePageTitle';
import EmptyState from '../../components/ui/EmptyState';
import { AbstractGraphic } from '../../components/ui/AbstractGraphic';
import type { Charity } from '../../types';
import DonationModal from '../../components/charity/DonationModal';

const CharitySelection: React.FC = () => {
  usePageTitle('My Charity Partner');
  const { user, profile, refreshProfile } = useAuth();
  const { subscription, updateCharityDetails, isPremium, loading: subLoading } = useSubscription();
  const [charities, setCharities] = useState<Charity[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error', text: string } | null>(null);
  const [isDonationModalOpen, setIsDonationModalOpen] = useState(false);
  const [activeTab, setActiveTab] = useState<'network' | 'selector'>('network');
  const [searchTerm, setSearchTerm] = useState('');

  // States for user selection
  const [selectedCharityId, setSelectedCharityId] = useState<string | null>(null);
  const [contributionPct, setContributionPct] = useState<number>(10);
  const [selectingId, setSelectingId] = useState<string | null>(null);

  useEffect(() => {
    fetchCharities();
  }, []);

  useEffect(() => {
    if (subscription) {
      setSelectedCharityId(subscription.charity_id || null);
      setContributionPct(subscription.charity_percentage || 10);
    } else if (profile) {
      setSelectedCharityId(profile.selected_charity_id || null);
    }
  }, [subscription, profile]);

  const fetchCharities = async () => {
    try {
      const { data, error } = await supabase.from('charities').select('*').order('name');
      if (error) throw error;
      setCharities(data || []);
    } catch (err) {
      console.error('Error fetching charities:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleSelectCharity = async (charityId: string) => {
    if (!user) return;
    setSelectingId(charityId);
    try {
      const { error } = await supabase
        .from('profiles')
        .update({ selected_charity_id: charityId })
        .eq('id', user.id);
      
      if (error) throw error;
      
      if (subscription) {
        await updateCharityDetails(charityId, contributionPct);
      }
      
      await refreshProfile();
      setSelectedCharityId(charityId);
      setMessage({ type: 'success', text: 'Charity partner selected successfully.' });
    } catch (error: any) {
      console.error('Error selecting charity:', error);
      setMessage({ type: 'error', text: error.message || 'Failed to update partner.' });
    } finally {
      setSelectingId(null);
    }
  };

  const handleSave = async () => {
    if (!isPremium) {
      setMessage({ type: 'error', text: 'An active membership is required to save contribution preferences.' });
      return;
    }
    setSaving(true);
    setMessage(null);
    try {
      if (!selectedCharityId) throw new Error('Please select a charity first.');
      await updateCharityDetails(selectedCharityId, contributionPct);
      setMessage({ type: 'success', text: 'Contribution percentage updated successfully.' });
    } catch (err: any) {
      console.error('Save error:', err);
      setMessage({ type: 'error', text: err.message || 'Failed to save preferences.' });
    } finally {
      setSaving(false);
    }
  };

  if (loading || subLoading) {
    return (
      <div className="flex items-center justify-center min-h-[500px]">
        <div className="w-10 h-10 border-4 border-primary border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  const selectedCharity = charities.find(c => c.id === selectedCharityId);
  const filteredCharities = charities.filter(c => 
    c.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    c.category.toLowerCase().includes(searchTerm.toLowerCase()) ||
    c.description.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <>
      {selectedCharity && (
        <DonationModal 
          isOpen={isDonationModalOpen}
          onClose={() => setIsDonationModalOpen(false)}
          charity={selectedCharity}
        />
      )}

      <div className="relative min-h-screen bg-background pb-20">
        <AbstractGraphic variant="ambient-glow" className="opacity-30" />

        <div className="max-w-6xl mx-auto px-6 py-10 relative z-10 space-y-10">
          {/* Header & Tabs */}
          <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-6 pb-6 border-b border-white/10">
            <div>
              <div className="inline-flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-primary mb-2">
                <Heart className="w-4 h-4 text-destructive" />
                <span>Charity Giving</span>
              </div>
              <h1 className="text-3xl sm:text-4xl font-display font-bold tracking-tight text-foreground">
                Charity Partner & Impact
              </h1>
              <p className="text-muted-foreground text-sm mt-1 max-w-xl">
                Choose the charity that receives your monthly membership contribution. 100% of designated funds go directly to your chosen partner.
              </p>
            </div>

            <div className="flex p-1 bg-surface-container border border-white/10 rounded-2xl shrink-0">
              <button 
                onClick={() => setActiveTab('network')}
                className={cn(
                  "px-5 py-2 rounded-xl text-xs font-semibold transition-all",
                  activeTab === 'network' 
                    ? "bg-primary text-primary-foreground shadow-sm" 
                    : "text-muted-foreground hover:text-foreground"
                )}
              >
                Browse Charities
              </button>
              <button 
                onClick={() => setActiveTab('selector')}
                className={cn(
                  "px-5 py-2 rounded-xl text-xs font-semibold transition-all",
                  activeTab === 'selector' 
                    ? "bg-primary text-primary-foreground shadow-sm" 
                    : "text-muted-foreground hover:text-foreground"
                )}
              >
                Set Contribution %
              </button>
            </div>
          </div>

          {!isPremium && (
            <div className="p-6 bg-surface-container border border-white/10 rounded-3xl flex flex-col sm:flex-row items-center justify-between gap-6">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 rounded-2xl bg-primary/10 text-primary flex items-center justify-center shrink-0">
                  <Lock className="w-6 h-6" />
                </div>
                <div>
                  <h4 className="font-display font-bold text-base text-foreground">Community Tier</h4>
                  <p className="text-xs text-muted-foreground mt-0.5">
                    Upgrade to an active membership to direct recurring monthly contributions to your chosen charity.
                  </p>
                </div>
              </div>

              <Link 
                to="/dashboard/subscription" 
                className="px-6 py-2.5 rounded-xl bg-primary text-primary-foreground font-semibold text-xs whitespace-nowrap shadow-sm"
              >
                View Plans
              </Link>
            </div>
          )}

          {message && (
            <div className={cn(
              "p-4 rounded-2xl flex items-center gap-3 text-xs font-medium",
              message.type === 'success' ? "bg-primary/10 border border-primary/20 text-primary" : "bg-destructive/10 border border-destructive/20 text-destructive"
            )}>
              {message.type === 'success' ? <CheckCircle2 className="w-4 h-4 shrink-0" /> : <AlertCircle className="w-4 h-4 shrink-0" />}
              <span>{message.text}</span>
            </div>
          )}

          <AnimatePresence mode="wait">
            {activeTab === 'network' ? (
              <motion.div
                key="network"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                className="space-y-6"
              >
                <div className="relative max-w-md">
                  <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                  <input 
                    type="text" 
                    placeholder="Search charities by name or cause..." 
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="w-full pl-11 pr-4 py-3 bg-surface-container border border-white/10 rounded-xl text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:border-primary transition-colors"
                  />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {filteredCharities.map((charity) => {
                    const isSelected = selectedCharityId === charity.id;
                    
                    return (
                      <div
                        key={charity.id}
                        className={cn(
                          "bg-surface-container border rounded-3xl p-6 flex flex-col justify-between transition-all group relative",
                          isSelected 
                            ? "border-primary shadow-lg shadow-primary/10 ring-1 ring-primary" 
                            : "border-white/10 hover:border-white/20 hover:bg-surface-container-high"
                        )}
                      >
                        <div>
                          <div className="flex items-start justify-between gap-4 mb-4">
                            <div className="w-14 h-14 rounded-2xl bg-surface-container-high border border-white/10 p-2 flex items-center justify-center font-display font-bold text-lg text-primary overflow-hidden shrink-0">
                              {charity.logo_url ? (
                                <img src={charity.logo_url} alt={charity.name} className="w-full h-full object-contain" />
                              ) : (
                                charity.name.charAt(0)
                              )}
                            </div>

                            <div className="flex items-center gap-2">
                              {charity.featured && (
                                <span className="px-2.5 py-0.5 rounded-full bg-secondary text-secondary-foreground text-[10px] font-bold uppercase tracking-wider flex items-center gap-1">
                                  <Trophy className="w-3 h-3" /> Featured
                                </span>
                              )}
                              {isSelected && (
                                <span className="w-6 h-6 rounded-full bg-primary text-primary-foreground flex items-center justify-center">
                                  <CheckCircle2 className="w-4 h-4" />
                                </span>
                              )}
                            </div>
                          </div>

                          <span className="text-[10px] uppercase font-semibold text-primary block mb-1">
                            {charity.category}
                          </span>
                          <h3 className="font-display font-bold text-lg text-foreground mb-2 group-hover:text-primary transition-colors">
                            <Link to={`/charities/${charity.slug}`}>{charity.name}</Link>
                          </h3>
                          <p className="text-xs text-muted-foreground line-clamp-3 leading-relaxed mb-6">
                            {charity.description}
                          </p>
                        </div>

                        <div className="pt-4 border-t border-white/10 space-y-3">
                          <div className="flex items-center justify-between text-xs">
                            <span className="text-muted-foreground">Total Raised</span>
                            <span className="font-display font-bold text-foreground">
                              {formatCurrency(charity.total_raised)}
                            </span>
                          </div>

                          <div className="flex items-center gap-2 pt-1">
                            {charity.website_url && (
                              <a 
                                href={charity.website_url} 
                                target="_blank" 
                                rel="noopener noreferrer"
                                className="px-3 py-2 rounded-xl bg-surface-container-high border border-white/10 text-muted-foreground hover:text-foreground text-xs font-semibold flex items-center gap-1.5 transition-colors"
                              >
                                <span>Website</span>
                                <ExternalLink className="w-3 h-3" />
                              </a>
                            )}

                            <button 
                              onClick={() => handleSelectCharity(charity.id)}
                              disabled={isSelected || selectingId === charity.id || !isPremium}
                              className={cn(
                                "flex-1 py-2 rounded-xl text-xs font-semibold flex items-center justify-center gap-1.5 transition-colors",
                                isSelected 
                                  ? "bg-primary/20 text-primary cursor-default font-bold" 
                                  : "bg-primary text-primary-foreground hover:opacity-90 disabled:opacity-40"
                              )}
                            >
                              {selectingId === charity.id ? (
                                <Loader2 className="w-3.5 h-3.5 animate-spin" />
                              ) : isSelected ? (
                                <><CheckCircle2 className="w-3.5 h-3.5" /> Selected</>
                              ) : (
                                <span>Select Charity</span>
                              )}
                            </button>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </motion.div>
            ) : (
              <motion.div
                key="selector"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                className="grid grid-cols-1 lg:grid-cols-3 gap-8"
              >
                {/* Left: Quick Select Grid */}
                <div className="lg:col-span-2 space-y-4">
                  <h3 className="font-display font-bold text-lg text-foreground mb-4">
                    Choose Your Beneficiary Charity
                  </h3>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    {charities.map((charity) => (
                      <div
                        key={charity.id}
                        onClick={() => setSelectedCharityId(charity.id)}
                        className={cn(
                          "cursor-pointer p-5 rounded-2xl border transition-all text-left flex items-start gap-4",
                          selectedCharityId === charity.id 
                            ? "bg-primary/10 border-primary shadow-md ring-1 ring-primary" 
                            : "bg-surface-container border-white/10 hover:border-white/20 hover:bg-surface-container-high"
                        )}
                      >
                        <div className="w-12 h-12 rounded-xl bg-surface-container-high border border-white/10 flex items-center justify-center font-display font-bold text-base text-primary overflow-hidden shrink-0">
                          {charity.logo_url ? (
                            <img src={charity.logo_url} alt="" className="w-full h-full object-cover" />
                          ) : (
                            charity.name.charAt(0)
                          )}
                        </div>
                        <div className="flex-grow min-w-0">
                          <span className="text-[10px] uppercase font-semibold text-primary block mb-0.5">
                            {charity.category}
                          </span>
                          <h4 className="font-display font-bold text-sm text-foreground truncate">
                            {charity.name}
                          </h4>
                          <span className="text-[11px] text-muted-foreground block mt-1">
                            {formatCurrency(charity.total_raised)} raised
                          </span>
                        </div>
                        {selectedCharityId === charity.id && (
                          <CheckCircle2 className="w-5 h-5 text-primary shrink-0 mt-1" />
                        )}
                      </div>
                    ))}
                  </div>
                </div>

                {/* Right: Contribution Percentage Slider */}
                <div className="space-y-6">
                  <div className="bg-surface-container border border-white/10 rounded-3xl p-6 shadow-xl space-y-6">
                    <h3 className="font-display font-bold text-lg text-foreground flex items-center gap-2">
                      <Target className="w-5 h-5 text-primary" />
                      <span>Contribution Level</span>
                    </h3>

                    {selectedCharity ? (
                      <div className="space-y-6">
                        <div className="p-4 bg-surface-container-high rounded-2xl border border-white/10 flex items-center gap-3">
                          <div className="w-10 h-10 rounded-xl bg-primary/10 text-primary flex items-center justify-center font-display font-bold text-sm shrink-0">
                            {selectedCharity.name.charAt(0)}
                          </div>
                          <div className="min-w-0">
                            <span className="text-[10px] uppercase font-semibold text-muted-foreground block">
                              Active Beneficiary
                            </span>
                            <span className="font-display font-bold text-sm text-foreground truncate block">
                              {selectedCharity.name}
                            </span>
                          </div>
                        </div>

                        <div className="space-y-4">
                          <div className="flex items-baseline justify-between">
                            <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                              Giving Percentage
                            </label>
                            <span className="text-3xl font-display font-black text-primary">
                              {contributionPct}%
                            </span>
                          </div>

                          <input 
                            type="range" 
                            min="10" 
                            max="100" 
                            step="5"
                            value={contributionPct}
                            onChange={(e) => setContributionPct(parseInt(e.target.value))}
                            disabled={!isPremium}
                            className="w-full h-2 bg-surface-container-high rounded-full appearance-none cursor-pointer accent-primary disabled:opacity-40"
                          />

                          <div className="flex justify-between text-[11px] text-muted-foreground font-medium">
                            <span>10% (PRD Baseline)</span>
                            <span>50%</span>
                            <span>100% (All-In)</span>
                          </div>
                        </div>

                        <div className="p-4 rounded-2xl bg-primary/5 border border-primary/20 text-xs text-muted-foreground space-y-1">
                          <div className="flex items-center gap-1.5 text-primary font-semibold">
                            <ShieldCheck className="w-4 h-4" />
                            <span>100% Pass-Through Rule</span>
                          </div>
                          <p className="leading-relaxed">
                            {contributionPct}% of your monthly membership dues will be automatically directed to {selectedCharity.name}.
                          </p>
                        </div>

                        <div className="flex gap-2">
                          <button
                            onClick={handleSave}
                            disabled={saving || !isPremium}
                            className="flex-1 py-3 rounded-xl bg-primary text-primary-foreground font-semibold text-xs hover:opacity-90 transition-opacity shadow-md disabled:opacity-40 flex items-center justify-center gap-2"
                          >
                            {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <CheckCircle2 className="w-4 h-4" />}
                            <span>Save Contribution %</span>
                          </button>

                          <button
                            onClick={() => setIsDonationModalOpen(true)}
                            className="px-4 py-3 rounded-xl bg-surface-container-high border border-white/10 text-foreground font-semibold text-xs hover:bg-surface-container-highest transition-colors"
                          >
                            One-Time Donation
                          </button>
                        </div>
                      </div>
                    ) : (
                      <p className="text-xs text-muted-foreground">Select a charity from the list on the left to set your giving preferences.</p>
                    )}
                  </div>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>
    </>
  );
};

export default CharitySelection;
