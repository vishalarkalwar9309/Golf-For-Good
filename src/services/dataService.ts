import { supabase } from '../lib/supabase';
import { 
  fetchWithCache, 
  getCached, 
  setCached, 
  invalidateCache, 
  clearUserCache,
  CACHE_TTL 
} from '../lib/cache';
import type { Charity, Score, Draw, UserSubscription, DrawEntry } from '../types';

/**
 * Public Data Services (Never blocked by auth)
 */

export async function fetchCharities(forceRefresh = false): Promise<Charity[]> {
  return fetchWithCache<Charity[]>(
    'public:charities',
    async () => {
      const { data, error } = await supabase
        .from('charities')
        .select('*')
        .order('total_raised', { ascending: false });

      if (error) throw error;
      return data || [];
    },
    { ttl: CACHE_TTL.PUBLIC_CHARITIES, forceRefresh, timeoutMs: 8000 }
  );
}

export function getCachedCharities(): Charity[] | null {
  return getCached<Charity[]>('public:charities');
}

export async function fetchLatestPublishedDraw(forceRefresh = false): Promise<Draw | null> {
  return fetchWithCache<Draw | null>(
    'public:latest_published_draw',
    async () => {
      const { data, error } = await supabase
        .from('draws')
        .select('*')
        .eq('status', 'published')
        .order('created_at', { ascending: false })
        .limit(1)
        .maybeSingle();

      if (error) throw error;
      return data;
    },
    { ttl: CACHE_TTL.PUBLIC_DRAWS, forceRefresh, timeoutMs: 8000 }
  );
}

export function getCachedLatestDraw(): Draw | null {
  return getCached<Draw | null>('public:latest_published_draw');
}

/**
 * User-Scoped Data Services (Strictly partitioned by userId)
 */

export async function fetchUserScores(userId: string, forceRefresh = false): Promise<Score[]> {
  if (!userId) return [];
  const key = `user:scores:${userId}`;

  return fetchWithCache<Score[]>(
    key,
    async () => {
      const { data, error } = await supabase
        .from('scores')
        .select('*')
        .eq('user_id', userId)
        .order('date', { ascending: false })
        .limit(5);

      if (error) throw error;
      return data || [];
    },
    { ttl: CACHE_TTL.USER_SCORES, userId, forceRefresh, timeoutMs: 8000 }
  );
}

export function getCachedUserScores(userId: string): Score[] | null {
  if (!userId) return null;
  return getCached<Score[]>(`user:scores:${userId}`, userId);
}

export async function fetchUserSubscription(userId: string, forceRefresh = false): Promise<UserSubscription | null> {
  if (!userId) return null;
  const key = `user:subscription:${userId}`;

  return fetchWithCache<UserSubscription | null>(
    key,
    async () => {
      const { data, error } = await supabase
        .from('subscriptions')
        .select('*')
        .eq('user_id', userId)
        .maybeSingle();

      if (error) throw error;
      return data;
    },
    { ttl: CACHE_TTL.USER_SUBSCRIPTION, userId, forceRefresh, timeoutMs: 8000 }
  );
}

export function getCachedUserSubscription(userId: string): UserSubscription | null {
  if (!userId) return null;
  return getCached<UserSubscription | null>(`user:subscription:${userId}`, userId);
}

export async function fetchUserDrawEntry(userId: string, drawId: string, forceRefresh = false): Promise<DrawEntry | null> {
  if (!userId || !drawId) return null;
  const key = `user:draw_entry:${userId}:${drawId}`;

  return fetchWithCache<DrawEntry | null>(
    key,
    async () => {
      const { data, error } = await supabase
        .from('draw_entries')
        .select('*')
        .eq('draw_id', drawId)
        .eq('user_id', userId)
        .maybeSingle();

      if (error) throw error;
      return data;
    },
    { ttl: CACHE_TTL.USER_ENTRIES, userId, forceRefresh, timeoutMs: 8000 }
  );
}

export function getCachedUserDrawEntry(userId: string, drawId: string): DrawEntry | null {
  if (!userId || !drawId) return null;
  return getCached<DrawEntry | null>(`user:draw_entry:${userId}:${drawId}`, userId);
}

/**
 * Cache Invalidation on Mutations
 */

export function invalidateScores(userId: string): void {
  invalidateCache(`user:scores:${userId}`);
  invalidateCache('public:leaderboard');
}

export function invalidateSubscription(userId: string): void {
  invalidateCache(`user:subscription:${userId}`);
  invalidateCache(`user:profile:${userId}`);
}

export function invalidateCharityData(): void {
  invalidateCache('public:charities');
}

export function invalidateDrawData(userId?: string): void {
  invalidateCache('public:latest_published_draw');
  if (userId) {
    invalidateCache(`user:draw_entry:${userId}`);
  }
}

export { clearUserCache };
