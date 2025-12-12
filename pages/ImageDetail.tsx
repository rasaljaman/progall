// ... imports (Keep existing imports)
import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Helmet } from 'react-helmet-async';
import { supabaseService, supabase } from '../services/supabaseService';
import { ImageItem } from '../types';
import { ArrowLeft, Copy, Download, Edit2, Sparkles, Share2 } from 'lucide-react';
import { getAdminColor } from '../constants'; 
import EditImageModal from '../components/EditImageModal';
import GalleryGrid from '../components/GalleryGrid';
import { useToast } from '../context/ToastContext';

const ImageDetail: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  
  const [image, setImage] = useState<ImageItem | null>(null);
  const [relatedImages, setRelatedImages] = useState<ImageItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [isAdmin, setIsAdmin] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const { showToast } = useToast();

  useEffect(() => {
    window.scrollTo(0, 0);
  }, [id]);

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      if (!id) return;

      const { data: currentImg, error } = await supabase
        .from('images')
        .select('*')
        .eq('id', id)
        .single();

      if (error || !currentImg) {
        navigate('/'); 
        return;
      }

      setImage(currentImg);

      const { data: allImages } = await supabase
        .from('images')
        .select('*')
        .neq('id', currentImg.id)
        .limit(100);

      if (allImages) {
        const rankedImages = allImages.map(img => {
          let score = 0;
          if (img.category === currentImg.category) score += 10;
          const sharedTags = img.tags.filter(tag => currentImg.tags.includes(tag));
          score += (sharedTags.length * 3);
          const currentWords = currentImg.prompt.toLowerCase().split(/\s+/);
          const imgWords = img.prompt.toLowerCase().split(/\s+/);
          const sharedWords = imgWords.filter(w => currentWords.includes(w) && w.length > 3);
          score += sharedWords.length;
          return { ...img, relevanceScore: score };
        });

        const sorted = rankedImages
          .sort((a, b) => b.relevanceScore - a.relevanceScore)
          .slice(0, 8);

        setRelatedImages(sorted);
      }

      const { data: { session } } = await supabase.auth.getSession();
      setIsAdmin(!!session);

      setLoading(false);
    };

    fetchData();
  }, [id, navigate]);

  const handleCopy = () => {
    if (image) {
      navigator.clipboard.writeText(image.prompt);
      showToast('Prompt copied successfully! 🎨');
    }
  };
  
  const handleGeminiRemix = () => {
    if (image) {
      const newTab = window.open('https://gemini.google.com/app', '_blank');
      navigator.clipboard.writeText(image.prompt)
        .then(() => {
           showToast('Prompt copied! Paste it in Gemini.');
        })
        .catch((err) => {
           if(newTab) showToast('Please copy prompt manually', 'error');
        });
    }
  };

  const handleShare = async () => {
    if (navigator.share && image) {
      try {
        await navigator.share({
          title: 'ProGall Art',
          text: image.prompt,
          url: window.location.href,
        });
      } catch (err) { }
    } else {
      handleCopy();
    }
  };
  
  const handleSaveEdit = async (updatedImage: ImageItem) => {
    try {
      await supabaseService.updateImage(updatedImage);
      setImage(updatedImage);
      showToast('Image details updated successfully!');
    } catch (err) {
      showToast('Failed to save changes', 'error');
    }
  };

  const handleDelete = async (id: string) => {
    if (confirm('Delete this image permanently?')) {
        await supabaseService.deleteImage(id); 
        navigate('/');
    }
  };

  if (loading) return <div className="min-h-screen flex items-center justify-center"><div className="animate-spin rounded-full h-10 w-10 border-t-2 border-accent"></div></div>;
  if (!image) return null;

  return (
    // ADDED 'page-enter' CLASS HERE
    <div className="min-h-screen pb-20 pt-6 page-enter">
      
      <Helmet>
        <title>{image.prompt.slice(0, 60)}... | ProGall</title>
        <meta name="description" content={`Download this AI generated ${image.category} art.`} />
        <meta property="og:title" content={`${image.category} AI Art | ProGall`} />
        <meta property="og:image" content={image.thumbnail} />
      </Helmet>

      <div className="max-w-7xl mx-auto px-4">
        
        <button 
          onClick={() => navigate('/')} 
          className="flex items-center gap-2 text-textSecondary hover:text-textPrimary mb-6 transition-colors"
        >
          <ArrowLeft size={20} />
          <span>Back to Gallery</span>
        </button>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          
          <div className="space-y-4 relative">
             <img src={image.url} alt={image.prompt} className="w-full rounded-2xl border border-surfaceHighlight shadow-2xl" />
             
             {isAdmin && image.created_by && (
                <div 
                  className="absolute top-4 left-4 z-20 flex items-center gap-2 bg-black/60 backdrop-blur-md px-3 py-1.5 rounded-full border border-white/10"
                  title="Admin Creator ID"
                >
                  <div 
                    className="w-3 h-3 rounded-full border border-white shadow-sm" 
                    style={{ backgroundColor: getAdminColor(image.created_by) }}
                  />
                  <span className="text-[10px] text-gray-300 font-mono">
                    {image.created_by.slice(0, 6)}...
                  </span>
                </div>
             )}

             {isAdmin && (
              <button onClick={() => setIsEditModalOpen(true)} className="w-full py-3 border border-dashed border-accent/30 text-accent rounded-xl hover:bg-surfaceHighlight">
                <Edit2 size={18} className="inline mr-2"/> Edit Image Details
              </button>
            )}
          </div>

          <div className="space-y-6">
            <div>
              <span className="text-accent text-sm font-bold uppercase">{image.category}</span>
              <h1 className="text-3xl font-bold text-textPrimary mt-1">Prompt Details</h1>
            </div>

            <div className="bg-surface p-6 rounded-xl border border-surfaceHighlight group relative">
              <p className="text-textPrimary text-lg font-light leading-relaxed">{image.prompt}</p>
              <button onClick={handleCopy} className="absolute top-4 right-4 p-2 bg-black/5 rounded hover:bg-accent hover:text-white opacity-100 lg:opacity-0 group-hover:opacity-100 transition-opacity"><Copy size={16} className="text-textSecondary"/></button>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <button onClick={handleGeminiRemix} className="col-span-full py-4 bg-gradient-to-r from-teal-500 to-cyan-600 rounded-xl text-white font-bold flex items-center justify-center gap-2 shadow-lg">
                <Sparkles size={20}/> Remix on Gemini
              </button>
              
              <button onClick={handleShare} className="py-3 bg-surface border border-surfaceHighlight rounded-xl text-textPrimary flex items-center justify-center gap-2 hover:bg-surfaceHighlight">
                <Share2 size={18}/> Share
              </button>
              <a href={image.url} download target="_blank" rel="noreferrer" className="py-3 bg-surface border border-surfaceHighlight rounded-xl text-textPrimary flex items-center justify-center gap-2 hover:bg-surfaceHighlight">
                <Download size={18}/> Download
              </a>
            </div>

            <div className="flex flex-wrap gap-2">
              {image.tags.map((tag, i) => (
                <span key={i} className="px-3 py-1 bg-surfaceHighlight rounded-lg text-sm text-textPrimary/70">#{tag}</span>
              ))}
            </div>
          </div>
        </div>

        {relatedImages.length > 0 && (
          <div className="mt-20 border-t border-surfaceHighlight pt-10">
            <h2 className="text-2xl font-bold text-textPrimary mb-8">Related to this style</h2>
            <GalleryGrid images={relatedImages} />
          </div>
        )}

        {isAdmin && image && (
          <EditImageModal 
            image={image} isOpen={isEditModalOpen} onClose={() => setIsEditModalOpen(false)} onSave={handleSaveEdit} onDelete={handleDelete}
          />
        )}
      </div>
    </div>
  );
};

export default ImageDetail;
