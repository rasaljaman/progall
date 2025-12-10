import React, { useState, useEffect } from 'react';
import { X, Save, Trash2, RefreshCw } from 'lucide-react';
import { ImageItem } from '../types';
import { CATEGORIES } from '../constants'; // Ensure you have this import

interface EditImageModalProps {
  image: ImageItem;
  isOpen: boolean;
  onClose: () => void;
  // Updated: onSave now accepts an optional file
  onSave: (updatedImage: ImageItem, newFile?: File) => Promise<void>;
  onDelete: (id: string) => Promise<void>;
}

const EditImageModal: React.FC<EditImageModalProps> = ({ image, isOpen, onClose, onSave, onDelete }) => {
  const [formData, setFormData] = useState<ImageItem>(image);
  const [tagsInput, setTagsInput] = useState(image.tags.join(', '));
  const [loading, setLoading] = useState(false);
  
  // New State for File Replacement
  const [newFile, setNewFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string>(image.url);

  // Reset state when modal opens with a new image
  useEffect(() => {
    setFormData(image);
    setTagsInput(image.tags.join(', '));
    setNewFile(null);
    setPreviewUrl(image.url);
  }, [image]);

  if (!isOpen) return null;

  // Handle selecting a new file from device
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      setNewFile(file);
      setPreviewUrl(URL.createObjectURL(file)); // Show local preview
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    // Convert tags string back to array
    const updatedTags = tagsInput.split(',').map(t => t.trim()).filter(t => t.length > 0);
    const updatedData = { ...formData, tags: updatedTags };
    
    // Pass data AND newFile to the parent handler
    await onSave(updatedData, newFile || undefined);
    
    setLoading(false);
    onClose();
  };

  const handleDelete = async () => {
    if (confirm('Are you sure you want to delete this image? This cannot be undone.')) {
      setLoading(true);
      await onDelete(image.id);
      setLoading(false);
      onClose();
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4 animate-in fade-in duration-200">
      <div className="bg-surface border border-surfaceHighlight rounded-xl w-full max-w-4xl max-h-[90vh] overflow-y-auto flex flex-col md:flex-row shadow-2xl">
        
        {/* LEFT: IMAGE PREVIEW & REPLACE */}
        <div className="w-full md:w-2/5 bg-black relative group min-h-[300px] md:min-h-full">
            <img 
              src={previewUrl} 
              alt="Preview" 
              className="w-full h-full object-contain md:object-cover opacity-100 transition-opacity group-hover:opacity-40" 
            />
            
            {/* Overlay for replacing image */}
            <label className="absolute inset-0 flex flex-col items-center justify-center bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer">
                <RefreshCw size={32} className="text-white mb-2" />
                <span className="text-white font-bold text-sm">Click to Replace Image</span>
                <input type="file" className="hidden" accept="image/*" onChange={handleFileChange} />
            </label>

            {/* Badge indicating a new file is staged */}
            {newFile && (
                <div className="absolute top-4 left-4 bg-accent text-white text-[10px] font-bold px-2 py-1 rounded shadow border border-white/20">
                    NEW IMAGE SELECTED
                </div>
            )}
        </div>

        {/* RIGHT: FORM */}
        <div className="w-full md:w-3/5 flex flex-col">
            <div className="flex justify-between items-center p-6 border-b border-surfaceHighlight">
            <h2 className="text-xl font-bold text-textPrimary">Edit Image Details</h2>
            <button onClick={onClose} className="p-2 hover:bg-surfaceHighlight rounded-full text-textSecondary">
                <X size={20} />
            </button>
            </div>

            <form onSubmit={handleSubmit} className="p-6 space-y-5 flex-1 overflow-y-auto">
            
            {/* Featured Toggle */}
            <div className="flex items-center gap-3 p-3 bg-surfaceHighlight/30 rounded-lg border border-surfaceHighlight">
                <input 
                    type="checkbox" 
                    id="featured"
                    checked={formData.is_featured || false}
                    onChange={(e) => setFormData({...formData, is_featured: e.target.checked})}
                    className="w-5 h-5 accent-accent rounded cursor-pointer"
                />
                <label htmlFor="featured" className="cursor-pointer">
                    <span className="block text-textPrimary font-medium">Feature in Slider</span>
                    <span className="text-xs text-textSecondary">Show this in the main Home Carousel</span>
                </label>
            </div>

            {/* Prompt */}
            <div>
                <label className="block text-xs font-bold text-textSecondary uppercase tracking-wider mb-2">Prompt</label>
                <textarea 
                value={formData.prompt}
                onChange={(e) => setFormData({...formData, prompt: e.target.value})}
                className="w-full bg-background border border-surfaceHighlight rounded-lg p-3 text-textPrimary focus:border-accent outline-none text-sm h-32 leading-relaxed"
                placeholder="Enter prompt..."
                />
            </div>

            <div className="grid grid-cols-2 gap-4">
                {/* Category */}
                <div>
                    <label className="block text-xs font-bold text-textSecondary uppercase tracking-wider mb-2">Category</label>
                    <input 
                        list="categories"
                        value={formData.category}
                        onChange={(e) => setFormData({...formData, category: e.target.value})}
                        className="w-full bg-background border border-surfaceHighlight rounded-lg p-3 text-textPrimary focus:border-accent outline-none text-sm"
                    />
                    <datalist id="categories">
                        {CATEGORIES.filter(c => c !== 'All').map(c => <option key={c} value={c} />)}
                    </datalist>
                </div>

                {/* Tags */}
                <div>
                    <label className="block text-xs font-bold text-textSecondary uppercase tracking-wider mb-2">Tags</label>
                    <input 
                        type="text"
                        value={tagsInput}
                        onChange={(e) => setTagsInput(e.target.value)}
                        className="w-full bg-background border border-surfaceHighlight rounded-lg p-3 text-textPrimary focus:border-accent outline-none text-sm"
                        placeholder="dark, 4k, neon..."
                    />
                </div>
            </div>

            {/* Action Buttons */}
            <div className="flex gap-3 pt-6 mt-4 border-t border-surfaceHighlight">
                <button 
                type="button" 
                onClick={handleDelete}
                className="px-4 py-2 bg-red-500/10 text-red-500 rounded-lg hover:bg-red-500 hover:text-white transition-all flex items-center gap-2 font-medium text-sm"
                >
                <Trash2 size={16} />
                Delete
                </button>
                <div className="flex-1"></div>
                <button 
                type="button" 
                onClick={onClose}
                className="px-4 py-2 text-textSecondary hover:text-textPrimary font-medium text-sm"
                >
                Cancel
                </button>
                <button 
                type="submit" 
                disabled={loading}
                className="px-6 py-2 bg-accent text-white font-bold rounded-lg hover:bg-accent/90 flex items-center gap-2 shadow-lg shadow-accent/20 transition-all disabled:opacity-50"
                >
                <Save size={18} />
                {loading ? 'Saving...' : 'Save Changes'}
                </button>
            </div>
            </form>
        </div>
      </div>
    </div>
  );
};

export default EditImageModal;
