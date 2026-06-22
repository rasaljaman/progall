/**
 * ProGall Auto-Pipeline v2
 * ========================
 * Sources (in priority order):
 *  1. Civitai.com  — public AI art API, no auth needed ✅ WORKS NOW
 *  2. Reddit       — requires OAuth approval (add creds when approved)
 *
 * For each discovered item:
 *  → Gemini 2.0 Flash  — enhance prompt + categorise + add tags
 *  → Download real image from Civitai CDN → upload to Supabase Storage
 *  → Insert row into public.images table (appears in gallery immediately)
 *
 * Usage:
 *   node scripts/auto-pipeline.mjs
 *   DRY_RUN=true node scripts/auto-pipeline.mjs
 *
 * Env vars:
 *   GEMINI_API_KEY         — Google AI Studio key (get free at aistudio.google.com)
 *   HF_TOKEN               — HuggingFace token (fallback image generation)
 *   SUPABASE_URL           — Supabase project URL
 *   SUPABASE_SERVICE_KEY   — Supabase service_role key
 *   REDDIT_CLIENT_ID       — (optional) after Reddit API approval
 *   REDDIT_CLIENT_SECRET   — (optional) after Reddit API approval
 *   REDDIT_USERNAME        — (optional)
 *   REDDIT_PASSWORD        — (optional)
 */

import fs from 'node:fs';
import path from 'node:path';
import { createClient } from '@supabase/supabase-js';

// ─────────────────────────────────────────────────────────────────────────────
// 0.  LOAD .env  (local development)
// ─────────────────────────────────────────────────────────────────────────────
const envPath = path.resolve(process.cwd(), '.env');
if (fs.existsSync(envPath)) {
  fs.readFileSync(envPath, 'utf8').split(/\r?\n/).forEach(line => {
    const m = line.match(/^\s*([\w.-]+)\s*=\s*(.*)?$/);
    if (m) {
      let v = (m[2] || '').trim();
      if ((v.startsWith('"') && v.endsWith('"')) || (v.startsWith("'") && v.endsWith("'")))
        v = v.slice(1, -1);
      if (!process.env[m[1]]) process.env[m[1]] = v;
    }
  });
}

// ─────────────────────────────────────────────────────────────────────────────
// 1.  CONFIG
// ─────────────────────────────────────────────────────────────────────────────
const DRY_RUN   = process.env.DRY_RUN   === 'true';
const MAX_POSTS = parseInt(process.env.MAX_POSTS  || '8',  10);
const MIN_SCORE = parseInt(process.env.MIN_SCORE  || '30', 10);

const GEMINI_API_KEY       = process.env.GEMINI_API_KEY       || process.env.VITE_GEMINI_API_KEY || '';
const HF_TOKEN             = process.env.HF_TOKEN             || process.env.VITE_HF_TOKEN       || '';
const SUPABASE_URL         = process.env.SUPABASE_URL         || process.env.VITE_SUPABASE_URL   || '';
const SUPABASE_SERVICE_KEY = process.env.SUPABASE_SERVICE_KEY || '';
const REDDIT_CLIENT_ID     = process.env.REDDIT_CLIENT_ID     || '';
const REDDIT_CLIENT_SECRET = process.env.REDDIT_CLIENT_SECRET || '';
const REDDIT_USERNAME      = process.env.REDDIT_USERNAME      || '';
const REDDIT_PASSWORD      = process.env.REDDIT_PASSWORD      || '';


const REDDIT_SUBREDDITS = ['AIArt', 'StableDiffusion', 'midjourney', 'dalle', 'FluxAI'];

const HF_MODELS = [
  'black-forest-labs/FLUX.1-schnell',
  'stabilityai/stable-diffusion-xl-base-1.0',
  'runwayml/stable-diffusion-v1-5',
];

const GEMINI_ENDPOINT =
  `https://generativelanguage.googleapis.com/v1beta/models/gemini-flash-latest:generateContent?key=${GEMINI_API_KEY}`;

