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

  // --- NEW: Get Audit Logs (For Super Admin) ---
  async getAuditLogs(): Promise<AuditLog[]> {
    const { data, error } = await supabase
      .from('audit_logs')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(50); // Show last 50 actions

    if (error) throw error;
    return data || [];
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
      .from('prompts-images') // Keeping your bucket name 'prompts-images'
      .upload(filePath, file);

    if (uploadError) throw uploadError;

    // 2. Get Public URL
    const { data: { publicUrl } } = supabase.storage
      .from('prompts-images')
      .getPublicUrl(filePath);

    // 3. Insert into Database (With created_by ID)
    const { data, error: insertError } = await supabase
      .from('images')
      .insert([
        {
          url: publicUrl,
          thumbnail: publicUrl,
          prompt,
          category,
          tags,
          width: 800, // Default width
          height: 600, // Default height
          created_by: user.id // TRACKING: Save the Admin ID
        }
      ])
      .select()
      .single();

    if (insertError) throw insertError;

    // 4. LOG IT
    await logActivity('UPLOAD', `Uploaded image in ${category}: "${prompt.substring(0, 15)}..."`);

    return data as ImageItem;
  }

  // --- Delete with Tracking ---
  async deleteImage(id: string): Promise<void> {
    // 1. Get the image URL to find the storage path
    const item = await this.getImageById(id);
    if (!item) return;

    // Extract filename from URL
    const urlParts = item.url.split('/');
    const fileName = urlParts[urlParts.length - 1];

    if (fileName) {
       await supabase.storage.from('prompts-images').remove([fileName]);
    }

    // 2. Delete from DB
    const { error } = await supabase
      .from('images')
      .delete()
      .eq('id', id);

    if (error) throw error;

    // 3. LOG IT
    await logActivity('DELETE', `Deleted image ID: ${id.slice(0, 8)}`);
  }
}

export const supabaseService = new SupabaseService();
