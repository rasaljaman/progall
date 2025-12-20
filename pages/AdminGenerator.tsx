import React, { useState } from 'react';
import { supabase } from '../services/supabaseService';
import { Sparkles, Save, RefreshCw, Image as ImageIcon, Palette } from 'lucide-react';
import { useToast } from '../context/ToastContext';

const AdminGenerator: React.FC = () => {
  const [topic, setTopic] = useState('');
  const [loading, setLoading] = useState(false);
  const [status, setStatus] = useState(''); 
  const [generatedData, setGeneratedData] = useState<any>(null);
  const [selectedStyle, setSelectedStyle] = useState('No Style');
  const { showToast } = useToast();

  const styles = [
    { name: 'No Style', prompt: '' },
    { name: 'Anime', prompt: 'anime style, cel shaded, vibrant colors, studio ghibli aesthetic, highly detailed' },
    { name: 'Cyberpunk', prompt: 'cyberpunk style, neon lights, futuristic, high tech, low life, blade runner aesthetic' },
    { name: 'Realistic', prompt: 'hyper-realistic, 8k resolution, cinematic lighting, photorealistic, shot on 35mm lens' },
    { name: 'Oil Painting', prompt: 'oil painting style, textured brushstrokes, classical art, detailed canvas' },
    { name: '3D Render', prompt: '3D render, unreal engine 5, octane render, volumetric lighting, ray tracing' }
  ];

  // --- DYNAMIC MODEL FINDER ---
  const findWorkingModel = async (apiKey: string) => {
    try {
      const response = await fetch(
        `https://generativelanguage.googleapis.com/v1beta/models?key=${apiKey}`
      );
      if (!response.ok) return null;
      const data = await response.json();
      if (!data.models) return null;

      const preferred = data.models.find((m: any) => 
        m.name.includes('gemini') && 
        m.supportedGenerationMethods?.includes('generateContent') &&
        (m.name.includes('flash') || m.name.includes('pro'))
      );
      return preferred ? preferred.name : 'models/gemini-pro';
    } catch (e) {
      return 'models/gemini-pro'; 
    }
  };

  const handleGenerate = async () => {
    if (!topic) return showToast('Please enter a topic!', 'error');
    
    const apiKey = import.meta.env.VITE_GEMINI_API_KEY;
    if (!apiKey) {
        showToast('API Key missing in .env file', 'error');
        return;
    }
    
    setLoading(true);
    setGeneratedData(null);

    try {
      // --- PHASE 1: GENERATE ---
      setStatus('Connecting to AI Brain... 🧠');
      const modelName = await findWorkingModel(apiKey);
      const styleInstruction = styles.find(s => s.name === selectedStyle)?.prompt || '';
      
      const response = await fetch(
        `https://generativelanguage.googleapis.com/v1beta/${modelName}:generateContent?key=${apiKey}`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            contents: [{
              parts: [{
                text: `
                  Act as a professional AI Art Curator. I will give you a simple topic: "${topic}".
                  1. Write a highly detailed, creative text-to-image prompt (Midjourney style). Style: ${styleInstruction}.
                  2. Select the single best category: [Abstract, Anime, Cyberpunk, Fantasy, Landscapes, Minimalist, Nature, Portraits, Sci-Fi, Surrealism, 3D Render].
                  3. Generate 5-8 relevant, searchable tags (comma separated).
                  Return ONLY JSON with keys: "prompt", "category", "tags".
                `
              }]
            }]
          })
        }
      );

      if (!response.ok) throw new Error(`Gemini API Error: ${response.status}`);

      const data = await response.json();
      if (!data.candidates || data.candidates.length === 0) throw new Error("No results from AI.");

      let text = data.candidates[0].content.parts[0].text;
      text = text.replace(/```json/g, '').replace(/```/g, '').trim();
      
      let aiData;
      try {
        aiData = JSON.parse(text);
      } catch (e) {
        aiData = {
          prompt: `${topic} ${styleInstruction}, highly detailed, 8k`,
          category: 'AI Art',
          tags: ['ai', 'art', 'generated']
        };
      }

      // --- PHASE 2: IMAGE ---
      setStatus('Artist is painting... (This takes ~10s) 🎨');
      const finalPrompt = `${aiData.prompt} ${styleInstruction}`;
      const imageUrl = `https://image.pollinations.ai/prompt/${encodeURIComponent(finalPrompt)}?nolog=true&width=1024&height=1024&seed=${Math.floor(Math.random() * 1000)}`;
      
      setGeneratedData({
        ...aiData,
        tempImageUrl: imageUrl,
        tags: Array.isArray(aiData.tags) ? aiData.tags : aiData.tags.split(',').map((t: string) => t.trim())
      });
      
      setStatus('Ready to review! ✨');

    } catch (error: any) {
      console.error(error);
      showToast(`${error.message || 'Error occurred'}`, 'error');
      setStatus('Error occurred.');
    } finally {
      setLoading(false);
    }
  };

  // --- SAVE LOGIC (UPDATED WITH BETTER ERROR HANDLING & USER ID) ---
  const handleSaveToGallery = async () => {
    if (!generatedData) return;
    setLoading(true);
    setStatus('Uploading to database... ☁️');

    try {
      // 1. Get Current User (Required for 'created_by' if using UUIDs)
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("You are not logged in.");

      // 2. Fetch Image Blob
      const res = await fetch(generatedData.tempImageUrl);
      if (!res.ok) throw new Error("Failed to download image from AI provider.");
      const blob = await res.blob();
      const file = new File([blob], `ai-gen-${Date.now()}.jpg`, { type: 'image/jpeg' });

      // 3. Upload to Storage
      const fileName = `${Date.now()}-ai-art.jpg`;
      const { error: uploadError } = await supabase.storage
        .from('images')
        .upload(fileName, file);

      if (uploadError) {
        console.error("Storage Error:", uploadError);
        throw new Error(`Storage Upload Failed: ${uploadError.message}`);
      }

      // 4. Get Public URL
      const { data: { publicUrl } } = supabase.storage
        .from('images')
        .getPublicUrl(fileName);

      // 5. Insert into Database
      const { error: dbError } = await supabase
        .from('images')
        .insert([{
          url: publicUrl,
          thumbnail: publicUrl,
          prompt: generatedData.prompt,
          category: generatedData.category,
          tags: generatedData.tags,
          created_at: new Date(),
          created_by: user.id // FIX: Using real User ID instead of 'AI_AGENT'
        }]);

      if (dbError) {
        console.error("DB Error:", dbError);
        throw new Error(`Database Save Failed: ${dbError.message}`);
      }

      showToast('Published to Gallery successfully! 🎉');
      setGeneratedData(null);
      setTopic('');
      setStatus('');

    } catch (error: any) {
      console.error(error);
      showToast(error.message, 'error'); // Show EXACT error in toast
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="p-6 md:p-12 max-w-4xl mx-auto min-h-screen text-textPrimary">
      
      <div className="mb-8">
        <h1 className="text-3xl font-bold flex items-center gap-3">
          <Sparkles className="text-accent" /> AI Auto-Creator
        </h1>
        <p className="text-textSecondary mt-2">
          Enter a simple idea. Select a style. The Agent does the rest.
        </p>
      </div>

      <div className="bg-surface border border-surfaceHighlight p-6 rounded-2xl shadow-lg mb-8">
        <div className="mb-4">
           <label className="text-xs font-bold text-textSecondary uppercase tracking-widest mb-2 block flex items-center gap-2">
             <Palette size={14}/> Choose Art Style
           </label>
           <div className="flex flex-wrap gap-2">
             {styles.map(style => (
               <button
                 key={style.name}
                 onClick={() => setSelectedStyle(style.name)}
                 className={`px-4 py-2 rounded-full text-sm font-bold transition-all border ${
                   selectedStyle === style.name 
                   ? 'bg-accent border-accent text-white' 
                   : 'bg-black/20 border-surfaceHighlight text-textSecondary hover:text-white'
                 }`}
               >
                 {style.name}
               </button>
             ))}
           </div>
        </div>

        <div className="flex flex-col md:flex-row gap-4">
          <input 
            type="text" 
            placeholder="e.g. A cat eating noodles..." 
            value={topic}
            onChange={(e) => setTopic(e.target.value)}
            className="flex-1 bg-black/20 border border-surfaceHighlight rounded-xl px-4 py-3 text-lg focus:border-accent outline-none text-white placeholder-gray-500"
            disabled={loading}
          />
          <button 
            onClick={handleGenerate}
            disabled={loading}
            className="bg-accent hover:bg-accent/80 text-white px-8 py-3 rounded-xl font-bold flex items-center justify-center gap-2 transition-all disabled:opacity-50"
          >
            {loading ? <RefreshCw className="animate-spin" /> : <Sparkles />}
            {loading ? 'Generate' : 'Generate'}
          </button>
        </div>
        
        {status && (
          <div className="mt-4 text-sm font-mono text-accent animate-pulse">
            &gt; {status}
          </div>
        )}
      </div>

      {generatedData && (
        <div className="bg-surface border border-surfaceHighlight rounded-2xl overflow-hidden animate-in fade-in slide-in-from-bottom-4 duration-500">
          <div className="grid grid-cols-1 md:grid-cols-2">
            
            <div className="relative bg-black h-[400px] flex items-center justify-center group">
               <img 
                 src={generatedData.tempImageUrl} 
                 alt="AI Preview" 
                 className="w-full h-full object-cover"
               />
            </div>

            <div className="p-6 flex flex-col justify-between">
               <div className="space-y-4">
                  <div>
                    <span className="text-xs font-bold text-textSecondary uppercase tracking-widest">Detected Category</span>
                    <div className="text-accent font-bold text-xl">{generatedData.category}</div>
                  </div>

                  <div>
                    <span className="text-xs font-bold text-textSecondary uppercase tracking-widest">AI Written Prompt</span>
                    <p className="text-sm text-textPrimary/80 leading-relaxed bg-black/20 p-3 rounded-lg border border-white/5 mt-1 max-h-40 overflow-y-auto">
                      {generatedData.prompt}
                    </p>
                  </div>

                  <div>
                    <span className="text-xs font-bold text-textSecondary uppercase tracking-widest">Auto Tags</span>
                    <div className="flex flex-wrap gap-2 mt-1">
                      {generatedData.tags.map((t: string, i: number) => (
                        <span key={i} className="px-2 py-1 bg-surfaceHighlight rounded text-xs text-textSecondary">#{t}</span>
                      ))}
                    </div>
                  </div>
               </div>

               <div className="mt-8 flex gap-3">
                 <button 
                   onClick={() => setGeneratedData(null)} 
                   className="flex-1 py-3 rounded-xl border border-red-500/30 text-red-400 hover:bg-red-500/10 font-bold transition-colors"
                 >
                   Discard
                 </button>
                 <button 
                   onClick={handleSaveToGallery} 
                   className="flex-[2] py-3 rounded-xl bg-green-600 hover:bg-green-500 text-white font-bold shadow-lg flex items-center justify-center gap-2 transition-all hover:scale-[1.02]"
                 >
                   <Save size={18} /> Approve & Upload
                 </button>
               </div>
            </div>

          </div>
        </div>
      )}

    </div>
  );
};

export default AdminGenerator;
