import React, { useState } from 'react';
import { X, Save, Trash2 } from 'lucide-react';
import { ImageItem } from '../types';

interface EditImageModalProps {
  image: ImageItem;
  isOpen: boolean;
  onClose: () => void;
  onSave: (updatedImage: ImageItem) => Promise<void>;
  onDelete: (id: string) => Promise<void>;
}

const EditImageModal: React.FC<EditImageModalProps> = ({ image, isOpen, onClose, onSave, onDelete }) => {
  const [formData, setFormData] = useState<ImageItem>(image);
  const [loading, setLoading] = useState(false);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    await onSave(formData);
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
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4">
      <div className="bg-surface border border-surfaceHighlight rounded-xl w-full max-w-lg max-h-[90vh] overflow-y-auto">
        <div className="flex justify-between items-center p-4 border-b border-surfaceHighlight">
          <h2 className="text-xl font-bold text-white">Edit Image</h2>
          <button onClick={onClose} className="p-1 hover:bg-white/10 rounded-full text-gray-400">
            <X size={20} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-4 space-y-4">
          
          {/* Preview */}
          <div className="flex gap-4">
            <img src={image.thumbnail} alt="Preview" className="w-24 h-24 object-cover rounded-lg border border-surfaceHighlight" />
            <div className="flex-1 space-y-2">
              <label className="flex items-center gap-3 p-3 bg-surfaceHighlight/50 rounded-lg cursor-pointer hover:bg-surfaceHighlight transition-colors border border-white/5">
                <input 
                  type="checkbox" 
                  checked={formData.is_featured || false}
                  onChange={(e) => setFormData({...formData, is_featured: e.target.checked})}
                  className="w-5 h-5 accent-accent rounded"
                />
                <div>
                  <span className="block text-white font-medium">Feature in Slider</span>
                  <span className="text-xs text-gray-400">Show this in the Home Carousel</span>
                </div>
              </label>
            </div>
          </div>

          {/* Prompt */}
          <div>
            <label className="block text-sm text-gray-400 mb-1">Prompt</label>
            <textarea 
              value={formData.prompt}
              onChange={(e) => setFormData({...formData, prompt: e.target.value})}
              className="w-full bg-black/30 border border-surfaceHighlight rounded-lg p-3 text-white focus:border-accent focus:outline-none h-32"
            />
          </div>

          {/* Category */}
          <div>
            <label className="block text-sm text-gray-400 mb-1">Category</label>
            <input 
              type="text"
              value={formData.category}
              onChange={(e) => setFormData({...formData, category: e.target.value})}
              className="w-full bg-black/30 border border-surfaceHighlight rounded-lg p-3 text-white focus:border-accent focus:outline-none"
            />
          </div>

          {/* Tags */}
          <div>
            <label className="block text-sm text-gray-400 mb-1">Tags (comma separated)</label>
            <input 
              type="text"
              value={formData.tags.join(', ')}
              onChange={(e) => setFormData({...formData, tags: e.target.value.split(',').map(t => t.trim())})}
              className="w-full bg-black/30 border border-surfaceHighlight rounded-lg p-3 text-white focus:border-accent focus:outline-none"
            />
          </div>

          {/* Actions */}
          <div className="flex gap-3 pt-4 border-t border-surfaceHighlight mt-4">
            <button 
              type="button" 
              onClick={handleDelete}
              className="px-4 py-2 bg-red-500/10 text-red-400 rounded-lg hover:bg-red-500/20 flex items-center gap-2"
            >
              <Trash2 size={18} />
              Delete
            </button>
            <div className="flex-1"></div>
            <button 
              type="button" 
              onClick={onClose}
              className="px-4 py-2 text-gray-400 hover:text-white"
            >
              Cancel
            </button>
            <button 
              type="submit" 
              disabled={loading}
              className="px-6 py-2 bg-accent text-black font-bold rounded-lg hover:bg-accent/90 flex items-center gap-2"
            >
              <Save size={18} />
              {loading ? 'Saving...' : 'Save Changes'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default EditImageModal;
