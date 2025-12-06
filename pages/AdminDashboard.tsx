import React, { useState, useEffect } from 'react';
import { Upload, Grid, Search, Edit2 } from 'lucide-react';
import { supabaseService, supabase } from '../services/supabaseService'; // Ensure supabase export exists
import { ImageItem } from '../types';
import { CATEGORIES } from '../constants';
import EditImageModal from '../components/EditImageModal';

const AdminDashboard: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'manage' | 'upload'>('manage');
  
  // --- Manage State ---
  const [images, setImages] = useState<ImageItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [editingImage, setEditingImage] = useState<ImageItem | null>(null);

  // --- Upload Form State ---
  const [file, setFile] = useState<File | null>(null);
  const [prompt, setPrompt] = useState('');
  const [category, setCategory] = useState(CATEGORIES[1]);
  const [tags, setTags] = useState('');
  const [uploading, setUploading] = useState(false);
  const [dragActive, setDragActive] = useState(false);

  // --- 1. FETCH DATA ---
  const loadImages = async () => {
    setLoading(true);
    // We use the service, but ensure it fetches the new 'is_featured' column
    const data = await supabaseService.getImages();
    setImages(data);
    setLoading(false);
  };

  useEffect(() => {
    if (activeTab === 'manage') loadImages();
  }, [activeTab]);

  // --- 2. UPLOAD HANDLERS ---
  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault(); e.stopPropagation();
    if (e.type === "dragenter" || e.type === "dragover") setDragActive(true);
    else if (e.type === "dragleave") setDragActive(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault(); e.stopPropagation();
    setDragActive(false);
    if (e.dataTransfer.files && e.dataTransfer.files[0]) setFile(e.dataTransfer.files[0]);
  };

  const handleUpload = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!file || !prompt) return;

    setUploading(true);
    try {
      const tagArray = tags.split(',').map(t => t.trim()).filter(t => t.length > 0);
      
      // Note: We are uploading with default is_featured = false
      await supabaseService.uploadImage(file, prompt, category, tagArray);
      
      // Reset & Switch Tab
      setFile(null); setPrompt(''); setTags(''); setCategory(CATEGORIES[1]);
      alert('Upload Successful!');
      setActiveTab('manage'); // Switch to view the new image
    } catch (err: any) {
      console.error(err);
      alert(err.message || "Upload failed");
    } finally {
      setUploading(false);
    }
  };

  // --- 3. EDIT & DELETE HANDLERS ---
  const handleSaveEdit = async (updatedImage: ImageItem) => {
    try {
      // Direct Supabase update because we need to update specific fields including is_featured
      const { error } = await supabase
        .from('images')
        .update({
          prompt: updatedImage.prompt,
          category: updatedImage.category,
          tags: updatedImage.tags,
          is_featured: updatedImage.is_featured
        })
        .eq('id', updatedImage.id);

      if (error) throw error;

      // Update local state instantly
      setImages(images.map(img => img.id === updatedImage.id ? updatedImage : img));
    } catch (err: any) {
      alert('Update failed: ' + err.message);
    }
  };

  const handleDelete = async (id: string) => {
    try {
      await supabaseService.deleteImage(id);
      setImages(images.filter(img => img.id !== id));
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
          <h1 className="text-3xl font-bold text-white">Admin Dashboard</h1>
          
          <div className="flex bg-surfaceHighlight p-1 rounded-lg">
            <button
              onClick={() => setActiveTab('manage')}
              className={`px-4 py-2 rounded-md transition-all flex items-center gap-2 ${activeTab === 'manage' ? 'bg-surface text-white shadow' : 'text-gray-400 hover:text-white'}`}
            >
              <Grid size={18} />
              Manage Gallery
            </button>
            <button
              onClick={() => setActiveTab('upload')}
              className={`px-4 py-2 rounded-md transition-all flex items-center gap-2 ${activeTab === 'upload' ? 'bg-accent text-black font-medium shadow' : 'text-gray-400 hover:text-white'}`}
            >
              <Upload size={18} />
              Upload New
            </button>
          </div>
        </div>

        {/* --- TAB: MANAGE --- */}
        {activeTab === 'manage' && (
          <div className="space-y-6">
            {/* Search */}
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={20} />
              <input 
                type="text" 
                placeholder="Search by prompt or category..." 
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full bg-surface border border-surfaceHighlight rounded-xl py-3 pl-10 pr-4 text-white focus:outline-none focus:border-accent"
              />
            </div>

            {loading ? (
               <div className="flex justify-center py-20">
                   <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-accent"></div>
               </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {images.filter(img => 
                    img.prompt.toLowerCase().includes(searchTerm.toLowerCase()) || 
                    img.category.toLowerCase().includes(searchTerm.toLowerCase())
                ).map((img) => (
                  <div key={img.id} className="bg-surface border border-surfaceHighlight rounded-xl overflow-hidden group hover:border-accent/50 transition-colors">
                    {/* Thumbnail */}
                    <div className="relative h-48 bg-black">
                      <img src={img.thumbnail} alt="" className="w-full h-full object-cover opacity-80 group-hover:opacity-100 transition-opacity" />
                      
                      {/* Featured Badge */}
                      {img.is_featured && (
                        <div className="absolute top-2 right-2 bg-accent text-black text-[10px] font-bold px-2 py-1 rounded shadow-lg uppercase tracking-wider">
                          Featured
                        </div>
                      )}

                      {/* Edit Button (Visible on Hover) */}
                      <button 
                        onClick={() => setEditingImage(img)}
                        className="absolute bottom-2 right-2 bg-black/80 text-white p-2 rounded-full opacity-0 group-hover:opacity-100 transition-opacity hover:bg-accent hover:text-black"
                      >
                        <Edit2 size={16} />
                      </button>
                    </div>

                    {/* Content */}
                    <div className="p-4">
                      <p className="text-gray-300 text-sm line-clamp-2 mb-3 h-10">{img.prompt}</p>
                      <div className="flex justify-between items-center">
                        <span className="text-xs bg-surfaceHighlight px-2 py-1 rounded text-gray-400 border border-white/5">
                            {img.category}
                        </span>
                        <span className="text-[10px] text-gray-600">ID: {img.id.slice(0,4)}</span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* --- TAB: UPLOAD (Updated for Custom Categories) --- */}
        {activeTab === 'upload' && (
          <div className="max-w-2xl mx-auto">
            <div className="bg-surface p-6 md:p-8 rounded-2xl shadow-neumorphic border border-surfaceHighlight">
                <h2 className="text-xl font-bold text-white mb-6">Upload New Image</h2>
                
                <form onSubmit={handleUpload} className="space-y-6">
                    {/* Drag Drop Area */}
                    <div 
                        className={`border-2 border-dashed rounded-xl p-10 text-center transition-colors cursor-pointer ${
                            dragActive ? 'border-accent bg-accent/10' : 'border-surfaceHighlight hover:border-textSecondary'
                        }`}
                        onDragEnter={handleDrag}
                        onDragLeave={handleDrag}
                        onDragOver={handleDrag}
                        onDrop={handleDrop}
                    >
                        <input 
                            type="file" 
                            id="file-upload" 
                            className="hidden" 
                            accept="image/*"
                            onChange={(e) => e.target.files && setFile(e.target.files[0])}
                        />
                        <label htmlFor="file-upload" className="cursor-pointer flex flex-col items-center gap-3">
                             {file ? (
                                <>
                                    <div className="text-green-400 font-medium break-all bg-green-400/10 px-4 py-2 rounded-lg">{file.name}</div>
                                    <span className="text-xs text-textSecondary">Click to change</span>
                                </>
                             ) : (
                                <>
                                    <div className="bg-surfaceHighlight p-4 rounded-full text-textSecondary mb-2">
                                        <Upload size={32}/>
                                    </div>
                                    <p className="text-base text-textPrimary">Drag image here or <span className="text-accent hover:underline">browse</span></p>
                                    <p className="text-xs text-textSecondary mt-1">Supports JPG, PNG</p>
                                </>
                             )}
                        </label>
                    </div>

                    <div>
                        <label className="block text-xs font-medium text-textSecondary uppercase tracking-wider mb-2">Prompt</label>
                        <textarea 
                            value={prompt}
                            onChange={e => setPrompt(e.target.value)}
                            required
                            rows={4}
                            className="w-full bg-black/30 border border-surfaceHighlight rounded-lg p-3 text-white focus:border-accent focus:ring-1 focus:ring-accent outline-none transition-all resize-none text-sm"
                            placeholder="Enter the detailed AI prompt..."
                        />
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <label className="block text-xs font-medium text-textSecondary uppercase tracking-wider mb-2">Category</label>
                            
                            {/* UPDATED: Input with Datalist for Custom Categories */}
                            <input 
                                list="category-suggestions" 
                                value={category}
                                onChange={e => setCategory(e.target.value)}
                                className="w-full bg-black/30 border border-surfaceHighlight rounded-lg p-3 text-white focus:border-accent outline-none text-sm h-11"
                                placeholder="Type new or select..." 
                            />
                            <datalist id="category-suggestions">
                                {CATEGORIES.filter(c => c !== 'All').map(c => (
                                    <option key={c} value={c} />
                                ))}
                            </datalist>

                        </div>
                        <div>
                            <label className="block text-xs font-medium text-textSecondary uppercase tracking-wider mb-2">Tags</label>
                            <input 
                                type="text"
                                value={tags}
                                onChange={e => setTags(e.target.value)}
                                className="w-full bg-black/30 border border-surfaceHighlight rounded-lg p-3 text-white focus:border-accent focus:ring-1 focus:ring-accent outline-none transition-all text-sm h-11"
                                placeholder="dark, 4k, realistic"
                            />
                        </div>
                    </div>

                    <button 
                        type="submit" 
                        disabled={uploading || !file}
                        className={`w-full py-3 rounded-lg font-bold text-black transition-all transform active:scale-[0.99] ${
                            uploading || !file ? 'bg-gray-600 cursor-not-allowed' : 'bg-accent hover:bg-accent/90 shadow-lg shadow-accent/20'
                        }`}
                    >
                        {uploading ? 'Uploading...' : 'Upload Image'}
                    </button>
                </form>
            </div>
          </div>
        )}

        {/* --- EDIT MODAL --- */}
        {editingImage && (
          <EditImageModal 
            image={editingImage} 
            isOpen={!!editingImage} 
            onClose={() => setEditingImage(null)}
            onSave={handleSaveEdit}
            onDelete={handleDelete}
          />
        )}
      </div>
    </div>
  );
};

export default AdminDashboard;
