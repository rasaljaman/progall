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
  action: 'UPLOAD' | 'EDIT' | 'DELETE';
  details: string;
  created_at: string;
}
