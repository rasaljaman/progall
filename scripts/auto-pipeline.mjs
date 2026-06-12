/**
 * ProGall Auto-Pipeline
 * =====================
 * Discovers trending AI art prompt posts from Reddit,
 * enhances them with Gemini 2.0 Flash, generates a real image
 * using HuggingFace FLUX.1-schnell (free), then uploads
 * everything into the main Supabase `images` table.
 *
 * Usage:
 *   node scripts/auto-pipeline.mjs
 *   DRY_RUN=true node scripts/auto-pipeline.mjs
 *
 * Required environment variables:
 *   REDDIT_CLIENT_ID       — Reddit OAuth app client ID
 *   REDDIT_CLIENT_SECRET   — Reddit OAuth app client secret
 *   REDDIT_USERNAME        — Your Reddit account username
 *   REDDIT_PASSWORD        — Your Reddit account password
 *   GEMINI_API_KEY         — Google AI Studio / VITE_GEMINI_API_KEY
 *   HF_TOKEN               — HuggingFace user access token
 *   SUPABASE_URL           — Supabase project URL
 *   SUPABASE_SERVICE_KEY   — Supabase service role key
 */

import fs from 'node:fs';
import path from 'node:path';
import { createClient } from '@supabase/supabase-js';

// ─────────────────────────────────────────────────────────────────────────────
// 0.  LOAD .env (for local development)
// ─────────────────────────────────────────────────────────────────────────────
const envPath = path.resolve(process.cwd(), '.env');
if (fs.existsSync(envPath)) {
  const content = fs.readFileSync(envPath, 'utf8');
  content.split(/\r?\n/).forEach(line => {
    const match = line.match(/^\s*([\w.-]+)\s*=\s*(.*)?$/);
    if (match) {
      const key = match[1];
      let value = (match[2] || '').trim();
      if ((value.startsWith('"') && value.endsWith('"')) ||
          (value.startsWith("'") && value.endsWith("'"))) {
        value = value.slice(1, -1);
      }
      if (!process.env[key]) process.env[key] = value;
    }
  });
}

// ─────────────────────────────────────────────────────────────────────────────
// 1.  CONFIGURATION
// ─────────────────────────────────────────────────────────────────────────────
const DRY_RUN   = process.env.DRY_RUN === 'true';
const MAX_POSTS = parseInt(process.env.MAX_POSTS || '8', 10);   // posts per run
const MIN_SCORE = parseInt(process.env.MIN_SCORE || '30', 10);  // minimum upvotes

const REDDIT_CLIENT_ID     = process.env.REDDIT_CLIENT_ID     || '';
const REDDIT_CLIENT_SECRET = process.env.REDDIT_CLIENT_SECRET || '';
const REDDIT_USERNAME      = process.env.REDDIT_USERNAME      || '';
const REDDIT_PASSWORD      = process.env.REDDIT_PASSWORD      || '';

const GEMINI_API_KEY = process.env.GEMINI_API_KEY
                    || process.env.VITE_GEMINI_API_KEY
                    || '';

const HF_TOKEN = process.env.HF_TOKEN
              || process.env.VITE_HF_TOKEN
              || '';

const SUPABASE_URL         = process.env.SUPABASE_URL         || process.env.VITE_SUPABASE_URL || '';
const SUPABASE_SERVICE_KEY = process.env.SUPABASE_SERVICE_KEY || '';

// Subreddits to harvest from — all public, rich in quality AI art prompts
const TARGET_SUBREDDITS = [
  'AIArt',
  'StableDiffusion',
  'midjourney',
  'dalle',
  'FluxAI',
];

// HuggingFace model priority list (best free models, fastest first)
const HF_MODELS = [
  'black-forest-labs/FLUX.1-schnell',          // SOTA, fastest
  'stabilityai/stable-diffusion-xl-base-1.0',  // reliable fallback
  'runwayml/stable-diffusion-v1-5',            // last resort
];

// Gemini endpoint
const GEMINI_ENDPOINT =
  `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${GEMINI_API_KEY}`;