// ─────────────────────────────────────────────────────────────────────────────
// 2.  BANNER
// ─────────────────────────────────────────────────────────────────────────────
const hasReddit = !!(REDDIT_CLIENT_ID && REDDIT_CLIENT_SECRET);
console.log('╔══════════════════════════════════════════════════════╗');
console.log('║  ProGall Auto-Pipeline v2 — Gemini + FLUX.1 + HF  ║');
console.log('╚══════════════════════════════════════════════════════╝');
console.log(`Mode        : ${DRY_RUN ? '🟡 DRY RUN (no writes)' : '🟢 LIVE'}`);
console.log(`Sources     : ${hasReddit ? 'Gemini Prompts + Reddit' : 'Gemini Prompts (Reddit: pending approval)'}`);
console.log(`Max posts   : ${MAX_POSTS}`);
console.log(`Gemini key  : ${GEMINI_API_KEY ? '✅' : '❌ missing — get free at aistudio.google.com'}`);
console.log(`HF token    : ${HF_TOKEN ? '✅' : '❌ missing — needed for image generation'}`);
console.log(`Supabase    : ${SUPABASE_URL ? '✅' : '❌ missing'}`);
console.log('');

// ─────────────────────────────────────────────────────────────────────────────
// 3.  GEMINI PROMPT GENERATION  —  primary source (no external API needed!)
//     Gemini creates fresh, unique, varied AI art prompts every run.
//     HuggingFace FLUX.1 then generates real images from those prompts.
// ─────────────────────────────────────────────────────────────────────────────

// Style seeds — Gemini picks from these each run to ensure variety
const STYLE_SEEDS = [
  'photorealistic portrait of a woman, dramatic studio lighting, sharp focus, 8k',
  'candid portrait of a smiling man in a cozy cafe, soft natural window light',
  'commercial product shot of a luxury perfume bottle on a sleek black marble slab with water splashes',
  'high-end cosmetic cream jar product photography, gold accents, floating pastel flower petals',
  'cyberpunk street citizen with neon reflections on their face and leather jacket, rain shower',
  'editorial product shot of modern wireless headphones, minimalist wooden stand, clean soft shadows',
  'group of happy diverse friends laughing together at a sunny outdoor cafe table, cinematic depth of field',
  'futuristic astronaut close-up portrait, glowing neon visor reflections, detailed space suit',
  'classical oil painting style portrait of a nobleman with a thoughtful expression, warm chiaroscuro',
  'action shot of a runner athlete mid-stride on a wet city track at sunset, dramatic backlighting',
  'professional product photography of a sleek smart watch, floating water droplets, neon blue accents',
  'anime style portrait of a young adventurer with a detailed colorful fantasy background',
  'vintage 1970s film style portrait of a musician holding an acoustic guitar, warm sun flares',
  'sleek designer sunglasses commercial photography, resting on a white sand dune, bright sunlight',
  'close-up portrait of an elderly artisan smiling in a dusty wood workshop, cinematic lighting',
];

/**
 * Use Gemini to generate N unique, diverse AI art prompts
 * Returns posts in the unified pipeline format
 */
