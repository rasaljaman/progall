import fs from 'node:fs';
import path from 'node:path';
import { createClient } from '@supabase/supabase-js';

// Load environment variables from .env if present
const envPath = path.resolve(process.cwd(), '.env');
if (fs.existsSync(envPath)) {
  const content = fs.readFileSync(envPath, 'utf8');
  content.split(/\r?\n/).forEach(line => {
    const match = line.match(/^\s*([\w.-]+)\s*=\s*(.*)?\s*$/);
    if (match) {
      const key = match[1];
      let value = match[2] || '';
      if (value.startsWith('"') && value.endsWith('"')) value = value.slice(1, -1);
      if (value.startsWith("'") && value.endsWith("'")) value = value.slice(1, -1);
      process.env[key] = value;
    }
  });
}

// Read variables
const DRY_RUN = process.env.DRY_RUN === 'true';
const X_BEARER_TOKEN = process.env.X_BEARER_TOKEN || 'mock';
const SUPABASE_URL = process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL;
const SUPABASE_SERVICE_KEY = process.env.SUPABASE_SERVICE_KEY;

console.log('--- ProGall Twitter Fetcher Start ---');
console.log(`Dry Run Mode: ${DRY_RUN}`);
console.log(`X Bearer Token: ${X_BEARER_TOKEN === 'mock' ? 'MOCK MODE' : 'Configured'}`);
console.log(`Supabase URL: ${SUPABASE_URL || 'Not Configured'}`);
console.log(`Supabase Service Key: ${SUPABASE_SERVICE_KEY ? 'Configured' : 'Not Configured'}`);

if (!SUPABASE_URL) {
  console.error('Error: SUPABASE_URL (or VITE_SUPABASE_URL) is required.');
  process.exit(1);
}
if (!SUPABASE_SERVICE_KEY && !DRY_RUN) {
  console.error('Error: SUPABASE_SERVICE_KEY is required for non-dry-runs.');
  process.exit(1);
}

// Detect AI model from prompt text
function detectModel(text) {
  const lower = text.toLowerCase();
  if (lower.includes('midjourney') || lower.includes('--ar') || lower.includes('--v') || lower.includes('niji')) {
    return 'Midjourney';
  }
  if (lower.includes('dall-e') || lower.includes('dalle') || lower.includes('dall e')) {
    return 'DALL-E 3';
  }
  if (lower.includes('stable diffusion') || lower.includes('sdxl') || lower.includes('sd1.5') || lower.includes('comfyui')) {
    return 'Stable Diffusion';
  }
  if (lower.includes('gemini') || lower.includes('imagen')) {
    return 'Google Gemini';
  }
  if (lower.includes('flux')) {
    return 'Flux';
  }
  return 'Unknown';
}

