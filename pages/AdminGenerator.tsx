import React, { useState } from 'react';
import { supabase } from '../services/supabaseService';
import { Sparkles, RefreshCw, Palette, Camera, Zap, AlertTriangle } from 'lucide-react';
import { useToast } from '../context/ToastContext';

const AdminGenerator: React.FC = () => {
  const [topic, setTopic] = useState('');
  const [loading, setLoading] = useState(false);
  const [status, setStatus] = useState(''); 
  const [generatedData, setGeneratedData] = useState<any>(null);
  const [selectedStyle, setSelectedStyle] = useState('Realistic'); // Default to Realistic
  
  const { showToast } = useToast();

  // --- PROMPTING ENGINE ---
  // These "Secret Ingredients" force the AI to look professional
  const styles: Record<string, string> = {
    'No Style': 'highly detailed, sharp focus, 8k',
    'Anime': 'anime style, studio ghibli, makoto shinkai, vibrant colors, highly detailed, 8k resolution, cinematic lighting',
    'Cyberpunk': 'cyberpunk style, neon noir, blade runner aesthetic, futuristic city, chromatic aberration, wet streets, realistic texture',
    'Realistic': 'award winning photography, shot on Sony A7R IV, 85mm lens, f/1.8, depth of field, natural lighting, skin pores, hyper-realistic, 8k uhd',
    'Oil Painting': 'oil painting style, thick impasto, textured brushstrokes, classical composition, dramatic lighting',
    '3D Render': '3D render, unreal engine 5, octane render, ray tracing, volumetric lighting, subsurface scattering, 8k'
  };

  const handleGenerate = async () => {
    if (!topic) return showToast('Please enter a topic!', 'error');

    setLoading(true);
    setGeneratedData(null);
    setStatus('Enhancing your idea... 🧠');

    try {
      const stylePrompt = styles[selectedStyle] || styles['No Style'];
      
      // --- PHASE 1: GENERATE METADATA (Pollinations Text - Unlimited) ---
      // We ask the AI to expand your simple idea into a full scene description
      const systemPrompt = `
        Act as a Pro Photographer. 
        Input: "${topic}". 
        Style: "${selectedStyle}".
        Task: Return valid JSON with:
        1. "prompt": A vivid, descriptive paragraph expanding on the input. Describe lighting, camera angle, and textures.
        2. "category": A single category name.
        3. "tags": 5 relevant hashtags.
        Output ONLY JSON.
      `;

      let aiData = {
          prompt: `${topic}, ${stylePrompt}`,
          category: 'AI Art',
          tags: ['ai', 'generated']
      };

      try {
        const textResponse = await fetch(`https://text.pollinations.ai/${encodeURIComponent(systemPrompt)}`);
        if (textResponse.ok) {
           let rawText = await textResponse.text();
           // Clean cleanup to ensure valid JSON
           rawText = rawText.replace(/```json/g, '').replace(/```/g, '').trim();
           const parsed = JSON.parse(rawText);
           aiData = { ...parsed };
        }
      } catch (e) {
         console.warn("Text brain failed, using manual fallback.");
      }

      // --- PHASE 2: GENERATE IMAGE (Pollinations Flux) ---
      // This is the "Magic Sauce" that fixes quality
      setStatus('Rendering high-fidelity image... 📸');
      
      // We combine the AI's description + our "Pro Style" keywords
      const finalPrompt = `${aiData.prompt}, ${stylePrompt}`;
      
      // KEY SETTINGS:
      // model=flux (Best quality)
      // seed=random (Ensures a new image every time)
      // width/height=HD (Cinematic look)
      // nologo=true (Removes watermark)
      const imageUrl = `https://image.pollinations.ai/prompt/${encodeURIComponent(finalPrompt)}?nologo=true&private=true&model=flux&width=1280&height=720&seed=${Math.floor(Math.random() * 99999)}`;
      
      setGeneratedData({
        ...aiData,
        tempImageUrl: imageUrl,
        tags: Array.isArray(aiData.tags) ? aiData.tags : aiData.tags.split(',').map((t: string) => t.trim())
      });
      
      setStatus('Ready! ✨');

    } catch (error: any) {
      console.error(error);
      showToast('Something went wrong. Try again.', 'error');
      setStatus('Error occurred.');
    } finally {
      setLoading(false);
    }
  };

  // --- SAVE LOGIC ---
  const handleSaveToGallery = async () => {
    if (!generatedData) return;
    setLoading(true);
    setStatus('Uploading... ☁️');

    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("You are not logged in.");

      const res = await fetch(generatedData.tempImageUrl);
      const blob = await res.blob();
      const file = new File([blob], `ai-${Date.now()}.jpg`, { type: 'image/jpeg' });
      const fileName = `${Date.now()}.jpg`;

      const { error: uploadError } = await supabase.storage.from('images').upload(fileName, file);
      if (uploadError) throw uploadError;

      const { data: { publicUrl } } = supabase.storage.from('images').getPublicUrl(fileName);

      const { error: dbError } = await supabase.from('images').insert([{
        url: publicUrl,
        thumbnail: publicUrl,
        prompt: generatedData.prompt,
        category: generatedData.category,
        tags: generatedData.tags,
        created_at: new Date(),
        created_by: user.id
      }]);

      if (dbError) throw dbError;
      showToast('Saved successfully! 🎉');
      setGeneratedData(null);
      setTopic('');

    } catch (error: any) {
      showToast(error.message || 'Save failed', 'error');
    } finally {
      setLoading(false);
      setStatus('');
    }
  };

  return (
    <div className="p-6 md:p-12 max-w-4xl mx-auto min-h-screen text-textPrimary">
      <div className="mb-8">
        <h1 className="text-3xl font-bold flex items-center gap-3">
          <Zap className="text-yellow-400 fill-yellow-400" /> Unlimited AI Studio
        </h1>
        <p className="text-textSecondary mt-2">
          Stable, Unlimited, and Tuned for Quality.
        </p>
      </div>

      <div className="bg-surface border border-surfaceHighlight p-6 rounded-2xl shadow-lg mb-8">
        <div className="mb-4">
           <label className="text-xs font-bold text-textSecondary uppercase tracking-widest mb-2 block">
             Choose Style (Tuned for Realism)
           </label>
           <div className="flex flex-wrap gap-2">
             {Object.keys(styles).map(styleName => (
               <button
                 key={styleName}
                 onClick={() => setSelectedStyle(styleName)}
                 className={`px-4 py-2 rounded-full text-sm font-bold border transition-all ${selectedStyle === styleName ? 'bg-accent text-white border-accent' : 'bg-black/20 border-surfaceHighlight text-gray-400'}`}
               >
                 {styleName}
               </button>
             ))}
           </div>
        </div>

        <div className="flex flex-col md:flex-row gap-4">
          <input 
            type="text" 
            placeholder="e.g. A futuristic city..." 
            value={topic}
            onChange={(e) => setTopic(e.target.value)}
            className="flex-1 bg-black/20 border border-surfaceHighlight rounded-xl px-4 py-3 text-white outline-none focus:border-accent"
            disabled={loading}
          />
          <button 
            onClick={handleGenerate}
            disabled={loading}
            className={`px-8 py-3 rounded-xl font-bold flex items-center gap-2 ${loading ? 'bg-gray-700 text-gray-400' : 'bg-accent text-white shadow-lg hover:scale-105 transition-transform'}`}
          >
            {loading ? <RefreshCw className="animate-spin"/> : <Sparkles/>}
            {loading ? 'Creating...' : 'Generate'}
          </button>
        </div>
        
        {status && <div className="mt-4 text-sm font-mono text-accent animate-pulse">&gt; {status}</div>}
      </div>

      {generatedData && (
        <div className="bg-surface border border-surfaceHighlight rounded-2xl overflow-hidden animate-in fade-in slide-in-from-bottom-4 duration-500">
          <div className="grid grid-cols-1 md:grid-cols-2">
            <div className="relative bg-black h-[400px]">
               <img src={generatedData.tempImageUrl} className="w-full h-full object-cover"/>
            </div>
            <div className="p-6 flex flex-col justify-between">
               <div className="space-y-4">
                  <div>
                    <span className="text-xs font-bold text-gray-500 uppercase">Pro Prompt</span>
                    <p className="text-sm bg-black/20 p-3 rounded-lg border border-white/5 mt-1 max-h-40 overflow-y-auto">
                      {generatedData.prompt}
                    </p>
                  </div>
                  <div>
                     <span className="text-xs font-bold text-gray-500 uppercase">Tags</span>
                     <div className="flex flex-wrap gap-2 mt-2">
                        {generatedData.tags.map((tag:string, i:number) => (
                           <span key={i} className="text-xs bg-surfaceHighlight px-2 py-1 rounded text-textSecondary">#{tag}</span>
                        ))}
                     </div>
                  </div>
               </div>
               <div className="mt-8 flex gap-3">
                 <button onClick={() => setGeneratedData(null)} className="flex-1 py-3 text-red-400 border border-red-500/30 rounded-xl hover:bg-red-500/10">Discard</button>
                 <button onClick={handleSaveToGallery} className="flex-[2] py-3 bg-green-600 text-white rounded-xl font-bold shadow-lg hover:bg-green-500">Approve & Upload</button>
               </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminGenerator;