// ─────────────────────────────────────────────────────────────────────────────
// 2.  BANNER
// ─────────────────────────────────────────────────────────────────────────────
console.log('╔══════════════════════════════════════════════════════╗');
console.log('║      ProGall Auto-Pipeline — Reddit → AI → Gallery  ║');
console.log('╚══════════════════════════════════════════════════════╝');
console.log(`Mode        : ${DRY_RUN ? '🟡 DRY RUN (no writes)' : '🟢 LIVE'}`);
console.log(`Max posts   : ${MAX_POSTS}`);
console.log(`Min score   : ${MIN_SCORE}`);
console.log(`Gemini key  : ${GEMINI_API_KEY ? '✅' : '❌ missing'}`);
console.log(`HF token    : ${HF_TOKEN ? '✅' : '❌ missing'}`);
console.log(`Reddit creds: ${REDDIT_CLIENT_ID ? '✅' : '⚠️  missing — using public JSON API'}`);
console.log(`Supabase    : ${SUPABASE_URL ? '✅' : '❌ missing'}`);
console.log('');

// ─────────────────────────────────────────────────────────────────────────────
// 3.  REDDIT  —  fetch trending posts
//     We use the unauthenticated Reddit JSON API (/r/sub/hot.json) which
//     requires NO credentials and gives 100 req/min for personal use.
//     If Reddit OAuth creds are provided we authenticate for a better limit.
// ─────────────────────────────────────────────────────────────────────────────

/** Returns an OAuth Bearer token if credentials are available */
async function getRedditToken() {
  if (!REDDIT_CLIENT_ID || !REDDIT_CLIENT_SECRET) return null;

  const encoded = Buffer.from(`${REDDIT_CLIENT_ID}:${REDDIT_CLIENT_SECRET}`).toString('base64');
  const res = await fetch('https://www.reddit.com/api/v1/access_token', {
    method: 'POST',
    headers: {
      'Authorization': `Basic ${encoded}`,
      'Content-Type': 'application/x-www-form-urlencoded',
      'User-Agent': 'ProGall-AutoPipeline/1.0 (by /u/progall_bot)',
    },
    body: `grant_type=password&username=${encodeURIComponent(REDDIT_USERNAME)}&password=${encodeURIComponent(REDDIT_PASSWORD)}`,
  });

  if (!res.ok) {
    console.warn(`⚠️  Reddit OAuth failed (${res.status}) — falling back to public API`);
    return null;
  }

  const json = await res.json();
  return json.access_token || null;
}

/** Fetch "hot" posts from one subreddit, return only image posts */
async function fetchSubredditPosts(subreddit, token, limit = 25) {
  if (!token) {
    // Reddit now requires OAuth for all API access (403 on public JSON)
    console.warn(`  ⚠️  r/${subreddit}: No Reddit OAuth token — skipping (set REDDIT_CLIENT_ID/SECRET)`);
    return [];
  }

  const url = `https://oauth.reddit.com/r/${subreddit}/hot?limit=${limit}&t=week`;
  const headers = {
    'User-Agent': 'ProGall-AutoPipeline/1.0 (by /u/progall_bot)',
    'Authorization': `Bearer ${token}`,
  };

  const res = await fetch(url, { headers });
  if (!res.ok) {
    console.warn(`⚠️  r/${subreddit}: HTTP ${res.status} — skipping`);
    return [];
  }

  const json = await res.json();
  const children = json?.data?.children || [];

  return children
    .map(c => c.data)
    .filter(p => {
      // Must have an image preview or direct image link
      const hasImage = p.url && (
        p.url.match(/\.(jpg|jpeg|png|webp|gif)(\?|$)/i) ||
        p.preview?.images?.[0]?.source?.url ||
        p.thumbnail?.startsWith('http')
      );
      // Must meet minimum score
      const goodScore = (p.score || 0) >= MIN_SCORE;
      // Must not be a pinned announcement
      const notStickied = !p.stickied;
      // Must have some text body or meaningful title for prompt extraction
      const hasContent = (p.selftext && p.selftext.length > 20) || p.title.length > 15;

      return hasImage && goodScore && notStickied && hasContent;
    })
    .map(p => ({
      id: p.id,
      title: p.title,
      body: p.selftext || '',
      score: p.score,
      subreddit: p.subreddit,
      author: p.author,
      permalink: `https://reddit.com${p.permalink}`,
      imageUrl: extractBestImageUrl(p),
    }));
}

