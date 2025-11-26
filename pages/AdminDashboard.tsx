import React, { useState, useEffect } from 'react';
import { supabaseService } from '../services/supabaseService';
import { ImageItem } from '../types';
import { Upload, X, Trash2, Edit2, Copy, Search } from 'lucide-react';
import { CATEGORIES } from '../constants';

const AdminDashboard: React.FC = () => {
  const [images, setImages] = useState<ImageItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [dragActive, setDragActive] = useState(false);
  
  // Form State
  const [file, setFile] = useState<File | null>(null);
  const [prompt, setPrompt] = useState('');
  const [category, setCategory] = useState(CATEGORIES[1]); // Default to first real cat
  const [tags, setTags] = useState('');
  const [uploading, setUploading] = useState(false);

  useEffect(() => {
    loadImages();
  }, []);

  const loadImages = async () => {
    setLoading(true);
    const data = await supabaseService.getImages();
    setImages(data);
    setLoading(false);
  };

  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === "dragenter" || e.type === "dragover") {
      setDragActive(true);
    } else if (e.type === "dragleave") {
      setDragActive(false);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      setFile(e.dataTransfer.files[0]);
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setFile(e.target.files[0]);
    }
  };

  const handleUpload = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!file || !prompt) return;

    setUploading(true);
    try {
      const tagArray = tags.split(',').map(t => t.trim()).filter(t => t.length > 0);
      await supabaseService.uploadImage(file, prompt, category, tagArray);
      
      // Reset form
      setFile(null);
      setPrompt('');
      setTags('');
      setCategory(CATEGORIES[1]);
      
      // Refresh list
      await loadImages();
    /* } catch (err) {
      console.error(err);
      alert('Upload failed');
    } finally {
      setUploading(false);
    } */
    
    } catch (err) {
  console.error("Upload Error:", err);

  let msg =
    err?.message ||
    err?.error_description ||
    err?.data?.message ||
    "Upload failed! Please try again.";

  alert(msg);
}
  };

  const handleDelete = async (id: string) => {
    if (window.confirm('Are you sure you want to delete this image?')) {
        await supabaseService.deleteImage(id);
        await loadImages();
    }
  };

  return (
    <div className="max-w-6xl mx-auto px-4 py-8 pb-24">
      <h1 className="text-3xl font-bold text-white mb-8">Admin Dashboard</h1>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Upload Column */}
        <div className="lg:col-span-1">
            <div className="bg-surface p-6 rounded-2xl shadow-neumorphic sticky top-24">
                <h2 className="text-xl font-semibold text-accent mb-6 flex items-center gap-2">
                    <Upload size={20} />
                    Upload New
                </h2>
                
                <form onSubmit={handleUpload} className="space-y-4">
                    {/* Drag Drop Area */}
                    <div 
                        className={`border-2 border-dashed rounded-xl p-8 text-center transition-colors ${
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
                            onChange={handleFileChange}
                        />
                        <label htmlFor="file-upload" className="cursor-pointer flex flex-col items-center gap-2">
                             {file ? (
                                <>
                                    <div className="text-green-400 font-medium break-all">{file.name}</div>
                                    <span className="text-xs text-textSecondary">Click to change</span>
                                </>
                             ) : (
                                <>
                                    <div className="bg-surfaceHighlight p-3 rounded-full text-textSecondary">
                                        <Upload size={24}/>
                                    </div>
                                    <p className="text-sm text-textPrimary">Drag image here or <span className="text-accent">browse</span></p>
                                    <p className="text-xs text-textSecondary mt-1">Supports JPG, PNG</p>
                                </>
                             )}
                        </label>
                    </div>

                    <div>
                        <label className="block text-xs font-medium text-textSecondary uppercase tracking-wider mb-1">Prompt</label>
                        <textarea 
                            value={prompt}
                            onChange={e => setPrompt(e.target.value)}
                            required
                            rows={4}
                            className="w-full bg-background border border-surfaceHighlight rounded-lg p-3 text-white focus:border-accent focus:ring-1 focus:ring-accent outline-none transition-all resize-none text-sm"
                            placeholder="Enter the AI prompt..."
                        />
                    </div>

                    <div>
                        <label className="block text-xs font-medium text-textSecondary uppercase tracking-wider mb-1">Category</label>
                        <select 
                             value={category}
                             onChange={e => setCategory(e.target.value)}
                             className="w-full bg-background border border-surfaceHighlight rounded-lg p-3 text-white focus:border-accent outline-none text-sm"
                        >
                            {CATEGORIES.filter(c => c !== 'All').map(c => (
                                <option key={c} value={c}>{c}</option>
                            ))}
                        </select>
                    </div>

                    <div>
                        <label className="block text-xs font-medium text-textSecondary uppercase tracking-wider mb-1">Tags</label>
                        <input 
                            type="text"
                            value={tags}
                            onChange={e => setTags(e.target.value)}
                            className="w-full bg-background border border-surfaceHighlight rounded-lg p-3 text-white focus:border-accent focus:ring-1 focus:ring-accent outline-none transition-all text-sm"
                            placeholder="e.g. landscape, dark, 4k (comma separated)"
                        />
                    </div>

                    <button 
                        type="submit" 
                        disabled={uploading || !file}
                        className={`w-full py-3 rounded-lg font-bold text-black transition-all transform active:scale-95 ${
                            uploading || !file ? 'bg-gray-600 cursor-not-allowed' : 'bg-accent hover:bg-accent/90'
                        }`}
                    >
                        {uploading ? 'Uploading...' : 'Upload Image'}
                    </button>
                </form>
            </div>
        </div>

        {/* List Column */}
        <div className="lg:col-span-2 space-y-6">
            <div className="flex items-center justify-between mb-2">
                <h2 className="text-xl font-semibold text-white">Library ({images.length})</h2>
                {/* Simple mock search filter could go here */}
            </div>

            {loading ? (
                 <div className="flex justify-center p-12">
                     <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-accent"></div>
                 </div>
            ) : (
                <div className="bg-surface rounded-2xl border border-surfaceHighlight overflow-hidden">
                    <div className="overflow-x-auto">
                        <table className="w-full text-left border-collapse">
                            <thead>
                                <tr className="bg-surfaceHighlight/50 border-b border-surfaceHighlight text-xs uppercase text-textSecondary">
                                    <th className="p-4 font-medium">Image</th>
                                    <th className="p-4 font-medium">Prompt Preview</th>
                                    <th className="p-4 font-medium">Category</th>
                                    <th className="p-4 font-medium text-right">Actions</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-surfaceHighlight">
                                {images.map(img => (
                                    <tr key={img.id} className="hover:bg-white/5 transition-colors group">
                                        <td className="p-4">
                                            <div className="w-16 h-12 rounded-lg overflow-hidden bg-black">
                                                <img src={img.thumbnail} alt="" className="w-full h-full object-cover" />
                                            </div>
                                        </td>
                                        <td className="p-4">
                                            <p className="text-sm text-textPrimary line-clamp-2 max-w-xs" title={img.prompt}>
                                                {img.prompt}
                                            </p>
                                        </td>
                                        <td className="p-4">
                                            <span className="text-xs px-2 py-1 rounded bg-surfaceHighlight text-textSecondary border border-surfaceHighlight/50">
                                                {img.category}
                                            </span>
                                        </td>
                                        <td className="p-4 text-right">
                                            <div className="flex items-center justify-end gap-2 opacity-100 lg:opacity-0 group-hover:opacity-100 transition-opacity">
                                                <button 
                                                    onClick={() => navigator.clipboard.writeText(img.prompt)}
                                                    className="p-2 hover:bg-surfaceHighlight rounded text-textSecondary hover:text-white"
                                                    title="Copy Prompt"
                                                >
                                                    <Copy size={16} />
                                                </button>
                                                <button 
                                                    onClick={() => handleDelete(img.id)}
                                                    className="p-2 hover:bg-red-500/20 rounded text-textSecondary hover:text-red-400"
                                                    title="Delete"
                                                >
                                                    <Trash2 size={16} />
                                                </button>
                                            </div>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </div>
            )}
        </div>
      </div>
    </div>
  );
};

export default AdminDashboard;
