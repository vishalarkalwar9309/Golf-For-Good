import { supabase } from './supabase';
import type { Draw, DrawEntry, Winner } from '../types';

/**
 * Core Draw Engine Logic
 * Handles 5-number matching, prize splitting, and jackpot rollover.
 */

// PRD specifies 1-45 Stableford range
export const MIN_STABLEFORD = 1;
export const MAX_STABLEFORD = 45;

const TIER_SPLITS = {
  5: 0.40, // 40% of pool
  4: 0.35, // 35% of pool
  3: 0.25  // 25% of pool
};

/**
 * Generate 5 unique winning numbers.
 * PRD Requirement (§ 06): Stableford points range is strictly 1–45.
 * 
 * Modes:
 * 1. Random Mode: Standard lottery-style draw with uniform probability across 1–45.
 *    P(n) = 1 / 45 for each number.
 * 
 * 2. Algorithmic Mode (Weighted by Score Frequency):
 *    Directly satisfies PRD § 06: "Algorithmic — weighted by score frequency".
 *    Mathematical Formulation:
 *    a. Empirical Frequency Histogram:
 *       Given the set of all user-submitted Stableford scores across the platform,
 *       f(n) = count of occurrences of score n in [1, 45].
 *    b. Laplace / Baseline Smoothing:
 *       To guarantee that every number in [1, 45] remains eligible with non-zero probability
 *       even if not yet played by any user:
 *       weight(n) = f(n) + 1.
 *    c. Roulette-Wheel Weighted Sampling Without Replacement:
 *       Iteratively draw 5 distinct numbers. In each step k (from 1 to 5):
 *       - The probability of selecting an available number i is:
 *         P(i) = weight(i) / sum_{j in available}(weight(j))
 *       - A random threshold is generated in [0, total_available_weight).
 *       - The selected number is removed from the candidate pool (no duplicates).
 *    d. Descending Sort:
 *       The 5 drawn numbers are sorted in descending order (highest score first).
 * 
 * @param mode 'random' | 'algorithmic'
 * @param allScores User scores collection from the database for empirical frequency calculation
 */
export function generateWinningNumbers(mode: 'random' | 'algorithmic', allScores: any[] = []): number[] {
  if (mode === 'random') {
    const numbers: number[] = [];
    while (numbers.length < 5) {
      const num = Math.floor(Math.random() * (MAX_STABLEFORD - MIN_STABLEFORD + 1)) + MIN_STABLEFORD;
      if (!numbers.includes(num)) numbers.push(num);
    }
    return numbers.sort((a, b) => b - a); // Sort descending
  }

  // Algorithmic Mode: Empirical Frequency Distribution Weighted Sampling
  // Step 1: Compute frequency of each score 1..45 from actual platform data
  const frequencyMap = new Map<number, number>();
  for (let n = MIN_STABLEFORD; n <= MAX_STABLEFORD; n++) {
    frequencyMap.set(n, 0);
  }

  allScores.forEach(s => {
    const pts = Number(s.stableford_points);
    if (!isNaN(pts) && pts >= MIN_STABLEFORD && pts <= MAX_STABLEFORD) {
      frequencyMap.set(pts, (frequencyMap.get(pts) || 0) + 1);
    }
  });

  // Step 2: Build candidate pool with smoothed weights (f(n) + 1)
  const candidates: { number: number; weight: number }[] = [];
  for (let n = MIN_STABLEFORD; n <= MAX_STABLEFORD; n++) {
    candidates.push({
      number: n,
      weight: (frequencyMap.get(n) || 0) + 1
    });
  }

  // Step 3: Draw 5 distinct numbers via roulette-wheel weighted sampling without replacement
  const selectedNumbers: number[] = [];
  while (selectedNumbers.length < 5 && candidates.length > 0) {
    const totalWeight = candidates.reduce((sum, c) => sum + c.weight, 0);
    let randomThreshold = Math.random() * totalWeight;

    let selectedIndex = 0;
    for (let i = 0; i < candidates.length; i++) {
      randomThreshold -= candidates[i].weight;
      if (randomThreshold <= 0) {
        selectedIndex = i;
        break;
      }
    }

    selectedNumbers.push(candidates[selectedIndex].number);
    candidates.splice(selectedIndex, 1); // Remove selected to guarantee uniqueness
  }

  // Fallback in the rare event candidates exhausted
  while (selectedNumbers.length < 5) {
    const fallback = Math.floor(Math.random() * (MAX_STABLEFORD - MIN_STABLEFORD + 1)) + MIN_STABLEFORD;
    if (!selectedNumbers.includes(fallback)) selectedNumbers.push(fallback);
  }

  return selectedNumbers.sort((a, b) => b - a);
}

/**
 * Calculate matching numbers between entry and winning numbers.
 */
export function countMatches(entry: number[], winning: number[]): number {
  return entry.filter(num => winning.includes(num)).length;
}

/**
 * Get the current rollover amount from the latest published draw.
 */
export async function getLatestRollover(): Promise<number> {
  const { data, error } = await supabase
    .from('draws')
    .select('jackpot_rollover_amount')
    .eq('status', 'published')
    .order('created_at', { ascending: false })
    .limit(1)
    .maybeSingle();

  if (error) {
    console.error('Error fetching rollover:', error);
    return 0;
  }
  return data?.jackpot_rollover_amount || 0;
}

/**
 * Core Algorithm: Calculates simulation or final results.
 * PRD requirement: Auto-calculation of each pool tier based on active subscriber count.
 */