/** Extract the highest-quality image URL from a Reddit post */
function extractBestImageUrl(post) {
  // 1. Direct image link
  if (post.url && post.url.match(/\.(jpg|jpeg|png|webp)(\?|$)/i)) {
    return post.url;
  }
  // 2. Preview image (Reddit CDN) — decode HTML entities
  const preview = post.preview?.images?.[0]?.source?.url;
  if (preview) {
    return preview.replace(/&amp;/g, '&');
  }
  // 3. Fallback to thumbnail
  if (post.thumbnail?.startsWith('http')) {
    return post.thumbnail;
  }
  return null;
}

/** Deduplicate posts by ID across subreddits */
function deduplicatePosts(allPosts) {
  const seen = new Set();
  return allPosts.filter(p => {
    if (seen.has(p.id)) return false;
    seen.add(p.id);
    return true;
  });
}

/** Sort by score descending, take top N */
function selectTopPosts(posts, n) {
  return posts
    .filter(p => p.imageUrl)    // only posts with an image
    .sort((a, b) => b.score - a.score)
    .slice(0, n);
}

// ─────────────────────────────────────────────────────────────────────────────
// 4.  GEMINI  —  enhance the prompt + categorise
// ─────────────────────────────────────────────────────────────────────────────
async function enhanceWithGemini(post) {
  if (!GEMINI_API_KEY) {
    console.warn('  ⚠️  No Gemini key — using raw title as prompt');
    return buildFallbackEnhancement(post);
  }

  const rawText = [post.title, post.body].filter(Boolean).join('\n').slice(0, 1500);

  const systemPrompt = `You are an expert AI art prompt engineer for a gallery website called ProGall.

Given a raw Reddit post about AI art, extract and enhance the image prompt, then return ONLY valid JSON with this exact structure (no markdown, no code fences, just raw JSON):

{
  "enhanced_prompt": "A detailed, vivid image generation prompt (2-4 sentences, describing subject, style, lighting, mood, technical quality terms like 4K, cinematic, hyperrealistic)",
  "category": "one of: Photorealistic, Fantasy, Anime, Cyberpunk, Portrait, Abstract, Landscape, Architecture, Sci-Fi, 3D Render",
  "tags": ["tag1", "tag2", "tag3", "tag4", "tag5"],
  "editorial_summary": "One sentence describing what makes this image special",
  "editorial_notes": "One paragraph explaining the artistic technique and why this prompt works well",
  "editorial_tips": "One practical tip for remixing or building on this prompt"
}

The enhanced_prompt MUST be something you could directly paste into FLUX.1 or Stable Diffusion to generate a great image.`;

  const body = {
    contents: [
      { role: 'user', parts: [{ text: `${systemPrompt}\n\nReddit post:\nTitle: ${post.title}\nBody: ${post.body || '(no body)'}\nSubreddit: r/${post.subreddit}` }] }
    ],
    generationConfig: { temperature: 0.7, maxOutputTokens: 600 },
  };

  try {
    const res = await fetch(GEMINI_ENDPOINT, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    });

    if (!res.ok) {
      const errText = await res.text();
      throw new Error(`Gemini API ${res.status}: ${errText.slice(0, 200)}`);
    }

    const json = await res.json();
    const text = json?.candidates?.[0]?.content?.parts?.[0]?.text || '';

    // Strip any accidental markdown fences
    const cleaned = text.replace(/^```json?\s*/i, '').replace(/\s*```$/i, '').trim();
    const parsed = JSON.parse(cleaned);

    return {
      enhanced_prompt:   parsed.enhanced_prompt   || post.title,
      category:          parsed.category          || 'Abstract',
      tags:              Array.isArray(parsed.tags) ? parsed.tags.slice(0, 8) : [],
      editorial_summary: parsed.editorial_summary || '',
      editorial_notes:   parsed.editorial_notes   || '',
      editorial_tips:    parsed.editorial_tips     || '',
    };
  } catch (err) {
    console.warn(`  ⚠️  Gemini enhancement failed: ${err.message}`);
    return buildFallbackEnhancement(post);
  }
}

