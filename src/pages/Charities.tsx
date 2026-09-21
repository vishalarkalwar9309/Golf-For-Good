import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'motion/react';
import { Search, Heart, ArrowRight, Check, Sparkles, Globe } from 'lucide-react';
import { supabase } from '../lib/supabase';
import { cn, formatCurrency } from '../lib/utils';
import { useAuth } from '../components/auth/AuthProvider';
import { usePageTitle } from '../hooks/usePageTitle';
import { Badge } from '../components/ui/Badge';
import { Button } from '../components/ui/Button';
import type { Charity } from '../types';

const Charities: React.FC = () => {
  usePageTitle('Charity Directory');
  const { user, profile, refreshProfile } = useAuth();
  const [charities, setCharities] = useState<Charity[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('All');
  const [selectingId, setSelectingId] = useState<string | null>(null);

  useEffect(() => {
    fetchCharities();
  }, []);

  const fetchCharities = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('charities')
        .select('*')
        .order('total_raised', { ascending: false });
      
      if (error) throw error;
      setCharities(data || []);
    } catch (error) {
      console.error('Error fetching charities:', error);
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

      // Also update active subscription if present
      await supabase
        .from('subscriptions')
        .update({ charity_id: charityId })
        .eq('user_id', user.id);

      await refreshProfile();
    } catch (error) {
      console.error('Error selecting charity:', error);
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
        {/* Header Section */}
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

        {/* Search & Category Filter Bar */}
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

        {/* Charities Grid */}
        {loading ? (
          <div className="flex items-center justify-center py-28">
            <div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin" />
          </div>
        ) : filteredCharities.length === 0 ? (
          <div className="surface-card p-16 text-center max-w-lg mx-auto">
            <Heart className="w-12 h-12 text-on-surface-variant/40 mx-auto mb-4" />
            <h3 className="text-lg font-bold text-white mb-2">No charities found</h3>
            <p className="text-xs text-on-surface-variant">Try searching for a different name or resetting the category filter.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {filteredCharities.map((charity) => {
              const isSelected = profile?.selected_charity_id === charity.id;
              
              return (
                <div
                  key={charity.id}
                  className={cn(
                    "surface-card overflow-hidden flex flex-col justify-between transition-all duration-300 hover:border-white/20",
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
                      <Link to={`/charities/${charity.slug}`}>
                        <Button variant="ghost" size="sm">
                          Details
                        </Button>
                      </Link>

                      {user && (
                        <Button
                          variant={isSelected ? "outline" : "primary"}
                          size="sm"
                          loading={selectingId === charity.id}
                          onClick={() => handleSelectCharity(charity.id)}
                          icon={isSelected ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : undefined}
                        >
                          {isSelected ? "Selected" : "Select"}
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
