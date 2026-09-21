import React, { useState, useEffect } from 'react';
import { 
  Database, Search, Calendar, Heart, ShieldCheck,
  Download, CheckCircle2, AlertCircle, RefreshCw, Users
} from 'lucide-react';
import { supabase } from '../../lib/supabase';
import { cn, formatCurrency, formatDate } from '../../lib/utils';
import { usePageTitle } from '../../hooks/usePageTitle';
import EmptyState from '../../components/ui/EmptyState';
import { AbstractGraphic } from '../../components/ui/AbstractGraphic';

const Subscriptions: React.FC = () => {
  usePageTitle('Subscription Ledger | Admin');
  const [subscriptions, setSubscriptions] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | 'active' | 'inactive' | 'cancelled'>('all');

  useEffect(() => {
    fetchSubscriptions();
  }, []);

  const fetchSubscriptions = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('subscriptions')
        .select(`
          *,
          user:profiles(full_name, email),
          charity:charities(name)
        `)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setSubscriptions(data || []);
    } catch (error) {
      console.error('Error fetching subscriptions:', error);
    } finally {
      setLoading(false);
    }
  };

  const filteredSubscriptions = subscriptions.filter(sub => {
    const matchesSearch = 
      sub.user?.full_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      sub.user?.email?.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = statusFilter === 'all' || sub.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  const stats = {
    total: subscriptions.length,
    active: subscriptions.filter(s => s.status === 'active').length,
    mrr: subscriptions
      .filter(s => s.status === 'active')
      .reduce((acc, s) => acc + (s.amount ? Number(s.amount) : 0), 0)
  };

  const handleDownload = () => {
    if (subscriptions.length === 0) return;
    
    const headers = ['User', 'Email', 'Plan', 'Status', 'Amount', 'Charity', 'Renewal Date', 'Created At'];
    const csvContent = [
      headers.join(','),
      ...subscriptions.map(sub => [
        `"${sub.user?.full_name || 'Member'}"`,
        `"${sub.user?.email || 'N/A'}"`,
        `"${sub.plan_type}"`,
        `"${sub.status}"`,
        sub.amount,
        `"${sub.charity?.name || 'Unassigned'}"`,
        `"${formatDate(sub.renewal_date)}"`,
        `"${formatDate(sub.created_at)}"`
      ].join(','))
    ].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.setAttribute('href', url);
    link.setAttribute('download', `subscriptions_export_${new Date().toISOString().split('T')[0]}.csv`);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="relative min-h-screen bg-background pb-20">
      <AbstractGraphic variant="ambient-glow" className="opacity-30" />

      <div className="max-w-7xl mx-auto px-6 py-10 relative z-10 space-y-10">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-6 pb-6 border-b border-white/10">
          <div>
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-primary/10 border border-primary/20 text-primary text-xs font-semibold mb-2">
              <Database className="w-4 h-4" />
              <span>Billing & Memberships</span>
            </div>
            <h1 className="text-3xl sm:text-4xl font-display font-bold tracking-tight text-foreground">
              Subscription Directory
            </h1>
            <p className="text-muted-foreground text-sm mt-1 max-w-xl">
              Monitor active member subscriptions, recurring revenue, renewal schedules, and assigned charity giving allocations.
            </p>
          </div>

          <div className="bg-surface-container border border-white/10 px-5 py-3 rounded-2xl flex items-center gap-4">
            <div>
              <span className="text-[10px] uppercase font-semibold text-muted-foreground block mb-0.5">
                Monthly Recurring Revenue
              </span>
              <span className="font-display font-black text-2xl text-primary">
                {formatCurrency(stats.mrr)}
              </span>
            </div>
          </div>
        </div>

        {/* Quick KPI Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
          <div className="bg-surface-container border border-white/10 rounded-2xl p-5 space-y-1">
            <span className="text-xs uppercase font-semibold text-muted-foreground block">
              Active Memberships
            </span>
            <span className="text-3xl font-display font-black text-foreground">
              {stats.active}
            </span>
          </div>

          <div className="bg-surface-container border border-white/10 rounded-2xl p-5 space-y-1">
            <span className="text-xs uppercase font-semibold text-muted-foreground block">
              Total Recorded Subscriptions
            </span>
            <span className="text-3xl font-display font-black text-foreground">
              {stats.total}
            </span>
          </div>

          <div className="bg-surface-container border border-white/10 rounded-2xl p-5 space-y-1">
            <span className="text-xs uppercase font-semibold text-muted-foreground block">
              Charity Baseline
            </span>
            <span className="text-3xl font-display font-black text-primary">
              10% min <span className="text-xs text-muted-foreground font-normal">per PRD</span>
            </span>
          </div>
        </div>

        {/* Directory Card */}
        <div className="bg-surface-container border border-white/10 rounded-3xl overflow-hidden shadow-xl">
          <div className="p-6 border-b border-white/10 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div className="relative flex-1 max-w-md">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <input 
                type="text" 
                placeholder="Search by member name or email..." 
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-2.5 bg-surface-container-high border border-white/10 rounded-xl text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:border-primary transition-colors"
              />
            </div>

            <div className="flex items-center gap-3">
              <div className="flex items-center gap-1 p-1 bg-surface-container-high border border-white/10 rounded-xl">
                {(['all', 'active', 'inactive', 'cancelled'] as const).map((status) => (
                  <button
                    key={status}
                    onClick={() => setStatusFilter(status)}
                    className={cn(
                      "px-3 py-1.5 rounded-lg text-xs font-semibold capitalize transition-colors",
                      statusFilter === status 
                        ? "bg-primary text-primary-foreground shadow-sm" 
                        : "text-muted-foreground hover:text-foreground"
                    )}
                  >
                    {status}
                  </button>
                ))}
              </div>

              <button
                onClick={handleDownload}
                title="Export CSV"
                className="p-2.5 rounded-xl bg-surface-container-high border border-white/10 text-muted-foreground hover:text-foreground transition-colors"
              >
                <Download className="w-4 h-4" />
              </button>
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="border-b border-white/10 text-[10px] uppercase font-bold text-muted-foreground bg-surface-container-high/50 tracking-wider">
                  <th className="px-6 py-4">Member</th>
                  <th className="px-6 py-4">Status</th>
                  <th className="px-6 py-4">Plan & Amount</th>
                  <th className="px-6 py-4">Charity Partner</th>
                  <th className="px-6 py-4 text-right">Renewal Date</th>
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
                ) : filteredSubscriptions.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="px-6 py-16 text-center">
                      <EmptyState 
                        icon={Database}
                        title="No Subscriptions Found"
                        description="No subscription records match your search filter."
                        className="border-none bg-transparent"
                      />
                    </td>
                  </tr>
                ) : (
                  filteredSubscriptions.map((sub) => (
                    <tr key={sub.id} className="hover:bg-white/[0.02] transition-colors">
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-3">
                          <div className="w-9 h-9 rounded-xl bg-surface-container-high border border-white/10 flex items-center justify-center font-bold text-primary shrink-0">
                            {sub.user?.full_name?.charAt(0) || 'M'}
                          </div>
                          <div>
                            <p className="font-semibold text-sm text-foreground">
                              {sub.user?.full_name || 'Member'}
                            </p>
                            <span className="text-muted-foreground text-xs">{sub.user?.email}</span>
                          </div>
                        </div>
                      </td>

                      <td className="px-6 py-4">
                        <span className={cn(
                          "inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10px] font-semibold uppercase tracking-wider",
                          sub.status === 'active' 
                            ? "bg-primary/15 text-primary border border-primary/20" 
                            : "bg-destructive/15 text-destructive border border-destructive/20"
                        )}>
                          {sub.status === 'active' ? <CheckCircle2 className="w-3 h-3" /> : <AlertCircle className="w-3 h-3" />}
                          {sub.status}
                        </span>
                      </td>

                      <td className="px-6 py-4">
                        <span className="font-display font-bold text-sm text-foreground block">
                          {sub.amount ? formatCurrency(sub.amount) : 'Free Tier'}
                        </span>
                        <span className="text-[10px] text-muted-foreground capitalize">
                          {sub.plan_type} • {sub.charity_percentage || 10}% Giving
                        </span>
                      </td>

                      <td className="px-6 py-4">
                        <div className="flex items-center gap-2">
                          <Heart className={cn(
                            "w-3.5 h-3.5",
                            sub.charity?.name ? "text-primary" : "text-muted-foreground opacity-30"
                          )} />
                          <span className="text-foreground">
                            {sub.charity?.name || 'Unassigned'}
                          </span>
                        </div>
                      </td>

                      <td className="px-6 py-4 text-right">
                        <span className="text-muted-foreground">
                          {formatDate(sub.renewal_date)}
                        </span>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Subscriptions;
