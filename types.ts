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
}

export type SortOption = 'newest' | 'oldest' | 'popular';

export interface User {
  id: string;
  email: string;
  role: 'admin' | 'user';
}