async function generateGeminiPrompts(count) {
  if (!GEMINI_API_KEY) {
    console.warn('  ⚠️  No Gemini key — cannot generate prompts. Add GEMINI_API_KEY.');
    return [];
  }

  // Pick random style seeds for this run
  const seeds = [...STYLE_SEEDS].sort(() => Math.random() - 0.5).slice(0, count);
  console.log(`  🎲  Style seeds: ${seeds.slice(0, 3).map(s => `"${s}"`).join(', ')}...`);

  const prompt = `You are an expert AI art prompt engineer. Generate exactly ${count} unique, diverse, high-quality image generation prompts for a gallery website.

Each prompt should be vivid, detailed, and optimized for FLUX.1 / Stable Diffusion image generation.

CRITICAL REQUIREMENT: Every prompt generated MUST feature either:
1. One or more people, focusing on realistic human faces, expressions, emotions, or action poses (e.g., portraits, candid shots, stylized characters).
2. Professional product photography/commercial shots (e.g., perfume bottles, skincare jars, tech gadgets, fashion accessories on clean, aesthetic backgrounds).

Avoid abstract shapes or pure landscapes without people or products.

Use these seeds as inspiration but be creative:
${seeds.map((s, i) => `${i + 1}. ${s}`).join('\n')}

Return ONLY valid JSON array (no markdown, no code fences):
[
  {
    "prompt": "Full detailed image generation prompt, 2-3 sentences with subject, style, lighting, mood, technical quality terms",
    "category": "one of: Photorealistic, Fantasy, Anime, Cyberpunk, Portrait, Abstract, Landscape, Architecture, Sci-Fi, 3D Render",
    "tags": ["tag1", "tag2", "tag3", "tag4", "tag5"],
    "editorial_summary": "One compelling sentence about this image",
    "editorial_notes": "One paragraph about the artistic technique",
    "editorial_tips": "One tip for remixing this prompt"
  }
]`;

  try {
    const res = await fetch(GEMINI_ENDPOINT, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        contents: [{ role: 'user', parts: [{ text: prompt }] }],
        generationConfig: {
          temperature: 0.9,
          maxOutputTokens: 8000,
          responseMimeType: 'application/json',
        },
      }),
    });

    if (!res.ok) {
      const t = await res.text();
      throw new Error(`Gemini ${res.status}: ${t.slice(0, 150)}`);
    }

    const json    = await res.json();
    const rawText = json?.candidates?.[0]?.content?.parts?.[0]?.text || '';
    const parsed  = extractJson(rawText, true);

    console.log(`  ✅  Gemini generated ${parsed.length} prompts`);

    return parsed.map((item, i) => {
      // Create a unique permalink per prompt using a stable hash of the prompt text
      // This prevents all Gemini posts from sharing the same original_source and being skipped as duplicates
      const promptHash = Buffer.from((item.prompt || '').slice(0, 200)).toString('base64').slice(0, 32);
      return {
        id:              `gemini_${Date.now()}_${i}`,
        title:           item.prompt?.slice(0, 120) || `Generated prompt ${i + 1}`,
        body:            item.prompt || '',
        score:           1000,
        subreddit:       'gemini',
        author:          'gemini-ai',
        permalink:       `gemini://auto-pipeline/${promptHash}`,  // unique per prompt
        imageUrl:        null,          // no existing image — HF will generate one
        _existingPrompt: item.prompt,
        // Pre-computed enhancement (no need for second Gemini call)
        _enhancement: {
          enhanced_prompt:   item.prompt,
          category:          item.category    || 'Abstract',
          tags:              item.tags         || ['ai-art', 'generated'],
          editorial_summary: item.editorial_summary || '',
          editorial_notes:   item.editorial_notes   || '',
          editorial_tips:    item.editorial_tips     || '',
        },
      };
    });
  } catch (err) {
    console.warn(`  ⚠️  Gemini prompt generation failed: ${err.message}`);
    return [];
  }
}


// ─────────────────────────────────────────────────────────────────────────────
// 4.  REDDIT  —  activated when OAuth credentials are available
// ─────────────────────────────────────────────────────────────────────────────
async function getRedditToken() {
  if (!REDDIT_CLIENT_ID || !REDDIT_CLIENT_SECRET) return null;
  try {
    const encoded = Buffer.from(`${REDDIT_CLIENT_ID}:${REDDIT_CLIENT_SECRET}`).toString('base64');
    const res = await fetch('https://www.reddit.com/api/v1/access_token', {
      method: 'POST',
      headers: {
        'Authorization':  `Basic ${encoded}`,
        'Content-Type':   'application/x-www-form-urlencoded',
        'User-Agent':     'ProGall-AutoPipeline/2.0 (by /u/rasaljaman)',
      },
      body: `grant_type=password&username=${encodeURIComponent(REDDIT_USERNAME)}&password=${encodeURIComponent(REDDIT_PASSWORD)}`,
    });
    if (!res.ok) { console.warn(`  ⚠️  Reddit OAuth failed (${res.status})`); return null; }
    const json = await res.json();
    return json.access_token || null;
  } catch (err) {
    console.warn(`  ⚠️  Reddit OAuth error: ${err.message}`);
    return null;
  }
}

async function fetchRedditPosts(token) {
  if (!token) return [];
  const posts = [];
  for (const sub of REDDIT_SUBREDDITS) {
    try {
      const res = await fetch(
        `https://oauth.reddit.com/r/${sub}/hot?limit=15&t=week`,
        { headers: { 'Authorization': `Bearer ${token}`, 'User-Agent': 'ProGall-AutoPipeline/2.0' } }
      );
      if (!res.ok) { console.warn(`  ⚠️  r/${sub}: ${res.status}`); continue; }
      const json     = await res.json();
      const children = json?.data?.children || [];
      const filtered = children
        .map(c => c.data)
        .filter(p => !p.stickied && (p.score || 0) >= MIN_SCORE && hasImageUrl(p))
        .map(p => ({
          id:        p.id,
          title:     p.title,
          body:      p.selftext || '',
          score:     p.score,
          subreddit: p.subreddit,
          author:    p.author,
          permalink: `https://reddit.com${p.permalink}`,
          imageUrl:  extractRedditImage(p),
        }));
      posts.push(...filtered);
      console.log(`  r/${sub}: ${filtered.length} posts`);
      await sleep(600);
    } catch (err) { console.warn(`  ⚠️  r/${sub}: ${err.message}`); }
  }
  return posts;
}

