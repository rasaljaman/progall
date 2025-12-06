import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { supabase } from '../services/supabaseService';
import { ImageItem } from '../types';
import { ArrowLeft, Copy, Download, Edit2, Sparkles, Share2 } from 'lucide-react';
import EditImageModal from '../components/EditImageModal';
import GalleryGrid from '../components/GalleryGrid';

const ImageDetail: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  
  const [image, setImage] = useState<ImageItem | null>(null);
  const [relatedImages, setRelatedImages] = useState<ImageItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [isAdmin, setIsAdmin] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);

  // --- 1. SCROLL TO TOP (Fixes issue where page stays at bottom on navigation) ---
  useEffect(() => {
    window.scrollTo(0, 0);
  }, [id]);

  // --- 2. FETCH DATA & SMART SORT ---
  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      if (!id) return;

      // A. Get Current Image
      const { data: currentImg, error } = await supabase
        .from('images')
        .select('*')
        .eq('id', id)
        .single();

      if (error || !currentImg) {
        console.error('Error fetching image:', error);
        navigate('/'); 
        return;
      }

      setImage(currentImg);

      // B. SMART SORT ALGORITHM for Related Images
      // Fetch a pool of images (limit 100) to rank them
      const { data: allImages } = await supabase
        .from('images')
        .select('*')
        .neq('id', currentImg.id) // Exclude the image we are looking at
        .limit(100);

      if (allImages) {
        // Calculate a "Relevance Score" for each image
        const rankedImages = allImages.map(img => {
          let score = 0;

          // Priority 1: Category Match (+10 points)
          if (img.category === currentImg.category) score += 10;

          // Priority 2: Tag Overlap (+3 points per shared tag)
          const sharedTags = img.tags.filter(tag => currentImg.tags.includes(tag));
          score += (sharedTags.length * 3);

          // Priority 3: Word Match (+1 point per shared word > 3 letters)
          const currentWords = currentImg.prompt.toLowerCase().split(/\s+/);
          const imgWords = img.prompt.toLowerCase().split(/\s+/);
          const sharedWords = imgWords.filter(w => currentWords.includes(w) && w.length > 3);
          score += sharedWords.length;

          // Return image with its calculated score
          return { ...img, relevanceScore: score };
        });

        // Sort by Score (Highest first) and take the top 8
        const sorted = rankedImages
          .sort((a, b) => b.relevanceScore - a.relevanceScore)
          .slice(0, 8);

        setRelatedImages(sorted);
      }

      // C. Check Admin Status
      const { data: { session } } = await supabase.auth.getSession();
      setIsAdmin(!!session);

      setLoading(false);
    };

    fetchData();
  }, [id, navigate]);

  // --- HANDLERS ---
  const handleCopy = () => {
    if (image) {
      navigator.clipboard.writeText(image.prompt);
      alert('Prompt copied to clipboard! ✨');
    }
  };
  
  const handleGeminiRemix = async () => {
    if (image) {
      try {
        await navigator.clipboard.writeText(image.prompt);
        // Wait for clipboard write before opening tab
        window.open('https://gemini.google.com/app', '_blank');
      } catch (err) {
        console.error('Failed to copy:', err);
        // Open anyway if copy fails
        window.open('https://gemini.google.com/app', '_blank');
      }
    }
  };

  const handleShare = async () => {
    if (navigator.share && image) {
      try {
        await navigator.share({
          title: 'ProGall AI Art',
          text: image.prompt,
          url: window.location.href,
        });
      } catch (err) {
        // Share canceled
      }
    } else {
      handleCopy(); // Fallback
    }
  };

  const handleSaveEdit = async (updatedImage: ImageItem) => {
    const { error } = await supabase
      .from('images')
      .update({
        prompt: updatedImage.prompt,
        category: updatedImage.category,
        tags: updatedImage.tags,
        is_featured: updatedImage.is_featured
      })
      .eq('id', updatedImage.id);

    if (!error) {
      setImage(updatedImage); 
    }
  };

  const handleDelete = async (id: string) => {
    if (confirm('Delete this image permanently?')) {
        await supabase.from('images').delete().eq('id', id);
        navigate('/');
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-accent"></div>
      </div>
    );
  }

  if (!image) return null;

  return (
    <div className="min-h-screen pb-20 pt-6">
      <div className="max-w-7xl mx-auto px-4">
        
        {/* Back Button */}
        <button 
          onClick={() => navigate('/')} 
          className="flex items-center gap-2 text-textSecondary hover:text-white mb-6 transition-colors"
        >
          <ArrowLeft size={20} />
          <span>Back to Gallery</span>
        </button>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 lg:gap-12">
          
          {/* Left: Image Display */}
          <div className="space-y-6">
            <div className="bg-surface border border-surfaceHighlight rounded-2xl overflow-hidden shadow-2xl relative">
              <img 
                src={image.url} 
                alt={image.prompt} 
                className="w-full h-auto object-contain max-h-[80vh] bg-black/50" 
              />
            </div>
            
            {/* Admin Edit Shortcut */}
            {isAdmin && (
              <button 
                onClick={() => setIsEditModalOpen(true)}
                className="w-full py-3 bg-surfaceHighlight/30 border border-dashed border-accent/30 text-accent rounded-xl hover:bg-surfaceHighlight hover:border-accent transition-all flex items-center justify-center gap-2"
              >
                <Edit2 size={18} />
                <span>Edit Image Details (Admin)</span>
              </button>
            )}
          </div>

          {/* Right: Details & Actions */}
          <div className="space-y-8">
            
            {/* Header info */}
            <div>
              <div className="flex items-center gap-3 mb-4">
                <span className="px-3 py-1 bg-accent/10 text-accent rounded-full text-xs font-bold uppercase tracking-wider border border-accent/20">
                  {image.category}
                </span>
                {image.is_featured && (
                   <span className="px-3 py-1 bg-amber-500/10 text-amber-500 rounded-full text-xs font-bold uppercase tracking-wider border border-amber-500/20">
                     Featured
                   </span>
                )}
              </div>
              <h1 className="text-3xl md:text-4xl font-bold text-white leading-tight">Prompt Details</h1>
            </div>

            {/* Prompt Box */}
            <div className="bg-surface border border-surfaceHighlight rounded-xl p-6 relative group shadow-lg">
              <h3 className="text-xs font-bold text-textSecondary uppercase tracking-wider mb-4 flex items-center gap-2">
                 <Sparkles size={14} className="text-accent"/> 
                 AI Prompt
              </h3>
              <p className="text-gray-200 leading-relaxed font-light text-lg select-all">
                {image.prompt}
              </p>
              
              <button 
                onClick={handleCopy}
                className="absolute top-4 right-4 p-2 bg-black/40 hover:bg-accent hover:text-black rounded-lg text-gray-400 transition-all opacity-100 lg:opacity-0 group-hover:opacity-100"
                title="Copy Prompt"
              >
                <Copy size={18} />
              </button>
            </div>

            {/* Main Action Buttons */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              
              {/* PRIMARY ACTION: GEMINI REMIX */}
              <button 
                onClick={handleGeminiRemix}
                className="col-span-full py-4 bg-gradient-to-r from-blue-600 to-purple-600 rounded-xl text-white font-bold text-lg shadow-lg hover:shadow-accent/25 hover:scale-[1.01] transition-all flex items-center justify-center gap-3 active:scale-95"
              >
                <Sparkles size={24} className="animate-pulse" />
                Remix on Gemini
              </button>
              
              {/* Secondary Actions */}
              <button 
                onClick={handleShare}
                className="py-3 bg-surface border border-surfaceHighlight rounded-xl text-white font-medium hover:bg-surfaceHighlight hover:border-textSecondary transition-all flex items-center justify-center gap-2"
              >
                <Share2 size={18} />
                Share
              </button>

              <a 
                href={image.url} 
                download 
                target="_blank"
                rel="noreferrer"
                className="py-3 bg-surface border border-surfaceHighlight rounded-xl text-white font-medium hover:bg-surfaceHighlight hover:border-textSecondary transition-all flex items-center justify-center gap-2"
              >
                <Download size={18} />
                Download
              </a>
            </div>

            {/* Tags */}
            <div>
               <h3 className="text-xs font-bold text-textSecondary uppercase tracking-wider mb-3">Tags</h3>
               <div className="flex flex-wrap gap-2">
                 {image.tags.map((tag, i) => (
                   <span key={i} className="px-3 py-1 bg-surfaceHighlight/50 rounded-lg text-sm text-gray-400 border border-white/5 hover:border-white/20 transition-colors cursor-default">
                     #{tag}
                   </span>
                 ))}
               </div>
            </div>

          </div>
        </div>

        {/* Related Images Section (Smart Sorted) */}
        {relatedImages.length > 0 && (
          <div className="mt-20 border-t border-surfaceHighlight pt-10">
            <h2 className="text-2xl font-bold text-white mb-8">Related to this style</h2>
            <GalleryGrid images={relatedImages} />
          </div>
        )}

      </div>

      {/* Edit Modal */}
      {isAdmin && image && (
        <EditImageModal 
          image={image} 
          isOpen={isEditModalOpen} 
          onClose={() => setIsEditModalOpen(false)}
          onSave={handleSaveEdit}
          onDelete={handleDelete}
        />
      )}

    </div>
  );
};

export default ImageDetail;
