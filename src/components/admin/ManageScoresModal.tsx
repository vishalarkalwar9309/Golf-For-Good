import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { X, Save, Edit3, Trash2, Calendar, Hash, AlertCircle, Loader2, Check } from 'lucide-react';
import { supabase } from '../../lib/supabase';
import { cn, formatDate } from '../../lib/utils';
import EmptyState from '../ui/EmptyState';

interface Score {
  id: string;
  user_id: string;
  course_name: string;
  date: string;
  stableford_points: number;
  created_at: string;
}

interface ManageScoresModalProps {
  user: {
    id: string;
    full_name: string;
    email: string;
  };
  onClose: () => void;
}

const ManageScoresModal: React.FC<ManageScoresModalProps> = ({ user, onClose }) => {
  const [scores, setScores] = useState<Score[]>([]);
  const [loading, setLoading] = useState(true);
  const [editingId, setEditingId] = useState<string | null>(null);
  
  // Edit Buffer State
  const [editPoints, setEditPoints] = useState<number | string>('');
  const [editDate, setEditDate] = useState<string>('');
  
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [actionLoading, setActionLoading] = useState<string | null>(null);

  useEffect(() => {
    fetchScores();
  }, [user.id]);

  const fetchScores = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('scores')
        .select('*')
        .eq('user_id', user.id)
        .order('date', { ascending: false });

      if (error) throw error;
      setScores(data || []);
    } catch (err: any) {
      console.error('Error fetching scores:', err);
      setErrorMsg('Failed to load player scores.');
    } finally {
      setLoading(false);
    }
  };

  const startEdit = (score: Score) => {
    setEditingId(score.id);
    setEditPoints(score.stableford_points);
    setEditDate(score.date);
    setErrorMsg(null);
  };

  const cancelEdit = () => {
    setEditingId(null);
    setErrorMsg(null);
  };

  const handleSave = async (scoreId: string) => {
    setErrorMsg(null);
    const parsedPoints = parseInt(editPoints as string, 10);
    
    if (isNaN(parsedPoints) || parsedPoints < 1 || parsedPoints > 45) {
      setErrorMsg('Stableford points must be strictly between 1 and 45.');
      return;
    }
    
    if (!editDate) {
      setErrorMsg('Date is required.');
      return;
    }

    setActionLoading(scoreId);
    try {
      const { error } = await supabase
        .from('scores')
        .update({
          stableford_points: parsedPoints,
          date: editDate
        })
        .eq('id', scoreId);

      if (error) throw error;
      
      setEditingId(null);
      await fetchScores();
    } catch (err: any) {
      console.error('Error saving score:', err);
      setErrorMsg(`Failed to save score: ${err.message}`);
    } finally {
      setActionLoading(null);
    }
  };

  const handleDelete = async (scoreId: string) => {
    const confirmDelete = window.confirm('Are you sure you want to delete this score entry?');
    if (!confirmDelete) return;

    setActionLoading(`delete-${scoreId}`);
    try {
      const { error } = await supabase
        .from('scores')
        .delete()
        .eq('id', scoreId);

      if (error) throw error;
      await fetchScores();
    } catch (err: any) {
      console.error('Error deleting score:', err);
      setErrorMsg(`Failed to delete score: ${err.message}`);
    } finally {
      setActionLoading(null);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <motion.div 
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        onClick={onClose}
        className="absolute inset-0 bg-background/80 backdrop-blur-sm"
      />
      
      <motion.div 
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.95 }}
        className="relative w-full max-w-3xl max-h-[85vh] bg-surface-container border border-white/10 rounded-3xl shadow-2xl overflow-hidden flex flex-col"
      >
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-white/10">
          <div>
            <h2 className="text-xl font-display font-bold text-foreground">Manage Player Scores</h2>
            <p className="text-xs text-muted-foreground mt-0.5">
              Player: <span className="text-foreground font-semibold">{user.full_name || 'Anonymous'}</span> ({user.email})
            </p>
          </div>
          <button 
            onClick={onClose}
            className="p-1 rounded-lg text-muted-foreground hover:text-foreground"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Error Alert */}
        <AnimatePresence>
          {errorMsg && (
            <motion.div 
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: 'auto', opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              className="bg-destructive/10 border-b border-destructive/20 px-6 py-3 flex items-center gap-2 text-destructive text-xs font-medium"
            >
              <AlertCircle className="w-4 h-4 shrink-0" />
              <p>{errorMsg}</p>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Content */}
        <div className="flex-grow overflow-y-auto p-6">
          {loading ? (
            <div className="flex items-center justify-center h-48">
              <Loader2 className="w-6 h-6 animate-spin text-primary" />
            </div>
          ) : scores.length === 0 ? (
            <EmptyState 
              icon={Hash}
              title="No Scores Recorded"
              description="This player has not logged any Stableford rounds yet."
              className="border-dashed border-white/10 py-12"
            />
          ) : (
            <div className="border border-white/10 rounded-2xl overflow-hidden">
              <table className="w-full text-left text-xs">
                <thead>
                  <tr className="bg-surface-container-high/50 text-[10px] uppercase font-bold text-muted-foreground border-b border-white/10 tracking-wider">
                    <th className="px-4 py-3">Round Date</th>
                    <th className="px-4 py-3">Course Name</th>
                    <th className="px-4 py-3">Points (1–45)</th>
                    <th className="px-4 py-3 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-white/5">
                  {scores.map((score) => {
                    const isEditing = editingId === score.id;
                    const isSaving = actionLoading === score.id;
                    const isDeleting = actionLoading === `delete-${score.id}`;

                    return (
                      <tr key={score.id} className="hover:bg-white/[0.02]">
                        <td className="px-4 py-3">
                          {isEditing ? (
                            <input 
                              type="date"
                              value={editDate}
                              onChange={(e) => setEditDate(e.target.value)}
                              className="bg-surface-container-high border border-white/10 rounded-lg px-2.5 py-1 text-xs text-foreground focus:outline-none focus:border-primary [color-scheme:dark]"
                            />
                          ) : (
                            <span className="text-foreground">{formatDate(score.date)}</span>
                          )}
                        </td>

                        <td className="px-4 py-3">
                          <span className="font-semibold text-foreground">{score.course_name}</span>
                        </td>

                        <td className="px-4 py-3">
                          {isEditing ? (
                            <input 
                              type="number"
                              min="1"
                              max="45"
                              value={editPoints}
                              onChange={(e) => setEditPoints(e.target.value)}
                              className="w-16 bg-surface-container-high border border-white/10 rounded-lg px-2 py-1 text-xs text-foreground font-bold focus:outline-none focus:border-primary"
                            />
                          ) : (
                            <span className="px-2.5 py-0.5 rounded-md bg-primary/10 text-primary font-bold">
                              {score.stableford_points} pts
                            </span>
                          )}
                        </td>

                        <td className="px-4 py-3 text-right">
                          <div className="flex items-center justify-end gap-1.5">
                            {isEditing ? (
                              <>
                                <button
                                  onClick={() => handleSave(score.id)}
                                  disabled={isSaving}
                                  className="px-2.5 py-1 rounded-md bg-primary text-primary-foreground font-semibold text-xs flex items-center gap-1"
                                >
                                  {isSaving ? <Loader2 className="w-3 h-3 animate-spin" /> : <Save className="w-3 h-3" />}
                                  <span>Save</span>
                                </button>
                                <button
                                  onClick={cancelEdit}
                                  className="px-2 py-1 rounded-md bg-surface-container-high text-muted-foreground text-xs"
                                >
                                  Cancel
                                </button>
                              </>
                            ) : (
                              <>
                                <button
                                  onClick={() => startEdit(score)}
                                  className="p-1.5 rounded-lg bg-surface-container-high text-muted-foreground hover:text-foreground"
                                  title="Edit Round"
                                >
                                  <Edit3 className="w-3.5 h-3.5" />
                                </button>
                                <button
                                  onClick={() => handleDelete(score.id)}
                                  disabled={isDeleting}
                                  className="p-1.5 rounded-lg bg-surface-container-high text-muted-foreground hover:text-destructive"
                                  title="Delete Round"
                                >
                                  {isDeleting ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Trash2 className="w-3.5 h-3.5" />}
                                </button>
                              </>
                            )}
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </motion.div>
    </div>
  );
};

export default ManageScoresModal;