function hasImageUrl(p) {
  return !!(
    (p.url && p.url.match(/\.(jpg|jpeg|png|webp)(\?|$)/i)) ||
    p.preview?.images?.[0]?.source?.url ||
    p.thumbnail?.startsWith('http')
  );
}

function extractRedditImage(p) {
  if (p.url && p.url.match(/\.(jpg|jpeg|png|webp)(\?|$)/i)) return p.url;
  const prev = p.preview?.images?.[0]?.source?.url;
  if (prev) return prev.replace(/&amp;/g, '&');
  if (p.thumbnail?.startsWith('http')) return p.thumbnail;
  return null;
}

// ─────────────────────────────────────────────────────────────────────────────
// 5.  GEMINI  —  enrich prompt + categorise
// ─────────────────────────────────────────────────────────────────────────────
async function enhanceWithGemini(post) {
  if (!GEMINI_API_KEY) {
    console.warn('  ⚠️  No Gemini key — using raw prompt');
    return fallbackEnhancement(post);
  }

  const isCivitai = post.subreddit === 'civitai';
  const rawPrompt = post._existingPrompt || [post.title, post.body].filter(Boolean).join('\n');

  const userMsg = isCivitai
    ? `You are an expert AI art curator for a gallery website called ProGall.

Given this existing AI art prompt from Civitai.com, return ONLY valid JSON (no markdown, no code fences):

{
  "enhanced_prompt": "Keep the core prompt but make it richer and more vivid. Add lighting, mood, and technical quality descriptors. 2-3 sentences max.",
  "category": "one of: Photorealistic, Fantasy, Anime, Cyberpunk, Portrait, Abstract, Landscape, Architecture, Sci-Fi, 3D Render",
  "tags": ["tag1", "tag2", "tag3", "tag4", "tag5"],
  "editorial_summary": "One sentence about what makes this image visually compelling",
  "editorial_notes": "One paragraph about the artistic style and technique",
  "editorial_tips": "One practical tip for someone who wants to remix this prompt"
}

Original Civitai prompt: ${rawPrompt.slice(0, 800)}`
    : `You are an expert AI art prompt engineer for a gallery website called ProGall.

Given this Reddit AI art post, extract and enhance the image prompt. Return ONLY valid JSON:

{
  "enhanced_prompt": "A detailed, vivid image generation prompt. 2-3 sentences with subject, style, lighting, mood, technical quality.",
  "category": "one of: Photorealistic, Fantasy, Anime, Cyberpunk, Portrait, Abstract, Landscape, Architecture, Sci-Fi, 3D Render",
  "tags": ["tag1", "tag2", "tag3", "tag4", "tag5"],
  "editorial_summary": "One sentence describing what makes this image special",
  "editorial_notes": "One paragraph about the artistic technique",
  "editorial_tips": "One practical tip for remixing this prompt"
}

Title: ${post.title}
Body: ${(post.body || '').slice(0, 600)}`;

  try {
    const res = await fetch(GEMINI_ENDPOINT, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        contents: [{ role: 'user', parts: [{ text: userMsg }] }],
        generationConfig: {
          temperature: 0.7,
          maxOutputTokens: 2000,
          responseMimeType: 'application/json',
        },
      }),
    });

    if (!res.ok) {
      const t = await res.text();
      throw new Error(`Gemini ${res.status}: ${t.slice(0, 150)}`);
    }

    const json = await res.json();
    const text = json?.candidates?.[0]?.content?.parts?.[0]?.text || '';
    const parsed  = extractJson(text, false);

    return {
      enhanced_prompt:   parsed.enhanced_prompt   || rawPrompt.slice(0, 300),
      category:          parsed.category          || 'Abstract',
      tags:              Array.isArray(parsed.tags) ? parsed.tags.slice(0, 8) : [],
      editorial_summary: parsed.editorial_summary || '',
      editorial_notes:   parsed.editorial_notes   || '',
      editorial_tips:    parsed.editorial_tips     || '',
    };
  } catch (err) {
    console.warn(`  ⚠️  Gemini failed: ${err.message}`);
    return fallbackEnhancement(post);
  }
}

