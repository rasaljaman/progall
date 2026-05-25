export interface ImageItem {
  id: string;
  url: string;
  thumbnail: string;
  prompt: string;
  category: string;
  tags: string[];
  width: number;
  height: number;
  created_at?: string;
  is_featured?: boolean;
  created_by?: string;
  editorial_summary?: string;
  editorial_notes?: string;
  editorial_tips?: string;
  downloads_count?: number;
  copies_count?: number;
  views_count?: number;
}

export type SortOption = 'newest' | 'oldest' | 'popular';

export interface User {
  id: string;
  email: string;
  role: 'admin' | 'user';
}
export interface AuditLog {
  id: string;
  admin_email: string;
  action: 'UPLOAD' | 'EDIT' | 'DELETE' | 'BLOG_CREATE' | 'BLOG_UPDATE' | 'BLOG_DELETE';
  details: string;
  created_at: string;
}

export interface BlogPost {
  id?: string;
  title: string;
  slug: string;
  excerpt: string;
  content: string;
  category: string;
  read_time: string;
  image_url: string;
  is_published?: boolean;
  created_at?: string;
}

export interface DashboardStats {
  totalImages: number;
  myUploads: number;
  totalLogs: number;
}

export interface TwitterPrompt {
  id: string;
  author: string;
  handle: string;
  prompt_text: string;
  image_urls: string[];
  model: string;
  likes: number;
  views: number;
  tweet_url: string;
  tweeted_at: string;
  created_at?: string;
}

