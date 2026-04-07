import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import SEO from '../components/SEO';
import { supabaseService } from '../services/supabaseService';
import { BlogPost } from '../types';
import { BookOpen, Clock, ChevronRight, Sparkles } from 'lucide-react';

const Blog: React.FC = () => {
  const [blogs, setBlogs] = useState<BlogPost[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    window.scrollTo(0, 0);
    const fetchBlogs = async () => {
      try {
        const data = await supabaseService.getBlogs(true);
        setBlogs(data);
      } catch (err) {
        console.error("Error fetching blogs:", err);
      } finally {
        setLoading(false);
      }
    };
    fetchBlogs();
  }, []);

  return (
    <div className="min-h-screen pb-20 pt-28 md:pt-32 bg-background text-textPrimary page-enter">
      <SEO
        title="AI Prompt Engineering Guides & Blog"
        description="Learn the secrets of generative AI. Read our comprehensive guides on Midjourney lighting, composition, and prompt engineering."
      />

      <div className="max-w-5xl mx-auto px-4">
        
        {/* Header */}
        <div className="text-center mb-16 animate-fade-up">
          <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-accent/10 text-accent text-sm font-semibold mb-4 border border-accent/20">
            <Sparkles size={16} /> Guides & Tutorials
          </div>
          <h1 className="text-4xl md:text-5xl font-bold tracking-tight mb-4">
            Master <span className="text-accent">AI Art</span> Generation
          </h1>
          <p className="text-textSecondary text-lg max-w-2xl mx-auto leading-relaxed">
            Take your prompts from generic to breathtaking. Explore our collection of in-depth guides, 
            tutorials, and prompt engineering best practices.
          </p>
        </div>

        {/* Blog Grid */}
        {loading ? (
          <div className="flex justify-center items-center py-20">
             <div className="w-8 h-8 rounded-full border-2 border-accent border-t-transparent animate-spin"></div>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {blogs.length === 0 ? (
               <div className="col-span-full text-center text-textSecondary py-10">No articles available.</div>
            ) : (
              blogs.map((post) => (
                <Link 
                  key={post.id} 
                  to={`/blog/${post.slug}`}
                  className="group flex flex-col bg-surfaceHighlight border border-border/50 rounded-2xl overflow-hidden hover:border-accent/40 transition-all hover:shadow-xl hover:shadow-accent/5 hover:-translate-y-1"
                >
                  <div className="h-48 overflow-hidden relative">
                    <img 
                      src={post.image_url} 
                      alt={post.title} 
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                    />
                    <div className="absolute top-3 left-3 px-2.5 py-1 bg-black/60 backdrop-blur text-white text-xs font-semibold rounded-lg border border-white/10">
                      {post.category}
                    </div>
                  </div>
                  
                  <div className="p-6 flex flex-col flex-1">
                    <div className="flex items-center gap-3 text-xs text-textSecondary mb-3 font-medium">
                      <span className="flex items-center gap-1.5"><Calendar size={13} /> {new Date(post.created_at || '').toLocaleDateString()}</span>
                      <span className="flex items-center gap-1.5"><Clock size={13} /> {post.read_time}</span>
                    </div>
                    
                    <h2 className="text-lg font-bold text-textPrimary leading-tight mb-3 group-hover:text-accent transition-colors">
                      {post.title}
                    </h2>
                    
                    <p className="text-textSecondary text-sm leading-relaxed mb-6 flex-1 line-clamp-3">
                      {post.excerpt}
                    </p>
                    
                    <div className="flex items-center text-accent text-sm font-semibold mt-auto">
                      Read Article <ChevronRight size={16} className="ml-1 group-hover:translate-x-1 transition-transform" />
                    </div>
                  </div>
                </Link>
              ))
            )}
          </div>
        )}

        {/* SEO Bottom Banner */}
        <div className="mt-20 p-8 bg-surface rounded-3xl border border-border/50 text-center animate-fade-up">
          <BookOpen size={32} className="mx-auto text-accent mb-4" />
          <h3 className="text-2xl font-bold mb-3">Why Read Our Guides?</h3>
          <p className="text-textSecondary text-sm md:text-base max-w-3xl mx-auto leading-relaxed">
            The landscape of generative AI is constantly evolving with tools like Midjourney v6, DALL-E 3, and Stable Diffusion XL. 
            Understanding the underlying mechanics of prompt weights, lighting syntax, and aspect ratios separates amateur random-generation from professional, deliberate artistry. 
            Our blog exists to provide high-quality text analysis that bridges that gap.
          </p>
        </div>

      </div>
    </div>
  );
};

// Calendar icon component for inline use
const Calendar = ({ size }: { size: number }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <rect x="3" y="4" width="18" height="18" rx="2" ry="2"></rect>
    <line x1="16" y1="2" x2="16" y2="6"></line>
    <line x1="8" y1="2" x2="8" y2="6"></line>
    <line x1="3" y1="10" x2="21" y2="10"></line>
  </svg>
);

export default Blog;
