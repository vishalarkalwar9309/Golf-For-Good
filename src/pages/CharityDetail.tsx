import React, { useState, useEffect } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { motion } from 'motion/react';
import { 
  Heart, Globe, ArrowLeft, Calendar, MapPin, 
  ExternalLink, CheckCircle2, ShieldCheck, 
  Loader2, Sparkles, Check 
} from 'lucide-react';
import { supabase } from '../lib/supabase';
import { useAuth } from '../components/auth/AuthProvider';
import { usePageTitle } from '../hooks/usePageTitle';
import { formatCurrency } from '../lib/utils';
import { Badge } from '../components/ui/Badge';
import { Button } from '../components/ui/Button';
import type { Charity } from '../types';
import DonationModal from '../components/charity/DonationModal';

const CharityDetail: React.FC = () => {
  const { slug } = useParams<{ slug: string }>();
  const navigate = useNavigate();
  const { user, profile, refreshProfile } = useAuth();
  const [charity, setCharity] = useState<Charity | null>(null);
  const [loading, setLoading] = useState(true);
  const [selecting, setSelecting] = useState(false);
  const [error, setError] = useState(false);
  const [isDonationModalOpen, setIsDonationModalOpen] = useState(false);

  useEffect(() => {
    if (slug) {
      fetchCharity();
    }
  }, [slug]);

  const fetchCharity = async () => {
    setLoading(true);
    try {
      const { data, error: fetchError } = await supabase
        .from('charities')
        .select('*')
        .eq('slug', slug)
        .single();

      if (fetchError || !data) {
        setError(true);
      } else {
        setCharity(data);
      }
    } catch (err) {
      console.error('Error fetching charity:', err);
      setError(true);
    } finally {
      setLoading(false);
    }
  };

  usePageTitle(charity ? `${charity.name} | Charity Partner` : 'Charity Profile');

  const handleSupport = async () => {
    if (!user) {
      navigate('/signup', { state: { preferredCharityId: charity?.id } });
      return;
    }

    if (!charity) return;

    setSelecting(true);
    try {
      const { error: updateError } = await supabase
        .from('profiles')
        .update({ selected_charity_id: charity.id })
        .eq('id', user.id);

      if (updateError) throw updateError;

      // Update active subscription
      await supabase
        .from('subscriptions')
        .update({ charity_id: charity.id })
        .eq('user_id', user.id);

      await refreshProfile();
      navigate('/dashboard/charity');
    } catch (err) {
      console.error('Error selecting charity:', err);
    } finally {
      setSelecting(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (error || !charity) {
    return (
      <div className="min-h-screen pt-36 px-6 bg-background flex flex-col items-center">
        <div className="surface-card p-12 text-center max-w-lg">
          <Heart className="w-12 h-12 text-on-surface-variant/40 mx-auto mb-4" />
          <h1 className="text-2xl font-display font-bold text-white mb-2">Charity Not Found</h1>
          <p className="text-sm text-on-surface-variant mb-6">The charity profile you requested could not be located.</p>
          <Link to="/charities">
            <Button variant="primary" size="md" icon={<ArrowLeft className="w-4 h-4" />}>
              Back to Charity Directory
            </Button>
          </Link>
        </div>
      </div>
    );
  }

  const isSelected = profile?.selected_charity_id === charity.id;
  const events = charity.upcoming_events || [];

  return (
    <>
      <DonationModal 
        isOpen={isDonationModalOpen}
        onClose={() => setIsDonationModalOpen(false)}
        charity={charity}
      />

      <div className="min-h-screen bg-background text-on-surface pt-24 pb-28">
        {/* Cover Hero */}
        <section className="relative h-96 w-full overflow-hidden bg-slate-900 border-b border-white/[0.08]">
          {charity.image_url ? (
            <img 
              src={charity.image_url} 
              alt={charity.name} 
              className="w-full h-full object-cover opacity-60"
            />
          ) : (
            <div className="w-full h-full bg-gradient-to-r from-emerald-950 via-slate-900 to-background flex items-center justify-center">
              <Heart className="w-20 h-20 text-white/10" />
            </div>
          )}
          <div className="absolute inset-0 bg-gradient-to-t from-background via-background/40 to-transparent" />

          <div className="absolute top-8 left-6 md:left-12">
            <Link to="/charities" className="inline-flex items-center gap-2 text-xs font-semibold text-white/80 hover:text-white bg-black/40 backdrop-blur-md px-3.5 py-2 rounded-xl border border-white/10 transition-colors">
              <ArrowLeft className="w-4 h-4" /> All Charities
            </Link>
          </div>
        </section>

        {/* Profile Content */}
        <div className="max-w-7xl mx-auto px-6 md:px-12 -mt-24 relative z-10">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-10">
            {/* Main Details (Col 1 & 2) */}
            <div className="lg:col-span-2 space-y-8">
              <div className="surface-card p-8 md:p-12">
                <div className="flex flex-wrap items-center gap-2 mb-4">
                  <Badge variant="coral" size="sm">
                    {charity.category || 'General'}
                  </Badge>
                  {charity.featured && (
                    <Badge variant="gold" size="sm">
                      Featured Partner
                    </Badge>
                  )}
                  <Badge variant="neutral" size="sm">
                    Verified Organization
                  </Badge>
                </div>

                <h1 className="text-3xl sm:text-4xl md:text-5xl font-display font-extrabold text-white mb-6">
                  {charity.name}
                </h1>

                <p className="text-lg text-white/90 leading-relaxed font-sans font-medium mb-8">
                  {charity.description}
                </p>

                {charity.long_description && (
                  <div className="pt-6 border-t border-white/[0.06] text-sm text-on-surface-variant leading-relaxed space-y-4">
                    <h3 className="text-base font-bold text-white font-display">About the Mission</h3>
                    <p>{charity.long_description}</p>
                  </div>
                )}

                {charity.website_url && (
                  <div className="pt-6 mt-6 border-t border-white/[0.06]">
                    <a
                      href={charity.website_url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-2 text-sm text-primary hover:underline font-semibold"
                    >
                      Visit Official Website <ExternalLink className="w-4 h-4" />
                    </a>
                  </div>
                )}
              </div>

              {/* Upcoming Events / Golf Days */}
              {events && events.length > 0 && (
                <div className="surface-card p-8">
                  <h3 className="text-xl font-display font-bold text-white mb-6 flex items-center gap-2">
                    <Calendar className="w-5 h-5 text-primary" /> Upcoming Events & Golf Days
                  </h3>
                  <div className="space-y-4">
                    {events.map((evt: any, i: number) => (
                      <div key={i} className="p-4 rounded-xl bg-white/[0.03] border border-white/[0.06] flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                        <div>
                          <h4 className="text-sm font-bold text-white">{evt.title}</h4>
                          <div className="flex items-center gap-4 text-xs text-on-surface-variant mt-1">
                            <span>{evt.date}</span>
                            {evt.location && <span>&bull; {evt.location}</span>}
                          </div>
                        </div>
                        <Badge variant="emerald" size="sm">Upcoming</Badge>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* Support / Actions Sidebar (Col 3) */}
            <div className="space-y-6">
              <div className="surface-elevated p-8">
                <span className="text-xs font-semibold uppercase tracking-wider text-on-surface-variant block mb-1">
                  Total Impact Raised
                </span>
                <p className="font-display font-black text-4xl text-emerald-400 mb-6">
                  {formatCurrency(charity.total_raised || 0)}
                </p>

                <div className="space-y-3">
                  <Button
                    variant={isSelected ? "outline" : "primary"}
                    size="lg"
                    className="w-full"
                    loading={selecting}
                    onClick={handleSupport}
                    icon={isSelected ? <Check className="w-4 h-4 text-emerald-400" /> : undefined}
                  >
                    {isSelected ? "Currently Selected" : (user ? "Select as My Charity" : "Join to Support")}
                  </Button>

                  <Button
                    variant="outline"
                    size="lg"
                    className="w-full"
                    onClick={() => setIsDonationModalOpen(true)}
                    icon={<Heart className="w-4 h-4 text-rose-400" />}
                  >
                    One-Time Donation
                  </Button>
                </div>

                <div className="mt-6 pt-6 border-t border-white/[0.06] text-xs text-on-surface-variant space-y-2">
                  <div className="flex items-center gap-2">
                    <ShieldCheck className="w-4 h-4 text-primary flex-shrink-0" />
                    <span>Direct monthly subscription allocation</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <CheckCircle2 className="w-4 h-4 text-emerald-400 flex-shrink-0" />
                    <span>Independent of draw winnings</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </>
  );
};

export default CharityDetail;
