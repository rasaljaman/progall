import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { supabaseService } from '../services/supabaseService';
import { ImageItem } from '../types';
import { Share2, Copy, Check, ArrowLeft } from 'lucide-react';
import GalleryGrid from '../components/GalleryGrid';

const ImageDetail: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [image, setImage] = useState<ImageItem | null>(null);
  const [relatedImages, setRelatedImages] = useState<ImageItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    const fetchImage = async () => {
      setLoading(true);
      if (id) {
        const found = await supabaseService.getImageById(id);
        setImage(found || null);
        
        // Fetch mock related images (just all images excluding current for demo)
        const all = await supabaseService.getImages();
        setRelatedImages(all.filter(i => i.id !== id));
      }
      setLoading(false);
    };
    fetchImage();
  }, [id]);

  const handleCopyPrompt = () => {
    if (image) {
      navigator.clipboard.writeText(image.prompt);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const handleShare = async () => {
    if (navigator.share && image) {
      try {
        await navigator.share({
          title: 'Check out this AI art',
          text: image.prompt,
          url: window.location.href,
        });
      } catch (err) {
        console.log('Share canceled');
      }
    } else {
      alert('Sharing is not supported on this browser.');
    }
  };

  if (loading) {
    return (
        <div className="flex justify-center items-center h-screen bg-background">
            <div className="animate-spin rounded-full h-10 w-10 border-t-2 border-b-2 border-accent"></div>
        </div>
    );
  }

  if (!image) {
    return (
      <div className="flex flex-col items-center justify-center h-screen text-textSecondary">
        <p className="mb-4">Image not found.</p>
        <button onClick={() => navigate('/')} className="text-accent hover:underline">Go Home</button>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background pb-20">
      {/* Full Width Image Container */}
      <div className="w-full bg-black/50 flex justify-center py-4 md:py-8 min-h-[40vh] md:min-h-[60vh] relative shadow-2xl">
         <img 
            src={image.url} 
            alt={image.prompt}
            className="max-h-[70vh] w-auto max-w-full object-contain rounded-sm shadow-2xl"
         />
      </div>

      {/* Info Section */}
      <div className="max-w-4xl mx-auto px-4 mt-8">
        
        {/* Prompt Card */}
        <div className="bg-surface rounded-2xl p-6 md:p-8 shadow-neumorphic border border-surfaceHighlight/50">
            <h2 className="text-sm font-semibold text-accent mb-3 uppercase tracking-wider">AI Prompt</h2>
            <p className="text-lg md:text-xl text-textPrimary leading-relaxed font-light">
                {image.prompt}
            </p>

            {/* Actions */}
            <div className="flex gap-4 mt-8">
                <button
                    onClick={handleShare}
                    className="flex-1 md:flex-none flex items-center justify-center gap-2 px-6 py-3 bg-surfaceHighlight hover:bg-surfaceHighlight/80 text-white rounded-lg transition-all font-medium active:scale-95"
                >
                    <Share2 size={18} />
                    <span>Share</span>
                </button>
                <button
                    onClick={handleCopyPrompt}
                    className={`flex-1 md:flex-none flex items-center justify-center gap-2 px-6 py-3 rounded-lg transition-all font-medium active:scale-95 border ${
                        copied 
                        ? 'bg-green-500/20 border-green-500 text-green-400' 
                        : 'bg-transparent border-surfaceHighlight hover:border-accent text-white hover:text-accent'
                    }`}
                >
                    {copied ? <Check size={18} /> : <Copy size={18} />}
                    <span>{copied ? 'Copied!' : 'Copy Prompt'}</span>
                </button>
            </div>
        </div>

        {/* Metadata Tags */}
        <div className="flex flex-wrap gap-2 mt-6">
            <span className="px-3 py-1 rounded-full bg-surfaceHighlight text-xs text-textSecondary border border-surfaceHighlight">
                {image.category}
            </span>
            {image.tags.map(tag => (
                <span key={tag} className="px-3 py-1 rounded-full bg-surfaceHighlight/50 text-xs text-textSecondary">
                    #{tag}
                </span>
            ))}
        </div>

      </div>

      {/* Related Gallery */}
      <div className="max-w-7xl mx-auto mt-16 px-4">
        <h3 className="text-xl font-bold text-white mb-6 pl-2 border-l-4 border-accent">More like this</h3>
        <GalleryGrid images={relatedImages} />
      </div>
    </div>
  );
};

export default ImageDetail;
