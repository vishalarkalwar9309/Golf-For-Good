import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Users, Search, Shield, 
  Mail, Trophy, Zap,
  Edit3, ShieldCheck,
  CheckCircle2, Lock, Unlock, CreditCard, X, Loader2, AlertCircle
} from 'lucide-react';
import { supabase } from '../../lib/supabase';
import { cn, formatCurrency } from '../../lib/utils';
import { usePageTitle } from '../../hooks/usePageTitle';
import EmptyState from '../../components/ui/EmptyState';
import ManageScoresModal from '../../components/admin/ManageScoresModal';
import { AbstractGraphic } from '../../components/ui/AbstractGraphic';

const AdminUsers: React.FC = () => {
  usePageTitle('User Management | Admin');
  const [users, setUsers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [roleFilter, setRoleFilter] = useState<'all' | 'admin' | 'user'>('all');
  const [selectedUserForScores, setSelectedUserForScores] = useState<any | null>(null);
  const [selectedUserForSubscription, setSelectedUserForSubscription] = useState<any | null>(null);

  useEffect(() => {
    fetchUsers();
  }, []);

  const fetchUsers = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select(`
          *,
          subscription:subscriptions(status, plan_type, amount)
        `)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setUsers(data || []);
    } catch (error) {
      console.error('Error fetching users:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleUpdateRole = async (userId: string, newRole: 'admin' | 'user') => {
    try {
      const { error } = await supabase
        .from('profiles')
        .update({ role: newRole })
        .eq('id', userId);

      if (error) throw error;
      await fetchUsers();
    } catch (error) {
      console.error('Error updating role:', error);
    }
  };

  const filteredUsers = users.filter(u => {
    const matchesSearch = 
      u.full_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      u.email?.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesRole = roleFilter === 'all' || u.role === roleFilter;
    return matchesSearch && matchesRole;
  });

  return (
    <div className="relative min-h-screen bg-background pb-20">
      <AbstractGraphic variant="ambient-glow" className="opacity-30" />

      <div className="max-w-7xl mx-auto px-6 py-10 relative z-10 space-y-10">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-6 pb-6 border-b border-white/10">
          <div>
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-primary/10 border border-primary/20 text-primary text-xs font-semibold mb-2">
              <Users className="w-4 h-4" />
              <span>Player Management</span>
            </div>
            <h1 className="text-3xl sm:text-4xl font-display font-bold tracking-tight text-foreground">
              Users & Player Rosters
            </h1>
            <p className="text-muted-foreground text-sm mt-1 max-w-xl">
              Audit player accounts, manage administrator permissions, and review or edit recorded Stableford scores.
            </p>
          </div>

          <div className="bg-surface-container border border-white/10 px-5 py-3 rounded-2xl">
            <span className="text-[10px] uppercase font-semibold text-muted-foreground block mb-0.5">
              Total Players
            </span>
            <span className="font-display font-black text-2xl text-foreground">
              {users.length}
            </span>
          </div>
        </div>

        {/* Filter Controls & Table Card */}
        <div className="bg-surface-container border border-white/10 rounded-3xl overflow-hidden shadow-xl">
          <div className="p-6 border-b border-white/10 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div className="relative flex-1 max-w-md">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <input 
                type="text" 
                placeholder="Search players by name or email..." 
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-2.5 bg-surface-container-high border border-white/10 rounded-xl text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:border-primary transition-colors"
              />
            </div>

            <div className="flex items-center gap-1.5 p-1 bg-surface-container-high border border-white/10 rounded-xl">
              {(['all', 'admin', 'user'] as const).map((role) => (
                <button
                  key={role}
                  onClick={() => setRoleFilter(role)}
                  className={cn(
                    "px-4 py-1.5 rounded-lg text-xs font-semibold capitalize transition-colors",
                    roleFilter === role 
                      ? "bg-primary text-primary-foreground shadow-sm" 
                      : "text-muted-foreground hover:text-foreground"
                  )}
                >
                  {role === 'all' ? 'All Roles' : role}
                </button>
              ))}
            </div>
          </div>

          {/* Table */}
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="border-b border-white/10 text-[10px] uppercase font-bold text-muted-foreground bg-surface-container-high/50 tracking-wider">
                  <th className="px-6 py-4">Player Details</th>
                  <th className="px-6 py-4">Role</th>
                  <th className="px-6 py-4">Subscription</th>
                  <th className="px-6 py-4">Charity & Winnings</th>
                  <th className="px-6 py-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/5">
                {loading ? (
                  Array.from({ length: 4 }).map((_, i) => (
                    <tr key={i} className="animate-pulse">
                      <td colSpan={5} className="px-6 py-6">
                        <div className="h-6 bg-white/5 rounded-lg w-full" />
                      </td>
                    </tr>
                  ))
                ) : filteredUsers.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="px-6 py-16 text-center">
                      <EmptyState 
                        icon={Users}
                        title="No Users Found"
                        description="No players match the search or filter criteria."
                        className="border-none bg-transparent"
                      />
                    </td>
                  </tr>
                ) : (
                  filteredUsers.map((u) => {
                    const sub = Array.isArray(u.subscription) ? u.subscription[0] : u.subscription;
                    const isSubActive = sub?.status === 'active' || u.subscription_status === 'active';

                    return (
                      <tr key={u.id} className="hover:bg-white/[0.02] transition-colors">
                        <td className="px-6 py-4">
                          <div className="flex items-center gap-3">
                            <div className="w-10 h-10 rounded-xl bg-surface-container-high border border-white/10 flex items-center justify-center font-bold text-primary shrink-0 overflow-hidden">
                              {u.avatar_url ? (
                                <img src={u.avatar_url} alt="" className="w-full h-full object-cover" />
                              ) : (
                                u.full_name?.charAt(0) || '?'
                              )}
                            </div>
                            <div>
                              <p className="font-display font-bold text-sm text-foreground">
                                {u.full_name || 'Unnamed Player'}
                              </p>
                              <span className="text-muted-foreground text-xs flex items-center gap-1 mt-0.5">
                                <Mail className="w-3 h-3" />
                                {u.email}
                              </span>
                            </div>
                          </div>
                        </td>

                        <td className="px-6 py-4">
                          <span className={cn(
                            "inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10px] font-semibold uppercase tracking-wider",
                            u.role === 'admin' 
                              ? "bg-secondary/15 text-secondary border border-secondary/20" 
                              : "bg-primary/10 text-primary border border-primary/20"
                          )}>
                            {u.role === 'admin' ? <Shield className="w-3 h-3" /> : <Zap className="w-3 h-3" />}
                            {u.role}
                          </span>
                        </td>

                        <td className="px-6 py-4">
                          <span className={cn(
                            "font-semibold capitalize block",
                            isSubActive ? "text-primary" : "text-muted-foreground"
                          )}>
                            {sub?.status || u.subscription_status || 'None'}
                          </span>
                          <span className="text-[10px] text-muted-foreground capitalize">
                            {sub?.plan_type || u.subscription_tier || 'Standard'} plan
                          </span>
                        </td>

                        <td className="px-6 py-4">
                          <div className="space-y-0.5">
                            <span className="text-muted-foreground block">
                              Impact: <strong className="text-foreground">{formatCurrency(u.total_impact || 0)}</strong>
                            </span>
                            <span className="text-muted-foreground block">
                              Won: <strong className="text-secondary">{formatCurrency(u.lifetime_winnings || 0)}</strong>
                            </span>
                          </div>
                        </td>

                        <td className="px-6 py-4 text-right">
                          <div className="flex items-center justify-end gap-1.5">
                            <button
                              onClick={() => handleUpdateRole(u.id, u.role === 'admin' ? 'user' : 'admin')}
                              title={u.role === 'admin' ? "Demote to Player" : "Promote to Admin"}
                              className="w-8 h-8 rounded-lg bg-surface-container-high border border-white/10 hover:border-white/20 text-muted-foreground hover:text-foreground flex items-center justify-center transition-colors"
                            >
                              {u.role === 'admin' ? <Unlock className="w-3.5 h-3.5" /> : <Lock className="w-3.5 h-3.5" />}
                            </button>

                            <button
                              onClick={() => setSelectedUserForScores(u)}
                              title="Manage User Scores"
                              className="w-8 h-8 rounded-lg bg-surface-container-high border border-white/10 hover:border-primary/40 text-muted-foreground hover:text-primary flex items-center justify-center transition-colors"
                            >
                              <Edit3 className="w-3.5 h-3.5" />
                            </button>

                            <button
                              onClick={() => setSelectedUserForSubscription(u)}
                              title="Manage Subscription"
                              className="w-8 h-8 rounded-lg bg-surface-container-high border border-white/10 hover:border-secondary/40 text-muted-foreground hover:text-secondary flex items-center justify-center transition-colors"
                            >
                              <CreditCard className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      <AnimatePresence>
        {selectedUserForScores && (
          <ManageScoresModal 
            user={selectedUserForScores} 
            onClose={() => setSelectedUserForScores(null)} 
          />
        )}
        {selectedUserForSubscription && (
          <ManageSubscriptionModal 
            user={selectedUserForSubscription} 
            onClose={() => setSelectedUserForSubscription(null)} 
            onSuccess={fetchUsers}
          />
        )}
      </AnimatePresence>
    </div>
  );
};

interface ManageSubscriptionModalProps {
  user: any;
  onClose: () => void;
  onSuccess: () => void;
}

const ManageSubscriptionModal: React.FC<ManageSubscriptionModalProps> = ({ user, onClose, onSuccess }) => {
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error', text: string } | null>(null);
  
  const sub = Array.isArray(user.subscription) ? user.subscription[0] : user.subscription;

  const handleUpdate = async (planType: 'monthly' | 'yearly' | 'cancel') => {
    setLoading(true);
    setMessage(null);
    try {
      if (planType === 'cancel') {
        if (sub) {
          const { error: subError } = await supabase
            .from('subscriptions')
            .update({ status: 'cancelled' })
            .eq('user_id', user.id);
          if (subError) throw subError;
        }

        const { error: profError } = await supabase
          .from('profiles')
          .update({ 
            subscription_status: 'cancelled',
            subscription_tier: 'none'
          })
          .eq('id', user.id);

        if (profError) throw profError;
      } else {
        const amount = planType === 'monthly' ? 25 : 250;
        const renewalDate = new Date();
        if (planType === 'monthly') renewalDate.setMonth(renewalDate.getMonth() + 1);
        else renewalDate.setFullYear(renewalDate.getFullYear() + 1);

        if (sub) {
          const { error: subError } = await supabase
            .from('subscriptions')
            .update({
              status: 'active',
              plan_type: planType,
              amount,
              renewal_date: renewalDate.toISOString()
            })
            .eq('user_id', user.id);
          if (subError) throw subError;
        } else {
          const { error: insError } = await supabase
            .from('subscriptions')
            .insert([{
              user_id: user.id,
              status: 'active',
              plan_type: planType,
              amount,
              charity_percentage: 10,
              start_date: new Date().toISOString(),
              renewal_date: renewalDate.toISOString()
            }]);
          if (insError) throw insError;
        }

        const { error: profError } = await supabase
          .from('profiles')
          .update({ 
            subscription_status: 'active',
            subscription_tier: planType
          })
          .eq('id', user.id);

        if (profError) throw profError;
      }

      setMessage({ type: 'success', text: 'Membership updated successfully.' });
      onSuccess();
      setTimeout(onClose, 1000);
    } catch (err: any) {
      console.error(err);
      setMessage({ type: 'error', text: err.message || 'Action failed.' });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-background/80 backdrop-blur-sm">
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.95 }}
        className="w-full max-w-md bg-surface-container border border-white/10 rounded-3xl p-6 shadow-2xl space-y-6"
      >
        <div className="flex items-center justify-between pb-4 border-b border-white/10">
          <div>
            <h3 className="font-display font-bold text-lg text-foreground">
              Manage Membership
            </h3>
            <p className="text-xs text-muted-foreground mt-0.5">{user.full_name} ({user.email})</p>
          </div>
          <button onClick={onClose} className="p-1 rounded-lg text-muted-foreground hover:text-foreground">
            <X className="w-5 h-5" />
          </button>
        </div>

        {message && (
          <div className={cn(
            "p-3 rounded-xl text-xs flex items-center gap-2",
            message.type === 'success' ? "bg-primary/10 text-primary border border-primary/20" : "bg-destructive/10 text-destructive border border-destructive/20"
          )}>
            {message.type === 'success' ? <CheckCircle2 className="w-4 h-4 shrink-0" /> : <AlertCircle className="w-4 h-4 shrink-0" />}
            <span>{message.text}</span>
          </div>
        )}

        <div className="space-y-3">
          <button
            onClick={() => handleUpdate('monthly')}
            disabled={loading}
            className="w-full p-4 rounded-2xl bg-surface-container-high border border-white/10 hover:border-primary/40 text-left transition-all flex items-center justify-between group"
          >
            <div>
              <span className="font-display font-bold text-sm text-foreground block group-hover:text-primary transition-colors">
                Set to Monthly Membership
              </span>
              <span className="text-xs text-muted-foreground">Standard 30-day renewal</span>
            </div>
            <Zap className="w-5 h-5 text-primary" />
          </button>

          <button
            onClick={() => handleUpdate('yearly')}
            disabled={loading}
            className="w-full p-4 rounded-2xl bg-surface-container-high border border-white/10 hover:border-secondary/40 text-left transition-all flex items-center justify-between group"
          >
            <div>
              <span className="font-display font-bold text-sm text-foreground block group-hover:text-secondary transition-colors">
                Set to Annual Membership
              </span>
              <span className="text-xs text-muted-foreground">Annual 365-day renewal</span>
            </div>
            <ShieldCheck className="w-5 h-5 text-secondary" />
          </button>

          <button
            onClick={() => handleUpdate('cancel')}
            disabled={loading}
            className="w-full p-4 rounded-2xl bg-destructive/10 border border-destructive/20 hover:bg-destructive/20 text-destructive text-left transition-all flex items-center justify-between"
          >
            <div>
              <span className="font-display font-bold text-sm block">Cancel / Deactivate Plan</span>
              <span className="text-xs text-destructive/80">Pause draw entries and billing</span>
            </div>
            <Lock className="w-5 h-5" />
          </button>
        </div>
      </motion.div>
    </div>
  );
};

export default AdminUsers;
