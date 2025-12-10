import React, { useState, useEffect, useMemo } from 'react';
import { Upload, Grid, Search, Edit2, Activity, Filter, BarChart3, PieChart, Users } from 'lucide-react'; 
import { supabaseService, supabase } from '../services/supabaseService';
import { ImageItem, AuditLog } from '../types';
import { CATEGORIES, SUPER_ADMIN_EMAIL, getAdminColor } from '../constants';
import EditImageModal from '../components/EditImageModal';

const AdminDashboard: React.FC = () => {
  const [activeTab, setActiveTab] = useState<string>('manage');
  
  // Data State
  const [images, setImages] = useState<ImageItem[]>([]);
  const [logs, setLogs] = useState<AuditLog[]>([]);
  
  // --- PHASE 3: STATS STATE ---
  const [stats, setStats] = useState({ total: 0, mine: 0, team: 0 });
  
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [editingImage, setEditingImage] = useState<ImageItem | null>(null);
  
  // --- PHASE 3: FILTER STATE ---
  const [filterAdmin, setFilterAdmin] = useState('All');
  const [filterAction, setFilterAction] = useState('All');
  
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
          
          // --- FETCH STATS (Only for Super Admin) ---
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
      const data = await supabaseService.getAuditLogs();
      setLogs(data);
    } catch (error) {
      console.error("Error loading logs", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (activeTab === 'manage') loadImages();
    if (activeTab === 'activity' && isSuperAdmin) loadLogs();
  }, [activeTab, isSuperAdmin]);

  // --- 3. FILTERED LOGS LOGIC ---
  const filteredLogs = useMemo(() => {
    return logs.filter(log => {
      const matchesAdmin = filterAdmin === 'All' || log.admin_email === filterAdmin;
      const matchesAction = filterAction === 'All' || log.action === filterAction;
      return matchesAdmin && matchesAction;
    });
  }, [logs, filterAdmin, filterAction]);

  // Get unique admin emails for the dropdown
  const uniqueAdmins = Array.from(new Set(logs.map(l => l.admin_email)));

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
      
      // Refresh Stats
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
      // Pass the updated data AND the new file (if any) to the service
      const savedImage = await supabaseService.updateImage(updatedImage, newFile);

      // Update local state with the returned image (which has the new URL if replaced)
      setImages(images.map(img => img.id === savedImage.id ? savedImage : img));
      
      alert('Update Successful!');
    } catch (err: any) {
      alert('Update failed: ' + err.message);
    }
  };

  
  /* const handleSaveEdit = async (updatedImage: ImageItem) => {
    try {
      await supabaseService.updateImage(updatedImage);
      setImages(images.map(img => img.id === updatedImage.id ? updatedImage : img));
    } catch (err: any) {
      alert('Update failed: ' + err.message);
    }
  }; */

  const handleDelete = async (id: string) => {
    try {
      await supabaseService.deleteImage(id);
      setImages(images.filter(img => img.id !== id));
      
      // Refresh Stats
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
          
          <div className="flex bg-surfaceHighlight p-1 rounded-lg overflow-x-auto">
            <button onClick={() => setActiveTab('manage')} className={`px-4 py-2 rounded-md transition-all flex items-center gap-2 whitespace-nowrap ${activeTab === 'manage' ? 'bg-surface text-textPrimary shadow' : 'text-textSecondary hover:text-textPrimary'}`}>
              <Grid size={18} /> Manage
            </button>
            <button onClick={() => setActiveTab('upload')} className={`px-4 py-2 rounded-md transition-all flex items-center gap-2 whitespace-nowrap ${activeTab === 'upload' ? 'bg-accent text-white font-medium shadow' : 'text-textSecondary hover:text-textPrimary'}`}>
              <Upload size={18} /> Upload
            </button>
            {isSuperAdmin && (
              <button onClick={() => setActiveTab('activity')} className={`px-4 py-2 rounded-md transition-all flex items-center gap-2 whitespace-nowrap ${activeTab === 'activity' ? 'bg-purple-600 text-white shadow' : 'text-textSecondary hover:text-purple-400'}`}>
                <Activity size={18} /> Activity Log
              </button>
            )}
          </div>
        </div>

        {/* --- PHASE 3: STATS CARDS (Super Admin Only) --- */}
        {isSuperAdmin && (
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
                    
                    {/* SUPER ADMIN: COLORED DOT */}
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
                    <div>
                        <label className="block text-xs font-medium text-textSecondary uppercase tracking-wider mb-2">Prompt</label>
                        <textarea value={prompt} onChange={e => setPrompt(e.target.value)} required rows={4} className="w-full bg-background border border-surfaceHighlight rounded-lg p-3 text-textPrimary focus:border-accent outline-none text-sm" placeholder="Enter prompt..." />
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <label className="block text-xs font-medium text-textSecondary uppercase tracking-wider mb-2">Category</label>
                            <input list="cat-list" value={category} onChange={e => setCategory(e.target.value)} className="w-full bg-background border border-surfaceHighlight rounded-lg p-3 text-textPrimary focus:border-accent outline-none text-sm h-11" placeholder="Select..." />
                            <datalist id="cat-list">{CATEGORIES.filter(c => c !== 'All').map(c => <option key={c} value={c} />)}</datalist>
                        </div>
                        <div>
                            <label className="block text-xs font-medium text-textSecondary uppercase tracking-wider mb-2">Tags</label>
                            <input type="text" value={tags} onChange={e => setTags(e.target.value)} className="w-full bg-background border border-surfaceHighlight rounded-lg p-3 text-textPrimary focus:border-accent outline-none text-sm h-11" placeholder="dark, 4k..." />
                        </div>
                    </div>
                    <button type="submit" disabled={uploading || !file} className={`w-full py-3 rounded-lg font-bold text-white transition-all ${uploading || !file ? 'bg-gray-400' : 'bg-accent hover:bg-accent/90'}`}>{uploading ? 'Uploading...' : 'Upload Image'}</button>
                </form>
            </div>
          </div>
        )}

        {/* --- TAB: ACTIVITY LOG (PHASE 3 FILTER UPGRADE) --- */}
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

        {editingImage && <EditImageModal image={editingImage} isOpen={!!editingImage} onClose={() => setEditingImage(null)} onSave={handleSaveEdit} onDelete={handleDelete} />}
      </div>
    </div>
  );
};

export default AdminDashboard;