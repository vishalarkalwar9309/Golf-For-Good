import React, { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Target, Calendar, MapPin, Plus, Trash2, Trophy, Loader2, AlertCircle, Lock, CheckCircle2, Edit2, X, Info } from 'lucide-react';
import { motion } from 'motion/react';
import { Link } from 'react-router-dom';
import { supabase } from '../../lib/supabase';
import { useAuth } from '../../components/auth/AuthProvider';
import { useSubscription } from '../../hooks/useSubscription';
import { cn, formatDate } from '../../lib/utils';
import { usePageTitle } from '../../hooks/usePageTitle';
import EmptyState from '../../components/ui/EmptyState';
import { AbstractGraphic } from '../../components/ui/AbstractGraphic';
import type { Score } from '../../types';

const scoreSchema = z.object({
  course_name: z.string().min(2, 'Course name must be at least 2 characters'),
  date: z.string().min(1, 'Date is required'),
  stableford_points: z.coerce.number().min(1, 'Stableford points must be at least 1').max(45, 'Maximum Stableford points is 45'),
});

type ScoreFormValues = z.infer<typeof scoreSchema>;

const Scores: React.FC = () => {
  usePageTitle('My Scores');
  const { user } = useAuth();
  const { isActive, isPremium, loading: subLoading } = useSubscription();
  const [scores, setScores] = useState<Score[]>([]);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null);
  const [editingScore, setEditingScore] = useState<Score | null>(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const { register, handleSubmit, reset, formState: { errors } } = useForm<ScoreFormValues>({
    resolver: zodResolver(scoreSchema) as any,
    defaultValues: {
      date: new Date().toISOString().split('T')[0],
      course_name: '',
      stableford_points: '' as any
    }
  });

  useEffect(() => {
    if (user) {
      fetchScores();
    }
  }, [user]);

  const fetchScores = async () => {
    setLoading(true);
    let isCancelled = false;

    const watchdog = setTimeout(() => {
      if (!isCancelled) {
        setLoading(false);
      }
    }, 6000);

    try {
      const { data, error } = await supabase
        .from('scores')
        .select('*')
        .eq('user_id', user!.id)
        .order('date', { ascending: false });

      if (error) throw error;
      if (!isCancelled) {
        setScores(data || []);
      }
    } catch (err: any) {
      if (!isCancelled) {
        setError(err.message);
      }
    } finally {
      clearTimeout(watchdog);
      if (!isCancelled) {
        setLoading(false);
      }
    }
  };

  const startEdit = (score: Score) => {
    setEditingScore(score);
    reset({
      course_name: score.course_name,
      date: score.date.split('T')[0],
      stableford_points: score.stableford_points
    });
    setError(null);
  };

  const cancelEdit = () => {
    setEditingScore(null);
    reset({
      course_name: '',
      date: new Date().toISOString().split('T')[0],
      stableford_points: '' as any
    });
    setError(null);
  };

  const onSubmit = async (formData: ScoreFormValues) => {
    if (!isPremium) {
      setError('An active membership is required to record rounds.');
      return;
    }
    setSubmitting(true);
    setError(null);
    try {
      // PRD Requirement: Only one score entry is permitted per date.
      const formattedDate = formData.date.split('T')[0];
      const duplicate = scores.find(s => s.date.split('T')[0] === formattedDate && (!editingScore || s.id !== editingScore.id));
      if (duplicate) {
        setError(`A score for ${formattedDate} already exists (${duplicate.course_name}: ${duplicate.stableford_points} pts). Only one score per date is permitted.`);
        setSubmitting(false);
        return;
      }

      if (editingScore) {
        const { error: updateError } = await supabase
          .from('scores')
          .update({
            course_name: formData.course_name.trim(),
            date: formattedDate,
            stableford_points: formData.stableford_points
          })
          .eq('id', editingScore.id);

        if (updateError) throw updateError;
        setEditingScore(null);
      } else {
        // Enforce PRD 5 latest scores retention: prune oldest when reaching 5
        const { data: currentScores, error: fetchError } = await supabase
          .from('scores')
          .select('id, date')
          .eq('user_id', user!.id)
          .order('date', { ascending: true }); // Oldest first

        if (fetchError) throw fetchError;

        if (currentScores && currentScores.length >= 5) {
          const scoresToDelete = currentScores.length - 4;
          const idsToDelete = currentScores.slice(0, scoresToDelete).map(s => s.id);
          
          const { error: deleteError } = await supabase
            .from('scores')
            .delete()
            .in('id', idsToDelete);
            
          if (deleteError) throw deleteError;
        }

        const { error: insertError } = await supabase
          .from('scores')
          .insert([{
            user_id: user!.id,
            course_name: formData.course_name.trim(),
            date: formattedDate,
            stableford_points: formData.stableford_points
          }]);

        if (insertError) throw insertError;
      }

      reset({
        course_name: '',
        date: new Date().toISOString().split('T')[0],
        stableford_points: '' as any
      });
      fetchScores();
    } catch (err: any) {
      setError(err.message || 'Failed to submit score');
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async (scoreId: string) => {
    setDeletingId(scoreId);
    try {
      const { error } = await supabase
        .from('scores')
        .delete()
        .eq('id', scoreId);

      if (error) throw error;
      setConfirmDeleteId(null);
      fetchScores();
    } catch (err: any) {
      setError('Failed to delete score. Please try again.');
    } finally {
      setDeletingId(null);
    }
  };

  const avgScore = scores.length > 0 
    ? (scores.reduce((acc, s) => acc + s.stableford_points, 0) / scores.length).toFixed(1)
    : '0.0';

  if (loading && subLoading) {
    return (
      <div className="flex items-center justify-center min-h-[500px]">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="relative min-h-screen bg-background pb-20">
      <AbstractGraphic variant="ambient-glow" className="opacity-30" />

      <div className="max-w-6xl mx-auto px-6 py-10 relative z-10 space-y-10">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-6 pb-6 border-b border-white/10">
          <div>
            <div className="inline-flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-primary mb-2">
              <Target className="w-4 h-4" />
              <span>Stableford Rounds</span>
            </div>
            <h1 className="text-3xl sm:text-4xl font-display font-bold tracking-tight text-foreground">
              My Scores & Draw Numbers
            </h1>
            <p className="text-muted-foreground text-sm mt-1 max-w-xl">
              Log your official club rounds. Your 5 most recent scores are used as your numbers in the monthly prize draw.
            </p>
          </div>

          <div className="bg-surface-container border border-white/10 px-5 py-3 rounded-2xl flex items-center gap-4">
            <div className="text-right">
              <span className="text-[10px] uppercase font-semibold text-muted-foreground block">
                Current Average
              </span>
              <span className="text-2xl font-display font-black text-primary leading-tight">
                {avgScore} <span className="text-xs font-sans text-muted-foreground font-normal">pts</span>
              </span>
            </div>
            <div className="w-px h-8 bg-white/10" />
            <div className="text-right">
              <span className="text-[10px] uppercase font-semibold text-muted-foreground block">
                Active Slots
              </span>
              <span className="text-2xl font-display font-black text-foreground leading-tight">
                {scores.length}<span className="text-xs font-sans text-muted-foreground font-normal">/5</span>
              </span>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Left Column: Form */}
          <div className="space-y-6">
            <div className="bg-surface-container border border-white/10 rounded-3xl p-6 relative overflow-hidden shadow-xl">
              {!isPremium && (
                <div className="absolute inset-0 z-20 bg-background/80 backdrop-blur-sm flex flex-col items-center justify-center p-6 text-center">
                  <Lock className="w-8 h-8 text-primary mb-3" />
                  <h3 className="font-display font-bold text-base text-foreground mb-1">Membership Required</h3>
                  <p className="text-xs text-muted-foreground mb-4">
                    Activate a membership plan to record Stableford rounds and participate in the monthly draw.
                  </p>
                  <Link
                    to="/dashboard/subscription"
                    className="px-5 py-2 rounded-xl bg-primary text-primary-foreground font-semibold text-xs"
                  >
                    View Membership Plans
                  </Link>
                </div>
              )}

              <div className="flex items-center justify-between mb-5">
                <h3 className="font-display font-bold text-lg text-foreground flex items-center gap-2">
                  {editingScore ? <Edit2 className="w-4 h-4 text-primary" /> : <Plus className="w-4 h-4 text-primary" />}
                  <span>{editingScore ? 'Edit Recorded Round' : 'Log New Round'}</span>
                </h3>
                {editingScore && (
                  <button
                    onClick={cancelEdit}
                    className="text-xs text-muted-foreground hover:text-foreground flex items-center gap-1"
                  >
                    <X className="w-3.5 h-3.5" /> Cancel
                  </button>
                )}
              </div>

              {error && (
                <div className="mb-4 p-3 rounded-xl bg-destructive/10 border border-destructive/20 text-destructive text-xs flex items-start gap-2">
                  <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
                  <span>{error}</span>
                </div>
              )}

              <form onSubmit={handleSubmit(onSubmit as any)} className="space-y-4">
                <div>
                  <label className="text-xs font-medium text-muted-foreground block mb-1">
                    Course Name
                  </label>
                  <div className="relative">
                    <MapPin className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                    <input
                      {...register('course_name')}
                      type="text"
                      disabled={!isPremium}
                      placeholder="e.g. Royal Melbourne Golf Club"
                      className="w-full bg-surface-container-high border border-white/10 rounded-xl py-2.5 pl-10 pr-4 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:border-primary transition-colors disabled:opacity-50"
                    />
                  </div>
                  {errors.course_name && <p className="text-destructive text-[11px] mt-1">{errors.course_name.message}</p>}
                </div>

                <div>
                  <label className="text-xs font-medium text-muted-foreground block mb-1">
                    Round Date
                  </label>
                  <div className="relative">
                    <Calendar className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                    <input
                      {...register('date')}
                      type="date"
                      disabled={!isPremium}
                      className="w-full bg-surface-container-high border border-white/10 rounded-xl py-2.5 pl-10 pr-4 text-sm text-foreground focus:outline-none focus:border-primary transition-colors disabled:opacity-50 [color-scheme:dark]"
                    />
                  </div>
                  {errors.date && <p className="text-destructive text-[11px] mt-1">{errors.date.message}</p>}
                </div>

                <div>
                  <label className="text-xs font-medium text-muted-foreground block mb-1">
                    Stableford Points (1–45)
                  </label>
                  <div className="relative">
                    <Trophy className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                    <input
                      {...register('stableford_points')}
                      type="number"
                      min="1"
                      max="45"
                      disabled={!isPremium}
                      placeholder="Points (1–45)"
                      className="w-full bg-surface-container-high border border-white/10 rounded-xl py-2.5 pl-10 pr-4 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:border-primary transition-colors disabled:opacity-50"
                    />
                  </div>
                  {errors.stableford_points && <p className="text-destructive text-[11px] mt-1">{errors.stableford_points.message}</p>}
                </div>

                <button
                  type="submit"
                  disabled={submitting || !isPremium}
                  className="w-full py-3 rounded-xl bg-primary text-primary-foreground font-semibold text-xs hover:opacity-90 transition-opacity shadow-md shadow-primary/10 disabled:opacity-50 flex items-center justify-center gap-2 mt-2"
                >
                  {submitting ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      <span>Saving...</span>
                    </>
                  ) : (
                    <span>{editingScore ? 'Update Round' : 'Save Round Score'}</span>
                  )}
                </button>
              </form>

              <div className="mt-5 pt-4 border-t border-white/10 flex items-start gap-2 text-[11px] text-muted-foreground">
                <Info className="w-3.5 h-3.5 text-primary shrink-0 mt-0.5" />
                <span>Stableford points are strictly bounded between 1 and 45. One entry permitted per calendar date.</span>
              </div>
            </div>
          </div>

          {/* Right Column: Score List */}
          <div className="lg:col-span-2 space-y-4">
            <div className="bg-surface-container border border-white/10 rounded-3xl overflow-hidden">
              <div className="p-6 border-b border-white/10 flex items-center justify-between">
                <div>
                  <h3 className="font-display font-bold text-lg text-foreground">
                    Active Rounds ({scores.length}/5)
                  </h3>
                  <p className="text-xs text-muted-foreground mt-0.5">
                    Sorted by date. The 5 latest scores represent your official draw numbers.
                  </p>
                </div>

                <div className="flex items-center gap-1.5">
                  {[1, 2, 3, 4, 5].map((slot) => (
                    <div 
                      key={slot}
                      className={cn(
                        "w-6 h-6 rounded-full text-[10px] font-bold flex items-center justify-center transition-colors",
                        slot <= scores.length 
                          ? "bg-primary text-primary-foreground" 
                          : "bg-surface-container-high border border-white/10 text-muted-foreground"
                      )}
                    >
                      {slot}
                    </div>
                  ))}
                </div>
              </div>

              {scores.length === 0 ? (
                <div className="p-12 text-center">
                  <EmptyState 
                    icon={Target}
                    title="No Rounds Logged"
                    description="Enter your latest Stableford rounds using the form to generate your 5 draw numbers."
                    className="border-none bg-transparent"
                  />
                </div>
              ) : (
                <div className="divide-y divide-white/5">
                  {scores.map((score, idx) => (
                    <motion.div
                      key={score.id}
                      initial={{ opacity: 0, y: 8 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: idx * 0.04 }}
                      className="p-5 flex items-center justify-between hover:bg-white/[0.02] transition-colors group"
                    >
                      <div className="flex items-center gap-4">
                        <div className="w-14 h-14 rounded-2xl bg-surface-container-high border border-primary/20 flex items-center justify-center font-display font-black text-2xl text-primary shrink-0 shadow-sm">
                          {score.stableford_points}
                        </div>
                        <div>
                          <h4 className="font-display font-bold text-base text-foreground group-hover:text-primary transition-colors">
                            {score.course_name}
                          </h4>
                          <div className="flex items-center gap-3 text-xs text-muted-foreground mt-0.5">
                            <span className="flex items-center gap-1.5">
                              <Calendar className="w-3.5 h-3.5 text-primary" />
                              {formatDate(score.date)}
                            </span>
                            <span className="text-[10px] px-2 py-0.5 rounded-full bg-surface-container-high border border-white/10 text-foreground font-medium">
                              Draw Number #{idx + 1}
                            </span>
                          </div>
                        </div>
                      </div>

                      <div className="flex items-center gap-2">
                        {confirmDeleteId === score.id ? (
                          <div className="flex items-center gap-1.5">
                            <button
                              onClick={() => handleDelete(score.id)}
                              disabled={deletingId === score.id}
                              className="px-3 py-1.5 rounded-lg bg-destructive text-destructive-foreground text-xs font-semibold hover:opacity-90 disabled:opacity-50"
                            >
                              {deletingId === score.id ? 'Deleting...' : 'Confirm'}
                            </button>
                            <button
                              onClick={() => setConfirmDeleteId(null)}
                              className="px-3 py-1.5 rounded-lg bg-surface-container-high text-muted-foreground text-xs font-semibold hover:text-foreground"
                            >
                              Cancel
                            </button>
                          </div>
                        ) : (
                          <>
                            <button
                              onClick={() => startEdit(score)}
                              className="w-9 h-9 rounded-xl bg-surface-container-high border border-white/5 text-muted-foreground hover:text-foreground hover:border-white/20 flex items-center justify-center transition-colors"
                              title="Edit Round"
                            >
                              <Edit2 className="w-4 h-4" />
                            </button>
                            <button
                              onClick={() => setConfirmDeleteId(score.id)}
                              className="w-9 h-9 rounded-xl bg-surface-container-high border border-white/5 text-muted-foreground hover:text-destructive hover:border-destructive/30 flex items-center justify-center transition-colors"
                              title="Delete Round"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </>
                        )}
                      </div>
                    </motion.div>
                  ))}
                </div>
              )}

              {scores.length > 0 && scores.length < 5 && (
                <div className="p-4 bg-primary/10 border-t border-white/5 text-xs text-primary font-medium flex items-center justify-between">
                  <span>Log {5 - scores.length} more round{5 - scores.length > 1 ? 's' : ''} to complete all 5 draw numbers.</span>
                </div>
              )}

              {scores.length === 5 && (
                <div className="p-4 bg-surface-container-high border-t border-white/5 text-xs text-muted-foreground flex items-center justify-between">
                  <span>5 latest rounds active. Submitting a new round will retain the 5 most recent rounds.</span>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Scores;