function fallbackEnhancement(post) {
  const prompt = post._existingPrompt || post.title;
  // Auto-detect category from prompt keywords
  const lower = prompt.toLowerCase();
  const category =
    lower.match(/cyber|neon|futur|sci.fi|robot/) ? 'Cyberpunk' :
    lower.match(/anime|manga|ghibli/) ? 'Anime' :
    lower.match(/portrait|face|eyes|person|woman|man/) ? 'Portrait' :
    lower.match(/landscape|mountain|forest|ocean|sky/) ? 'Landscape' :
    lower.match(/fantasy|dragon|magic|wizard|elf/) ? 'Fantasy' :
    lower.match(/abstract|fluid|surreal|dream/) ? 'Abstract' : 'Photorealistic';
  return {
    enhanced_prompt:   prompt,
    category,
    tags:              ['ai-art', 'generated', post.subreddit],
    editorial_summary: '',
    editorial_notes:   '',
    editorial_tips:    '',
  };
}

// ─────────────────────────────────────────────────────────────────────────────
// 6.  IMAGE ACQUISITION  —  download from Lexica OR generate with HuggingFace
// ─────────────────────────────────────────────────────────────────────────────

/** Download an image from a URL and return as Buffer */
async function downloadImage(url) {
  const res = await fetch(url, { headers: { 'User-Agent': 'ProGall-AutoPipeline/2.0' } });
  if (!res.ok) throw new Error(`Download failed: HTTP ${res.status} for ${url}`);
  const ab = await res.arrayBuffer();
  return Buffer.from(ab);
}

/** Generate image using HuggingFace Inference API with Pollinations.ai fallback */
async function generateImageHF(prompt, modelIndex = 0) {
  // Try HuggingFace first
  if (modelIndex < HF_MODELS.length) {
    const model = HF_MODELS[modelIndex];
    console.log(`  🎨  HF generating with ${model}...`);
    try {
      const res = await fetch(`https://api-inference.huggingface.co/models/${model}`, {
        method: 'POST',
        headers: {
          'Authorization':    `Bearer ${HF_TOKEN}`,
          'Content-Type':     'application/json',
          'x-wait-for-model': 'true',
        },
        body: JSON.stringify({
          inputs: prompt,
          parameters: { width: 1024, height: 1024, num_inference_steps: 4, guidance_scale: 0 },
        }),
      });

      if (res.status === 503 || res.status === 429) {
        console.warn(`  ⚠️  ${model} unavailable — trying next`);
        return generateImageHF(prompt, modelIndex + 1);
      }
      if (!res.ok) {
        const t = await res.text();
        if (t.includes('loading')) return generateImageHF(prompt, modelIndex + 1);
        throw new Error(`HF ${res.status}: ${t.slice(0, 200)}`);
      }
      const ct = res.headers.get('content-type') || '';
      if (!ct.startsWith('image/')) throw new Error(`HF returned non-image: ${ct}`);
      return Buffer.from(await res.arrayBuffer());
    } catch (err) {
      if (err.message.includes('fetch failed') || err.message.includes('network')) {
        console.warn(`  ⚠️  HF network error (${model}) — trying next model or Pollinations.ai fallback`);
        return generateImageHF(prompt, modelIndex + 1);
      }
      throw err;
    }
  }

  // Fallback: Pollinations.ai — completely free, no auth, works everywhere
  console.log(`  🌸  Using Pollinations.ai (free fallback)...`);
  const encodedPrompt = encodeURIComponent(prompt.slice(0, 500)); // URL length limit
  const seed = Math.floor(Math.random() * 1000000);
  const url = `https://image.pollinations.ai/prompt/${encodedPrompt}?width=1024&height=1024&nologo=true&seed=${seed}&model=flux`;

  const res = await fetch(url, {
    headers: { 'User-Agent': 'ProGall-AutoPipeline/2.0' },
    signal: AbortSignal.timeout(60000), // 60-second timeout
  });

  if (!res.ok) throw new Error(`Pollinations.ai ${res.status}: ${await res.text().catch(() => '')}`);
  const ct = res.headers.get('content-type') || '';
  if (!ct.startsWith('image/')) throw new Error(`Pollinations returned non-image: ${ct}`);

  console.log(`  ✅  Pollinations.ai generated image`);
  return Buffer.from(await res.arrayBuffer());
}

