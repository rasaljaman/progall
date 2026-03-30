import React from 'react';
import { Link } from 'react-router-dom';
import { Sparkles } from 'lucide-react';

// ── Theme-adaptive SVG social icons (use currentColor) ────────────────────
const InstagramIcon = () => (
  <svg viewBox="0 0 24 24" width="20" height="20" fill="currentColor" aria-hidden="true">
    <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zm0-2.163c-3.259 0-3.667.014-4.947.072-4.358.2-6.78 2.618-6.98 6.98-.059 1.281-.073 1.689-.073 4.948 0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98 1.281.058 1.689.072 4.948.072 3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98-1.281-.059-1.69-.073-4.949-.073zm0 5.838c-3.403 0-6.162 2.759-6.162 6.162s2.759 6.163 6.162 6.163 6.162-2.759 6.162-6.163c0-3.403-2.759-6.162-6.162-6.162zm0 10.162c-2.209 0-4-1.79-4-4 0-2.209 1.791-4 4-4s4 1.791 4 4c0 2.21-1.791 4-4 4zm6.406-11.845c-.796 0-1.441.645-1.441 1.44s.645 1.44 1.441 1.44c.795 0 1.439-.645 1.439-1.44s-.644-1.44-1.439-1.44z" />
  </svg>
);

const ThreadsIcon = () => (
  <svg viewBox="0 0 24 24" width="20" height="20" fill="currentColor" aria-hidden="true">
    <path d="M12.186 24h-.007c-3.581-.024-6.334-1.205-8.184-3.509C2.35 18.44 1.5 15.586 1.472 12.01v-.017c.03-3.579.879-6.43 2.525-8.482C5.845 1.205 8.6.024 12.18 0h.014c2.746.02 5.043.725 6.826 2.098 1.677 1.29 2.858 3.13 3.509 5.467l-2.04.569c-1.104-3.96-3.898-5.984-8.304-6.015-2.91.022-5.11.936-6.54 2.717C4.307 6.504 3.616 8.914 3.589 12c.027 3.086.718 5.496 2.057 7.164 1.43 1.783 3.631 2.698 6.54 2.717 2.623-.02 4.358-.631 5.8-2.045 1.647-1.613 1.618-3.593 1.09-4.798-.31-.71-.873-1.3-1.634-1.75-.192 1.352-.622 2.446-1.284 3.272-.886 1.102-2.14 1.704-3.73 1.79-1.202.065-2.361-.218-3.259-.801-1.063-.689-1.685-1.74-1.752-2.964-.065-1.19.408-2.285 1.33-3.082.88-.76 2.119-1.207 3.583-1.291a13.853 13.853 0 0 1 3.02.142c-.126-.742-.375-1.332-.75-1.757-.513-.586-1.308-.883-2.359-.89h-.029c-.844 0-1.992.232-2.721 1.32L7.734 7.847c.98-1.454 2.568-2.256 4.478-2.256h.044c3.194.02 5.097 1.975 5.287 5.388.108.046.216.094.321.142 1.49.7 2.58 1.761 3.154 3.07.797 1.82.871 4.79-1.548 7.158-1.85 1.81-4.094 2.628-7.277 2.65Zm1.003-11.69c-.242 0-.487.007-.739.021-1.836.103-2.98.946-2.916 2.143.067 1.256 1.452 1.839 2.784 1.767 1.224-.065 2.818-.543 3.086-3.71a10.5 10.5 0 0 0-2.215-.221z" />
  </svg>
);

// ── Footer links data ─────────────────────────────────────────────────────
const EXPLORE_LINKS = [
  { to: '/',        label: 'Gallery' },
  { to: '/about',   label: 'About' },
  { to: '/faq',     label: 'FAQ' },
  { to: '/contact', label: 'Contact' },
];

const LEGAL_LINKS = [
  { to: '/terms',   label: 'Terms of Service' },
  { to: '/privacy', label: 'Privacy Policy' },
];

const PLATFORMS = ['Gemini', 'Midjourney', 'DALL-E 3', 'Stable Diffusion', 'Firefly', 'Flux'];

const SOCIAL_LINKS = [
  {
    label: 'Instagram',
    href: 'https://www.instagram.com/progall_?igsh=MXh0OHkwbnZsOTE4bg==',
    icon: <InstagramIcon />,
    hoverColor: 'hover:text-pink-500 dark:hover:text-pink-400',
  },
  {
    label: 'Threads',
    href: 'https://www.threads.net/@progall_',
    icon: <ThreadsIcon />,
    hoverColor: 'hover:text-textPrimary',
  },
];

