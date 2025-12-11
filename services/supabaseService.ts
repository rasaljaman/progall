import { createClient } from '@supabase/supabase-js';
import { ImageItem, AuditLog } from '../types';
// 1. IMPORT COMPRESSION LIBRARY
import imageCompression from 'browser-image-compression';

// Initialize the client
const supabaseUrl = (import.meta as any).env?.VITE_SUPABASE_URL || '';
const supabaseKey = (import.meta as any).env?.VITE_SUPABASE_ANON_KEY || '';

export const supabase = createClient(supabaseUrl, supabaseKey);

// --- HELPER: LOG ACTIVITY TO DB ---
const logActivity = async (action: string, details: string) => {
  const { data: { user } } = await supabase.auth.getUser();
  if (user && user.email) {
    await supabase.from('audit_logs').insert([
      { admin_email: user.email, action, details }
    ]);
  }
};

// --- HELPER: SMART COMPRESSION ---
const compressFile = async (file: File): Promise<File> => {
  // Settings: Resize to HD (1920px) and cap size at ~200KB
  const options = {
    maxSizeMB: 0.2,          // Target 200KB
    maxWidthOrHeight: 1920,  // HD Resolution (Perfect for web)
    useWebWorker: true,      // Run in background (No lag)
    fileType: 'image/webp'   // Force WebP (Best for bandwidth)
  };

  try {
    console.log(`Original: ${(file.size / 1024 / 1024).toFixed(2)} MB`);
    const compressedBlob = await imageCompression(file, options);
    
    // Create new file with .webp extension
    const newName = file.name.replace(/\.[^/.]+$/, "") + ".webp";
    const compressedFile = new File([compressedBlob], newName, { type: 'image/webp' });
    
    console.log(`Compressed: ${(compressedFile.size / 1024 / 1024).toFixed(2)} MB`);
    return compressedFile;
  } catch (error) {
    console.error("Compression failed, using original file:", error);
    return file; // Fallback to original if compression fails
  }
};

export class SupabaseService {
  
  // --- Auth ---

  async login(email: string, password: string) {
    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });
    if (error) throw error;
    return data;
  }

  async logout() {
    const { error } = await supabase.auth.signOut();
    if (error) throw error;
  }

  async getCurrentUser() {
    const { data: { user } } = await supabase.auth.getUser();
    return user;
  }

  // --- Data & Storage ---

  async getImages(): Promise<ImageItem[]> {
    const { data, error } = await supabase
      .from('images')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Error fetching images:', error);
      throw error;
    }
    return data as ImageItem[];
  }

  async getImageById(id: string): Promise<ImageItem | undefined> {
    const { data, error } = await supabase
      .from('images')
      .select('*')
      .eq('id', id)
      .single();

    if (error) {
      return undefined;
    }
    return data as ImageItem;
  }

  // --- Audit Logs (For Super Admin) ---
  async getAuditLogs(): Promise<AuditLog[]> {
    const { data, error } = await supabase
      .from('audit_logs')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(50); 

    if (error) throw error;
    return data || [];
  }
  
  // --- Dashboard Stats ---
  async getStats() {
    const user = await this.getCurrentUser();
    if (!user) return null;

    // 1. Total Images
    const { count: totalCount } = await supabase
      .from('images')
      .select('*', { count: 'exact', head: true });

    // 2. My Uploads
    const { count: myCount } = await supabase
      .from('images')
      .select('*', { count: 'exact', head: true })
      .eq('created_by', user.id);

    return {
      total: totalCount || 0,
      mine: myCount || 0,
      team: (totalCount || 0) - (myCount || 0)
    };
  }


  // --- SMART UPLOAD with Compression ---
  async uploadImage(file: File, prompt: string, category: string, tags: string[]): Promise<ImageItem> {
    const user = await this.getCurrentUser();
    if (!user) throw new Error("User must be logged in to upload");

    // 1. AUTO-COMPRESS
    const finalFile = await compressFile(file);

    // 2. Upload to Storage
    // Note: We use .webp extension now because compressFile forces WebP
    const fileName = `${Date.now()}-${Math.random().toString(36).substring(2)}.webp`;
    const filePath = `${fileName}`;

    const { error: uploadError } = await supabase.storage
      .from('prompts-images')
      .upload(filePath, finalFile);

    if (uploadError) throw uploadError;

    // 3. Get Public URL
    const { data: { publicUrl } } = supabase.storage
      .from('prompts-images')
      .getPublicUrl(filePath);

    // 4. Insert into Database
    const { data, error: insertError } = await supabase
      .from('images')
      .insert([
        {
          url: publicUrl,
          thumbnail: publicUrl, // We use the same compressed image for thumbnail
          prompt,
          category,
          tags,
          width: 1920, // Standard HD width after compression
          height: 1080, 
          created_by: user.id
        }
      ])
      .select()
      .single();

    if (insertError) throw insertError;

    // 5. LOG IT
    await logActivity('UPLOAD', `Uploaded image in ${category}: "${prompt.substring(0, 15)}..."`);

    return data as ImageItem;
  }

  // --- SMART REPLACE with Compression ---
  async updateImage(image: ImageItem, newFile?: File): Promise<ImageItem> {
    let finalUrl = image.url;
    let finalThumbnail = image.thumbnail;

    // 1. If a new file is provided, COMPRESS IT, upload it, and replace the URL
    if (newFile) {
      const user = await this.getCurrentUser();
      if (!user) throw new Error("User must be logged in to replace image");

      // Auto-Compress Replacement
      const finalFile = await compressFile(newFile);

      const fileName = `${Date.now()}-replaced-${Math.random().toString(36).substring(2)}.webp`;
      const filePath = `${fileName}`;

      const { error: uploadError } = await supabase.storage
        .from('prompts-images')
        .upload(filePath, finalFile);

      if (uploadError) throw uploadError;

      const { data: { publicUrl } } = supabase.storage
        .from('prompts-images')
        .getPublicUrl(filePath);

      finalUrl = publicUrl;
      finalThumbnail = publicUrl;

      // Log the specific replacement action
      await logActivity('REPLACE_IMAGE', `Replaced file for image ID: ${image.id.slice(0, 4)}...`);
    }

    // 2. Update Database (Metadata + URL if changed)
    const { data, error } = await supabase
      .from('images')
      .update({
        prompt: image.prompt,
        category: image.category,
        tags: image.tags,
        is_featured: image.is_featured,
        url: finalUrl,
        thumbnail: finalThumbnail
      })
      .eq('id', image.id)
      .select()
      .single();

    if (error) throw error;

    // Only log "EDIT" if we didn't already log "REPLACE_IMAGE"
    if (!newFile) {
       await logActivity('EDIT', `Edited details for image ID: ${image.id.slice(0, 4)}...`);
    }

    return data as ImageItem;
  }

  // --- Delete with Tracking ---
  async deleteImage(id: string): Promise<void> {
    const item = await this.getImageById(id);
    if (!item) return;

    const urlParts = item.url.split('/');
    const fileName = urlParts[urlParts.length - 1];

    if (fileName) {
       await supabase.storage.from('prompts-images').remove([fileName]);
    }

    const { error } = await supabase
      .from('images')
      .delete()
      .eq('id', id);

    if (error) throw error;

    await logActivity('DELETE', `Deleted image ID: ${id.slice(0, 8)}`);
  }
}

export const supabaseService = new SupabaseService();
