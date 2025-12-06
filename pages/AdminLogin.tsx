import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabaseService } from '../services/supabaseService';

const AdminLogin: React.FC = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const navigate = useNavigate();

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    
    try {
      await supabaseService.login(email, password);
      navigate('/admin/dashboard');
    } catch (err: any) {
      console.error(err);
      setError(err.message || "Failed to login");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex flex-col items-center justify-center min-h-[80vh] px-4">
      <div className="w-full max-w-md bg-surface p-8 rounded-2xl shadow-neumorphic border border-surfaceHighlight">
        <h2 className="text-2xl font-bold text-primary text-center mb-2">Admin Access</h2>
        <p className="text-textSecondary text-center mb-8 text-sm">Enter your credentials to manage gallery</p>

        {error && (
          <div className="mb-4 p-3 bg-red-500/10 border border-red-500/50 rounded text-red-400 text-sm text-center">
            {error}
          </div>
        )}

        <form onSubmit={handleLogin} className="space-y-6">
            <div>
                <label className="block text-xs font-medium text-textSecondary uppercase tracking-wider mb-2">Email</label>
                <input 
                    type="email" 
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="w-full bg-background border
                    border-surfaceHighlight rounded-lg p-3 text-primary focus:border-accent focus:ring-1 focus:ring-accent
                    outline-none transition-all"
                    placeholder="admin@progall.com"
                    required
                />
            </div>
            <div>
                <label className="block text-xs font-medium text-textSecondary uppercase tracking-wider mb-2">Password</label>
                <input 
                    type="password" 
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="w-full bg-background border
                    border-surfaceHighlight rounded-lg p-3
                    text-primary focus:border-accent focus:ring-1 focus:ring-accent
                    outline-none transition-all"
                    placeholder="••••••••"
                    required
                />
            </div>

            <button 
                type="submit" 
                disabled={loading}
                className="w-full bg-accent hover:bg-accent/90 text-black font-bold py-3 rounded-lg transition-all transform active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed"
            >
                {loading ? 'Verifying...' : 'Sign In'}
            </button>
        </form>

        <div className="mt-6 text-center">
            <button className="text-xs text-textSecondary hover:text-white transition-colors">Forgot password?</button>
        </div>
      </div>
    </div>
  );
};

export default AdminLogin;