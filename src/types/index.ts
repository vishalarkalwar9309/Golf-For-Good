export type UserRole = 'admin' | 'user';

export interface User {
  id: string;
  email: string;
  full_name: string;
  role: UserRole;
  avatar_url?: string;
  created_at: string;
}

export interface Profile extends User {
  subscription_status: 'active' | 'inactive' | 'cancelled' | 'lapsed';
  subscription_tier: 'monthly' | 'yearly' | 'free' | 'none';
  selected_charity_id?: string;
  onboarding_completed?: boolean;
  lifetime_winnings: number;
  total_impact: number;
}

export interface Charity {
  id: string;
  name: string;
  slug: string;
  description: string;
  long_description?: string;
  logo_url: string;
  image_url?: string;
  website_url: string;
  total_raised: number;
  category: string;
  featured?: boolean;
  upcoming_events?: Array<{ title: string; date: string; location: string }>;
}

export interface Score {
  id: string;
  user_id: string;
  stableford_points: number;
  course_name: string;
  date: string;
  created_at: string;
}

export interface Draw {
  id: string;
  draw_month: string; // YYYY-MM
  draw_year: string; // YYYY
  draw_mode: 'random' | 'algorithmic';
  winning_numbers: number[];
  prize_pool: number;
  jackpot_rollover_amount: number;
  status: 'pending' | 'published';
  winners: Winner[];
  published_at?: string;
  created_at: string;
}

export interface DrawEntry {
  id: string;
  draw_id: string;
  user_id: string;
  entry_numbers: number[];
  match_count: number;
  prize_amount: number;
  winner_status: 'none' | 'pending' | 'approved' | 'rejected';
  created_at: string;
  draw?: Draw;
  user?: Profile;
}

export interface Winner {
  user_id: string;
  user_name: string;
  prize_amount: number;
  match_count: number;
  rank?: number;
}

export interface SubscriptionPlan {
  id: string;
  name: string;
  price: number;
  interval: 'month' | 'year';
  features: string[];
}

export interface UserSubscription {
  id: string;
  user_id: string;
  charity_id?: string;
  plan_type: 'monthly' | 'yearly' | 'free';
  amount: number;
  charity_percentage: number;
  status: 'active' | 'inactive' | 'cancelled' | 'lapsed';
  start_date: string;
  renewal_date: string;
  stripe_customer_id?: string;
  stripe_subscription_id?: string;
  created_at: string;
}

export interface Donation {
  id: string;
  user_id: string;
  charity_id: string;
  subscription_id: string | null;
  amount: number;
  donation_type: 'independent' | 'subscription_share';
  created_at: string;
}
