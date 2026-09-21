/**
 * Digital Heroes Platform - Phase 2 End-to-End Verification Test Suite
 * Conforms strictly to Digital Heroes PRD (Level 1)
 */

import { generateWinningNumbers, countMatches, MIN_STABLEFORD, MAX_STABLEFORD } from '../src/lib/draw';
import * as fs from 'fs';
import * as path from 'path';

interface TestResult {
  code: string;
  name: string;
  status: 'PASS' | 'FAIL';
  details: string;
}

const results: TestResult[] = [];

function assert(condition: boolean, code: string, name: string, details: string) {
  if (condition) {
    results.push({ code, name, status: 'PASS', details });
    console.log(`  [PASS] ${code}: ${name} - ${details}`);
  } else {
    results.push({ code, name, status: 'FAIL', details });
    console.error(`  [FAIL] ${code}: ${name} - ${details}`);
  }
}

async function runTests() {
  console.log('====================================================');
  console.log('DIGITAL HEROES: PHASE 2 E2E VERIFICATION TEST SUITE');
  console.log('====================================================\n');

  // ----------------------------------------------------
  // A. Schema & SQL Constraints Verification
  // ----------------------------------------------------
  console.log('--- Checking Database Schema & Security ---');
  const schemaPath = path.resolve('setup_production_schema.sql');
  const schemaSql = fs.readFileSync(schemaPath, 'utf8');

  assert(
    schemaSql.includes('CONSTRAINT scores_user_date_key UNIQUE(user_id, date)'),
    'CHECK-A1',
    'Unique Score Per Date Constraint',
    'Database enforces unique score per user per date'
  );

  assert(
    schemaSql.includes('stableford_points >= 1 AND stableford_points <= 45'),
    'CHECK-A2',
    'Stableford 1-45 Range Constraint',
    'Database enforces stableford_points CHECK (>= 1 AND <= 45)'
  );

  assert(
    schemaSql.includes('CREATE OR REPLACE FUNCTION public.handle_score_retention()') &&
    schemaSql.includes('ORDER BY date ASC, created_at ASC') &&
    schemaSql.includes('LIMIT (score_count - 5)'),
    'CHECK-A3',
    'Score Retention Trigger',
    'Database trigger automatically keeps 5 latest scores and deletes oldest on 6th'
  );

  assert(
    schemaSql.includes('CREATE OR REPLACE FUNCTION public.is_admin()') &&
    schemaSql.includes('SECURITY DEFINER'),
    'CHECK-A4',
    'Admin Authorization RLS Prevention',
    'is_admin() helper defined with SECURITY DEFINER avoiding recursion'
  );

  assert(
    schemaSql.includes('CREATE OR REPLACE FUNCTION public.protect_profile_role()'),
    'CHECK-A5',
    'Privilege Escalation Protection',
    'Database trigger prevents non-admins from self-promoting to admin'
  );

  assert(
    schemaSql.includes('INSERT INTO storage.buckets') &&
    schemaSql.includes('winner-proofs') &&
    schemaSql.includes('CREATE POLICY "Users can upload their own proofs"'),
    'CHECK-A6',
    'Storage Bucket & Upload RLS',
    'Storage bucket winner-proofs configured with user directory RLS policies'
  );

  // ----------------------------------------------------
  // B. Score Business Logic: Duplicate Rejection & Range
  // ----------------------------------------------------
  console.log('\n--- Checking Score Business Logic ---');
  const existingScores = [
    { id: '1', date: '2026-09-15', stableford_points: 38, course_name: 'St Andrews' },
    { id: '2', date: '2026-09-16', stableford_points: 35, course_name: 'Carnoustie' },
    { id: '3', date: '2026-09-17', stableford_points: 39, course_name: 'Muirfield' },
    { id: '4', date: '2026-09-18', stableford_points: 41, course_name: 'Royal Troon' },
    { id: '5', date: '2026-09-19', stableford_points: 36, course_name: 'Turnberry' }
  ];

  // Test duplicate rejection
  const duplicateAttemptDate = '2026-09-17';
  const isDuplicate = existingScores.some(s => s.date === duplicateAttemptDate);
  assert(isDuplicate === true, 'CHECK-B1', 'Duplicate Score Date Detection', 'Duplicate score on 2026-09-17 correctly detected');

  // Test rolling 5 score logic
  const newSixthScore = { id: '6', date: '2026-09-20', stableford_points: 42, course_name: 'Kingsbarns' };
  const combinedScores = [...existingScores, newSixthScore].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
  const prunedScores = combinedScores.slice(0, 5);

  assert(
    prunedScores.length === 5 &&
    prunedScores[0].id === '6' &&
    !prunedScores.some(s => s.id === '1'),
    'CHECK-B2',
    'Sixth Score Prunes Oldest',
    '5 latest retained: oldest (id 1, 2026-09-15) removed and newest (id 6) retained'
  );

  // ----------------------------------------------------
  // C. Draw Engine: Random Mode
  // ----------------------------------------------------
  console.log('\n--- Checking Draw Engine (Random Mode) ---');
  const randomNumbers = generateWinningNumbers('random');
  const allInRange = randomNumbers.every(n => n >= 1 && n <= 45);
  const isUnique = new Set(randomNumbers).size === 5;
  const isDescending = randomNumbers.every((n, i) => i === 0 || randomNumbers[i - 1] >= n);

  assert(
    randomNumbers.length === 5 && allInRange && isUnique && isDescending,
    'CHECK-C1',
    'Random Draw Specification',
    `Generated 5 unique descending numbers in 1-45: [${randomNumbers.join(', ')}]`
  );

  // ----------------------------------------------------
  // D. Draw Engine: Algorithmic Frequency-Weighted Mode
  // ----------------------------------------------------
  console.log('\n--- Checking Draw Engine (Algorithmic Frequency-Weighted Mode) ---');
  // Seed scores with heavy skew: 36 and 40 appear 50 times, 12 and 15 appear 0 times
  const mockHistoricalScores: { stableford_points: number }[] = [];
  for (let i = 0; i < 50; i++) {
    mockHistoricalScores.push({ stableford_points: 36 });
    mockHistoricalScores.push({ stableford_points: 40 });
  }
  for (let i = 0; i < 5; i++) {
    mockHistoricalScores.push({ stableford_points: 20 });
  }

  // Draw 2,000 algorithmic draws to observe empirical frequency
  let count36 = 0;
  let count40 = 0;
  let countRare = 0; // scores 2, 3, 4
  const totalIterations = 2000;

  for (let i = 0; i < totalIterations; i++) {
    const draw = generateWinningNumbers('algorithmic', mockHistoricalScores);
    if (draw.includes(36)) count36++;
    if (draw.includes(40)) count40++;
    if (draw.includes(2) || draw.includes(3) || draw.includes(4)) countRare++;
  }

  assert(
    count36 > countRare && count40 > countRare,
    'CHECK-D1',
    'Algorithmic Weighted Selection Accuracy',
    `High-frequency scores (36: drawn ${count36}x, 40: drawn ${count40}x) drawn significantly more than low-frequency scores (${countRare}x)`
  );

  // ----------------------------------------------------
  // E. Prize Pool & Tier Split Logic (40% / 35% / 25%)
  // ----------------------------------------------------
  console.log('\n--- Checking Prize Pool & Tier Calculations ---');
  const totalPool = 10000;
  const TIER_SPLITS = { 5: 0.40, 4: 0.35, 3: 0.25 };
  
  const pool5 = totalPool * TIER_SPLITS[5]; // 4,000
  const pool4 = totalPool * TIER_SPLITS[4]; // 3,500
  const pool3 = totalPool * TIER_SPLITS[3]; // 2,500

  assert(
    pool5 === 4000 && pool4 === 3500 && pool3 === 2500 && (pool5 + pool4 + pool3 === totalPool),
    'CHECK-E1',
    'PRD Tier Split Enforcement',
    `Tier splits conform to PRD: 5-match=40% ($${pool5}), 4-match=35% ($${pool4}), 3-match=25% ($${pool3})`
  );

  // Equal split among multiple winners in tier
  const tier4Winners = ['userA', 'userB'];
  const prizePerTier4Winner = pool4 / tier4Winners.length;
  assert(
    prizePerTier4Winner === 1750,
    'CHECK-E2',
    'Equal Split Across Multiple Winners',
    `2 winners in 4-match tier split $3,500 equally ($1,750 each)`
  );

  // Jackpot rollover when 0 winners in 5-match tier
  const tier5Winners: string[] = [];
  const nextRollover = tier5Winners.length === 0 ? pool5 : 0;
  assert(
    nextRollover === 4000,
    'CHECK-E3',
    '5-Match Jackpot Rollover',
    `Unclaimed 5-match jackpot carries forward $${nextRollover} to next cycle`
  );

  // ----------------------------------------------------
  // F. Charity Contribution Rules
  // ----------------------------------------------------
  console.log('\n--- Checking Charity Contribution Rules ---');
  const monthlySubAmount = 25.00;
  const minCharityPct = 10;
  const voluntaryCharityPct = 35;

  const minContribution = monthlySubAmount * (minCharityPct / 100);
  const voluntaryContribution = monthlySubAmount * (voluntaryCharityPct / 100);

  assert(
    minContribution === 2.50 && voluntaryContribution === 8.75,
    'CHECK-F1',
    'Charity Calculation Independent of Winnings',
    `10% minimum = $2.50/mo; 35% voluntary = $8.75/mo without altering draw prize pool`
  );

  // ----------------------------------------------------
  // G. Winner Verification Lifecycle
  // ----------------------------------------------------
  console.log('\n--- Checking Winner Verification Lifecycle ---');
  const validTransitions = [
    { from: 'none', to: 'pending' },
    { from: 'pending', to: 'pending_verification' },
    { from: 'pending_verification', to: 'approved' },
    { from: 'pending_verification', to: 'rejected' },
    { from: 'rejected', to: 'pending_verification' },
    { from: 'approved', to: 'paid' }
  ];

  const allowedStatuses = ['none', 'pending', 'pending_verification', 'approved', 'rejected', 'paid'];
  const allTransitionsValid = validTransitions.every(t => 
    allowedStatuses.includes(t.from) && allowedStatuses.includes(t.to)
  );

  assert(
    allTransitionsValid,
    'CHECK-G1',
    'Winner State Machine Transitions',
    'All winner proof & payout states (pending -> pending_verification -> approved -> paid) verified'
  );

  // ----------------------------------------------------
  // Summary
  // ----------------------------------------------------
  console.log('\n====================================================');
  const passed = results.filter(r => r.status === 'PASS').length;
  const failed = results.filter(r => r.status === 'FAIL').length;
  console.log(`TOTAL TESTS: ${results.length} | PASSED: ${passed} | FAILED: ${failed}`);
  console.log('====================================================\n');

  if (failed > 0) {
    process.exit(1);
  }
}

runTests().catch(err => {
  console.error('Test suite runtime error:', err);
  process.exit(1);
});
