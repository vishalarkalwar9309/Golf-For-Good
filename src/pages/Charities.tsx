import React, { useState, useEffect, useCallback } from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'motion/react';
import { Search, Heart, ArrowRight, Check, Sparkles, Globe, AlertCircle, RotateCcw } from 'lucide-react';
import { supabase } from '../lib/supabase';
import { cn, formatCurrency } from '../lib/utils';
import { useAuth } from '../components/auth/AuthProvider';
import { usePageTitle } from '../hooks/usePageTitle';
import { Badge } from '../components/ui/Badge';
import { Button } from '../components/ui/Button';
import { CharityCardSkeleton } from '../components/ui/Skeleton';
import { 
  fetchCharities as fetchCharitiesService, 
  getCachedCharities, 
  invalidateCharityData 
} from '../services/dataService';
import type { Charity } from '../types';

const Charities: React.FC = () => {
  usePageTitle('Charity Directory');
  const { user, profile, refreshProfile } = useAuth();
  
  // Instant cache initialization (0ms on return visit)
  const [charities, setCharities] = useState<Charity[]>(() => getCachedCharities() || []);
  const [loading, setLoading] = useState<boolean>(() => !getCachedCharities());
  const [error, setError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('All');
  const [selectingId, setSelectingId] = useState<string | null>(null);

  const loadCharities = useCallback(async (force = false) => {
    // Only show loading skeletons if we don't have any cached data
    if (!getCachedCharities() || force) {
      setLoading(true);
    }
    setError(null);

    try {
      const data = await fetchCharitiesService(force);
      setCharities(data);
      setError(null);
    } catch (err: any) {
      console.error('Error loading charities:', err);
      // If we don't already have cached data to show, display the error
      if (charities.length === 0) {
        setError(err.message || 'We could not connect to the charity registry.');
      }
    } finally {
      setLoading(false);
    }
  }, [charities.length]);

  useEffect(() => {
    loadCharities();
  }, [loadCharities]);

  const handleSelectCharity = async (charityId: string) => {
    if (!user) return;
    setSelectingId(charityId);
    try {
      const { error: profileErr } = await supabase
        .from('profiles')
        .update({ selected_charity_id: charityId })
        .eq('id', user.id);
      
      if (profileErr) throw profileErr;

      // Also update active subscription if present
      await supabase
        .from('subscriptions')
        .update({ charity_id: charityId })
        .eq('user_id', user.id);

      invalidateCharityData();
      await refreshProfile();
    } catch (err) {
      console.error('Error selecting charity:', err);
    } finally {
      setSelectingId(null);
    }
  };

  const categories = ['All', ...new Set(charities.map(c => c.category).filter(Boolean))];

  const filteredCharities = charities.filter(c => {
    const matchesSearch = c.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
                         (c.description || '').toLowerCase().includes(searchTerm.toLowerCase());
    const matchesCategory = selectedCategory === 'All' || c.category === selectedCategory;
    return matchesSearch && matchesCategory;
  });

  return (
    <div className="min-h-screen bg-background text-on-surface pt-28 pb-24 px-6 md:px-12">
      <div className="max-w-7xl mx-auto">
        {/* Header Section (Always immediately rendered) */}
        <div className="text-center max-w-3xl mx-auto mb-16">
          <Badge variant="coral" size="md" className="mb-4">
            Direct Philanthropic Support
          </Badge>
          <h1 className="text-4xl sm:text-5xl md:text-6xl font-display font-extrabold tracking-tight text-white mb-6">
            Our Partner <span className="text-gradient-emerald">Charities.</span>
          </h1>
          <p className="text-base sm:text-lg text-on-surface-variant font-sans leading-relaxed">
            Every subscriber allocates a minimum 10% of their subscription directly to a verified charity of their choice. Explore our partners and discover their causes.
          </p>
        </div>

        {/* Search & Category Filter Bar (Always immediately rendered) */}
        <div className="flex flex-col md:flex-row items-center justify-between gap-6 mb-12">
          {/* Search Box */}
          <div className="relative w-full md:max-w-md">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-on-surface-variant" />
            <input 
              type="text" 
              placeholder="Search charities by name or cause..." 
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-11 pr-4 py-3 bg-[#10121A] border border-white/[0.08] rounded-xl focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent text-sm text-white placeholder:text-on-surface-variant/60"
            />
          </div>

          {/* Category Filter Pills */}
          <div className="flex items-center gap-2 overflow-x-auto pb-2 w-full md:w-auto">
            {categories.map((cat) => (
              <button
                key={cat}
                onClick={() => setSelectedCategory(cat)}
                className={cn(
                  "px-4 py-2 rounded-xl text-xs font-semibold tracking-wide transition-all whitespace-nowrap",
                  selectedCategory === cat 
                    ? "bg-primary text-background" 
                    : "bg-[#10121A] text-on-surface-variant border border-white/[0.08] hover:text-white hover:border-white/20"
                )}
              >
                {cat}
              </button>
            ))}
          </div>
        </div>

        {/* Charities Grid & Progressive States */}
        {loading && charities.length === 0 ? (
          // Progressive Skeleton Grid (Never a blank black screen)
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {Array.from({ length: 6 }).map((_, idx) => (
              <CharityCardSkeleton key={idx} />
            ))}
          </div>
        ) : error && charities.length === 0 ? (
          // Error State with Retry
          <div className="surface-card p-16 text-center max-w-lg mx-auto border border-rose-500/20">
            <AlertCircle className="w-12 h-12 text-rose-400 mx-auto mb-4" />
            <h3 className="text-lg font-bold text-white mb-2">We couldn't load charities</h3>
            <p className="text-xs text-on-surface-variant mb-6">{error}</p>
            <Button 
              variant="outline" 
              size="sm" 
              icon={<RotateCcw className="w-3.5 h-3.5" />} 
              onClick={() => loadCharities(true)}
            >
              Try Again
            </Button>
          </div>
        ) : charities.length === 0 ? (
          // Truly Empty Directory (0 rows in database)
          <div className="surface-card p-16 text-center max-w-lg mx-auto">
            <Heart className="w-12 h-12 text-on-surface-variant/40 mx-auto mb-4" />
            <h3 className="text-lg font-bold text-white mb-2">No charities registered yet</h3>
            <p className="text-xs text-on-surface-variant mb-6">Partner organizations will appear here as they are added.</p>
            <Button 
              variant="outline" 
              size="sm" 
              icon={<RotateCcw className="w-3.5 h-3.5" />} 
              onClick={() => loadCharities(true)}
            >
              Refresh Directory
            </Button>
          </div>
        ) : filteredCharities.length === 0 ? (
          // Filter / Search Produced Zero Results
          <div className="surface-card p-16 text-center max-w-lg mx-auto">
            <Search className="w-12 h-12 text-on-surface-variant/40 mx-auto mb-4" />
            <h3 className="text-lg font-bold text-white mb-2">No charities match your search</h3>
            <p className="text-xs text-on-surface-variant mb-6">
              {searchTerm 
                ? `No partner charities matched "${searchTerm}". Try another keyword or clear filters.` 
                : `No partner charities found in category "${selectedCategory}".`}
            </p>
            <Button 
              variant="outline" 
              size="sm" 
              icon={<RotateCcw className="w-3.5 h-3.5" />}
              onClick={() => { setSearchTerm(''); setSelectedCategory('All'); }}
            >
              Reset Search & Filters
            </Button>
          </div>
        ) : (
          // Render Real Charity Cards
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {filteredCharities.map((charity) => {
              const isSelected = profile?.selected_charity_id === charity.id;
              
              return (
                <div
                  key={charity.id}
                  className={cn(
                    "surface-card overflow-hidden flex flex-col justify-between transition-all duration-300 hover:border-white/20 rounded-2xl",
                    isSelected && "border-emerald-500/40 shadow-lg shadow-emerald-500/5"
                  )}
                >
                  <div>
                    {/* Image / Header */}
                    <div className="h-44 bg-slate-900 relative overflow-hidden">
                      {charity.image_url ? (
                        <img 
                          src={charity.image_url} 
                          alt={charity.name} 
                          className="w-full h-full object-cover transition-transform duration-500 hover:scale-105 opacity-80 hover:opacity-100"
                        />
                      ) : (
                        <div className="w-full h-full bg-gradient-to-br from-slate-900 to-slate-800 flex items-center justify-center">
                          <Heart className="w-10 h-10 text-white/20" />
                        </div>
                      )}
                      
                      <div className="absolute top-4 left-4 flex items-center gap-2">
                        <Badge variant="neutral" size="sm">
                          {charity.category || 'General'}
                        </Badge>
                        {charity.featured && (
                          <Badge variant="gold" size="sm">
                            Featured
                          </Badge>
                        )}
                      </div>
                    </div>

                    {/* Content */}
                    <div className="p-6">
                      <div className="flex items-start justify-between gap-3 mb-2">
                        <h3 className="text-xl font-display font-bold text-white">
                          {charity.name}
                        </h3>
                      </div>
                      
                      <p className="text-xs text-on-surface-variant leading-relaxed line-clamp-3 mb-6 font-sans">
                        {charity.description}
                      </p>
                    </div>
                  </div>

                  {/* Card Footer Actions */}
                  <div className="p-6 pt-0 border-t border-white/[0.06] flex items-center justify-between gap-4 mt-auto">
                    <div>
                      <span className="text-[10px] uppercase font-bold text-on-surface-variant block">Total Impact</span>
                      <span className="font-display font-bold text-sm text-emerald-400">
                        {formatCurrency(charity.total_raised || 0)}
                      </span>
                    </div>

                    <div className="flex items-center gap-2">
                      <Link 
                        to={`/charities/${charity.slug}`}
                        className="text-xs font-semibold text-on-surface-variant hover:text-white transition-colors px-3 py-1.5 rounded-lg hover:bg-white/5"
                      >
                        Details
                      </Link>

                      {user && (
                        <Button
                          variant={isSelected ? "lime" : "outline"}
                          size="sm"
                          icon={isSelected ? <Check className="w-3.5 h-3.5 text-[#08090D]" /> : <Heart className="w-3.5 h-3.5 text-rose-400" />}
                          onClick={() => handleSelectCharity(charity.id)}
                          disabled={selectingId === charity.id || isSelected}
                        >
                          {isSelected ? 'Selected' : 'Support'}
                        </Button>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
};

export default Charities;
