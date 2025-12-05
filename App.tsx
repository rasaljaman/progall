import React, { useState, useEffect } from 'react';
import { HashRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import Navbar from './components/Navbar';
import Sidebar from './components/Sidebar';
import Home from './pages/Home';
import ImageDetail from './pages/ImageDetail';
import AdminLogin from './pages/AdminLogin';
import AdminDashboard from './pages/AdminDashboard';
import Footer from './components/Footer';

// Import the new Legal/Support pages
import Terms from './pages/Terms';
import Privacy from './pages/Privacy';
import Contact from './pages/Contact';
import About from './pages/About';

import { supabase, supabaseService } from './services/supabaseService';

const App: React.FC = () => {
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [authLoading, setAuthLoading] = useState(true);

  useEffect(() => {
    // Check active session
    supabase.auth.getSession().then(({ data: { session } }) => {
      setIsAuthenticated(!!session);
      setAuthLoading(false);
    });

    // Listen for changes
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
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
    
    if (!isAuthenticated) {
      return <Navigate to="/admin/login" replace />;
    }
    return children;
  };

  return (
    <Router>
      <div className="flex flex-col min-h-screen bg-background text-textPrimary font-sans selection:bg-accent selection:text-black">
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
            
            {/* New Public Routes for Phase 1 */}
            <Route path="/terms" element={<Terms />} />
            <Route path="/privacy" element={<Privacy />} />
            <Route path="/contact" element={<Contact />} />
            <Route path="/about" element={<About />} />

            <Route 
                path="/admin/login" 
                element={
                    isAuthenticated ? <Navigate to="/admin/dashboard" replace /> : <AdminLogin />
                } 
            />
            <Route 
                path="/admin/dashboard" 
                element={
                    <ProtectedRoute>
                        <AdminDashboard />
                    </ProtectedRoute>
                } 
            />
          </Routes>
        </main>
        <Footer />
      </div>
    </Router>
  );
};

export default App;