// ─────────────────────────────────────────────────────────────────────────────
// 7.  SUPABASE  —  upload + insert
// ─────────────────────────────────────────────────────────────────────────────
async function uploadAndInsert(supabase, post, buffer, enhancement) {
  const ext         = 'jpg';
  const filename    = `auto-pipeline/${post.id}-${Date.now()}.${ext}`;
  const contentType = 'image/jpeg';

  console.log(`  📤  Uploading: prompt-images/${filename}`);
  const { error: uploadErr } = await supabase.storage
    .from('prompt-images')
    .upload(filename, buffer, { contentType, upsert: false });

  if (uploadErr) throw new Error(`Upload failed: ${uploadErr.message}`);

  const { data: { publicUrl } } = supabase.storage
    .from('prompt-images')
    .getPublicUrl(filename);

  console.log(`  🔗  ${publicUrl}`);

  const row = {
    url:             publicUrl,
    thumbnail:       publicUrl,
    prompt:          enhancement.enhanced_prompt,
    category:        enhancement.category,
    tags:            enhancement.tags,
    width:           1024,
    height:          1024,
    status:          'pending',
    source:          post.subreddit,   // 'gemini', 'reddit', etc.
    original_source: post.permalink,
  };

  const { error: dbErr } = await supabase.from('images').insert(row);
  if (dbErr) throw new Error(`DB insert failed: ${dbErr.message}`);

  console.log(`  ✅  Inserted into gallery`);
  return publicUrl;
}

// ─────────────────────────────────────────────────────────────────────────────
// 8.  DUPLICATE CHECK
// ─────────────────────────────────────────────────────────────────────────────
async function isAlreadyIngested(supabase, permalink) {
  const { data } = await supabase
    .from('images').select('id').eq('original_source', permalink).limit(1);
  return data && data.length > 0;
}

