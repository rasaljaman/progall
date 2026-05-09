import { writeFile } from 'node:fs/promises';
import { createClient } from '@supabase/supabase-js';

const SITE_URL = process.env.SITE_URL || 'https://progall.tech';
const SUPABASE_URL = process.env.VITE_SUPABASE_URL || '';
const SUPABASE_ANON_KEY = process.env.VITE_SUPABASE_ANON_KEY || '';
const SITEMAP_LIMIT = Number(process.env.SITEMAP_LIMIT || 5000);
const PAGE_SIZE = 1000;

const staticRoutes = [
  { path: '/', changefreq: 'daily', priority: '1.0' },
  { path: '/about', changefreq: 'monthly', priority: '0.8' },
  { path: '/contact', changefreq: 'monthly', priority: '0.8' },
  { path: '/faq', changefreq: 'monthly', priority: '0.6' },
  { path: '/privacy', changefreq: 'yearly', priority: '0.4' },
  { path: '/terms', changefreq: 'yearly', priority: '0.4' },
  { path: '/blog', changefreq: 'weekly', priority: '0.7' },
];

const formatDate = (value) => {
  if (!value) return '';
  const date = value instanceof Date ? value : new Date(value);
  if (Number.isNaN(date.getTime())) return '';
  return date.toISOString().split('T')[0];
};

const escapeXml = (value) =>
  value
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&apos;');

const urlEntry = (loc, lastmod, changefreq, priority) => {
  const parts = [
    '  <url>',
    `    <loc>${escapeXml(loc)}</loc>`,
  ];

  if (lastmod) parts.push(`    <lastmod>${lastmod}</lastmod>`);
  if (changefreq) parts.push(`    <changefreq>${changefreq}</changefreq>`);
  if (priority) parts.push(`    <priority>${priority}</priority>`);

  parts.push('  </url>');
  return parts.join('\n');
};

const buildStaticEntries = () => {
  const today = formatDate(new Date());
  return staticRoutes.map((route) => {
    const loc = new URL(route.path, SITE_URL).toString();
    return urlEntry(loc, today, route.changefreq, route.priority);
  });
};

const fetchAllRows = async (client, table, select, applyQuery) => {
  const rows = [];
  let from = 0;

  while (rows.length < SITEMAP_LIMIT) {
    let query = client.from(table).select(select);
    if (applyQuery) query = applyQuery(query);

    const { data, error } = await query.range(from, from + PAGE_SIZE - 1);
    if (error) throw error;

    if (!data || data.length === 0) break;
    rows.push(...data);

    if (data.length < PAGE_SIZE) break;
    from += PAGE_SIZE;
  }

  return rows.slice(0, SITEMAP_LIMIT);
};

const buildDynamicEntries = async () => {
  if (!SUPABASE_URL || !SUPABASE_ANON_KEY) {
    console.warn('[sitemap] Missing Supabase env vars. Generating static-only sitemap.');
    return [];
  }

  const client = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
  const entries = [];

  const blogs = await fetchAllRows(
    client,
    'blogs',
    'slug, updated_at, created_at, is_published',
    (query) =>
      query
        .eq('is_published', true)
        .order('created_at', { ascending: false })
  );

  for (const blog of blogs) {
    if (!blog.slug) continue;
    const loc = new URL(`/blog/${blog.slug}`, SITE_URL).toString();
    const lastmod = formatDate(blog.updated_at || blog.created_at);
    entries.push(urlEntry(loc, lastmod, 'weekly', '0.7'));
  }

  const images = await fetchAllRows(
    client,
    'images',
    'id, created_at',
    (query) => query.order('created_at', { ascending: false })
  );

  for (const image of images) {
    if (!image.id) continue;
    const loc = new URL(`/image/${image.id}`, SITE_URL).toString();
    const lastmod = formatDate(image.created_at);
    entries.push(urlEntry(loc, lastmod, 'weekly', '0.6'));
  }

  return entries;
};

const buildSitemap = async () => {
  const staticEntries = buildStaticEntries();
  let dynamicEntries = [];

  try {
    dynamicEntries = await buildDynamicEntries();
  } catch (error) {
    console.warn('[sitemap] Failed to fetch dynamic routes. Using static-only sitemap.');
    console.warn(error);
  }

  const allEntries = [...staticEntries, ...dynamicEntries];

  const xml = [
    '<?xml version="1.0" encoding="UTF-8"?>',
    '<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">',
    ...allEntries,
    '</urlset>',
    '',
  ].join('\n');

  await writeFile(new URL('../public/sitemap.xml', import.meta.url), xml, 'utf8');
  console.log(`[sitemap] Generated ${allEntries.length} URLs.`);
};

buildSitemap();