function buildFallbackEnhancement(post) {
  return {
    enhanced_prompt:   post.title,
    category:          'Abstract',
    tags:              ['ai-art', 'generated', post.subreddit.toLowerCase()],
    editorial_summary: `From r/${post.subreddit} — score ${post.score}`,
    editorial_notes:   '',
    editorial_tips:    '',
  };
}

// ─────────────────────────────────────────────────────────────────────────────
// 5.  HUGGING FACE  —  generate the image
// ─────────────────────────────────────────────────────────────────────────────
async function generateImageHF(prompt, modelIndex = 0) {
  if (modelIndex >= HF_MODELS.length) {
    throw new Error('All HuggingFace models failed');
  }

  const model = HF_MODELS[modelIndex];
  console.log(`  🎨  Generating with ${model}...`);

  const res = await fetch(`https://api-inference.huggingface.co/models/${model}`, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${HF_TOKEN}`,
      'Content-Type': 'application/json',
      'x-wait-for-model': 'true',   // wait for cold-start instead of 503
    },
    body: JSON.stringify({
      inputs: prompt,
      parameters: {
        width: 1024,
        height: 1024,
        num_inference_steps: 4,    // FLUX.1-schnell is fast at 4 steps
        guidance_scale: 0,          // schnell is guidance-free
      },
    }),
  });

  // HF returns 503 when model is loading — retry with next model
  if (res.status === 503) {
    console.warn(`  ⚠️  ${model} is loading/unavailable — trying next model`);
    return generateImageHF(prompt, modelIndex + 1);
  }

  if (!res.ok) {
    const errText = await res.text();
    // If rate-limited, retry next model
    if (res.status === 429) {
      console.warn(`  ⚠️  ${model} rate limited — trying next model`);
      return generateImageHF(prompt, modelIndex + 1);
    }
    throw new Error(`HF API ${res.status}: ${errText.slice(0, 300)}`);
  }

  const contentType = res.headers.get('content-type') || '';
  if (!contentType.startsWith('image/')) {
    const text = await res.text();
    // If model is still loading, wait and retry
    if (text.includes('loading') || text.includes('currently loading')) {
      console.warn(`  ⚠️  ${model} still loading — trying next model`);
      return generateImageHF(prompt, modelIndex + 1);
    }
    throw new Error(`Unexpected HF response (${contentType}): ${text.slice(0, 200)}`);
  }

  const arrayBuffer = await res.arrayBuffer();
  const buffer = Buffer.from(arrayBuffer);
  console.log(`  ✅  Generated image: ${(buffer.length / 1024).toFixed(0)} KB`);
  return buffer;
}

// ─────────────────────────────────────────────────────────────────────────────
// 6.  SUPABASE  —  upload image + insert row
// ─────────────────────────────────────────────────────────────────────────────
async function uploadAndInsert(supabase, postId, buffer, enhancement, post) {
  const filename = `auto-pipeline/${postId}-${Date.now()}.webp`;

  // Upload to Supabase Storage (bucket: prompt-images)
  console.log(`  📤  Uploading to Storage: prompt-images/${filename}`);
  const { error: uploadErr } = await supabase.storage
    .from('prompt-images')
    .upload(filename, buffer, {
      contentType: 'image/webp',
      upsert: false,
    });

  if (uploadErr) throw new Error(`Storage upload failed: ${uploadErr.message}`);

  const { data: { publicUrl } } = supabase.storage
    .from('prompt-images')
    .getPublicUrl(filename);

  console.log(`  🔗  Public URL: ${publicUrl}`);

  // Insert into images table
  const row = {
    url:             publicUrl,
    thumbnail:       publicUrl,
    prompt:          enhancement.enhanced_prompt,
    category:        enhancement.category,
    tags:            enhancement.tags,
    width:           1024,
    height:          1024,
    status:          'active',
    source:          'reddit',
    original_source: post.permalink,
  };

  console.log(`  💾  Inserting row into images table...`);
  const { error: dbErr } = await supabase.from('images').insert(row);
  if (dbErr) throw new Error(`DB insert failed: ${dbErr.message}`);

  console.log(`  ✅  Row inserted successfully`);
  return publicUrl;
}

// ─────────────────────────────────────────────────────────────────────────────
// 7.  CHECK DUPLICATE  —  skip posts already in DB
// ─────────────────────────────────────────────────────────────────────────────
async function isAlreadyIngested(supabase, permalink) {
  const { data } = await supabase
    .from('images')
    .select('id')
    .eq('original_source', permalink)
    .limit(1);
  return data && data.length > 0;
}

// ─────────────────────────────────────────────────────────────────────────────
// 8.  MAIN ORCHESTRATOR
// ─────────────────────────────────────────────────────────────────────────────
async function main() {
  // Validate required env vars
  if (!GEMINI_API_KEY) console.warn('⚠️  GEMINI_API_KEY not set — prompts will NOT be enhanced');
  if (!HF_TOKEN && !DRY_RUN) {
    console.error('❌  HF_TOKEN is required for image generation');
    process.exit(1);
  }
  if (!SUPABASE_URL || (!SUPABASE_SERVICE_KEY && !DRY_RUN)) {
    console.error('❌  SUPABASE_URL and SUPABASE_SERVICE_KEY are required');
    process.exit(1);
  }

  const supabase = DRY_RUN ? null : createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY);

  // ── Step 1: Discover Reddit posts ─────────────────────────────────────────
  console.log('\n📡  Step 1: Discovering trending posts from Reddit...');
  const token = await getRedditToken();
  if (token) console.log('  🔑  Using authenticated Reddit OAuth');
  else        console.log('  ⚠️  No Reddit credentials — will use mock data in DRY_RUN mode');

  let allPosts = [];

  if (!token && DRY_RUN) {
    // Provide mock posts so the full pipeline can be tested locally
    console.log('  🧪  Using mock Reddit posts for dry-run test...');
    allPosts = getMockPosts();
  } else {
    for (const sub of TARGET_SUBREDDITS) {
      try {
        const posts = await fetchSubredditPosts(sub, token, 15);
        console.log(`  r/${sub}: found ${posts.length} qualifying posts`);
        allPosts.push(...posts);
        // Small delay to respect rate limits
        await sleep(600);
      } catch (err) {
        console.warn(`  ⚠️  r/${sub} failed: ${err.message}`);
      }
    }
  }

  const unique   = deduplicatePosts(allPosts);
  const selected = selectTopPosts(unique, MAX_POSTS);
  console.log(`\n  📊  Total unique: ${unique.length} → Selected top: ${selected.length}`);

  if (selected.length === 0) {
    if (!token) {
      console.log('\n  ❗ No Reddit credentials found.');
      console.log('  Add REDDIT_CLIENT_ID and REDDIT_CLIENT_SECRET as GitHub Secrets.');
      console.log('  See: https://www.reddit.com/prefs/apps');
    }
    console.log('  No posts found matching criteria. Exiting.');
    process.exit(0);
  }

  // ── Steps 2-5: Process each post ─────────────────────────────────────────
  console.log('\n🔄  Processing posts...\n');
  let successCount = 0;
  let skipCount    = 0;

  for (let i = 0; i < selected.length; i++) {
    const post = selected[i];
    console.log(`─────────────────────────────────────────────────────`);
    console.log(`[${i + 1}/${selected.length}] r/${post.subreddit} | score:${post.score}`);
    console.log(`  Title: ${post.title.slice(0, 80)}...`);

    try {
      // Skip duplicates (already in DB)
      if (!DRY_RUN) {
        const alreadyIn = await isAlreadyIngested(supabase, post.permalink);
        if (alreadyIn) {
          console.log('  ⏭️  Already in database — skipping');
          skipCount++;
          continue;
        }
      }

      // Step 2: Gemini enhancement
      console.log('  🧠  Step 2: Enhancing prompt with Gemini 2.0 Flash...');
      const enhancement = await enhanceWithGemini(post);
      console.log(`  ✅  Category: ${enhancement.category}`);
      console.log(`  ✅  Prompt: ${enhancement.enhanced_prompt.slice(0, 100)}...`);

      // Step 3: Generate image
      if (DRY_RUN) {
        console.log('  🎨  [DRY RUN] Would generate image with HuggingFace FLUX.1-schnell');
        console.log('  📤  [DRY RUN] Would upload to Supabase Storage');
        console.log('  💾  [DRY RUN] Would insert into images table:');
        console.log(JSON.stringify({
          url: `https://supabase.co/storage/prompt-images/auto-pipeline/${post.id}.webp`,
          prompt: enhancement.enhanced_prompt,
          category: enhancement.category,
          tags: enhancement.tags,
          source: 'reddit',
          original_source: post.permalink,
        }, null, 4));
        successCount++;
        continue;
      }

      console.log('  🎨  Step 3: Generating image with HuggingFace...');
      const imageBuffer = await generateImageHF(enhancement.enhanced_prompt);

      // Step 4+5: Upload + insert
      console.log('  📤  Step 4/5: Uploading and inserting into Supabase...');
      const url = await uploadAndInsert(supabase, post.id, imageBuffer, enhancement, post);

      console.log(`  🎉  Done! Available at: ${url}`);
      successCount++;

      // Be gentle with APIs — 3s between posts
      if (i < selected.length - 1) await sleep(3000);

    } catch (err) {
      console.error(`  ❌  Failed: ${err.message}`);
    }
  }

  // ── Summary ───────────────────────────────────────────────────────────────
  console.log('\n╔══════════════════════════════════════════════════════╗');
  console.log('║                    Run Summary                       ║');
  console.log('╠══════════════════════════════════════════════════════╣');
  console.log(`║  Processed : ${String(selected.length).padEnd(38)}║`);
  console.log(`║  Succeeded : ${String(successCount).padEnd(38)}║`);
  console.log(`║  Skipped   : ${String(skipCount).padEnd(38)}║`);
  console.log(`║  Failed    : ${String(selected.length - successCount - skipCount).padEnd(38)}║`);
  console.log(`║  Mode      : ${String(DRY_RUN ? 'DRY RUN' : 'LIVE').padEnd(38)}║`);
  console.log('╚══════════════════════════════════════════════════════╝');
}

