import React, { useState, useEffect } from 'react';
import { motion } from 'motion/react';
import { 
  Trophy, Users, Heart, Zap, ArrowUpRight,
  ShieldCheck, TrendingUp, Database, ArrowRight
} from 'lucide-react';
import { 
  AreaChart, Area, XAxis, YAxis, CartesianGrid, 
  Tooltip, ResponsiveContainer
} from 'recharts';
import { Link } from 'react-router-dom';
import { useAuth } from '../../components/auth/AuthProvider';
import { usePageTitle } from '../../hooks/usePageTitle';
import { supabase } from '../../lib/supabase';
import { cn, formatCurrency } from '../../lib/utils';
import { AbstractGraphic } from '../../components/ui/AbstractGraphic';
import type { Winner } from '../../types';

const AdminOverview: React.FC = () => {
  const { user, profile } = useAuth();
  usePageTitle('Admin Overview');
  const [stats, setStats] = useState({
    totalUsers: 0,
    activeSubs: 0,
    totalRaised: 0,
    currentJackpot: 0,
    totalPrizes: 0,
    publishedDraws: 0
  });
  const [recentWinners, setRecentWinners] = useState<Winner[]>([]);
  const [charityImpact, setCharityImpact] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (user && profile?.role === 'admin') {
      fetchAdminStats();
    }
  }, [user, profile]);

  const fetchAdminStats = async () => {
    setLoading(true);
    try {
      // 1. Fetch Basic Totals
      const [
        { count: userCount },
        { data: activeSubs },
        { data: allCharities },
        { data: allDraws }
      ] = await Promise.all([
        supabase.from('profiles').select('*', { count: 'exact', head: true }),
        supabase.from('subscriptions').select('amount').eq('status', 'active'),
        supabase.from('charities').select('name, total_raised'),
        supabase.from('draws').select('*').eq('status', 'published').order('created_at', { ascending: false })
      ]);

      // 2. Calculate Aggregates
      const totalRaised = allCharities?.reduce((acc, c) => acc + (c.total_raised || 0), 0) || 0;
      const totalPrizes = allDraws?.reduce((acc, d) => acc + (d.prize_pool || 0), 0) || 0;
      const currentDraw = allDraws?.[0];

      setStats({
        totalUsers: userCount || 0,
        activeSubs: activeSubs?.length || 0,
        totalRaised,
        currentJackpot: currentDraw?.jackpot_rollover_amount || 0,
        totalPrizes,
        publishedDraws: allDraws?.length || 0
      });

      // 3. Extract Winners
      const winnersList: Winner[] = [];
      allDraws?.slice(0, 5).forEach(d => {
        if (d.winners) {
          winnersList.push(...(d.winners as any).slice(0, 3));
        }
      });
      setRecentWinners(winnersList);

      setCharityImpact(allCharities?.slice(0, 5) || []);
    } catch (error) {
      console.error('Error fetching admin stats:', error);
    } finally {
      setLoading(false);
    }
  };

  const chartData = [
    { name: 'Jan', revenue: 45000, impact: 12000 },
    { name: 'Feb', revenue: 52000, impact: 15000 },
    { name: 'Mar', revenue: 48000, impact: 14000 },
    { name: 'Apr', revenue: 61000, impact: 18000 },
    { name: 'May', revenue: 55000, impact: 16000 },
    { name: 'Jun', revenue: 67000, impact: 21000 },
  ];

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="w-10 h-10 border-4 border-primary border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="relative min-h-screen bg-background pb-20">
      <AbstractGraphic variant="ambient-glow" className="opacity-30" />

      <div className="max-w-7xl mx-auto px-6 py-10 relative z-10 space-y-10">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-6 pb-6 border-b border-white/10">
          <div>
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-secondary/10 border border-secondary/20 text-secondary text-xs font-semibold mb-2">
              <ShieldCheck className="w-4 h-4" />
              <span>Admin Console</span>
            </div>
            <h1 className="text-3xl sm:text-4xl font-display font-bold tracking-tight text-foreground">
              Platform Overview
            </h1>
            <p className="text-muted-foreground text-sm mt-1 max-w-xl">
              Real-time KPIs for user growth, draw cycles, jackpot rollover tracking, and charitable pass-through funds.
            </p>
          </div>
        </div>

        {/* Primary Metrics Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {[
            { label: 'Total Players', value: stats.totalUsers, icon: Users, color: 'text-foreground', sub: `${stats.activeSubs} Active Members` },
            { label: 'Rollover Jackpot', value: formatCurrency(stats.currentJackpot), icon: Zap, color: 'text-secondary', sub: '5-Match Tier Rollover' },
            { label: 'Total Charity Giving', value: formatCurrency(stats.totalRaised), icon: Heart, color: 'text-primary', sub: '100% Pass-Through' },
            { label: 'Total Prizes Awarded', value: formatCurrency(stats.totalPrizes), icon: Trophy, color: 'text-secondary', sub: `${stats.publishedDraws} Draws Completed` }
          ].map((metric, idx) => (
            <motion.div
              key={idx}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: idx * 0.05 }}
              className="bg-surface-container border border-white/10 rounded-3xl p-6 relative overflow-hidden shadow-xl"
            >
              <div className="flex items-center justify-between mb-4">
                <div className="w-11 h-11 rounded-2xl bg-surface-container-high border border-white/10 flex items-center justify-center">
                  <metric.icon className={cn("w-5 h-5", metric.color)} />
                </div>
                <TrendingUp className="w-4 h-4 text-primary opacity-60" />
              </div>
              <span className="text-xs uppercase font-semibold text-muted-foreground block mb-1">
                {metric.label}
              </span>
              <p className={cn("text-2xl sm:text-3xl font-display font-black tracking-tight mb-2", metric.color)}>
                {metric.value}
              </p>
              <span className="text-xs text-muted-foreground font-medium">
                {metric.sub}
              </span>
            </motion.div>
          ))}
        </div>

        {/* Chart + Recent Activity */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Revenue & Impact Chart */}
          <div className="lg:col-span-2 bg-surface-container border border-white/10 rounded-3xl p-6 sm:p-8 flex flex-col h-[480px]">
            <div className="flex items-center justify-between mb-8">
              <div>
                <h3 className="font-display font-bold text-lg text-foreground">
                  Platform Growth Trajectory
                </h3>
                <p className="text-xs text-muted-foreground mt-0.5">
                  Monthly platform revenue vs. pass-through charity impact.
                </p>
              </div>

              <div className="flex gap-4 text-xs font-semibold">
                <div className="flex items-center gap-2">
                  <div className="w-2.5 h-2.5 rounded-full bg-primary" />
                  <span className="text-foreground">Revenue</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-2.5 h-2.5 rounded-full bg-secondary" />
                  <span className="text-secondary">Charity Impact</span>
                </div>
              </div>
            </div>

            <div className="flex-grow">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={chartData}>
                  <defs>
                    <linearGradient id="colorRev" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#10B981" stopOpacity={0.2}/>
                      <stop offset="95%" stopColor="#10B981" stopOpacity={0}/>
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="#ffffff0a" vertical={false} />
                  <XAxis 
                    dataKey="name" 
                    stroke="#ffffff40" 
                    fontSize={11} 
                    tickLine={false} 
                    axisLine={false} 
                    dy={10}
                  />
                  <YAxis 
                    stroke="#ffffff40" 
                    fontSize={11} 
                    tickLine={false} 
                    axisLine={false} 
                    tickFormatter={(v) => `$${v/1000}k`}
                  />
                  <Tooltip 
                    contentStyle={{ 
                      backgroundColor: '#10121A', 
                      border: '1px solid rgba(255,255,255,0.1)',
                      borderRadius: '12px',
                      fontSize: '12px'
                    }}
                  />
                  <Area type="monotone" dataKey="revenue" stroke="#10B981" strokeWidth={2.5} fillOpacity={1} fill="url(#colorRev)" />
                  <Area type="monotone" dataKey="impact" stroke="#F59E0B" strokeWidth={2.5} fillOpacity={0} />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Right Column: Recent Winners & Charity Distribution */}
          <div className="space-y-6">
            <div className="bg-surface-container border border-white/10 rounded-3xl p-6 space-y-4">
              <div className="flex items-center justify-between pb-3 border-b border-white/10">
                <h3 className="font-display font-bold text-base text-foreground flex items-center gap-2">
                  <Trophy className="w-4 h-4 text-secondary" />
                  <span>Recent Winners</span>
                </h3>
                <Link to="/admin/winners" className="text-xs text-primary hover:underline font-semibold">
                  All Winners →
                </Link>
              </div>

              <div className="space-y-3">
                {recentWinners.length === 0 ? (
                  <p className="text-xs text-muted-foreground py-6 text-center">No recent winners logged.</p>
                ) : (
                  recentWinners.map((winner, idx) => (
                    <div key={idx} className="flex items-center justify-between text-xs">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-xl bg-surface-container-high border border-white/10 flex items-center justify-center font-bold text-primary">
                          {winner.user_name?.charAt(0) || 'W'}
                        </div>
                        <div>
                          <p className="font-semibold text-foreground">{winner.user_name}</p>
                          <span className="text-[10px] text-muted-foreground">{winner.match_count}-Match Tier</span>
                        </div>
                      </div>
                      <span className="font-display font-bold text-secondary">
                        {formatCurrency(winner.prize_amount)}
                      </span>
                    </div>
                  ))
                )}
              </div>
            </div>

            {/* Charity Distribution */}
            <div className="bg-surface-container border border-white/10 rounded-3xl p-6 space-y-4">
              <div className="flex items-center justify-between pb-3 border-b border-white/10">
                <h3 className="font-display font-bold text-base text-foreground flex items-center gap-2">
                  <Heart className="w-4 h-4 text-primary" />
                  <span>Charity Share</span>
                </h3>
                <Link to="/admin/charities" className="text-xs text-primary hover:underline font-semibold">
                  Manage →
                </Link>
              </div>

              <div className="space-y-3">
                {charityImpact.map((charity, idx) => {
                  const pct = stats.totalRaised > 0 
                    ? Math.round((charity.total_raised / stats.totalRaised) * 100) 
                    : 0;
                  return (
                    <div key={idx} className="space-y-1.5">
                      <div className="flex items-center justify-between text-xs">
                        <span className="text-foreground truncate max-w-[180px]">{charity.name}</span>
                        <span className="text-primary font-semibold">{pct}%</span>
                      </div>
                      <div className="w-full h-1.5 bg-surface-container-high rounded-full overflow-hidden">
                        <div className="h-full bg-primary rounded-full" style={{ width: `${pct}%` }} />
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        </div>

        {/* Quick Access Tiles */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
          <Link 
            to="/admin/users"
            className="p-5 rounded-2xl bg-surface-container border border-white/10 hover:border-primary/30 transition-all flex items-center justify-between group"
          >
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-primary/10 text-primary flex items-center justify-center">
                <Users className="w-5 h-5" />
              </div>
              <div>
                <h4 className="font-display font-bold text-sm text-foreground group-hover:text-primary transition-colors">Users & Scores</h4>
                <p className="text-xs text-muted-foreground">Manage players & edit scores</p>
              </div>
            </div>
            <ArrowRight className="w-4 h-4 text-muted-foreground group-hover:text-primary group-hover:translate-x-1 transition-transform" />
          </Link>

          <Link 
            to="/admin/draws"
            className="p-5 rounded-2xl bg-surface-container border border-white/10 hover:border-primary/30 transition-all flex items-center justify-between group"
          >
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-secondary/10 text-secondary flex items-center justify-center">
                <Zap className="w-5 h-5" />
              </div>
              <div>
                <h4 className="font-display font-bold text-sm text-foreground group-hover:text-secondary transition-colors">Draw Management</h4>
                <p className="text-xs text-muted-foreground">Random & algorithmic draws</p>
              </div>
            </div>
            <ArrowRight className="w-4 h-4 text-muted-foreground group-hover:text-secondary group-hover:translate-x-1 transition-transform" />
          </Link>

          <Link 
            to="/admin/winners"
            className="p-5 rounded-2xl bg-surface-container border border-white/10 hover:border-primary/30 transition-all flex items-center justify-between group"
          >
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-primary/10 text-primary flex items-center justify-center">
                <Trophy className="w-5 h-5" />
              </div>
              <div>
                <h4 className="font-display font-bold text-sm text-foreground group-hover:text-primary transition-colors">Winner Verification</h4>
                <p className="text-xs text-muted-foreground">Review scorecards & payouts</p>
              </div>
            </div>
            <ArrowRight className="w-4 h-4 text-muted-foreground group-hover:text-primary group-hover:translate-x-1 transition-transform" />
          </Link>
        </div>
      </div>
    </div>
  );
};

export default AdminOverview;