// ── Component ─────────────────────────────────────────────────────────────
const Footer: React.FC = () => {
  const year = new Date().getFullYear();

  return (
    <footer className="w-full bg-surface border-t border-border/40 mt-auto">

      {/* ── Top section ── */}
      <div className="max-w-7xl mx-auto px-6 pt-14 pb-10">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-10">

          {/* Brand */}
          <div className="lg:col-span-1 space-y-4">
            <Link to="/" className="inline-flex items-center gap-2.5 group">
              <div className="w-8 h-8 rounded-full overflow-hidden ring-2 ring-accent/20 group-hover:ring-accent/50 transition-all">
                <img src="/logo.jpg" alt="ProGall" className="w-full h-full object-cover" />
              </div>
              <span className="text-lg font-extrabold tracking-tight text-textPrimary">
                Pro<span className="text-gradient">Gall</span>
              </span>
            </Link>
            <p className="text-sm text-textSecondary leading-relaxed max-w-xs">
              The premium AI prompt gallery. Copy exact prompts for Midjourney, DALL-E, and Stable Diffusion — instantly.
            </p>

            {/* Social icons */}
            <div className="flex items-center gap-2 pt-1">
              {SOCIAL_LINKS.map(({ label, href, icon, hoverColor }) => (
                <a
                  key={label}
                  href={href}
                  target="_blank"
                  rel="noopener noreferrer"
                  aria-label={label}
                  className={`
                    flex items-center justify-center w-9 h-9 rounded-full
                    bg-surfaceHighlight border border-border/50
                    text-textSecondary transition-all duration-200
                    hover:border-accent/40 hover:bg-accent/5 hover:scale-110
                    ${hoverColor}
                  `}
                >
                  {icon}
                </a>
              ))}
            </div>
          </div>

          {/* Explore */}
          <div className="space-y-4">
            <h4 className="text-xs font-bold uppercase tracking-[0.1em] text-textSecondary">Explore</h4>
            <ul className="space-y-2.5">
              {EXPLORE_LINKS.map(({ to, label }) => (
                <li key={to}>
                  <Link
                    to={to}
                    className="text-sm text-textSecondary hover:text-accent transition-colors"
                  >
                    {label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Legal */}
          <div className="space-y-4">
            <h4 className="text-xs font-bold uppercase tracking-[0.1em] text-textSecondary">Legal</h4>
            <ul className="space-y-2.5">
              {LEGAL_LINKS.map(({ to, label }) => (
                <li key={to}>
                  <Link
                    to={to}
                    className="text-sm text-textSecondary hover:text-accent transition-colors"
                  >
                    {label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Platforms */}
          <div className="space-y-4">
            <h4 className="text-xs font-bold uppercase tracking-[0.1em] text-textSecondary">Works With</h4>
            <div className="flex flex-wrap gap-1.5">
              {PLATFORMS.map(p => (
                <span
                  key={p}
                  className="px-2.5 py-1 rounded-full text-[11px] font-medium bg-surfaceHighlight text-textSecondary border border-border/50"
                >
                  {p}
                </span>
              ))}
            </div>
            <div className="pt-1">
              <div className="inline-flex items-center gap-1.5 text-xs text-accent font-semibold bg-accent/8 border border-accent/20 px-3 py-1.5 rounded-full">
                <Sparkles size={11} />
                10,000+ Prompts
              </div>
            </div>
          </div>

        </div>
      </div>

      {/* ── Bottom bar ── */}
      <div className="border-t border-border/40">
        <div className="max-w-7xl mx-auto px-6 py-5 flex flex-col sm:flex-row items-center justify-between gap-3">
          <p className="text-xs text-textSecondary/60">
            © {year} ProGall. All rights reserved.
          </p>
          <p className="text-xs text-textSecondary/60 flex items-center gap-1">
            Made with
            <svg viewBox="0 0 24 24" width="12" height="12" fill="currentColor" className="text-rose-500 mx-0.5">
              <path d="M12 21.593c-5.63-5.539-11-10.297-11-14.402 0-3.791 3.068-5.191 5.281-5.191 1.312 0 4.151.501 5.719 4.457 1.59-3.968 4.464-4.447 5.726-4.447 2.54 0 5.274 1.621 5.274 5.181 0 4.069-5.136 8.625-11 14.402z" />
            </svg>
            for creators worldwide
          </p>
        </div>
      </div>

    </footer>
  );
};

export default Footer;
