import React, { useState, useEffect, useCallback } from 'react';
import { Check, Trash2, ExternalLink, Bot, User, RefreshCw, Inbox, AlertCircle } from 'lucide-react';
import { supabase } from '../services/supabaseService';
import { PendingPost } from '../types';

// ─── Skeleton Card ───────────────────────────────────────────────────────────
const SkeletonCard: React.FC = () => (
  <div className="bg-surface border border-surfaceHighlight rounded-2xl overflow-hidden animate-pulse">
    <div className="h-52 bg-surfaceHighlight" />
    <div className="p-4 space-y-3">
      <div className="h-3 bg-surfaceHighlight rounded w-3/4" />
      <div className="h-3 bg-surfaceHighlight rounded w-full" />
      <div className="h-3 bg-surfaceHighlight rounded w-5/6" />
      <div className="h-3 bg-surfaceHighlight rounded w-1/2" />
    </div>
    <div className="px-4 pb-4 flex gap-2">
      <div className="flex-1 h-9 bg-surfaceHighlight rounded-xl" />
      <div className="w-9 h-9 bg-surfaceHighlight rounded-xl" />
    </div>
  </div>
);

// ─── Individual Post Card ─────────────────────────────────────────────────────
interface PostCardProps {
  post: PendingPost;
  onApprove: (id: string) => Promise<void>;
  onReject: (id: string) => Promise<void>;
}

const PostCard: React.FC<PostCardProps> = ({ post, onApprove, onReject }) => {
  const [loading, setLoading] = useState<'approve' | 'reject' | null>(null);
  const [imgError, setImgError] = useState(false);

  const displayText = post.enhanced_prompt || post.raw_caption || '(no caption)';
  const rawCaptionDiffers =
    post.enhanced_prompt &&
    post.raw_caption &&
    post.enhanced_prompt !== post.raw_caption;

  const handleApprove = async () => {
    setLoading('approve');
    await onApprove(post.id);
    setLoading(null);
  };

  const handleReject = async () => {
    setLoading('reject');
    await onReject(post.id);
    setLoading(null);
  };

  return (
    <div className="bg-surface border border-surfaceHighlight rounded-2xl overflow-hidden flex flex-col transition-all hover:border-accent/40 hover:shadow-glow duration-300 group">
      {/* Image */}
      <div className="relative h-52 bg-black overflow-hidden">
        {imgError ? (
          <div className="w-full h-full flex flex-col items-center justify-center text-textSecondary gap-2">
            <AlertCircle size={28} />
            <span className="text-xs">Image failed to load</span>
          </div>
        ) : (
          <img
            src={post.image_url}
            alt="Pending post"
            className="w-full h-full object-cover opacity-90 group-hover:opacity-100 group-hover:scale-105 transition-all duration-500"
            onError={() => setImgError(true)}
          />
        )}

        {/* Overlay badges */}
        <div className="absolute top-2 left-2 flex gap-1.5">
          <span className="bg-yellow-500/90 text-black text-[10px] font-bold px-2 py-0.5 rounded-full uppercase tracking-wide shadow">
            Pending
          </span>
        </div>

        {post.source_url && (
          <a
            href={post.source_url}
            target="_blank"
            rel="noopener noreferrer"
            className="absolute bottom-2 right-2 bg-black/70 hover:bg-black text-white text-[10px] px-2 py-1 rounded-full flex items-center gap-1 transition-colors"
          >
            <ExternalLink size={10} /> Source
          </a>
        )}
      </div>

      {/* Content */}
      <div className="p-4 flex-1 space-y-3">
        {/* Enhanced prompt */}
        <div>
          <p className="text-[10px] font-bold uppercase tracking-wider text-accent mb-1">
            Enhanced Prompt
          </p>
          <p className="text-textPrimary text-sm leading-relaxed line-clamp-4">
            {displayText}
          </p>
        </div>

        {/* Raw caption if different */}
        {rawCaptionDiffers && (
          <div>
            <p className="text-[10px] font-bold uppercase tracking-wider text-textSecondary mb-1">
              Raw Caption
            </p>
            <p className="text-textSecondary text-xs leading-relaxed line-clamp-2">
              {post.raw_caption}
            </p>
          </div>
        )}

        {/* Meta pills */}
        <div className="flex flex-wrap gap-1.5 pt-1">
          {post.author && (
            <span className="inline-flex items-center gap-1 text-[10px] bg-background border border-surfaceHighlight px-2 py-0.5 rounded-full text-textSecondary">
              <User size={10} /> {post.author}
            </span>
          )}
          {post.model && (
            <span className="inline-flex items-center gap-1 text-[10px] bg-background border border-surfaceHighlight px-2 py-0.5 rounded-full text-textSecondary">
              <Bot size={10} /> {post.model}
            </span>
          )}
          <span className="inline-flex items-center gap-1 text-[10px] bg-background border border-surfaceHighlight px-2 py-0.5 rounded-full text-textSecondary ml-auto">
            {new Date(post.created_at).toLocaleDateString()}
          </span>
        </div>
      </div>

      {/* Action Buttons */}
      <div className="px-4 pb-4 flex gap-2">
        <button
          onClick={handleApprove}
          disabled={!!loading}
          className="flex-1 py-2 bg-green-600 hover:bg-green-500 disabled:opacity-50 disabled:cursor-not-allowed text-white font-bold rounded-xl text-xs flex items-center justify-center gap-1.5 transition-colors duration-200"
        >
          {loading === 'approve' ? (
            <div className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin" />
          ) : (
            <Check size={13} />
          )}
          Approve
        </button>
        <button
          onClick={handleReject}
          disabled={!!loading}
          className="px-3 py-2 border border-red-500/30 text-red-400 hover:bg-red-500/10 disabled:opacity-50 disabled:cursor-not-allowed rounded-xl transition-colors duration-200"
          title="Reject & Delete"
        >
          {loading === 'reject' ? (
            <div className="w-3.5 h-3.5 border-2 border-red-400 border-t-transparent rounded-full animate-spin" />
          ) : (
            <Trash2 size={14} />
          )}
        </button>
      </div>
    </div>
  );
};

