import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate, useLocation } from 'react-router-dom';
import { AuthProvider, useAuth } from './components/auth/AuthProvider';
import Navbar from './components/layout/Navbar';
import Footer from './components/layout/Footer';

// Pages
import Home from './pages/Home';
import Charities from './pages/Charities';
import HowItWorks from './pages/HowItWorks';
import Login from './pages/Login';
import Signup from './pages/Signup';
import DashboardLayout from './pages/dashboard/DashboardLayout';
import Onboarding from './pages/Onboarding';
import DashboardOverview from './pages/dashboard/DashboardOverview';
import Scores from './pages/dashboard/Scores';
import Charity from './pages/dashboard/Charity';
import Draws from './pages/dashboard/Draws';
import Winnings from './pages/dashboard/Winnings';
import Subscription from './pages/dashboard/Subscription';
import AdminLayout from './pages/admin/AdminLayout';
import AdminOverview from './pages/admin/AdminOverview';
import AdminUsers from './pages/admin/Users';
import AdminCharities from './pages/admin/Charities';
import AdminDraws from './pages/admin/Draws';
import AdminWinners from './pages/admin/Winners';
import AdminAnalytics from './pages/admin/Analytics';
import SubscriptionsPage from './pages/admin/Subscriptions';
import Leaderboard from './pages/Leaderboard';

import Profile from './pages/dashboard/Profile';
import CharityDetail from './pages/CharityDetail';
import NotFound from './pages/NotFound';

const ProtectedRoute: React.FC<{ children: React.ReactNode; adminOnly?: boolean }> = ({ children, adminOnly }) => {
  const { user, profile, loading } = useAuth();
  const location = useLocation();

  if (loading) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-background text-primary gap-4">
        <div className="w-10 h-10 border-2 border-primary/20 border-t-primary rounded-full animate-spin" />
        <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Loading Golf For Good...</p>
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  if (adminOnly && profile?.role !== 'admin') {
    return <Navigate to="/dashboard" replace />;
  }
  
  // Force onboarding if not completed and not already on onboarding page
  if (profile && !profile.onboarding_completed && location.pathname !== '/onboarding' && profile.role !== 'admin') {
    return <Navigate to="/onboarding" replace />;
  }

  return <>{children}</>;
};

const AuthCheck: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { user, profile, loading } = useAuth();
  const location = useLocation();

  if (loading) return null;

  if (user) {
    let from = (location.state as any)?.from?.pathname;
    
    if (!from) {
      if (profile?.role === 'admin') {
        from = '/admin';
      } else if (profile && !profile.onboarding_completed) {
        from = '/onboarding';
      } else {
        from = '/dashboard';
      }
    }
    
    return <Navigate to={from} replace />;
  }

  return <>{children}</>;
};

const AppContent: React.FC = () => {
  const location = useLocation();
  const isDashboard = location.pathname.startsWith('/dashboard') || location.pathname.startsWith('/admin') || location.pathname === '/onboarding';

  return (
    <div className="min-h-screen flex flex-col">
      <Navbar />
      <main className="flex-grow">
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/charities" element={<Charities />} />
          <Route path="/charities/:slug" element={<CharityDetail />} />
          <Route path="/how-it-works" element={<HowItWorks />} />
          <Route path="/leaderboard" element={<Leaderboard />} />
          
          <Route path="/login" element={
            <AuthCheck>
              <Login />
            </AuthCheck>
          } />
          <Route path="/signup" element={
            <AuthCheck>
              <Signup />
            </AuthCheck>
          } />
          
          <Route path="/onboarding" element={
            <ProtectedRoute>
              <Onboarding />
            </ProtectedRoute>
          } />
          
          <Route path="/dashboard" element={
            <ProtectedRoute>
              <DashboardLayout />
            </ProtectedRoute>
          }>
            <Route index element={<DashboardOverview />} />
            <Route path="scores" element={<Scores />} />
            <Route path="charity" element={<Charity />} />
            <Route path="draws" element={<Draws />} />
            <Route path="winnings" element={<Winnings />} />
            <Route path="subscription" element={<Subscription />} />
            <Route path="profile" element={<Profile />} />
          </Route>
          
          <Route path="/admin" element={
            <ProtectedRoute adminOnly>
              <AdminLayout />
            </ProtectedRoute>
          }>
            <Route index element={<AdminOverview />} />
            <Route path="users" element={<AdminUsers />} />
            <Route path="charities" element={<AdminCharities />} />
            <Route path="draws" element={<AdminDraws />} />
            <Route path="winners" element={<AdminWinners />} />
            <Route path="subscriptions" element={<SubscriptionsPage />} />
            <Route path="analytics" element={<AdminAnalytics />} />
            <Route path="profile" element={<Profile />} />
          </Route>
          
          <Route path="*" element={<NotFound />} />
        </Routes>
      </main>
      {!isDashboard && <Footer />}
    </div>
  );
};

const App: React.FC = () => {
  return (
    <AuthProvider>
      <Router>
        <AppContent />
      </Router>
    </AuthProvider>
  );
};

export default App;
