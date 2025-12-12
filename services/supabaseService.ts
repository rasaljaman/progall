import { createClient } from '@supabase/supabase-js';
import { ImageItem, AuditLog } from '../types';
import imageCompression from 'browser-image-compression'; // Phase 4: Compression

// Initialize the client
const supabaseUrl = (import.meta as any).env?.VITE_SUPABASE_URL || '';
const supabaseKey = (import.meta as any).env?.VITE_SUPABASE_ANON_KEY || '';

export const supabase = createClient(supabaseUrl, supabaseKey);

// --- HELPER: LOG ACTIVITY ---
const logActivity = async (action: string, details: string) => {
  const { data: { user } } = await supabase.auth.getUser();
  if (user && user.email) {
    await supabase.from('audit_logs').insert([
      { admin_email: user.email, action, details }
    ]);
  }
};

// --- HELPER: SMART COMPRESSION (Phase 4) ---
const compressFile = async (file: File): Promise<File> => {
  const options = {
    maxSizeMB: 0.2,          // Target 200KB
    maxWidthOrHeight: 1920,  // HD Resolution
    useWebWorker: true,
    fileType: 'image/webp'
  };

  try {
    console.log(`Original: ${(file.size / 1024 / 1024).toFixed(2)} MB`);
    const compressedBlob = await imageCompression(file, options);
    
    const newName = file.name.replace(/\.[^/.]+$/, "") + ".webp";
    const compressedFile = new File([compressedBlob], newName, { type: 'image/webp' });
    
    console.log(`Compressed: ${(compressedFile.size / 1024 / 1024).toFixed(2)} MB`);
    return compressedFile;
  } catch (error) {
    console.error("Compression failed, using original file:", error);
    return file; 
  }
};

export class SupabaseService {
  
  // --- Auth ---
  async login(email: string, password: string) {
    const { data, error } = await supabase.auth.signInWithPassword({ email, password });
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

    if (error) throw error;
    return data as ImageItem[];
  }

  async getImageById(id: string): Promise<ImageItem | undefined> {
    const { data, error } = await supabase
      .from('images')
      .select('*')
      .eq('id', id)
      .single();

    if (error) return undefined;
    return data as ImageItem;
  }

  // --- LOGS: List View (Limit 50) ---
  async getAuditLogs(): Promise<AuditLog[]> {
    const { data, error } = await supabase
      .from('audit_logs')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(50); 

    if (error) throw error;
    return data || [];
  }

  // --- LOGS: Analytics View (Limit 500) - PHASE 5 NEW ---
  async getAnalyticsLogs(): Promise<AuditLog[]> {
    const { data, error } = await supabase
      .from('audit_logs')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(500); 

    if (error) throw error;
    return data || [];
  }
  
  // --- Dashboard Stats ---
  async getStats() {
    const user = await this.getCurrentUser();
    if (!user) return null;

    const { count: totalCount } = await supabase
      .from('images')
      .select('*', { count: 'exact', head: true });

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

  // --- Upload with Compression ---
  async uploadImage(file: File, prompt: string, category: string, tags: string[]): Promise<ImageItem> {
    const user = await this.getCurrentUser();
    if (!user) throw new Error("User must be logged in");

    // 1. Compress
    const finalFile = await compressFile(file);

    // 2. Upload
    const fileName = `${Date.now()}-${Math.random().toString(36).substring(2)}.webp`;
    const { error: uploadError } = await supabase.storage.from('prompts-images').upload(fileName, finalFile);
    if (uploadError) throw uploadError;

    const { data: { publicUrl } } = supabase.storage.from('prompts-images').getPublicUrl(fileName);

    // 3. DB Insert
    const { data, error: insertError } = await supabase.from('images').insert([{
      url: publicUrl,
      thumbnail: publicUrl,
      prompt,
      category,
      tags,
      width: 1920,
      height: 1080,
      created_by: user.id
    }]).select().single();

    if (insertError) throw insertError;
    await logActivity('UPLOAD', `Uploaded image in ${category}: "${prompt.substring(0, 15)}..."`);

    return data as ImageItem;
  }

  // --- Update with Replace & Compression ---
  async updateImage(image: ImageItem, newFile?: File): Promise<ImageItem> {
    let finalUrl = image.url;

    if (newFile) {
      const user = await this.getCurrentUser();
      if (!user) throw new Error("User must be logged in");

      // Compress & Upload new file
      const finalFile = await compressFile(newFile);
      const fileName = `${Date.now()}-replaced-${Math.random().toString(36).substring(2)}.webp`;
      
      const { error: uploadError } = await supabase.storage.from('prompts-images').upload(fileName, finalFile);
      if (uploadError) throw uploadError;

      const { data: { publicUrl } } = supabase.storage.from('prompts-images').getPublicUrl(fileName);
      finalUrl = publicUrl;

      await logActivity('REPLACE_IMAGE', `Replaced file for image ID: ${image.id.slice(0, 4)}...`);
    }

    const { data, error } = await supabase.from('images').update({
      prompt: image.prompt,
      category: image.category,
      tags: image.tags,
      is_featured: image.is_featured,
      url: finalUrl,
      thumbnail: finalUrl
    }).eq('id', image.id).select().single();

    if (error) throw error;
    if (!newFile) await logActivity('EDIT', `Edited details for image ID: ${image.id.slice(0, 4)}...`);

    return data as ImageItem;
  }

  async deleteImage(id: string): Promise<void> {
    const item = await this.getImageById(id);
    if (item) {
        const urlParts = item.url.split('/');
        const fileName = urlParts[urlParts.length - 1];
        if (fileName) await supabase.storage.from('prompts-images').remove([fileName]);
    }

    const { error } = await supabase.from('images').delete().eq('id', id);
    if (error) throw error;
    await logActivity('DELETE', `Deleted image ID: ${id.slice(0, 8)}`);
  }
}

export const supabaseService = new SupabaseService();