export async function calculateDrawResults(
  mode: 'random' | 'algorithmic',
  customWinningNumbers?: number[]
) {
  // 1. Fetch active subscribers
  const { data: subs, error: sErr } = await supabase
    .from('subscriptions')
    .select('user_id, amount, profiles(full_name)')
    .eq('status', 'active');
    
  if (sErr) throw sErr;
  if (!subs || subs.length === 0) throw new Error('No active subscribers found for draw');

  // PRD § 07: Auto-calculation of pool based on active subscriber count
  // 50% of active subscriber fees contribute to the prize pool
  const calculatedContribution = subs.reduce((sum, s) => sum + (Number(s.amount) || 25) * 0.5, 0);
  const currentPool = Math.max(calculatedContribution, 500); // Minimum guaranteed baseline
  const rollover = await getLatestRollover();
  const totalPool = Math.round((currentPool + rollover) * 100) / 100;

  // 3. Fetch scores for all subs
  const { data: allScores, error: scErr } = await supabase
    .from('scores')
    .select('user_id, stableford_points, date')
    .order('date', { ascending: false });
  if (scErr) throw scErr;

  // 4. Generate winning numbers if not provided
  const winningNumbers = customWinningNumbers || generateWinningNumbers(mode, allScores || []);

  // 5. Build user entries
  const entries = subs.map(sub => {
    const userScores = (allScores || [])
      .filter(s => s.user_id === sub.user_id)
      .slice(0, 5)
      .map(s => s.stableford_points);
    
    // Eligibility: Must have exactly 5 scores to enter the "Matrix"
    const isValid = userScores.length === 5;
    const matchCount = isValid ? countMatches(userScores, winningNumbers) : 0;

    return {
      user_id: sub.user_id,
      user_name: (sub as any).profiles?.full_name || 'Anonymous',
      entry_numbers: userScores,
      match_count: matchCount,
      is_eligible: isValid
    };
  });

  // 6. Split prize pool into tiers
  const tierWinners = {
    5: entries.filter(e => e.match_count === 5),
    4: entries.filter(e => e.match_count === 4),
    3: entries.filter(e => e.match_count === 3)
  };

  const prizeAllocations = {
    5: TIER_SPLITS[5] * totalPool,
    4: TIER_SPLITS[4] * totalPool,
    3: TIER_SPLITS[3] * totalPool
  };

  // 7. Calculate new rollover
  const newRollover = tierWinners[5].length === 0 ? prizeAllocations[5] : 0;

  // 8. Format winners
  const winners: Winner[] = [];
  [5, 4, 3].forEach(tier => {
    const tierW = tierWinners[tier as 5 | 4 | 3];
    if (tierW.length > 0) {
      const prizePerWinner = prizeAllocations[tier as 5 | 4 | 3] / tierW.length;
      tierW.forEach(w => {
        winners.push({
          user_id: w.user_id,
          user_name: w.user_name,
          prize_amount: Math.round(prizePerWinner * 100) / 100,
          match_count: tier
        });
      });
    }
  });

  return {
    winningNumbers,
    totalPool,
    currentPool,
    rollover,
    newRollover,
    participantsCount: entries.length,
    eligibleCount: entries.filter(e => e.is_eligible).length,
    tierBreakdown: {
      5: tierWinners[5].length,
      4: tierWinners[4].length,
      3: tierWinners[3].length
    },
    winners,
    allEntries: entries
  };
}

/**
 * Officially persistent a draw result.
 */
export async function finalizeAndPublishDraw(
  results: Awaited<ReturnType<typeof calculateDrawResults>>,
  mode: 'random' | 'algorithmic'
) {
  const drawMonth = new Date().toISOString().slice(0, 7);
  const drawYear = new Date().getFullYear().toString();

  console.log('[Draw Engine] Initiating publish for:', drawMonth);

  // 1. Check for existing draw to prevent duplicates/hangs
  const { data: existing } = await supabase
    .from('draws')
    .select('id')
    .eq('draw_month', drawMonth)
    .eq('status', 'published')
    .maybeSingle();

  if (existing) {
    throw new Error(`An official draw for ${drawMonth} has already been published.`);
  }

  // 2. Create the Draw record
  console.log('[Draw Engine] Creating draw record...');
  const { data: draw, error: dErr } = await supabase
    .from('draws')
    .insert([{
      draw_month: drawMonth,
      draw_year: drawYear,
      draw_mode: mode,
      winning_numbers: results.winningNumbers,
      prize_pool: results.totalPool,
      jackpot_rollover_amount: results.newRollover,
      status: 'published',
      winners: results.winners,
      published_at: new Date().toISOString()
    }])
    .select()
    .single();

  if (dErr) {
    console.error('[Draw Engine] Draw creation error:', dErr);
    throw dErr;
  }

  // 3. Create Draw Entries for all participants
  const entryRecords = results.allEntries.map(e => {
    const winnerData = results.winners.find(w => w.user_id === e.user_id);
    return {
      draw_id: draw.id,
      user_id: e.user_id,
      entry_numbers: e.entry_numbers,
      match_count: e.match_count,
      prize_amount: winnerData?.prize_amount || 0,
      winner_status: winnerData ? 'pending' : 'none'
    };
  });

  if (entryRecords.length > 0) {
    const { error: eErr } = await supabase
      .from('draw_entries')
      .insert(entryRecords);

    if (eErr) {
      console.error('[Draw Engine] Entry archival error:', eErr);
      throw eErr;
    }
  }

  console.log('[Draw Engine] Official draw published successfully.');
  return draw;
}
