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
      alert('Prompt copied!');
    }
  };
  
  const handleGeminiRemix = async () => {
    if (image) {
      try {
        await navigator.clipboard.writeText(image.prompt);
        window.open('https://gemini.google.com/app', '_blank');
      } catch (err) {
        window.open('https://gemini.google.com/app', '_blank');
      }
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

  if (loading) return <div className="min-h-screen flex items-center justify-center"><div className="animate-spin rounded-full h-10 w-10 border-t-2 border-accent"></div></div>;
  if (!image) return null;

  return (
    <div className="min-h-screen pb-20 pt-6">
      <div className="max-w-7xl mx-auto px-4">
        
        {/* Back Button */}
        {/* FIX: Changed hover:text-white to hover:text-textPrimary */}
        <button 
          onClick={() => navigate('/')} 
          className="flex items-center gap-2 text-textSecondary hover:text-textPrimary mb-6 transition-colors"
        >
          <ArrowLeft size={20} />
          <span>Back to Gallery</span>
        </button>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Image */}
          <div className="space-y-4">
             <img src={image.url} alt="Main" className="w-full rounded-2xl border border-surfaceHighlight shadow-2xl" />
             
             {isAdmin && (
              <button onClick={() => setIsEditModalOpen(true)} className="w-full py-3 border border-dashed border-accent/30 text-accent rounded-xl hover:bg-surfaceHighlight">
                <Edit2 size={18} className="inline mr-2"/> Edit Image Details
              </button>
            )}
          </div>

          {/* Details */}
          <div className="space-y-6">
            <div>
              <span className="text-accent text-sm font-bold uppercase">{image.category}</span>
              {/* FIX: Changed text-white to text-textPrimary */}
              <h1 className="text-3xl font-bold text-textPrimary mt-1">Prompt Details</h1>
            </div>

            <div className="bg-surface p-6 rounded-xl border border-surfaceHighlight group relative">
              {/* FIX: Changed text-gray-200 to text-textPrimary */}
              <p className="text-textPrimary text-lg font-light leading-relaxed">{image.prompt}</p>
              <button onClick={handleCopy} className="absolute top-4 right-4 p-2 bg-black/5 rounded hover:bg-accent hover:text-white opacity-100 lg:opacity-0 group-hover:opacity-100 transition-opacity"><Copy size={16} className="text-textSecondary"/></button>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <button onClick={handleGeminiRemix} className="col-span-full py-4 bg-gradient-to-r from-teal-500 to-cyan-600 rounded-xl text-white font-bold flex items-center justify-center gap-2 shadow-lg">
                <Sparkles size={20}/> Remix on Gemini
              </button>
              {/* FIX: Added text-textPrimary to secondary buttons */}
              <button onClick={handleShare} className="py-3 bg-surface border border-surfaceHighlight rounded-xl text-textPrimary flex items-center justify-center gap-2 hover:bg-surfaceHighlight">
                <Share2 size={18}/> Share
              </button>
              <a href={image.url} download target="_blank" rel="noreferrer" className="py-3 bg-surface border border-surfaceHighlight rounded-xl text-textPrimary flex items-center justify-center gap-2 hover:bg-surfaceHighlight">
                <Download size={18}/> Download
              </a>
            </div>

            <div className="flex flex-wrap gap-2">
              {image.tags.map((tag, i) => (
                // FIX: Changed text-gray-400 to text-textSecondary
                <span key={i} className="px-3 py-1 bg-surfaceHighlight rounded-lg text-sm text-textPrimary/70">#{tag}</span>
              ))}
            </div>
          </div>
        </div>

        {/* Related Images */}
        {relatedImages.length > 0 && (
          <div className="mt-20 border-t border-surfaceHighlight pt-10">
            {/* FIX: Changed text-white to text-textPrimary */}
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
