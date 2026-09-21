import React, { useState, useEffect } from 'react';
import { motion } from 'motion/react';
import { 
  BarChart3, TrendingUp, Users, 
  Download, Calendar, Award, Heart
} from 'lucide-react';
import { 
  ResponsiveContainer, AreaChart, Area, 
  XAxis, YAxis, CartesianGrid, Tooltip, 
  PieChart, Pie, Cell
} from 'recharts';
import { supabase } from '../../lib/supabase';
import { cn, formatCurrency } from '../../lib/utils';
import { usePageTitle } from '../../hooks/usePageTitle';
import { AbstractGraphic } from '../../components/ui/AbstractGraphic';

const Analytics: React.FC = () => {
  usePageTitle('Reports & Analytics | Admin');
  const [loading, setLoading] = useState(true);
  const [data, setData] = useState<any>({
    revenueHistory: [],
    charityImpact: [],
    userSegments: [],
    currentMRR: 0,
    totalPrizePool: 0,
    totalDraws: 0,
    totalPaidPrizes: 0,
    totalCharityRaised: 0,
    paidWinnersCount: 0,
    subCount: 0,
    totalCount: 0
  });
  const [dateRange, setDateRange] = useState('6M');

  useEffect(() => {
    fetchAnalytics();
  }, [dateRange]);

  const handleExport = () => {
    const csvContent = [
      'Month,Revenue,Growth',
      ...data.revenueHistory.map((h: any) => `${h.month},${h.revenue},${h.growth}%`)
    ].join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `analytics_export_${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
  };

  const handleFilter = () => {
    const ranges = ['1M', '3M', '6M', '1Y', 'ALL'];
    const nextIndex = (ranges.indexOf(dateRange) + 1) % ranges.length;
    setDateRange(ranges[nextIndex]);
  };

  const fetchAnalytics = async () => {
    setLoading(true);
    try {
      const [
        { count: totalUsers },
        { data: activeSubs },
        { data: charities },
        { data: draws },
        { data: drawEntries },
        { data: donations }
      ] = await Promise.all([
        supabase.from('profiles').select('*', { count: 'exact', head: true }),
        supabase.from('subscriptions').select('id, amount, plan_type, status, created_at').eq('status', 'active'),
        supabase.from('charities').select('name, total_raised').order('total_raised', { ascending: false }),
        supabase.from('draws').select('id, draw_month, prize_pool, jackpot_rollover_amount, created_at').eq('status', 'published').order('created_at', { ascending: true }),
        supabase.from('draw_entries').select('match_count, prize_amount, winner_status'),
        supabase.from('donations').select('amount, created_at')
      ]);

      const subCount = activeSubs?.length || 0;
      const totalCount = totalUsers || 0;

      // Calculate MRR from active subscriptions
      const currentMRR = (activeSubs || []).reduce((sum, s) => {
        const amt = Number(s.amount) || (s.plan_type === 'yearly' ? 250 : 25);
        return sum + (s.plan_type === 'yearly' ? amt / 12 : amt);
      }, 0);

      const totalPrizePool = (draws || []).reduce((sum, d) => sum + (Number(d.prize_pool) || 0), 0);
      const totalDraws = draws?.length || 0;

      const paidEntries = (drawEntries || []).filter(e => e.winner_status === 'paid');
      const paidWinnersCount = paidEntries.length;
      const totalPaidPrizes = paidEntries.reduce((sum, e) => sum + (Number(e.prize_amount) || 0), 0);

      const totalCharityRaised = (charities || []).reduce((sum, c) => sum + (Number(c.total_raised) || 0), 0);

      const monthsBack = dateRange === '1M' ? 1 : dateRange === '3M' ? 3 : dateRange === '1Y' ? 12 : 6;
      const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
      const now = new Date();
      
      const computedHistory = [];
      let prevRev = 0;

      for (let i = monthsBack - 1; i >= 0; i--) {
        const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
        const label = monthNames[d.getMonth()];

        const activeInMonth = (activeSubs || []).filter(s => {
          const subDate = new Date(s.created_at || now);
          return subDate <= new Date(d.getFullYear(), d.getMonth() + 1, 0);
        });

        const monthDonations = (donations || []).filter(don => {
          const donDate = new Date(don.created_at || now);
          return donDate.getMonth() === d.getMonth() && donDate.getFullYear() === d.getFullYear();
        }).reduce((sum, don) => sum + (Number(don.amount) || 0), 0);

        const subRev = activeInMonth.reduce((sum, s) => {
          const amt = Number(s.amount) || (s.plan_type === 'yearly' ? 250 : 25);
          return sum + (s.plan_type === 'yearly' ? amt / 12 : amt);
        }, 0);

        const totalMonthRev = Math.round(subRev + monthDonations);
        const growth = prevRev > 0 ? Math.round(((totalMonthRev - prevRev) / prevRev) * 100) : 0;
        prevRev = totalMonthRev;

        computedHistory.push({
          month: label,
          revenue: totalMonthRev > 0 ? totalMonthRev : Math.round(currentMRR),
          growth
        });
      }

      setData({
        revenueHistory: computedHistory,
        charityImpact: charities || [],
        userSegments: [
          { name: 'Active Members', value: subCount, color: '#10B981' },
          { name: 'Community Only', value: Math.max(0, totalCount - subCount), color: '#374151' }
        ],
        currentMRR: Math.round(currentMRR),
        totalPrizePool,
        totalDraws,
        totalPaidPrizes,
        totalCharityRaised,
        paidWinnersCount,
        subCount,
        totalCount
      });
    } catch (err) {
      console.error('Error fetching analytics:', err);
    } finally {
      setLoading(false);
    }
  };

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
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-primary/10 border border-primary/20 text-primary text-xs font-semibold mb-2">
              <BarChart3 className="w-4 h-4" />
              <span>Executive Reporting</span>
            </div>
            <h1 className="text-3xl sm:text-4xl font-display font-bold tracking-tight text-foreground">
              Analytics & Performance Insights
            </h1>
            <p className="text-muted-foreground text-sm mt-1 max-w-xl">
              Financial trends, subscriber acquisition velocity, charity distribution aggregates, and draw prize pools.
            </p>
          </div>

          <div className="flex items-center gap-3">
            <button 
              onClick={handleExport}
              className="inline-flex items-center gap-2 px-4 py-2.5 bg-surface-container border border-white/10 text-foreground rounded-xl text-xs font-semibold hover:bg-surface-container-high transition-colors"
            >
              <Download className="w-3.5 h-3.5" />
              <span>Export CSV</span>
            </button>
            <button 
              onClick={handleFilter}
              className="inline-flex items-center gap-2 px-4 py-2.5 bg-primary text-primary-foreground rounded-xl text-xs font-semibold hover:opacity-90 transition-opacity shadow-sm"
            >
              <Calendar className="w-3.5 h-3.5" />
              <span>Range: {dateRange}</span>
            </button>
          </div>
        </div>

        {/* 4-Stat Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          <div className="bg-surface-container border border-white/10 rounded-2xl p-5 space-y-1">
            <span className="text-xs uppercase font-semibold text-muted-foreground block">
              Monthly Recurring Revenue
            </span>
            <span className="text-2xl sm:text-3xl font-display font-black text-primary">
              {formatCurrency(data.currentMRR)}
            </span>
            <span className="text-[11px] text-muted-foreground block pt-1">
              Active Member Subscriptions
            </span>
          </div>

          <div className="bg-surface-container border border-white/10 rounded-2xl p-5 space-y-1">
            <span className="text-xs uppercase font-semibold text-muted-foreground block">
              Total Prizes Generated
            </span>
            <span className="text-2xl sm:text-3xl font-display font-black text-secondary">
              {formatCurrency(data.totalPrizePool)}
            </span>
            <span className="text-[11px] text-muted-foreground block pt-1">
              Across {data.totalDraws} Finalized Draws
            </span>
          </div>

          <div className="bg-surface-container border border-white/10 rounded-2xl p-5 space-y-1">
            <span className="text-xs uppercase font-semibold text-muted-foreground block">
              Total Charity Raised
            </span>
            <span className="text-2xl sm:text-3xl font-display font-black text-primary">
              {formatCurrency(data.totalCharityRaised)}
            </span>
            <span className="text-[11px] text-muted-foreground block pt-1">
              100% Direct Pass-Through
            </span>
          </div>

          <div className="bg-surface-container border border-white/10 rounded-2xl p-5 space-y-1">
            <span className="text-xs uppercase font-semibold text-muted-foreground block">
              Member Conversion Rate
            </span>
            <span className="text-2xl sm:text-3xl font-display font-black text-foreground">
              {Math.round((data.subCount / Math.max(data.totalCount, 1)) * 100)}%
            </span>
            <span className="text-[11px] text-muted-foreground block pt-1">
              {data.subCount} Active of {data.totalCount} Players
            </span>
          </div>
        </div>

        {/* Charts Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Revenue Chart */}
          <div className="lg:col-span-2 bg-surface-container border border-white/10 rounded-3xl p-6 sm:p-8 flex flex-col h-[460px]">
            <div className="flex items-center justify-between mb-8">
              <div>
                <h3 className="font-display font-bold text-lg text-foreground">
                  Revenue Growth Trajectory
                </h3>
                <p className="text-xs text-muted-foreground mt-0.5">
                  Monthly recurring revenue including direct voluntary contributions.
                </p>
              </div>
              <span className="text-xs font-display font-bold text-primary">
                Current MRR: {formatCurrency(data.currentMRR)}
              </span>
            </div>

            <div className="flex-grow">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={data.revenueHistory}>
                  <defs>
                    <linearGradient id="areaColor" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#10B981" stopOpacity={0.2}/>
                      <stop offset="95%" stopColor="#10B981" stopOpacity={0}/>
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="#ffffff0a" vertical={false} />
                  <XAxis dataKey="month" stroke="#ffffff40" fontSize={11} tickLine={false} axisLine={false} dy={10} />
                  <YAxis stroke="#ffffff40" fontSize={11} tickLine={false} axisLine={false} tickFormatter={(v) => `$${v/1000}k`} />
                  <Tooltip 
                    contentStyle={{ 
                      backgroundColor: '#10121A', 
                      border: '1px solid rgba(255,255,255,0.1)',
                      borderRadius: '12px',
                      fontSize: '12px'
                    }}
                  />
                  <Area type="monotone" dataKey="revenue" stroke="#10B981" strokeWidth={2.5} fill="url(#areaColor)" />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Member Segment Breakdown */}
          <div className="bg-surface-container border border-white/10 rounded-3xl p-6 sm:p-8 flex flex-col h-[460px] justify-between">
            <div>
              <h3 className="font-display font-bold text-lg text-foreground flex items-center gap-2">
                <Users className="w-4 h-4 text-primary" />
                <span>Member Composition</span>
              </h3>
              <p className="text-xs text-muted-foreground mt-0.5">
                Active subscribers vs. free community players.
              </p>
            </div>

            <div className="relative h-48 my-auto">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={data.userSegments}
                    innerRadius={60}
                    outerRadius={85}
                    paddingAngle={4}
                    dataKey="value"
                  >
                    {data.userSegments.map((entry: any, index: number) => (
                      <Cell key={`cell-${index}`} fill={entry.color} stroke="none" />
                    ))}
                  </Pie>
                  <Tooltip />
                </PieChart>
              </ResponsiveContainer>
              <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
                <p className="text-3xl font-display font-black text-foreground">{data.totalCount}</p>
                <p className="text-[10px] uppercase font-bold text-muted-foreground">Total Players</p>
              </div>
            </div>

            <div className="space-y-3 pt-4 border-t border-white/10 text-xs">
              {data.userSegments.map((seg: any, idx: number) => (
                <div key={idx} className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <div className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: seg.color }} />
                    <span className="text-muted-foreground">{seg.name}</span>
                  </div>
                  <span className="font-display font-bold text-foreground">{seg.value}</span>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Charity Impact Allocation */}
        <div className="bg-surface-container border border-white/10 rounded-3xl p-6 sm:p-8 space-y-6">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="font-display font-bold text-lg text-foreground flex items-center gap-2">
                <Heart className="w-4 h-4 text-primary" />
                <span>Charity Partner Distribution</span>
              </h3>
              <p className="text-xs text-muted-foreground mt-0.5">
                Total funds raised across leading non-profit beneficiaries.
              </p>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {data.charityImpact.slice(0, 4).map((charity: any, idx: number) => (
              <div key={idx} className="p-4 rounded-2xl bg-surface-container-high border border-white/10 space-y-2">
                <div className="flex items-center justify-between text-xs">
                  <span className="font-semibold text-foreground truncate max-w-[140px]">{charity.name}</span>
                  <span className="font-display font-bold text-primary">{formatCurrency(charity.total_raised)}</span>
                </div>
                <div className="w-full h-1.5 bg-surface-container rounded-full overflow-hidden">
                  <div 
                    className="h-full bg-primary rounded-full"
                    style={{ width: `${Math.min(100, Math.max(15, (charity.total_raised / Math.max(data.totalCharityRaised, 1)) * 100))}%` }}
                  />
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

export default Analytics;
