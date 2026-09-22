import React, { createContext, useContext, useEffect, useState } from 'react';
import { supabase } from '../../lib/supabase';
import { clearUserCache } from '../../lib/cache';
import type { User, Profile } from '../../types';

interface AuthContextType {
  user: User | null;
  profile: Profile | null;
  loading: boolean;
  signOut: () => Promise<void>;
  refreshProfile: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let isMounted = true;

    // Safety watchdog: Auth initialization must never block the app longer than 5 seconds
    const watchdog = setTimeout(() => {
      if (isMounted) {
        setLoading((prev) => {
          if (prev) {
            console.warn('Auth initialization reached safety watchdog; releasing loading lock.');
            return false;
          }
          return prev;
        });
      }
    }, 5000);

    // Track active profile fetch to avoid duplicate concurrent calls
    let activeFetchUserId: string | null = null;

    const fetchProfile = async (userId: string, currentUser?: any) => {
      if (activeFetchUserId === userId) return;
      activeFetchUserId = userId;

      try {
        const { data, error } = await supabase
          .from('profiles')
          .select('*')
          .eq('id', userId)
          .maybeSingle();

        if (error) {
          console.error('Error fetching profile:', error);
        }

        if (isMounted) {
          if (data) {
            setProfile(data);
          } else {
            // Self-heal: If profile row is missing for an authenticated user, provision initial profile
            const userObj = currentUser || user;
            const newProfile = {
              id: userId,
              full_name: userObj?.user_metadata?.full_name || userObj?.email?.split('@')[0] || 'Member',
              email: userObj?.email || '',
              role: 'user' as const,
              onboarding_completed: false,
            };

            const { data: created, error: insertError } = await supabase
              .from('profiles')
              .upsert(newProfile)
              .select()
              .maybeSingle();

            if (!insertError && created) {
              setProfile(created);
            } else {
              setProfile(newProfile as any);
            }
          }
        }
      } catch (error) {
        console.error('Error in profile resolution:', error);
      } finally {
        activeFetchUserId = null;
        if (isMounted) {
          setLoading(false);
        }
      }
    };

    // Check active session
    const initAuth = async () => {
      try {
        const { data: { session } } = await supabase.auth.getSession();
        if (!isMounted) return;

        if (session?.user) {
          setUser(session.user as any);
          await fetchProfile(session.user.id, session.user);
        } else {
          setLoading(false);
        }
      } catch (error) {
        console.error('Error initializing auth:', error);
        if (isMounted) {
          setLoading(false);
        }
      }
    };

    initAuth();

    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (_event, session) => {
      if (!isMounted) return;

      if (session?.user) {
        setUser(session.user as any);
        await fetchProfile(session.user.id, session.user);
      } else {
        setUser(null);
        setProfile(null);
        setLoading(false);
      }
    });

    return () => {
      isMounted = false;
      clearTimeout(watchdog);
      subscription.unsubscribe();
    };
  }, []);

  const signOut = async () => {
    try {
      await supabase.auth.signOut();
    } catch (e) {
      console.error('Sign out error:', e);
    } finally {
      setUser(null);
      setProfile(null);
      clearUserCache();
    }
  };

  const refreshProfile = async () => {
    if (user?.id) {
      try {
        const { data } = await supabase
          .from('profiles')
          .select('*')
          .eq('id', user.id)
          .maybeSingle();
        if (data) setProfile(data);
      } catch (e) {
        console.error('Error refreshing profile:', e);
      }
    }
  };

  return (
    <AuthContext.Provider value={{ user, profile, loading, signOut, refreshProfile }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
