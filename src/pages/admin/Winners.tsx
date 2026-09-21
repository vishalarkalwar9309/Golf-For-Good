import React, { useState, useEffect } from 'react';
import { Award, CheckCircle2, XCircle, Clock, ExternalLink, Loader2, DollarSign, ShieldCheck } from 'lucide-react';
import { supabase } from '../../lib/supabase';
import { formatDate, cn } from '../../lib/utils';
import { usePageTitle } from '../../hooks/usePageTitle';
import EmptyState from '../../components/ui/EmptyState';
import { AbstractGraphic } from '../../components/ui/AbstractGraphic';

type WinnerProof = {
  id: string;
  user_id: string;
  draw_id: string;
  file_url: string;
  status: 'pending' | 'approved' | 'rejected';
  created_at: string;
  actual_status?: string;
  draw?: { draw_month: string; prize_pool: number };
  user?: { full_name: string; email: string };
};

const WinnersVerification: React.FC = () => {
  usePageTitle('Winner Verification | Admin');
  const [proofs, setProofs] = useState<WinnerProof[]>([]);
  const [loading, setLoading] = useState(true);
  const [actionError, setActionError] = useState<string | null>(null);

  useEffect(() => {
    fetchProofs();
  }, []);

  const fetchProofs = async () => {
    try {
      const { data, error } = await supabase
        .from('winner_proofs')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;
      
      const userIds = data?.map(d => d.user_id) || [];
      const drawIds = data?.map(d => d.draw_id) || [];
      
      let proofsWithStatus = data || [];
      
      if (userIds.length > 0 && drawIds.length > 0) {
        const [
          { data: entries },
          { data: profiles },
          { data: draws }
        ] = await Promise.all([
          supabase.from('draw_entries').select('user_id, draw_id, winner_status').in('user_id', userIds).in('draw_id', drawIds),
          supabase.from('profiles').select('id, full_name, email').in('id', userIds),
          supabase.from('draws').select('id, draw_month, prize_pool').in('id', drawIds)
        ]);
          
        proofsWithStatus = data?.map(proof => {
          const entry = entries?.find(e => e.user_id === proof.user_id && e.draw_id === proof.draw_id && e.winner_status !== 'none' && e.winner_status !== 'pending');
          const dpProfile = profiles?.find(p => p.id === proof.user_id);
          const dwDraw = draws?.find(d => d.id === proof.draw_id);

          return {
            ...proof,
            user: dpProfile,
            draw: dwDraw,
            actual_status: entry ? entry.winner_status : proof.status
          };
        }) || [];
      }

      setProofs(proofsWithStatus);
    } catch (err: any) {
      console.error('Error fetching proofs:', err);
    } finally {
      setLoading(false);
    }
  };

  const updateProofStatus = async (proof: WinnerProof, newStatus: 'approved' | 'rejected' | 'paid') => {
    try {
      if (newStatus !== 'paid') {
        const { error } = await supabase
          .from('winner_proofs')
          .update({ status: newStatus })
          .eq('id', proof.id);
        if (error) throw error;
      }
      
      const updateData: any = { winner_status: newStatus };
      if (newStatus === 'paid') {
        updateData.paid_at = new Date().toISOString();
      }
      
      const { error: entryError } = await supabase
        .from('draw_entries')
        .update(updateData)
        .eq('user_id', proof.user_id)
        .eq('draw_id', proof.draw_id);
        
      if (entryError) throw entryError;

      fetchProofs();
    } catch (err) {
      console.error('Failed to update proof status:', err);
      setActionError('Update failed. Please try again.');
      setTimeout(() => setActionError(null), 4000);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  const pendingProofs = proofs.filter(p => p.status === 'pending');
  const processedProofs = proofs.filter(p => p.status !== 'pending');

  return (
    <div className="relative min-h-screen bg-background pb-20">
      <AbstractGraphic variant="ambient-glow" className="opacity-30" />

      <div className="max-w-7xl mx-auto px-6 py-10 relative z-10 space-y-10">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-6 pb-6 border-b border-white/10">
          <div>
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-secondary/10 border border-secondary/20 text-secondary text-xs font-semibold mb-2">
              <ShieldCheck className="w-4 h-4" />
              <span>Scorecard Verification</span>
            </div>
            <h1 className="text-3xl sm:text-4xl font-display font-bold tracking-tight text-foreground">
              Winner Verification Queue
            </h1>
            <p className="text-muted-foreground text-sm mt-1 max-w-xl">
              Inspect uploaded player scorecards, verify Stableford score authenticity, approve payouts, and mark prizes as disbursed.
            </p>
          </div>

          <div className="bg-surface-container border border-white/10 px-5 py-3 rounded-2xl">
            <span className="text-[10px] uppercase font-semibold text-muted-foreground block mb-0.5">
              Pending Scorecards
            </span>
            <span className="font-display font-black text-2xl text-secondary">
              {pendingProofs.length}
            </span>
          </div>
        </div>

        {actionError && (
          <div className="p-4 rounded-2xl bg-destructive/10 border border-destructive/20 text-destructive text-xs font-semibold flex items-center gap-2">
            <XCircle className="w-4 h-4 shrink-0" />
            <span>{actionError}</span>
          </div>
        )}

        {/* Pending Scorecards Queue */}
        <div className="space-y-4">
          <h3 className="font-display font-bold text-lg text-foreground flex items-center gap-2">
            <Clock className="w-5 h-5 text-secondary" />
            <span>Awaiting Review ({pendingProofs.length})</span>
          </h3>

          {pendingProofs.length === 0 ? (
            <div className="bg-surface-container border border-white/10 rounded-3xl p-12 text-center">
              <CheckCircle2 className="w-10 h-10 text-primary mx-auto mb-2 opacity-60" />
              <p className="font-display font-bold text-base text-foreground">Verification Queue is Clear</p>
              <p className="text-xs text-muted-foreground mt-1">All winner submissions have been verified and processed.</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {pendingProofs.map((proof) => (
                <div 
                  key={proof.id} 
                  className="bg-surface-container border border-secondary/30 rounded-3xl overflow-hidden flex flex-col justify-between shadow-xl"
                >
                  <div className="h-52 bg-surface-container-high relative group overflow-hidden">
                    <img 
                      src={proof.file_url} 
                      alt="Scorecard Proof" 
                      className="w-full h-full object-cover transition-transform group-hover:scale-105" 
                    />
                    <div className="absolute inset-0 bg-background/60 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                      <a 
                        href={proof.file_url} 
                        target="_blank" 
                        rel="noreferrer"
                        className="px-4 py-2 rounded-xl bg-surface-container border border-white/10 text-foreground text-xs font-semibold flex items-center gap-1.5 shadow-lg"
                      >
                        <span>View Full Image</span>
                        <ExternalLink className="w-3.5 h-3.5" />
                      </a>
                    </div>
                  </div>

                  <div className="p-5 space-y-4 flex-grow flex flex-col justify-between">
                    <div className="space-y-2">
                      <div>
                        <span className="text-[10px] uppercase font-semibold text-muted-foreground block">
                          Player
                        </span>
                        <h4 className="font-display font-bold text-base text-foreground">
                          {proof.user?.full_name || 'Member'}
                        </h4>
                        <span className="text-xs text-muted-foreground">{proof.user?.email}</span>
                      </div>

                      <div className="pt-2 border-t border-white/10 flex items-center justify-between text-xs">
                        <span className="text-muted-foreground">Draw Period:</span>
                        <span className="font-semibold text-foreground">{proof.draw?.draw_month || 'Recent Draw'}</span>
                      </div>

                      <div className="flex items-center justify-between text-xs">
                        <span className="text-muted-foreground">Submitted:</span>
                        <span className="text-muted-foreground">{formatDate(proof.created_at)}</span>
                      </div>
                    </div>

                    <div className="pt-4 border-t border-white/10 flex gap-2">
                      <button 
                        onClick={() => updateProofStatus(proof, 'approved')}
                        className="flex-1 py-2.5 rounded-xl bg-primary text-primary-foreground font-semibold text-xs hover:opacity-90 transition-opacity flex items-center justify-center gap-1.5 shadow-sm"
                      >
                        <CheckCircle2 className="w-3.5 h-3.5" />
                        <span>Approve</span>
                      </button>

                      <button 
                        onClick={() => updateProofStatus(proof, 'rejected')}
                        className="flex-1 py-2.5 rounded-xl bg-destructive/15 border border-destructive/30 text-destructive font-semibold text-xs hover:bg-destructive/25 transition-colors flex items-center justify-center gap-1.5"
                      >
                        <XCircle className="w-3.5 h-3.5" />
                        <span>Reject</span>
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Processed Scorecards History */}
        <div className="space-y-4 pt-6">
          <h3 className="font-display font-bold text-lg text-foreground">
            Processed Verification History
          </h3>

          <div className="bg-surface-container border border-white/10 rounded-3xl overflow-hidden shadow-xl">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead>
                  <tr className="border-b border-white/10 text-[10px] uppercase font-bold text-muted-foreground bg-surface-container-high/50 tracking-wider">
                    <th className="px-6 py-4">Player</th>
                    <th className="px-6 py-4">Draw Month</th>
                    <th className="px-6 py-4">Verification Status</th>
                    <th className="px-6 py-4 text-right">Submission Date</th>
                    <th className="px-6 py-4 text-right">Disbursement</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-white/5">
                  {processedProofs.map((proof) => (
                    <tr key={proof.id} className="hover:bg-white/[0.02] transition-colors">
                      <td className="px-6 py-4">
                        <p className="font-semibold text-foreground">{proof.user?.full_name || 'Member'}</p>
                        <span className="text-muted-foreground text-xs">{proof.user?.email}</span>
                      </td>

                      <td className="px-6 py-4">
                        <span className="text-foreground">{proof.draw?.draw_month || 'Monthly Draw'}</span>
                      </td>

                      <td className="px-6 py-4">
                        <span className={cn(
                          "inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10px] font-semibold uppercase tracking-wider",
                          proof.actual_status === 'approved' ? "bg-primary/15 text-primary border border-primary/20" :
                          proof.actual_status === 'paid' ? "bg-secondary/15 text-secondary border border-secondary/20" :
                          "bg-destructive/15 text-destructive border border-destructive/20"
                        )}>
                          {proof.actual_status === 'approved' ? <CheckCircle2 className="w-3 h-3" /> :
                           proof.actual_status === 'paid' ? <DollarSign className="w-3 h-3" /> :
                           <XCircle className="w-3 h-3" />}
                          {proof.actual_status === 'pending_verification' ? 'pending' : (proof.actual_status || proof.status)}
                        </span>
                      </td>

                      <td className="px-6 py-4 text-right text-muted-foreground">
                        {formatDate(proof.created_at)}
                      </td>

                      <td className="px-6 py-4 text-right">
                        {proof.actual_status === 'approved' && (
                          <button
                            onClick={() => updateProofStatus(proof, 'paid')}
                            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-secondary text-secondary-foreground text-xs font-semibold hover:opacity-90 shadow-sm"
                          >
                            <DollarSign className="w-3.5 h-3.5" />
                            <span>Mark Paid</span>
                          </button>
                        )}
                        {proof.actual_status === 'paid' && (
                          <span className="text-xs text-primary font-semibold">Disbursed</span>
                        )}
                      </td>
                    </tr>
                  ))}
                  {processedProofs.length === 0 && (
                    <tr>
                      <td colSpan={5} className="px-6 py-12 text-center text-muted-foreground">
                        No previous scorecards logged in history.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default WinnersVerification;