// ─── Main PendingQueue Component ──────────────────────────────────────────────
const PendingQueue: React.FC = () => {
  const [posts, setPosts] = useState<PendingPost[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchPosts = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const { data, error: fetchErr } = await supabase
        .from('pending_posts')
        .select('*')
        .order('created_at', { ascending: false });

      if (fetchErr) throw fetchErr;
      setPosts((data as PendingPost[]) || []);
    } catch (err: any) {
      setError(err.message || 'Failed to load pending posts');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchPosts();
  }, [fetchPosts]);

  const handleApprove = async (id: string) => {
    const { error: rpcErr } = await supabase.rpc('approve_post', {
      pending_post_id: id,
    });
    if (rpcErr) {
      alert('Approval failed: ' + rpcErr.message);
      return;
    }
    // Optimistically remove from list
    setPosts(prev => prev.filter(p => p.id !== id));
  };

  const handleReject = async (id: string) => {
    const { error: delErr } = await supabase
      .from('pending_posts')
      .delete()
      .eq('id', id);
    if (delErr) {
      alert('Rejection failed: ' + delErr.message);
      return;
    }
    setPosts(prev => prev.filter(p => p.id !== id));
  };

  return (
    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
      {/* Header */}
      <div className="flex justify-between items-start gap-4 flex-wrap">
        <div>
          <h2 className="text-xl font-bold text-textPrimary flex items-center gap-2">
            <Inbox size={20} className="text-cyan-400" />
            Pending Queue
          </h2>
          <p className="text-textSecondary text-sm mt-1">
            Images scraped by Apify &amp; enhanced by Gemini, waiting for your review.
          </p>
        </div>
        <div className="flex items-center gap-3">
          {posts.length > 0 && (
            <span className="bg-cyan-500/20 text-cyan-400 border border-cyan-500/30 text-xs font-bold px-3 py-1 rounded-full">
              {posts.length} pending
            </span>
          )}
          <button
            onClick={fetchPosts}
            disabled={loading}
            className="flex items-center gap-1.5 px-3 py-1.5 border border-surfaceHighlight rounded-xl text-textSecondary text-xs hover:text-textPrimary hover:border-accent/50 transition-colors disabled:opacity-50"
          >
            <RefreshCw size={13} className={loading ? 'animate-spin' : ''} />
            Refresh
          </button>
        </div>
      </div>

      {/* Error State */}
      {error && (
        <div className="bg-red-500/10 border border-red-500/30 text-red-400 rounded-xl p-4 flex items-center gap-3">
          <AlertCircle size={18} />
          <span className="text-sm">{error}</span>
        </div>
      )}

      {/* Loading */}
      {loading && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {[...Array(6)].map((_, i) => <SkeletonCard key={i} />)}
        </div>
      )}

      {/* Empty State */}
      {!loading && !error && posts.length === 0 && (
        <div className="text-center py-24 bg-surface border border-surfaceHighlight rounded-2xl shadow-neumorphic">
          <Check size={48} className="mx-auto text-green-500 mb-4 opacity-80" />
          <h3 className="text-lg font-bold text-textPrimary">All Caught Up!</h3>
          <p className="text-textSecondary text-sm mt-2 max-w-xs mx-auto">
            No pending posts right now. New items will appear here once Apify &amp; n8n run.
          </p>
        </div>
      )}

      {/* Posts Grid */}
      {!loading && !error && posts.length > 0 && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {posts.map(post => (
            <PostCard
              key={post.id}
              post={post}
              onApprove={handleApprove}
              onReject={handleReject}
            />
          ))}
        </div>
      )}
    </div>
  );
};

export default PendingQueue;
