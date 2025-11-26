import { createClient, SupabaseClient } from '@supabase/supabase-js';
import { ImageItem } from '../types';

// Initialize the client
// NOTE: In a real Vite app, use import.meta.env.VITE_SUPABASE_URL
const supabaseUrl = (import.meta as any).env?.VITE_SUPABASE_URL || '';
const supabaseKey = (import.meta as any).env?.VITE_SUPABASE_ANON_KEY || '';

export const supabase = createClient(supabaseUrl, supabaseKey);

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
      // Return undefined if not found or error, to match previous behavior
      return undefined;
    }
    return data as ImageItem;
  }

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
          thumbnail: publicUrl, // Using same URL for simplicity; could use a resized version if implementing cloud functions
          prompt,
          category,
          tags,
          // We can optionally store width/height if we read the image first, 
          // or let them be null if schema allows. For now passing 0 or mock defaults 
          // unless we add image reading logic.
          width: 0, 
          height: 0,
          added_by: user.id
        }
      ])
      .select()
      .single();

    if (insertError) throw insertError;

    return data as ImageItem;
  }

  async deleteImage(id: string): Promise<void> {
    // 1. Get the image URL to find the storage path
    const item = await this.getImageById(id);
    if (!item) return;

    // Extract filename from URL (assumes standard Supabase storage URL format)
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
  }
}

export const supabaseService = new SupabaseService();