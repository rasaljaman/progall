import React, { useState, useEffect, useMemo } from 'react';
import { Upload, Grid, Search, Edit2, Activity, Filter, BarChart3, PieChart, Users, TrendingUp, Award, Calendar } from 'lucide-react'; 
import { supabaseService, supabase } from '../services/supabaseService';
import { ImageItem, AuditLog } from '../types';
import { CATEGORIES, SUPER_ADMIN_EMAIL, getAdminColor } from '../constants';
import EditImageModal from '../components/EditImageModal';

// --- TYPES FOR ANALYTICS ---
type TimeRange = 'today' | 'week' | 'month' | 'all';

interface AdminStats {
  email: string;
  uploads: number;
  edits: number;
  deletes: number;
  total: number;
  lastActive: string;
}

const AdminDashboard: React.FC = () => {
  // Tabs: 'manage' | 'upload' | 'activity' | 'analytics'
  const [activeTab, setActiveTab] = useState<string>('manage');
  
  // Data State
  const [images, setImages] = useState<ImageItem[]>([]);
  const [logs, setLogs] = useState<AuditLog[]>([]);
  const [analyticsLogs, setAnalyticsLogs] = useState<AuditLog[]>([]); // Larger dataset for charts
  
  // Stats & Loading
  const [stats, setStats] = useState({ total: 0, mine: 0, team: 0 });
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [editingImage, setEditingImage] = useState<ImageItem | null>(null);
  
  // Filters (Activity Tab)
  const [filterAdmin, setFilterAdmin] = useState('All');
  const [filterAction, setFilterAction] = useState('All');

  // Analytics Controls (Phase 5)
  const [timeRange, setTimeRange] = useState<TimeRange>('week');
  
  // Auth State
  const [isSuperAdmin, setIsSuperAdmin] = useState(false);
  const [currentUserEmail, setCurrentUserEmail] = useState('');

  // Upload Form State
  const [file, setFile] = useState<File | null>(null);
  const [prompt, setPrompt] = useState('');
  const [category, setCategory] = useState(CATEGORIES[1]);
  const [tags, setTags] = useState('');
  const [uploading, setUploading] = useState(false);
  const [dragActive, setDragActive] = useState(false);

  // --- 1. INITIAL LOAD ---
  useEffect(() => {
    const checkUser = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (user && user.email) {
        const currentEmail = user.email.toLowerCase().trim();
        const superEmail = SUPER_ADMIN_EMAIL.toLowerCase().trim();
        
        setCurrentUserEmail(currentEmail);
        
        if (currentEmail === superEmail) {
          setIsSuperAdmin(true);
          // Fetch Stats (Only for Super Admin)
          try {
            const statsData = await supabaseService.getStats();
            if (statsData) setStats(statsData);
          } catch (e) {
            console.error("Stats fetch error:", e);
          }
        }
      }
    };
    checkUser();
    loadImages();
  }, []);

  // --- 2. DATA FETCHING ---
  const loadImages = async () => {
    setLoading(true);
    const data = await supabaseService.getImages();
    setImages(data);
    setLoading(false);
  };

  const loadLogs = async () => {
    setLoading(true);
    try {
      // Normal logs for list view (Limit 50)
      const data = await supabaseService.getAuditLogs();
      setLogs(data);

      // Analytics logs for charts (Limit 500 - Only if Super Admin)
      if (isSuperAdmin) {
         // NOTE: Ensure 'getAnalyticsLogs' exists in your supabaseService!
         const analyticsData = await supabaseService.getAnalyticsLogs(); 
         setAnalyticsLogs(analyticsData);
      }
    } catch (error) {
      console.error("Error loading logs", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (activeTab === 'manage') loadImages();
    if ((activeTab === 'activity' || activeTab === 'analytics') && isSuperAdmin) loadLogs();
  }, [activeTab, isSuperAdmin]);

  // --- 3. LOGIC: FILTERED LOGS (Activity Tab) ---
  const filteredLogs = useMemo(() => {
    return logs.filter(log => {
      const matchesAdmin = filterAdmin === 'All' || log.admin_email === filterAdmin;
      const matchesAction = filterAction === 'All' || log.action === filterAction;
      return matchesAdmin && matchesAction;
    });
  }, [logs, filterAdmin, filterAction]);

  const uniqueAdmins = Array.from(new Set(logs.map(l => l.admin_email)));

  // --- 4. LOGIC: ANALYTICS CALCULATIONS (Phase 5) ---
  const analyticsData = useMemo(() => {
    const now = new Date();
    
    // A. Filter by Time Range
    const filteredByTime = analyticsLogs.filter(log => {
      const logDate = new Date(log.created_at);
      if (timeRange === 'today') return logDate.toDateString() === now.toDateString();
      if (timeRange === 'week') {
        const weekAgo = new Date(); weekAgo.setDate(now.getDate() - 7);
        return logDate >= weekAgo;
      }
      if (timeRange === 'month') {
        const monthAgo = new Date(); monthAgo.setDate(now.getDate() - 30);
        return logDate >= monthAgo;
      }
      return true; // 'all'
    });

    // B. Calculate Leaderboard
    const adminMap = new Map<string, AdminStats>();
    filteredByTime.forEach(log => {
      const email = log.admin_email;
      if (!adminMap.has(email)) {
        adminMap.set(email, { email, uploads: 0, edits: 0, deletes: 0, total: 0, lastActive: log.created_at });
      }
      const stats = adminMap.get(email)!;
      stats.total++;
      if (log.action === 'UPLOAD') stats.uploads++;
      if (log.action === 'EDIT' || log.action === 'REPLACE_IMAGE') stats.edits++;
      if (log.action === 'DELETE') stats.deletes++;
      
      // Update last active if newer
      if (new Date(log.created_at) > new Date(stats.lastActive)) {
          stats.lastActive = log.created_at;
      }
    });
    
    const leaderboard = Array.from(adminMap.values()).sort((a, b) => b.total - a.total);

    // C. Calculate Chart Data (Activity per Day)
    const chartMap = new Map<string, number>();
    filteredByTime.forEach(log => {
        const dateKey = new Date(log.created_at).toLocaleDateString(undefined, { month: 'short', day: 'numeric' });
        chartMap.set(dateKey, (chartMap.get(dateKey) || 0) + 1);
    });
    
    // Sort chart data (Oldest -> Newest)
    const chartData = Array.from(chartMap.entries())
        .map(([date, count]) => ({ date, count }))
        .reverse();

    return { leaderboard, chartData };
  }, [analyticsLogs, timeRange]);


  // --- HANDLERS ---
  const handleDrag = (e: React.DragEvent) => { e.preventDefault(); e.stopPropagation(); if (e.type === "dragenter" || e.type === "dragover") setDragActive(true); else if (e.type === "dragleave") setDragActive(false); };
  const handleDrop = (e: React.DragEvent) => { e.preventDefault(); e.stopPropagation(); setDragActive(false); if (e.dataTransfer.files && e.dataTransfer.files[0]) setFile(e.dataTransfer.files[0]); };

  const handleUpload = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!file || !prompt) return;
    setUploading(true);
    try {
      const tagArray = tags.split(',').map(t => t.trim()).filter(t => t.length > 0);
      await supabaseService.uploadImage(file, prompt, category, tagArray);
      
      setFile(null); setPrompt(''); setTags(''); setCategory(CATEGORIES[1]);
      alert('Upload Successful!');
      setActiveTab('manage');
      
      if (isSuperAdmin) {
        const newStats = await supabaseService.getStats();
        if(newStats) setStats(newStats);
      }
    } catch (err: any) {
      alert(err.message || "Upload failed");
    } finally {
      setUploading(false);
    }
  };
  
  const handleSaveEdit = async (updatedImage: ImageItem, newFile?: File) => {
    try {
      await supabaseService.updateImage(updatedImage, newFile);
      setImages(images.map(img => img.id === updatedImage.id ? updatedImage : img));
      alert('Update Successful!');
    } catch (err: any) {
      alert('Update failed: ' + err.message);
    }
  };

  const handleDelete = async (id: string) => {
    try {
      await supabaseService.deleteImage(id);
      setImages(images.filter(img => img.id !== id));
      
      if (isSuperAdmin) {
        const newStats = await supabaseService.getStats();
        if(newStats) setStats(newStats);
      }
    } catch (err: any) {
      alert('Delete failed: ' + err.message);
    }
  };

  // --- RENDER ---
  return (
    <div className="min-h-screen bg-background p-4 md:p-8 pt-24 pb-24">
      <div className="max-w-6xl mx-auto">
        
        {/* Header & Tabs */}
        <div className="flex flex-col md:flex-row justify-between items-center mb-8 gap-4">
          <div>
            <h1 className="text-3xl font-bold text-textPrimary">Admin Dashboard</h1>
            <p className="text-textSecondary text-sm mt-1">
              Logged in: <span className="text-accent">{currentUserEmail}</span>
              {isSuperAdmin && <span className="ml-2 text-xs bg-accent/20 text-accent px-2 py-0.5 rounded border border-accent/30">SUPER ADMIN</span>}
            </p>
          </div>
          
          <div className="flex bg-surfaceHighlight p-1 rounded-lg overflow-x-auto no-scrollbar">
            <button onClick={() => setActiveTab('manage')} className={`px-4 py-2 rounded-md transition-all flex items-center gap-2 whitespace-nowrap ${activeTab === 'manage' ? 'bg-surface text-textPrimary shadow' : 'text-textSecondary hover:text-textPrimary'}`}>
              <Grid size={18} /> Manage
            </button>
            <button onClick={() => setActiveTab('upload')} className={`px-4 py-2 rounded-md transition-all flex items-center gap-2 whitespace-nowrap ${activeTab === 'upload' ? 'bg-accent text-white font-medium shadow' : 'text-textSecondary hover:text-textPrimary'}`}>
              <Upload size={18} /> Upload
            </button>
            {isSuperAdmin && (
              <>
                <button onClick={() => setActiveTab('activity')} className={`px-4 py-2 rounded-md transition-all flex items-center gap-2 whitespace-nowrap ${activeTab === 'activity' ? 'bg-purple-600 text-white shadow' : 'text-textSecondary hover:text-purple-400'}`}>
                    <Activity size={18} /> Log
                </button>
                <button onClick={() => setActiveTab('analytics')} className={`px-4 py-2 rounded-md transition-all flex items-center gap-2 whitespace-nowrap ${activeTab === 'analytics' ? 'bg-orange-500 text-white shadow' : 'text-textSecondary hover:text-orange-400'}`}>
                    <TrendingUp size={18} /> Analytics
                </button>
              </>
            )}
          </div>
        </div>

        {/* --- GLOBAL STATS (Visible on all tabs for Super Admin) --- */}
        {isSuperAdmin && activeTab !== 'upload' && (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
            <div className="bg-surface border border-surfaceHighlight p-6 rounded-xl flex items-center gap-4 shadow-neumorphic">
              <div className="p-3 bg-blue-500/10 text-blue-500 rounded-full"><BarChart3 size={24} /></div>
              <div>
                <p className="text-textSecondary text-xs uppercase font-bold tracking-wider">Total Gallery</p>
                <p className="text-2xl font-bold text-textPrimary">{stats.total}</p>
              </div>
            </div>
            <div className="bg-surface border border-surfaceHighlight p-6 rounded-xl flex items-center gap-4 shadow-neumorphic">
              <div className="p-3 bg-green-500/10 text-green-500 rounded-full"><Users size={24} /></div>
              <div>
                <p className="text-textSecondary text-xs uppercase font-bold tracking-wider">My Uploads</p>
                <p className="text-2xl font-bold text-textPrimary">{stats.mine}</p>
              </div>
            </div>
            <div className="bg-surface border border-surfaceHighlight p-6 rounded-xl flex items-center gap-4 shadow-neumorphic">
              <div className="p-3 bg-purple-500/10 text-purple-500 rounded-full"><PieChart size={24} /></div>
              <div>
                <p className="text-textSecondary text-xs uppercase font-bold tracking-wider">Team Contribution</p>
                <p className="text-2xl font-bold text-textPrimary">{stats.team}</p>
              </div>
            </div>
          </div>
        )}

        {/* --- TAB: MANAGE --- */}
        {activeTab === 'manage' && (
          <div className="space-y-6">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-textSecondary" size={20} />
              <input type="text" placeholder="Search gallery..." value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} className="w-full bg-surface border border-surfaceHighlight rounded-xl py-3 pl-10 pr-4 text-textPrimary focus:outline-none focus:border-accent" />
            </div>

            {loading ? (
               <div className="flex justify-center py-20"><div className="animate-spin rounded-full h-8 w-8 border-t-2 border-accent"></div></div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {images.filter(img => img.prompt.toLowerCase().includes(searchTerm.toLowerCase()) || img.category.toLowerCase().includes(searchTerm.toLowerCase()))
                .map((img) => (
                  <div key={img.id} className="bg-surface border border-surfaceHighlight rounded-xl overflow-hidden group relative hover:border-accent/50 transition-colors">
                    {/* SUPER ADMIN DOT */}
                    {isSuperAdmin && (
                        <div className="absolute top-2 left-2 z-10 w-4 h-4 rounded-full border-2 border-white shadow-md" style={{ backgroundColor: getAdminColor(img.created_by || 'unknown') }} title={`Uploaded by Admin ID: ${img.created_by || 'Unknown'}`} />
                    )}
                    <div className="relative h-48 bg-black">
                      <img src={img.thumbnail} alt="" className="w-full h-full object-cover opacity-80 group-hover:opacity-100 transition-opacity" />
                      {img.is_featured && <div className="absolute top-2 right-2 bg-accent text-white text-[10px] font-bold px-2 py-1 rounded shadow uppercase">Featured</div>}
                      <button onClick={() => setEditingImage(img)} className="absolute bottom-2 right-2 bg-black/80 text-white p-2 rounded-full opacity-0 group-hover:opacity-100 transition-opacity hover:bg-accent"><Edit2 size={16} /></button>
                    </div>
                    <div className="p-4">
                      <p className="text-textPrimary text-sm line-clamp-2 mb-3 h-10">{img.prompt}</p>
                      <div className="flex justify-between items-center">
                        <span className="text-xs bg-surfaceHighlight px-2 py-1 rounded text-textSecondary border border-surfaceHighlight">{img.category}</span>
                        <span className="text-[10px] text-textSecondary">ID: {img.id.slice(0,4)}</span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* --- TAB: UPLOAD --- */}
        {activeTab === 'upload' && (
          <div className="max-w-2xl mx-auto">
            <div className="bg-surface p-6 md:p-8 rounded-2xl shadow-neumorphic border border-surfaceHighlight">
                <h2 className="text-xl font-bold text-textPrimary mb-6">Upload New Image</h2>
                <form onSubmit={handleUpload} className="space-y-6">
                    <div className={`border-2 border-dashed rounded-xl p-10 text-center transition-colors cursor-pointer ${dragActive ? 'border-accent bg-accent/10' : 'border-surfaceHighlight hover:border-textSecondary'}`} onDragEnter={handleDrag} onDragLeave={handleDrag} onDragOver={handleDrag} onDrop={handleDrop}>
                        <input type="file" id="file-upload" className="hidden" accept="image/*" onChange={(e) => e.target.files && setFile(e.target.files[0])} />
                        <label htmlFor="file-upload" className="cursor-pointer flex flex-col items-center gap-3">
                             {file ? <div className="text-green-500 font-medium break-all bg-green-500/10 px-4 py-2 rounded-lg">{file.name}</div> : <><Upload size={32} className="text-textSecondary"/><p className="text-textPrimary">Drag or browse</p></>}
                        </label>
                    </div>
                    <div><label className="block text-xs font-medium text-textSecondary uppercase tracking-wider mb-2">Prompt</label><textarea value={prompt} onChange={e => setPrompt(e.target.value)} required rows={4} className="w-full bg-background border border-surfaceHighlight rounded-lg p-3 text-textPrimary focus:border-accent outline-none text-sm" placeholder="Enter prompt..." /></div>
                    <div className="grid grid-cols-2 gap-4">
                        <div><label className="block text-xs font-medium text-textSecondary uppercase tracking-wider mb-2">Category</label><input list="cat-list" value={category} onChange={e => setCategory(e.target.value)} className="w-full bg-background border border-surfaceHighlight rounded-lg p-3 text-textPrimary focus:border-accent outline-none text-sm h-11" placeholder="Select..." /><datalist id="cat-list">{CATEGORIES.filter(c => c !== 'All').map(c => <option key={c} value={c} />)}</datalist></div>
                        <div><label className="block text-xs font-medium text-textSecondary uppercase tracking-wider mb-2">Tags</label><input type="text" value={tags} onChange={e => setTags(e.target.value)} className="w-full bg-background border border-surfaceHighlight rounded-lg p-3 text-textPrimary focus:border-accent outline-none text-sm h-11" placeholder="dark, 4k..." /></div>
                    </div>
                    <button type="submit" disabled={uploading || !file} className={`w-full py-3 rounded-lg font-bold text-white transition-all ${uploading || !file ? 'bg-gray-400' : 'bg-accent hover:bg-accent/90'}`}>{uploading ? 'Compressing & Uploading...' : 'Upload Image'}</button>
                </form>
            </div>
          </div>
        )}

        {/* --- TAB: ACTIVITY LOG (List View) --- */}
        {activeTab === 'activity' && isSuperAdmin && (
            <div className="space-y-6">
                <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                  <h2 className="text-xl font-bold text-textPrimary">Activity Log</h2>
                  
                  {/* FILTERS */}
                  <div className="flex gap-2">
                    <div className="relative group">
                      <div className="absolute inset-y-0 left-2 flex items-center pointer-events-none text-textSecondary"><Filter size={14} /></div>
                      <select value={filterAdmin} onChange={(e) => setFilterAdmin(e.target.value)} className="bg-surface border border-surfaceHighlight text-textPrimary text-sm rounded-lg pl-8 pr-4 py-2 focus:outline-none focus:border-accent">
                        <option value="All">All Admins</option>
                        {uniqueAdmins.map(admin => <option key={admin} value={admin}>{admin}</option>)}
                      </select>
                    </div>
                    <select value={filterAction} onChange={(e) => setFilterAction(e.target.value)} className="bg-surface border border-surfaceHighlight text-textPrimary text-sm rounded-lg px-4 py-2 focus:outline-none focus:border-accent">
                      <option value="All">All Actions</option>
                      <option value="UPLOAD">Upload</option>
                      <option value="EDIT">Edit</option>
                      <option value="DELETE">Delete</option>
                    </select>
                  </div>
                </div>

                {loading ? <div className="text-center py-10">Loading logs...</div> : (
                    <div className="bg-surface rounded-xl border border-surfaceHighlight overflow-x-auto">
                        <table className="w-full text-left border-collapse min-w-[600px]">
                            <thead className="bg-surfaceHighlight/50 border-b border-surfaceHighlight text-xs uppercase text-textSecondary">
                                <tr>
                                    <th className="p-4 whitespace-nowrap">Time</th>
                                    <th className="p-4 whitespace-nowrap">Admin</th>
                                    <th className="p-4 whitespace-nowrap">Action</th>
                                    <th className="p-4 min-w-[200px]">Details</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-surfaceHighlight">
                                {filteredLogs.length > 0 ? filteredLogs.map(log => (
                                    <tr key={log.id} className="hover:bg-surfaceHighlight/30 transition-colors">
                                        <td className="p-4 text-xs text-textSecondary whitespace-nowrap">
                                            {new Date(log.created_at).toLocaleString()}
                                        </td>
                                        <td className="p-4 text-sm font-medium text-textPrimary whitespace-nowrap">
                                            <div className="flex items-center gap-2">
                                                <div className="w-2 h-2 rounded-full flex-shrink-0" style={{ backgroundColor: getAdminColor(log.admin_email) }}></div>
                                                {log.admin_email}
                                            </div>
                                        </td>
                                        <td className="p-4 whitespace-nowrap">
                                            <span className={`text-xs px-2 py-1 rounded font-bold uppercase tracking-wider ${
                                                log.action === 'UPLOAD' ? 'bg-green-500/10 text-green-500' :
                                                log.action === 'DELETE' ? 'bg-red-500/10 text-red-500' :
                                                'bg-blue-500/10 text-blue-500'
                                            }`}>
                                                {log.action}
                                            </span>
                                        </td>
                                        <td className="p-4 text-sm text-textSecondary break-words min-w-[200px]">
                                            {log.details}
                                        </td>
                                    </tr>
                                )) : (
                                  <tr><td colSpan={4} className="p-8 text-center text-textSecondary">No logs found matching filters.</td></tr>
                                )}
                            </tbody>
                        </table>
                    </div>
                )}
            </div>
        )}

        {/* --- TAB: ANALYTICS (PHASE 5 NEW!) --- */}
        {activeTab === 'analytics' && isSuperAdmin && (
            <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
                
                {/* 1. Time Filters */}
                <div className="flex justify-between items-center">
                    <h2 className="text-xl font-bold text-textPrimary flex items-center gap-2">
                        <TrendingUp className="text-orange-500"/> Performance Analytics
                    </h2>
                    <div className="flex bg-surfaceHighlight p-1 rounded-lg">
                        {(['today', 'week', 'month', 'all'] as TimeRange[]).map(r => (
                            <button 
                                key={r} 
                                onClick={() => setTimeRange(r)} 
                                className={`px-3 py-1 text-xs font-bold uppercase rounded transition-all
                                    ${timeRange === r ? 'bg-surface text-textPrimary shadow' : 'text-textSecondary hover:text-textPrimary'}`
                                }
                            >
                                {r}
                            </button>
                        ))}
                    </div>
                </div>

                {/* 2. Visual Chart (Activity Volume) */}
                <div className="bg-surface border border-surfaceHighlight p-6 rounded-2xl shadow-neumorphic">
                    <div className="flex items-center gap-2 mb-6">
                        <Calendar size={16} className="text-textSecondary" />
                        <h3 className="text-sm font-bold text-textSecondary uppercase">Activity Volume</h3>
                    </div>
                    
                    {analyticsData.chartData.length > 0 ? (
                        <div className="flex items-end justify-between h-40 gap-2">
                            {analyticsData.chartData.map((item, idx) => {
                                // Calculate height relative to max value
                                const max = Math.max(...analyticsData.chartData.map(d => d.count));
                                const height = (item.count / max) * 100;
                                
                                return (
                                    <div key={idx} className="flex-1 flex flex-col items-center gap-2 group">
                                        <div 
                                            className="w-full bg-accent/20 rounded-t-sm relative hover:bg-accent/40 transition-colors"
                                            style={{ height: `${height}%`, minHeight: '4px' }}
                                        >
                                            <div className="absolute -top-8 left-1/2 -translate-x-1/2 bg-black text-white text-xs px-2 py-1 rounded opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap pointer-events-none z-10">
                                                {item.count} Actions
                                            </div>
                                        </div>
                                        <span className="text-[10px] text-textSecondary truncate w-full text-center">{item.date}</span>
                                    </div>
                                )
                            })}
                        </div>
                    ) : (
                        <div className="text-center py-10 text-textSecondary flex flex-col items-center">
                            <Activity size={40} className="mb-2 opacity-20"/>
                            <p>No activity recorded in this time range.</p>
                        </div>
                    )}
                </div>

                {/* 3. Admin Leaderboard */}
                <div className="bg-surface border border-surfaceHighlight rounded-2xl shadow-neumorphic overflow-hidden">
                    <div className="p-6 border-b border-surfaceHighlight flex items-center gap-2">
                        <Award className="text-yellow-500" />
                        <h3 className="text-lg font-bold text-textPrimary">Top Contributors</h3>
                    </div>
                    
                    {/* FIX: Added this wrapper div for scrolling */}
                    <div className="overflow-x-auto">
                        {/* FIX: Added min-w-[600px] to force horizontal scroll on mobile */}
                        <table className="w-full text-left min-w-[600px]">
                            <thead className="bg-surfaceHighlight/30 text-xs uppercase text-textSecondary">
                                <tr>
                                    <th className="p-4">Rank</th>
                                    <th className="p-4">Admin</th>
                                    <th className="p-4 text-center">Uploads</th>
                                    <th className="p-4 text-center">Edits</th>
                                    <th className="p-4 text-right">Last Active</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-surfaceHighlight">
                                {analyticsData.leaderboard.length > 0 ? analyticsData.leaderboard.map((admin, idx) => (
                                    <tr key={admin.email} className="hover:bg-surfaceHighlight/20 transition-colors">
                                        <td className="p-4 font-bold text-textSecondary">
                                            {idx === 0 ? '🥇' : idx === 1 ? '🥈' : idx === 2 ? '🥉' : `#${idx + 1}`}
                                        </td>
                                        <td className="p-4">
                                            <div className="flex items-center gap-3">
                                                <div className="w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold text-white shadow-sm" style={{ backgroundColor: getAdminColor(admin.email) }}>
                                                    {admin.email[0].toUpperCase()}
                                                </div>
                                                <div className="flex flex-col">
                                                    <span className="text-sm font-medium text-textPrimary">{admin.email.split('@')[0]}</span>
                                                    <span className="text-[10px] text-textSecondary">{admin.email}</span>
                                                </div>
                                            </div>
                                        </td>
                                        <td className="p-4 text-center">
                                            <span className="bg-green-500/10 text-green-500 px-2 py-1 rounded-md text-sm font-bold">{admin.uploads}</span>
                                        </td>
                                        <td className="p-4 text-center text-sm text-textSecondary">{admin.edits}</td>
                                        <td className="p-4 text-right text-xs text-textSecondary">
                                            {new Date(admin.lastActive).toLocaleDateString()}
                                        </td>
                                    </tr>
                                )) : (
                                    <tr><td colSpan={5} className="p-8 text-center text-textSecondary">No data available.</td></tr>
                                )}
                            </tbody>
                        </table>
                    </div>
                </div>

            </div>
        )}

        {editingImage && <EditImageModal image={editingImage} isOpen={!!editingImage} onClose={() => setEditingImage(null)} onSave={handleSaveEdit} onDelete={handleDelete} />}
      </div>
    </div>
  );
};

export default AdminDashboard;
