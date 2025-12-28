import React, { useState, useEffect } from 'react';
import { HashRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import Navbar from './components/Navbar';
import Sidebar from './components/Sidebar';
import Home from './pages/Home';
import ImageDetail from './pages/ImageDetail';
import AdminLogin from './pages/AdminLogin';
import AdminDashboard from './pages/AdminDashboard';
import AdminGenerator from './pages/AdminGenerator';
import Footer from './components/Footer';

// New Legal/Support pages
import Terms from './pages/Terms';
import Privacy from './pages/Privacy';
import Contact from './pages/Contact';
import About from './pages/About';
import FAQ from './pages/FAQ'; // <--- IMPORT FAQ
import AnalyticsPage from './pages/AnalyticsPage'; 

// Christmas Components
import Snowfall from './components/Christmas/Snowfall';
import HolidayGift from './components/Christmas/HolidayGift';
import ChristmasPage from './pages/ChristmasPage';

import { supabase, supabaseService } from './services/supabaseService';

const App: React.FC = () => {
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [authLoading, setAuthLoading] = useState(true);

  // CHRISTMAS EVENT TOGGLE
  const ENABLE_EVENT = true; 
  
  const isChristmasSeason = () => {
    if (!ENABLE_EVENT) return false;
    const today = new Date();
    return today.getMonth() === 11 && today.getDate() <= 26;
  };

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setIsAuthenticated(!!session);
      setAuthLoading(false);
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setIsAuthenticated(!!session);
      setAuthLoading(false);
    });

    return () => subscription.unsubscribe();
  }, []);

  const toggleSidebar = () => setIsSidebarOpen(!isSidebarOpen);
  const closeSidebar = () => setIsSidebarOpen(false);

  const handleLogout = async () => {
    await supabaseService.logout();
    setIsAuthenticated(false);
    closeSidebar();
  };

  const ProtectedRoute = ({ children }: { children: React.ReactElement }) => {
    if (authLoading) return <div className="min-h-screen bg-background flex items-center justify-center"><div className="w-8 h-8 border-t-2 border-accent rounded-full animate-spin"></div></div>;
    if (!isAuthenticated) return <Navigate to="/admin/login" replace />;
    return children;
  };

  return (
    <Router>
      <div className="flex flex-col min-h-screen bg-background text-textPrimary font-sans selection:bg-accent selection:text-black relative overflow-x-hidden">
        
        {isChristmasSeason() && (
          <>
            <Snowfall />
            <HolidayGift />
          </>
        )}

        <Navbar onToggleSidebar={toggleSidebar} />
        <Sidebar 
            isOpen={isSidebarOpen} 
            onClose={closeSidebar} 
            isAuthenticated={isAuthenticated}
            onLogout={handleLogout}
        />

        <main className="relative z-0 flex-grow">
          <Routes>
            <Route path="/" element={<Home />} />
            <Route path="/image/:id" element={<ImageDetail />} />
            
            {/* Public Routes */}
            <Route path="/terms" element={<Terms />} />
            <Route path="/privacy" element={<Privacy />} />
            <Route path="/contact" element={<Contact />} />
            <Route path="/about" element={<About />} />
            <Route path="/faq" element={<FAQ />} /> {/* <--- ADDED ROUTE */}

            <Route 
                path="/admin/login" 
                element={isAuthenticated ? <Navigate to="/admin/dashboard" replace /> : <AdminLogin />} 
            />
            <Route 
                path="/admin/dashboard" 
                element={<ProtectedRoute><AdminDashboard /></ProtectedRoute>} 
            />
            <Route 
                path="/admin/analytics" 
                element={<ProtectedRoute><AnalyticsPage /></ProtectedRoute>} 
            />
            <Route 
                path="/admin/generator" 
                element={<ProtectedRoute><AdminGenerator /></ProtectedRoute>} 
            />
            
            <Route path="/christmas" element={<ChristmasPage />} /> 
          </Routes>
        </main>
        <Footer />
      </div>
    </Router>
  );
};

export default App;
