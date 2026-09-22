import React, { Suspense } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate, useLocation } from 'react-router-dom';
import { AuthProvider, useAuth } from './components/auth/AuthProvider';
import Navbar from './components/layout/Navbar';
import Footer from './components/layout/Footer';

// Public Core Pages (Eagerly loaded for instant first paint)
import Home from './pages/Home';
import Charities from './pages/Charities';
import HowItWorks from './pages/HowItWorks';
import Login from './pages/Login';
import Signup from './pages/Signup';
import Leaderboard from './pages/Leaderboard';
import CharityDetail from './pages/CharityDetail';
import NotFound from './pages/NotFound';

// Lazy-loaded Authenticated & Admin Routes
const Onboarding = React.lazy(() => import('./pages/Onboarding'));
const DashboardLayout = React.lazy(() => import('./pages/dashboard/DashboardLayout'));
const DashboardOverview = React.lazy(() => import('./pages/dashboard/DashboardOverview'));
const Scores = React.lazy(() => import('./pages/dashboard/Scores'));
const Charity = React.lazy(() => import('./pages/dashboard/Charity'));
const Draws = React.lazy(() => import('./pages/dashboard/Draws'));
const Winnings = React.lazy(() => import('./pages/dashboard/Winnings'));
const Subscription = React.lazy(() => import('./pages/dashboard/Subscription'));
const Profile = React.lazy(() => import('./pages/dashboard/Profile'));

const AdminLayout = React.lazy(() => import('./pages/admin/AdminLayout'));
const AdminOverview = React.lazy(() => import('./pages/admin/AdminOverview'));
const AdminUsers = React.lazy(() => import('./pages/admin/Users'));
const AdminCharities = React.lazy(() => import('./pages/admin/Charities'));
const AdminDraws = React.lazy(() => import('./pages/admin/Draws'));
const AdminWinners = React.lazy(() => import('./pages/admin/Winners'));
const AdminAnalytics = React.lazy(() => import('./pages/admin/Analytics'));
const SubscriptionsPage = React.lazy(() => import('./pages/admin/Subscriptions'));

const PageFallback: React.FC = () => (
  <div className="min-h-[50vh] flex flex-col items-center justify-center bg-background text-primary gap-4">
    <div className="w-9 h-9 border-2 border-primary/20 border-t-primary rounded-full animate-spin" />
    <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground font-mono">Loading...</p>
  </div>
);

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

  return <>{children}</>;
};

const AuthCheck: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { user, profile, loading } = useAuth();
  const location = useLocation();

  if (loading) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-background text-primary gap-4">
        <div className="w-10 h-10 border-2 border-primary/20 border-t-primary rounded-full animate-spin" />
        <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Verifying session...</p>
      </div>
    );
  }

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
        <Suspense fallback={<PageFallback />}>
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
        </Suspense>
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
