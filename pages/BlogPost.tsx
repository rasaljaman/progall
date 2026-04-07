import React, { useEffect, useState } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import SEO from '../components/SEO';
import { supabaseService } from '../services/supabaseService';
import { BlogPost as BlogPostType } from '../types';
import { ArrowLeft, Clock } from 'lucide-react';

const BlogPost: React.FC = () => {
  const { slug } = useParams<{ slug: string }>();
  const navigate = useNavigate();
  
  const [post, setPost] = useState<BlogPostType | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    window.scrollTo(0, 0);
    const fetchPost = async () => {
      if (!slug) return;
      try {
        const data = await supabaseService.getBlogBySlug(slug);
        if (data) setPost(data);
      } catch (err) {
        console.error("Error fetching post", err);
      } finally {
        setLoading(false);
      }
    };
    fetchPost();
  }, [slug]);

  if (loading) {
    return (
      <div className="min-h-screen pt-32 flex justify-center text-accent">
        <div className="w-8 h-8 border-2 border-accent border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (!post) {
    return (
      <div className="min-h-screen pt-32 flex flex-col items-center flex-col justify-center text-textPrimary">
        <h2 className="text-2xl font-bold mb-4">Article Not Found</h2>
        <button onClick={() => navigate('/blog')} className="text-accent hover:underline">Return to Blog</button>
      </div>
    );
  }

  // A very simple Markdown parser since we don't have react-markdown installed.
  // It handles headings, bold text, lists, and paragraphs.
  const renderContent = (content: string) => {
    return content.split('\n\n').map((paragraph, index) => {
      const p = paragraph.trim();
      if (!p) return null;
      
      if (p.startsWith('### ')) {
        return <h3 key={index} className="text-2xl font-bold mt-10 mb-4 text-textPrimary">{p.replace('### ', '')}</h3>;
      }
      
      if (p.startsWith('- ')) {
        const items = p.split('\n').filter(Boolean).map(item => item.replace('- ', ''));
        return (
          <ul key={index} className="list-disc pl-6 my-6 space-y-2 text-textSecondary leading-relaxed">
            {items.map((item, i) => (
              <li key={i} dangerouslySetInnerHTML={{ __html: item.replace(/\*\*(.*?)\*\*/g, '<strong class="text-textPrimary">$1</strong>') }} />
            ))}
          </ul>
        );
      }

      // Format bold and italic
      const formatted = p
        .replace(/\*\*(.*?)\*\*/g, '<strong class="text-textPrimary font-semibold">$1</strong>')
        .replace(/\*(.*?)\*/g, '<em class="text-textPrimary font-medium">$1</em>')
        .replace(/`(.*?)`/g, '<code class="bg-surfaceHighlight px-1.5 py-0.5 rounded text-accent text-sm">$1</code>');

      return (
        <p key={index} className="mb-6 text-textSecondary leading-relaxed text-base md:text-lg" dangerouslySetInnerHTML={{ __html: formatted }} />
      );
    });
  };

  return (
    <div className="min-h-screen pb-20 pt-28 md:pt-32 bg-background text-textPrimary page-enter">
      <SEO
        title={post.title}
        description={post.excerpt}
        image={post.image_url}
      />

      <div className="max-w-3xl mx-auto px-4">
        <Link 
          to="/blog" 
          className="inline-flex items-center gap-2 text-textSecondary hover:text-textPrimary font-medium text-sm transition-colors mb-8"
        >
          <ArrowLeft size={16} /> Back to Guides
        </Link>
        
        <div className="flex items-center gap-3 text-sm font-semibold text-accent mb-4">
          <span className="px-3 py-1 bg-accent/10 rounded-full border border-accent/20">{post.category}</span>
          <span className="text-textSecondary flex items-center gap-1"><Clock size={14} /> {post.read_time}</span>
        </div>

        <h1 className="text-3xl md:text-5xl font-bold tracking-tight mb-6 leading-[1.15]">
          {post.title}
        </h1>
        
        <p className="text-xl text-textSecondary/80 leading-relaxed mb-10 font-light">
          {post.excerpt}
        </p>

        <div className="rounded-3xl overflow-hidden aspect-video mb-12 shadow-2xl">
          <img src={post.image_url} alt={post.title} className="w-full h-full object-cover" />
        </div>

        <article className="prose prose-invert max-w-none text-textPrimary">
          {renderContent(post.content)}
        </article>

        {/* Call to action at bottom of every article */}
        <div className="mt-16 p-8 bg-gradient-to-br from-surface to-surfaceHighlight border border-border/50 rounded-2xl text-center">
          <h4 className="text-xl font-bold mb-3">Ready to apply these techniques?</h4>
          <p className="text-textSecondary mb-6 max-w-md mx-auto">Explore our extensive gallery of AI prompts to see these exact strategies used in practice.</p>
          <Link to="/" className="inline-flex items-center justify-center px-6 py-3 bg-accent text-white font-bold rounded-xl shadow-lg shadow-accent/20 hover:-translate-y-0.5 hover:shadow-xl transition-all">
            Browse the Gallery
          </Link>
        </div>
      </div>
    </div>
  );
};

export default BlogPost;