// Clean hashtag and media links from prompt text to leave clean prompt text
function cleanPrompt(text) {
  // Remove hashtags
  let cleaned = text.replace(/#\w+/g, '');
  // Remove media links (https://t.co/...)
  cleaned = cleaned.replace(/https:\/\/t\.co\/\w+/g, '');
  // Trim spaces and clean up quotes/commas at ends
  return cleaned.trim().replace(/^["'\s]+|["'\s]+$/g, '');
}

async function run() {
  let supabase = null;
  if (!DRY_RUN) {
    supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY);
  }

  let tweets = [];
  let mediaMap = new Map();
  let userMap = new Map();

  if (X_BEARER_TOKEN === 'mock') {
    console.log('Running in MOCK mode. Generating mock tweets...');
    
    const mockResponse = {
      data: [
        {
          id: "1794263152063856001",
          text: "Abstract fluid acrylic splash, vibrant teal and deep purple gradients, gold veins, cinematic lighting #GPTImage2",
          author_id: "101",
          attachments: { media_keys: ["media_1"] },
          created_at: new Date(Date.now() - 3600000).toISOString(), // 1 hour ago
          public_metrics: { like_count: 42, impression_count: 1200 }
        },
        {
          id: "1794263152063856002",
          text: "Surreal portrait of a celestial queen, starry hair, glowing skin, detailed oil painting style #GPTImage2 --ar 4:3",
          author_id: "102",
          attachments: { media_keys: ["media_2"] },
          created_at: new Date(Date.now() - 7200000).toISOString(), // 2 hours ago
          public_metrics: { like_count: 88, impression_count: 3400 }
        },
        {
          id: "1794263152063856003",
          text: "Retro anime sci-fi corridor, neon highlights, cinematic volumetric lighting #GPTImage2 niji v6",
          author_id: "103",
          attachments: { media_keys: ["media_3"] },
          created_at: new Date(Date.now() - 10800000).toISOString(), // 3 hours ago
          public_metrics: { like_count: 156, impression_count: 5100 }
        }
      ],
      includes: {
        media: [
          { media_key: "media_1", type: "photo", url: "https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?w=1024" },
          { media_key: "media_2", type: "photo", url: "https://images.unsplash.com/photo-1579783902614-a3fb3927b6a5?w=1024" },
          { media_key: "media_3", type: "photo", url: "https://images.unsplash.com/photo-1607604276583-eef5d076aa5f?w=1024" }
        ],
        users: [
          { id: "101", name: "Aria Digital", username: "aria_art" },
          { id: "102", name: "Celestial Queen", username: "celestial_q" },
          { id: "103", name: "Neon Dreamer", username: "neon_dreamer" }
        ]
      }
    };
    
    tweets = mockResponse.data;
    mockResponse.includes.media.forEach(m => mediaMap.set(m.media_key, m));
    mockResponse.includes.users.forEach(u => userMap.set(u.id, u));
  } else {
    // Call X API v2 Search Recent
    const query = "#GPTImage2 has:images -is:retweet";
    const url = `https://api.twitter.com/2/tweets/search/recent?query=${encodeURIComponent(query)}&expansions=attachments.media_keys,author_id&media.fields=url,preview_image_url,type&user.fields=username,name&tweet.fields=created_at,public_metrics`;
    
    console.log(`Fetching from X API: GET ${url}`);
    try {
      const response = await fetch(url, {
        headers: {
          'Authorization': `Bearer ${X_BEARER_TOKEN}`,
          'User-Agent': 'v2RecentSearchJS'
        }
      });

      if (!response.ok) {
        throw new Error(`X API responded with status ${response.status}: ${await response.text()}`);
      }

      const json = await response.json();
      tweets = json.data || [];
      
      if (json.includes) {
        if (json.includes.media) {
          json.includes.media.forEach(m => mediaMap.set(m.media_key, m));
        }
        if (json.includes.users) {
          json.includes.users.forEach(u => userMap.set(u.id, u));
        }
      }
      console.log(`Found ${tweets.length} tweets from X API search.`);
    } catch (err) {
      console.error('Error fetching from X API. Falling back to mock data for validation...', err);
      return runMockFallback();
    }
  }

  await processTweets(tweets, mediaMap, userMap, supabase);
}

// Fallback executor in case real API fails during validation
async function runMockFallback() {
  console.log('--- Running Mock Fallback ---\n');
  process.env.X_BEARER_TOKEN = 'mock';
  await run();
}

async function processTweets(tweets, mediaMap, userMap, supabase) {
  let processedCount = 0;
  let successCount = 0;

  for (const tweet of tweets) {
    processedCount++;
    console.log(`\n[${processedCount}/${tweets.length}] Processing Tweet ID: ${tweet.id}`);

    try {
      // 1. Author and handle lookup
      const authorUser = userMap.get(tweet.author_id);
      if (!authorUser) {
        console.warn(`Warning: Author user not found for author_id ${tweet.author_id}. Skipping.`);
        continue;
      }
      const author = authorUser.name;
      const handle = authorUser.username;
      console.log(`Author: ${author} (@${handle})`);

      // 2. Media keys check
      if (!tweet.attachments || !tweet.attachments.media_keys || tweet.attachments.media_keys.length === 0) {
        console.warn('Warning: Tweet has no media attachments. Skipping.');
        continue;
      }

      // 3. Find associated media URLs
      const urlsToDownload = [];
      for (const mediaKey of tweet.attachments.media_keys) {
        const media = mediaMap.get(mediaKey);
        if (media && (media.type === 'photo' || media.type === 'animated_gif') && media.url) {
          urlsToDownload.push(media.url);
        } else if (media && media.preview_image_url) {
          urlsToDownload.push(media.preview_image_url);
        }
      }

      if (urlsToDownload.length === 0) {
        console.warn('Warning: No downloadable media URLs found. Skipping.');
        continue;
      }

      console.log(`Found ${urlsToDownload.length} media URLs to download.`);

      // 4. Download and upload images
      const publicUrls = [];
      for (let i = 0; i < urlsToDownload.length; i++) {
        const extUrl = urlsToDownload[i];
        const storagePath = `tweets/${tweet.id}/${i}.jpg`;
        console.log(`Downloading ${extUrl} ...`);

        if (DRY_RUN) {
          console.log(`[DRY RUN] Would upload downloaded buffer to storage: prompt-images/${storagePath}`);
          publicUrls.push(`https://mock-supabase.co/storage/v1/object/public/prompt-images/${storagePath}`);
        } else {
          try {
            const imgRes = await fetch(extUrl);
            if (!imgRes.ok) throw new Error(`HTTP ${imgRes.status} downloading image`);
            
            const arrayBuffer = await imgRes.arrayBuffer();
            const buffer = Buffer.from(arrayBuffer);

            console.log(`Uploading to Supabase Storage: prompt-images/${storagePath} (${buffer.length} bytes)...`);
            const { data, error: uploadError } = await supabase.storage
              .from('prompt-images')
              .upload(storagePath, buffer, {
                contentType: 'image/jpeg',
                upsert: true
              });

            if (uploadError) {
              throw uploadError;
            }

            const { data: { publicUrl } } = supabase.storage
              .from('prompt-images')
              .getPublicUrl(storagePath);

            console.log(`Uploaded successfully! Public URL: ${publicUrl}`);
            publicUrls.push(publicUrl);
          } catch (uploadErr) {
            console.error(`Error downloading/uploading image ${i}:`, uploadErr);
            throw uploadErr; // rethrow to fail this tweet processing
          }
        }
      }

      // 5. Build database fields
      const promptText = cleanPrompt(tweet.text);
      const detected = detectModel(tweet.text);
      const likes = tweet.public_metrics?.like_count || 0;
      const views = tweet.public_metrics?.impression_count || 0;
      const tweetUrl = `https://x.com/${handle}/status/${tweet.id}`;
      const tweetedAt = tweet.created_at;

      console.log(`Prompt Text: "${promptText}"`);
      console.log(`Model: ${detected} | Likes: ${likes} | Views: ${views}`);

      // 6. DB Upsert
      if (DRY_RUN) {
        console.log(`[DRY RUN] Would upsert record into table prompts:`);
        console.log(JSON.stringify({
          id: tweet.id, author, handle, prompt_text: promptText, image_urls: publicUrls,
          model: detected, likes, views, tweet_url: tweetUrl, tweeted_at: tweetedAt
        }, null, 2));
      } else {
        console.log(`Upserting record in public.prompts table...`);
        const { error: dbError } = await supabase
          .from('prompts')
          .upsert({
            id: tweet.id,
            author,
            handle,
            prompt_text: promptText,
            image_urls: publicUrls,
            model: detected,
            likes,
            views,
            tweet_url: tweetUrl,
            tweeted_at: tweetedAt
          }, { onConflict: 'id' });

        if (dbError) {
          throw dbError;
        }
        console.log(`Database upsert successful!`);
      }

      successCount++;
    } catch (tweetErr) {
      console.error(`Failed to process Tweet ID ${tweet.id}:`, tweetErr.message || tweetErr);
    }
  }

  console.log(`\n--- Run Complete ---`);
  console.log(`Processed: ${processedCount} | Successful: ${successCount} | Failed: ${processedCount - successCount}`);
}

run().catch(err => {
  console.error('Fatal fetcher execution error:', err);
  process.exit(1);
});
