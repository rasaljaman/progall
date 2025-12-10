import { createClient } from '@supabase/supabase-js';
import { ImageItem, AuditLog } from '../types';

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


  // --- Upload with Tracking ---
  async uploadImage(file: File, prompt: string, category: string, tags: string[]): Promise<ImageItem> {
    const user = await this.getCurrentUser();
    if (!user) throw new Error("User must be logged in to upload");

    // 1. Upload to Storage
    const fileExt = file.name.split('.').pop();
    const fileName = `${Date.now()}-${Math.random().toString(36).substring(2)}.${fileExt}`;
    const filePath = `${fileName}`;

    const { error: uploadError } = await supabase.storage
      .from('prompts-images')
      .upload(filePath, file);

    if (uploadError) throw uploadError;

    // 2. Get Public URL
    const { data: { publicUrl } } = supabase.storage
      .from('prompts-images')
      .getPublicUrl(filePath);

    // 3. Insert into Database
    const { data, error: insertError } = await supabase
      .from('images')
      .insert([
        {
          url: publicUrl,
          thumbnail: publicUrl,
          prompt,
          category,
          tags,
          width: 800,
          height: 600,
          created_by: user.id
        }
      ])
      .select()
      .single();

    if (insertError) throw insertError;

    // 4. LOG IT
    await logActivity('UPLOAD', `Uploaded image in ${category}: "${prompt.substring(0, 15)}..."`);

    return data as ImageItem;
  }

  // --- UPDATED: Update Image (Supports optional File Replacement) ---
  async updateImage(image: ImageItem, newFile?: File): Promise<ImageItem> {
    let finalUrl = image.url;
    let finalThumbnail = image.thumbnail;

    // 1. If a new file is provided, upload it and replace the URL
    if (newFile) {
      const user = await this.getCurrentUser();
      if (!user) throw new Error("User must be logged in to replace image");

      const fileExt = newFile.name.split('.').pop();
      const fileName = `${Date.now()}-replaced-${Math.random().toString(36).substring(2)}.${fileExt}`;
      const filePath = `${fileName}`;

      const { error: uploadError } = await supabase.storage
        .from('prompts-images')
        .upload(filePath, newFile);

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
