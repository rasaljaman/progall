import React, { useState, useRef, useEffect } from 'react';
import { supabase } from '../services/supabaseService';
import { Sparkles, RefreshCw, ChevronDown, Zap, Brain, AlertTriangle } from 'lucide-react';
import { useToast } from '../context/ToastContext';

const AdminGenerator: React.FC = () => {
  const [topic, setTopic] = useState('');
  const [loading, setLoading] = useState(false);
  const [status, setStatus] = useState(''); 
  const [generatedData, setGeneratedData] = useState<any>(null);
  const [selectedStyle, setSelectedStyle] = useState('Realistic');
  
  // --- DEFAULT IS GEMINI (SMART MODE) ---
  const [aiProvider, setAiProvider] = useState<'gemini' | 'pollinations'>('gemini');
  const [showDropdown, setShowDropdown] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  const { showToast } = useToast();

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setShowDropdown(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const styles: Record<string, string> = {
    'No Style': 'highly detailed, sharp focus, 8k, uhd',
    'Anime': 'anime style, studio ghibli, makoto shinkai, vibrant colors, highly detailed, 8k resolution, cinematic lighting',
    'Cyberpunk': 'cyberpunk style, neon noir, blade runner aesthetic, futuristic city, chromatic aberration, wet streets, realistic texture',
    'Realistic': 'award winning photography, shot on Sony A7R IV, 85mm lens, f/1.8, depth of field, natural lighting, skin pores, hyper-realistic, 8k uhd',
    'Oil Painting': 'oil painting style, thick impasto, textured brushstrokes, classical composition, dramatic lighting',
    '3D Render': '3D render, unreal engine 5, octane render, ray tracing, volumetric lighting, subsurface scattering, 8k'
  };

  // --- ENGINE 1: GEMINI PRO (PRIMARY) ---
  const generateWithGemini = async (systemPrompt: string) => {
    const apiKey = import.meta.env.VITE_GEMINI_API_KEY;
    if (!apiKey) throw new Error("Gemini API Key is missing in .env file");

    // Using the standard 'gemini-pro' model
    const response = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-pro:generateContent?key=${apiKey}`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          contents: [{ parts: [{ text: systemPrompt }] }]
        })
      }
    );

    if (response.status === 404) throw new Error("GEMINI_404_NOT_FOUND"); // Key exists but service disabled
    if (response.status === 429) throw new Error("GEMINI_QUOTA_FULL");
    if (!response.ok) throw new Error(`Gemini Error: ${response.status}`);

    const data = await response.json();
    let text = data.candidates?.[0]?.content?.parts?.[0]?.text;
    
    if (!text) throw new Error("Gemini returned empty response");

    // Clean up JSON format
    text = text.replace(/```json/g, '').replace(/```/g, '').trim();
    return JSON.parse(text);
  };

  // --- ENGINE 2: POLLINATIONS (BACKUP) ---
  const generateWithPollinations = async (systemPrompt: string) => {
    const response = await fetch(`https://text.pollinations.ai/${encodeURIComponent(systemPrompt)}`);
    if (!response.ok) throw new Error("Backup Brain is offline");
    
    let text = await response.text();
    text = text.replace(/```json/g, '').replace(/```/g, '').trim();
    return JSON.parse(text);
  };

  const handleGenerate = async () => {
    if (!topic) return showToast('Please enter a topic!', 'error');

    setLoading(true);
    setGeneratedData(null);
    
    // UI Update
    const engineName = aiProvider === 'gemini' ? 'Gemini Pro 🧠' : 'Pollinations ⚡';
    setStatus(`Consulting ${engineName}...`);

    try {
      const stylePrompt = styles[selectedStyle] || styles['No Style'];
      
      const systemPrompt = `
        Act as a Professional AI Art Director.
        Input Idea: "${topic}"
        Selected Style: "${selectedStyle}"
        
        Task: Create a highly detailed JSON object for image generation.
        JSON Structure:
        {
          "prompt": "Write a massive, detailed paragraph describing the image. Include camera settings (ISO, lens), lighting (volumetric, cinematic), and textures.",
          "category": "A single word category",
          "tags": ["tag1", "tag2", "tag3", "tag4", "tag5"]
        }
        
        IMPORTANT: Output ONLY valid JSON. No Markdown.
      `;

      let aiData;

      try {
        if (aiProvider === 'gemini') {
           // Try Gemini First
           aiData = await generateWithGemini(systemPrompt);
        } else {
           // Manual override to Pollinations
           aiData = await generateWithPollinations(systemPrompt);
        }
      } catch (error: any) {
        console.warn("Primary Engine Failed:", error.message);
        
        // --- SMART FALLBACK LOGIC ---
        if (aiProvider === 'gemini') {
           let errorMsg = "Gemini failed. Switching to Unlimited Backup.";
           if (error.message === "GEMINI_404_NOT_FOUND") errorMsg = "Gemini Service not enabled. Using Backup.";
           
           showToast(errorMsg, 'error');
           setStatus("Gemini failed, using Backup Brain... ⚡");
           
           // Automatically try the backup
           setAiProvider('pollinations'); // Update UI
           aiData = await generateWithPollinations(systemPrompt);
        } else {
           throw error; // If backup fails, stop.
        }
      }

      // --- PHASE 2: GENERATE IMAGE (Pollinations Flux) ---
      setStatus('Rendering High-Quality Image... 📸');
      
      const finalPrompt = `${aiData.prompt}, ${stylePrompt}`;
      const imageUrl = `https://image.pollinations.ai/prompt/${encodeURIComponent(finalPrompt)}?nologo=true&private=true&model=flux&width=1280&height=720&seed=${Math.floor(Math.random() * 99999)}`;
      
      setGeneratedData({
        ...aiData,
        tempImageUrl: imageUrl,
        tags: Array.isArray(aiData.tags) ? aiData.tags : aiData.tags.split(',').map((t: string) => t.trim())
      });
      
      setStatus('Ready! ✨');

    } catch (error: any) {
      console.error(error);
      showToast('Generation failed completely.', 'error');
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
          <Brain className="text-accent" /> Gemini Pro Studio
        </h1>
        <p className="text-textSecondary mt-2">
          Powered by Gemini Pro. Falls back to Pollinations if quota exceeded.
        </p>
      </div>

      <div className="bg-surface border border-surfaceHighlight p-6 rounded-2xl shadow-lg mb-8">
        <div className="mb-4">
           <label className="text-xs font-bold text-textSecondary uppercase tracking-widest mb-2 block">
             Choose Style
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
            placeholder="e.g. A cute girl portrait..." 
            value={topic}
            onChange={(e) => setTopic(e.target.value)}
            className="flex-1 bg-black/20 border border-surfaceHighlight rounded-xl px-4 py-3 text-white outline-none focus:border-accent"
            disabled={loading}
          />
          
          {/* SPLIT BUTTON */}
          <div className="relative flex items-center" ref={dropdownRef}>
            <button 
                onClick={handleGenerate}
                disabled={loading}
                className="bg-accent hover:bg-accent/80 text-white font-bold py-3 pl-6 pr-4 rounded-l-xl border-r border-black/20 flex items-center gap-2 transition-all h-full"
            >
                {loading ? <RefreshCw className="animate-spin" size={18}/> : aiProvider === 'gemini' ? <Brain size={18}/> : <Zap size={18}/>}
                {loading ? 'Thinking...' : aiProvider === 'gemini' ? 'Generate 🧠' : 'Generate ⚡'}
            </button>
            <button 
                onClick={() => setShowDropdown(!showDropdown)}
                disabled={loading}
                className="bg-accent hover:bg-accent/80 text-white font-bold py-3 px-3 rounded-r-xl transition-all h-full flex items-center justify-center"
            >
                <ChevronDown size={18} className={`transition-transform ${showDropdown ? 'rotate-180' : ''}`}/>
            </button>

            {/* DROPDOWN MENU */}
            {showDropdown && (
                <div className="absolute top-full right-0 mt-2 w-64 bg-surface border border-surfaceHighlight rounded-xl shadow-2xl overflow-hidden z-50">
                    <div className="p-2 text-xs font-bold text-textSecondary uppercase tracking-wider">Select AI Brain</div>
                    <button 
                        onClick={() => { setAiProvider('gemini'); setShowDropdown(false); }}
                        className={`w-full text-left px-4 py-3 flex items-center gap-3 hover:bg-white/5 transition-colors ${aiProvider === 'gemini' ? 'text-accent' : 'text-textPrimary'}`}
                    >
                        <Brain size={16} />
                        <div>
                            <div className="font-bold">Google Gemini</div>
                            <div className="text-xs text-textSecondary">Best Quality & Accuracy.</div>
                        </div>
                    </button>
                    <button 
                        onClick={() => { setAiProvider('pollinations'); setShowDropdown(false); }}
                        className={`w-full text-left px-4 py-3 flex items-center gap-3 hover:bg-white/5 transition-colors ${aiProvider === 'pollinations' ? 'text-accent' : 'text-textPrimary'}`}
                    >
                        <Zap size={16} />
                        <div>
                            <div className="font-bold">Pollinations AI</div>
                            <div className="text-xs text-textSecondary">Unlimited Backup.</div>
                        </div>
                    </button>
                </div>
            )}
          </div>
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
                    <span className="text-xs font-bold text-gray-500 uppercase">AI Prompt ({aiProvider})</span>
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
