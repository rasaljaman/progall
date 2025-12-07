import { ImageItem } from './types';

export const DEMO_IMAGES: ImageItem[] = []; // Keep empty or your demo data

export const CATEGORIES = [
  'All', 'Landscape', 'Animals', 'Sci-Fi', 'Adventure', 
  'Abstract', 'Portrait', 'Anime', 'Realistic', 
  '3D Render', 'Logo Design', 'Architecture'
];

// --- SUPER ADMIN CONFIG ---
// 1. MAKE SURE THIS IS YOUR EXACT LOGIN EMAIL
export const SUPER_ADMIN_EMAIL = "rasaljaman15@gmail.com"; 

export const getAdminColor = (adminId: string | undefined) => {
  if (!adminId) return '#94a3b8'; // Default Gray
  let hash = 0;
  for (let i = 0; i < adminId.length; i++) {
    hash = adminId.charCodeAt(i) + ((hash << 5) - hash);
  }
  const c = (hash & 0x00ffffff).toString(16).toUpperCase();
  return '#' + '00000'.substring(0, 6 - c.length) + c;
};