// ─────────────────────────────────────────────────────────────────────────────
// 9.  MAIN
// ─────────────────────────────────────────────────────────────────────────────
async function main() {
  if (!SUPABASE_URL || (!SUPABASE_SERVICE_KEY && !DRY_RUN)) {
    console.error('❌  SUPABASE_URL and SUPABASE_SERVICE_KEY are required');
    process.exit(1);
  }

  const supabase = DRY_RUN ? null : createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY);
  let allPosts   = [];

  // ── Source 1: Gemini-generated prompts (always works, uses your existing Gemini key) ──
  console.log('\n✨   Step 1: Generating AI art prompts with Gemini...');
  try {
    const geminiPosts = await generateGeminiPrompts(MAX_POSTS);
    console.log(`  ✅  Gemini: ${geminiPosts.length} prompts generated`);
    allPosts.push(...geminiPosts);
  } catch (err) {
    console.warn(`  ⚠️  Gemini prompts failed: ${err.message}`);
  }

  // ── Source 2: Reddit (when credentials are set) ───────────────────────────
  if (hasReddit) {
    console.log('\n📡  Step 1b: Fetching from Reddit (credentials found)...');
    try {
      const token       = await getRedditToken();
      const redditPosts = token ? await fetchRedditPosts(token) : [];
      console.log(`  ✅  Reddit: ${redditPosts.length} posts found`);
      allPosts.push(...redditPosts);
    } catch (err) {
      console.warn(`  ⚠️  Reddit failed: ${err.message}`);
    }
  } else {
    console.log('\n📡  Reddit: waiting for API approval — will auto-activate when creds are added to GitHub Secrets');
  }

  // ── Select top N ──────────────────────────────────────────────────────────
  // Deduplicate by ID
  const seen    = new Set();
  const unique  = allPosts.filter(p => { if (seen.has(p.id)) return false; seen.add(p.id); return true; });
  // Shuffle for variety
  const shuffled = unique.sort(() => Math.random() - 0.5);
  // Gemini posts have no imageUrl (generated by HF), Reddit/Civitai have real imageUrls
  const selected = shuffled.slice(0, MAX_POSTS);

  console.log(`\n  📊  Generated/found: ${unique.length} → Selected: ${selected.length}`);

  if (selected.length === 0) {
    console.log('  No prompts generated. Check GEMINI_API_KEY is set.');
    process.exit(0);
  }

  // ── Process each post ─────────────────────────────────────────────────────
  console.log('\n🔄  Processing...\n');
  let successCount = 0, skipCount = 0;

  for (let i = 0; i < selected.length; i++) {
    const post = selected[i];
    console.log(`─────────────────────────────────────────────────────`);
    console.log(`[${i + 1}/${selected.length}] ${post.subreddit.toUpperCase()}`);
    console.log(`  Prompt: ${post.title.slice(0, 90)}...`);

    try {
      // Skip duplicates
      if (!DRY_RUN) {
        if (await isAlreadyIngested(supabase, post.permalink)) {
          console.log('  ⏭️  Already in gallery — skipping');
          skipCount++;
          continue;
        }
      }

      // Use pre-computed enhancement (Gemini prompts) OR call Gemini to enhance (Reddit posts)
      let enhancement;
      if (post._enhancement) {
        enhancement = post._enhancement; // already computed during prompt generation
        console.log(`  ✅  Category: ${enhancement.category} (pre-computed)`);
      } else {
        console.log('  🧠  Gemini: enhancing prompt...');
        enhancement = await enhanceWithGemini(post);
        console.log(`  ✅  Category: ${enhancement.category}`);
      }

      if (DRY_RUN) {
        console.log('  🟡  [DRY RUN] Would process and insert:');
        console.log(JSON.stringify({
          source:   post.subreddit,
          prompt:   enhancement.enhanced_prompt.slice(0, 80) + '...',
          category: enhancement.category,
          tags:     enhancement.tags,
          imageUrl: post.imageUrl,
        }, null, 2));
        successCount++;
        continue;
      }

      // Get image buffer — always use HuggingFace for Gemini-sourced prompts
      let imageBuffer;
      if (post.imageUrl) {
        // Has existing image (Reddit) — download it
        console.log('  📥  Downloading source image...');
        imageBuffer = await downloadImage(post.imageUrl);
        console.log(`  ✅  Downloaded: ${(imageBuffer.length / 1024).toFixed(0)} KB`);
      } else {
        // Gemini-generated prompt — generate image with HuggingFace FLUX.1
        console.log('  🎨  Generating image with HuggingFace FLUX.1-schnell...');
        imageBuffer = await generateImageHF(enhancement.enhanced_prompt);
        console.log(`  ✅  Generated: ${(imageBuffer.length / 1024).toFixed(0)} KB`);
      }

      // Upload + insert
      const url = await uploadAndInsert(supabase, post, imageBuffer, enhancement);
      console.log(`  🎉  Live at: ${url}`);
      successCount++;

      if (i < selected.length - 1) await sleep(2000);

    } catch (err) {
      console.error(`  ❌  Failed: ${err.message}`);
    }
  }

  // ── Summary ───────────────────────────────────────────────────────────────
  console.log('\n╔══════════════════════════════════════════════════════╗');
  console.log('║                    Run Summary                       ║');
  console.log('╠══════════════════════════════════════════════════════╣');
  console.log(`║  Source    : ${String(hasReddit ? 'Gemini + Reddit' : 'Gemini (Reddit pending)').padEnd(38)}║`);
  console.log(`║  Selected  : ${String(selected.length).padEnd(38)}║`);
  console.log(`║  Succeeded : ${String(successCount).padEnd(38)}║`);
  console.log(`║  Skipped   : ${String(skipCount).padEnd(38)}║`);
  console.log(`║  Failed    : ${String(selected.length - successCount - skipCount).padEnd(38)}║`);
  console.log(`║  Mode      : ${String(DRY_RUN ? 'DRY RUN' : 'LIVE').padEnd(38)}║`);
  console.log('╚══════════════════════════════════════════════════════╝');
}

// ─────────────────────────────────────────────────────────────────────────────
// UTILITIES
// ─────────────────────────────────────────────────────────────────────────────
function sleep(ms) { return new Promise(r => setTimeout(r, ms)); }

function extractJson(text, isArray = false) {
  const startChar = isArray ? '[' : '{';
  const endChar = isArray ? ']' : '}';
  const start = text.indexOf(startChar);
  const end = text.lastIndexOf(endChar);
  if (start === -1 || end === -1 || end < start) {
    throw new Error(`Could not find JSON ${isArray ? 'array' : 'object'} in response: "${text.slice(0, 100)}..."`);
  }
  const jsonText = text.slice(start, end + 1);
  return JSON.parse(jsonText);
}

main().catch(err => { console.error('\n💥 Fatal:', err); process.exit(1); });