// ─────────────────────────────────────────────────────────────────────────────
// MOCK DATA  —  used when running DRY_RUN without Reddit credentials
// ─────────────────────────────────────────────────────────────────────────────
function getMockPosts() {
  return [
    {
      id: 'mock_001',
      title: 'Hyperrealistic portrait of an ancient warrior queen, golden armour, dramatic sunset, 8K detail',
      body: 'Generated with FLUX.1 at 1024x1024. Prompt: a regal warrior queen wearing intricate golden plate armour, fierce expression, dramatic sunset background casting warm light, hyperrealistic skin texture, 8K resolution, cinematic composition',
      score: 4200,
      subreddit: 'AIArt',
      author: 'mock_user',
      permalink: 'https://reddit.com/r/AIArt/mock_001',
      imageUrl: 'https://picsum.photos/seed/warrior/1024/1024',
    },
    {
      id: 'mock_002',
      title: 'Neon-drenched cyberpunk alley at night, rain reflections, holographic ads, anime style',
      body: 'Prompt used: neon-lit cyberpunk alley, heavy rain creating reflective puddles, towering holographic advertisements in Japanese and English, dark moody atmosphere, anime concept art style, highly detailed',
      score: 3800,
      subreddit: 'StableDiffusion',
      author: 'mock_user2',
      permalink: 'https://reddit.com/r/StableDiffusion/mock_002',
      imageUrl: 'https://picsum.photos/seed/cyberpunk/1024/1024',
    },
    {
      id: 'mock_003',
      title: 'Ancient underwater city, bioluminescent coral, manta rays, god rays through deep blue water',
      body: 'Midjourney v6 prompt: ancient lost city submerged in the deep ocean, glowing bioluminescent coral structures, graceful manta rays gliding past, divine god rays filtering through the deep blue water, dreamlike atmosphere, photorealistic',
      score: 5100,
      subreddit: 'midjourney',
      author: 'mock_user3',
      permalink: 'https://reddit.com/r/midjourney/mock_003',
      imageUrl: 'https://picsum.photos/seed/underwater/1024/1024',
    },
  ];
}

// ─────────────────────────────────────────────────────────────────────────────
// UTILITY
// ─────────────────────────────────────────────────────────────────────────────
function sleep(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

// ─────────────────────────────────────────────────────────────────────────────
// ENTRY POINT
// ─────────────────────────────────────────────────────────────────────────────
main().catch(err => {
  console.error('\n💥 Fatal error:', err);
  process.exit(1);
});
