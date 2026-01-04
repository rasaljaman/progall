import React, { useState, useRef, useEffect } from 'react';
import { supabase } from '../services/supabaseService';
import { Sparkles, RefreshCw, ChevronDown, Zap, Brain, Maximize2, X, Edit3, Save } from 'lucide-react';
import { useToast } from '../context/ToastContext';

const AdminGenerator: React.FC = () => {
  const [topic, setTopic] = useState('');
  const [loading, setLoading] = useState(false);
  const [status, setStatus] = useState(''); 
  const [generatedData, setGeneratedData] = useState<any>(null);
  const [selectedStyle, setSelectedStyle] = useState('Realistic');
  const [category, setCategory] = useState(''); // Editable category
  const [showStyleMenu, setShowStyleMenu] = useState(false);
  const [fullScreenImage, setFullScreenImage] = useState<string | null>(null);

  // --- DEFAULT IS GEMINI (SMART MODE) ---
  const [aiProvider, setAiProvider] = useState<'gemini' | 'pollinations'>('gemini');
  const [showEngineDropdown, setShowEngineDropdown] = useState(false);
  const engineDropdownRef = useRef<HTMLDivElement>(null);

  const { showToast } = useToast();

  // FIX: Force scroll to top on load
  useEffect(() => {
    window.scrollTo(0, 0);
  }, []);

  // Close dropdowns if clicking outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (engineDropdownRef.current && !engineDropdownRef.current.contains(event.target as Node)) {
        setShowEngineDropdown(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // --- EXPANDED STYLE LIST ---
  const styles: Record<string, string> = {
    'Realistic': 'award winning photography, shot on Sony A7R IV, 85mm lens, f/1.8, natural lighting, hyper-realistic, 8k uhd, sharp focus',
    'Anime': 'anime style, studio ghibli, makoto shinkai, vibrant colors, detailed background, 8k',
    'Cyberpunk': 'cyberpunk style, neon noir, futuristic city, wet streets, chromatic aberration, cinematic lighting',
    'Oil Painting': 'oil painting, thick impasto, textured brushstrokes, classical composition, dramatic lighting',
    '3D Render': '3D render, unreal engine 5, octane render, ray tracing, subsurface scattering, 8k',
    'Fantasy': 'high fantasy, magical atmosphere, ethereal lighting, intricate details, dnd character art',
    'Vintage': 'vintage 1950s photography, film grain, kodak portra 400, nostalgic atmosphere',
    'Cinematic': 'cinematic movie shot, anamorphic lens, teal and orange grading, dramatic shadows, imax quality',
    'Minimalist': 'minimalist design, clean lines, pastel colors, soft lighting, negative space',
    'Horror': 'dark horror theme, eerie atmosphere, volumetric fog, dramatic rim lighting, scary',
    'Sketch': 'pencil sketch, charcoal drawing, rough lines, artistic shading, monochrome',
    'Watercolor': 'watercolor painting, paint splatter, soft edges, artistic, dreamy'
  };

  const predefinedCategories = ["Portrait", "Landscape", "Abstract", "Sci-Fi", "Fantasy", "Architecture", "Fashion"];

  // --- ENGINE 1: GEMINI PRO (PRIMARY) ---
  const generateWithGemini = async (systemPrompt: string) => {
    const apiKey = import.meta.env.VITE_GEMINI_API_KEY;
    if (!apiKey) throw new Error("Gemini API Key missing");

    const response = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-pro:generateContent?key=${apiKey}`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ contents: [{ parts: [{ text: systemPrompt }] }] })
      }
    );

    if (response.status === 404) throw new Error("GEMINI_404");
    if (response.status === 429) throw new Error("GEMINI_QUOTA");
    if (!response.ok) throw new Error(`Gemini Error: ${response.status}`);

    const data = await response.json();
    let text = data.candidates?.[0]?.content?.parts?.[0]?.text;
    if (!text) throw new Error("Gemini returned empty response");
    return JSON.parse(text.replace(/```json/g, '').replace(/```/g, '').trim());
  };

  // --- ENGINE 2: POLLINATIONS (BACKUP) ---
  const generateWithPollinations = async (systemPrompt: string) => {
    const response = await fetch(`https://text.pollinations.ai/${encodeURIComponent(systemPrompt)}`);
    if (!response.ok) throw new Error("Backup Brain is offline");
    let text = await response.text();
    return JSON.parse(text.replace(/```json/g, '').replace(/```/g, '').trim());
  };

  const handleGenerate = async () => {
    if (!topic) return showToast('Please enter a topic!', 'error');

    setLoading(true);
    setGeneratedData(null);
    setShowStyleMenu(false); // Close menu
    const engineName = aiProvider === 'gemini' ? 'Gemini Pro 🧠' : 'Pollinations ⚡';
    setStatus(`Consulting ${engineName}...`);

    try {
      const stylePrompt = styles[selectedStyle] || styles['Realistic'];
      
      // --- SUPER PROMPT FOR FACE ACCURACY ---
      const systemPrompt = `
        Act as a Professional AI Art Director.
        Input Idea: "${topic}"
        Selected Style: "${selectedStyle}"
        
        GOAL: Create a prompt for an image where a user could later swap their face. 
        REQUIREMENTS:
        1. Face details (if any) must be "evenly lit, sharp focus, high fidelity, neutral expression".
        2. Lighting must be "cinematic but clean" (avoid heavy shadows covering the face).
        3. Texture must be "8k, skin pores visible" (if human).
        
        Task: Return valid JSON:
        {
          "prompt": "Detailed description. Start with main subject. Include camera settings.",
          "category": "A creative 1-2 word category name (e.g. 'NeonSoul', 'ForestCore')",
          "tags": ["tag1", "tag2", "tag3", "tag4", "tag5", "tag6", "tag7"] 
        }
        (Tags: Generate between 5 and 12 tags)
        Output ONLY valid JSON.
      `;

      let aiData;

      try {
        if (aiProvider === 'gemini') {
           aiData = await generateWithGemini(systemPrompt);
        } else {
           aiData = await generateWithPollinations(systemPrompt);
        }
      } catch (error: any) {
        console.warn("Primary Engine Failed:", error.message);
        // Smart Fallback
        if (aiProvider === 'gemini') {
           showToast("Gemini failed, switching to Unlimited Backup.", 'success');
           setAiProvider('pollinations');
           aiData = await generateWithPollinations(systemPrompt);
        } else {
           throw error;
        }
      }

      // --- GENERATE IMAGE ---
      setStatus('Rendering Face-Ready Image... 📸');
      
      const finalPrompt = `${aiData.prompt}, ${stylePrompt}, perfect face structure, symmetrical eyes, highly detailed skin texture, 8k`;
      const imageUrl = `https://image.pollinations.ai/prompt/${encodeURIComponent(finalPrompt)}?nologo=true&private=true&model=flux&width=1280&height=720&seed=${Math.floor(Math.random() * 99999)}`;
      
      setGeneratedData({
        ...aiData,
        tempImageUrl: imageUrl,
        tags: Array.isArray(aiData.tags) ? aiData.tags : aiData.tags.split(',').map((t: string) => t.trim())
      });
      setCategory(aiData.category || 'AI Art'); // Set initial category
      
      setStatus('Ready! ✨');

    } catch (error: any) {
      console.error(error);
      showToast('Generation failed.', 'error');
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
        category: category, // Use the editable category
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
    // FIX: Changed padding to 'pt-32 px-6 pb-20' to clear the navbar
    <div className="pt-32 px-6 pb-20 md:px-12 max-w-4xl mx-auto min-h-screen text-textPrimary">
      
      {/* FULL SCREEN MODAL */}
      {fullScreenImage && (
        <div className="fixed inset-0 bg-black/95 z-50 flex items-center justify-center p-4 animate-in fade-in duration-200" onClick={() => setFullScreenImage(null)}>
            <button className="absolute top-4 right-4 text-white/50 hover:text-white"><X size={32}/></button>
            <img src={fullScreenImage} className="max-w-full max-h-full rounded-lg shadow-2xl object-contain" />
        </div>
      )}

      <div className="mb-8">
        <h1 className="text-3xl font-bold flex items-center gap-3">
          <Brain className="text-accent" /> Smart Asset Creator
        </h1>
        <p className="text-textSecondary mt-2">
          Create face-swappable templates with dynamic categories and tags.
        </p>
      </div>

      <div className="bg-surface border border-surfaceHighlight p-6 rounded-2xl shadow-lg mb-8">
        
        {/* STYLE SELECTOR */}
        <div className="mb-6">
           <div className="flex justify-between items-center mb-2">
              <label className="text-xs font-bold text-textSecondary uppercase tracking-widest">
                Visual Style
              </label>
              <button 
                onClick={() => setShowStyleMenu(!showStyleMenu)}
                className="text-xs font-bold text-accent hover:text-white flex items-center gap-1"
              >
                {showStyleMenu ? 'Hide Styles' : 'Show All Styles'} <ChevronDown size={14} className={`transition-transform ${showStyleMenu ? 'rotate-180' : ''}`}/>
              </button>
           </div>
           
           <div className={`grid grid-cols-2 md:grid-cols-4 gap-2 transition-all duration-300 ${showStyleMenu ? 'max-h-[500px] opacity-100' : 'max-h-12 overflow-hidden opacity-100'}`}>
             {Object.keys(styles).map(styleName => (
               <button
                 key={styleName}
                 onClick={() => setSelectedStyle(styleName)}
                 className={`px-3 py-2 rounded-lg text-sm font-bold border transition-all text-left ${selectedStyle === styleName ? 'bg-accent text-white border-accent' : 'bg-black/20 border-surfaceHighlight text-gray-400 hover:border-white/30'}`}
               >
                 {styleName}
               </button>
             ))}
           </div>
        </div>

        {/* INPUT + ENGINE SELECTOR */}
        <div className="flex flex-col md:flex-row gap-4">
          <input 
            type="text" 
            placeholder="e.g. A cybernetic warrior in neon rain..." 
            value={topic}
            onChange={(e) => setTopic(e.target.value)}
            className="flex-1 bg-black/20 border border-surfaceHighlight rounded-xl px-4 py-3 text-white outline-none focus:border-accent placeholder:text-gray-600"
            disabled={loading}
          />
          
          <div className="relative flex items-center" ref={engineDropdownRef}>
            <button 
                onClick={handleGenerate}
                disabled={loading}
                className="bg-accent hover:bg-accent/80 text-white font-bold py-3 pl-6 pr-4 rounded-l-xl border-r border-black/20 flex items-center gap-2 transition-all h-full whitespace-nowrap"
            >
                {loading ? <RefreshCw className="animate-spin" size={18}/> : aiProvider === 'gemini' ? <Brain size={18}/> : <Zap size={18}/>}
                {loading ? 'Creating...' : aiProvider === 'gemini' ? 'Generate Pro' : 'Generate Fast'}
            </button>
            <button 
                onClick={() => setShowEngineDropdown(!showEngineDropdown)}
                disabled={loading}
                className="bg-accent hover:bg-accent/80 text-white font-bold py-3 px-3 rounded-r-xl transition-all h-full flex items-center justify-center"
            >
                <ChevronDown size={18} className={`transition-transform ${showEngineDropdown ? 'rotate-180' : ''}`}/>
            </button>

            {/* ENGINE DROPDOWN */}
            {showEngineDropdown && (
                <div className="absolute top-full right-0 mt-2 w-64 bg-surface border border-surfaceHighlight rounded-xl shadow-2xl overflow-hidden z-20">
                    <button 
                        onClick={() => { setAiProvider('gemini'); setShowEngineDropdown(false); }}
                        className={`w-full text-left px-4 py-3 flex items-center gap-3 hover:bg-white/5 ${aiProvider === 'gemini' ? 'text-accent' : 'text-textPrimary'}`}
                    >
                        <Brain size={16} /> <div><div className="font-bold">Gemini Pro</div><div className="text-xs opacity-60">High Intelligence</div></div>
                    </button>
                    <button 
                        onClick={() => { setAiProvider('pollinations'); setShowEngineDropdown(false); }}
                        className={`w-full text-left px-4 py-3 flex items-center gap-3 hover:bg-white/5 ${aiProvider === 'pollinations' ? 'text-accent' : 'text-textPrimary'}`}
                    >
                        <Zap size={16} /> <div><div className="font-bold">Pollinations</div><div className="text-xs opacity-60">Unlimited Speed</div></div>
                    </button>
                </div>
            )}
          </div>
        </div>
        
        {status && <div className="mt-4 text-sm font-mono text-accent animate-pulse">&gt; {status}</div>}
      </div>

      {generatedData && (
        <div className="bg-surface border border-surfaceHighlight rounded-2xl overflow-hidden animate-in fade-in slide-in-from-bottom-4 duration-500">
          <div className="grid grid-cols-1 lg:grid-cols-2">
            
            {/* IMAGE PREVIEW (CLICK TO EXPAND) */}
            <div className="relative bg-black group h-[300px] lg:h-auto overflow-hidden">
               <img 
                 src={generatedData.tempImageUrl} 
                 className="w-full h-full object-contain cursor-zoom-in transition-transform duration-700 group-hover:scale-105"
                 onClick={() => setFullScreenImage(generatedData.tempImageUrl)}
               />
               <div className="absolute bottom-4 right-4 bg-black/60 text-white p-2 rounded-full opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none">
                 <Maximize2 size={20}/>
               </div>
            </div>

            {/* DETAILS PANEL */}
            <div className="p-6 flex flex-col gap-6">
               
               {/* EDITABLE CATEGORY */}
               <div>
                  <label className="text-xs font-bold text-gray-500 uppercase flex items-center gap-2 mb-2">
                    <Edit3 size={12}/> Category (Editable)
                  </label>
                  <div className="flex gap-2">
                    <input 
                      type="text" 
                      value={category}
                      onChange={(e) => setCategory(e.target.value)}
                      className="flex-1 bg-black/20 border border-surfaceHighlight rounded-lg px-3 py-2 text-white text-sm focus:border-accent outline-none"
                    />
                    <select 
                      onChange={(e) => setCategory(e.target.value)}
                      className="bg-black/20 border border-surfaceHighlight rounded-lg px-2 text-textSecondary text-sm outline-none"
                      value=""
                    >
                      <option value="" disabled>Presets</option>
                      {predefinedCategories.map(c => <option key={c} value={c}>{c}</option>)}
                    </select>
                  </div>
               </div>

               {/* TAGS */}
               <div>
                 <span className="text-xs font-bold text-gray-500 uppercase">Tags ({generatedData.tags.length})</span>
                 <div className="flex flex-wrap gap-2 mt-2 max-h-[100px] overflow-y-auto">
                    {generatedData.tags.map((tag:string, i:number) => (
                       <span key={i} className="text-xs bg-surfaceHighlight border border-white/5 px-2 py-1 rounded text-textSecondary">#{tag}</span>
                    ))}
                 </div>
               </div>

               {/* PROMPT */}
               <div className="flex-1">
                 <span className="text-xs font-bold text-gray-500 uppercase">Pro Prompt</span>
                 <p className="text-sm text-textSecondary bg-black/20 p-3 rounded-lg border border-white/5 mt-1 h-24 overflow-y-auto custom-scrollbar">
                   {generatedData.prompt}
                 </p>
               </div>

               {/* ACTIONS */}
               <div className="flex gap-3 mt-auto">
                 <button 
                   onClick={() => setGeneratedData(null)} 
                   className="px-6 py-3 text-red-400 border border-red-500/30 rounded-xl hover:bg-red-500/10 font-bold"
                 >
                   Discard
                 </button>
                 <button 
                   onClick={handleSaveToGallery} 
                   className="flex-1 py-3 bg-green-600 text-white rounded-xl font-bold shadow-lg hover:bg-green-500 flex items-center justify-center gap-2"
                 >
                   <Save size={18}/> Approve & Upload
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
