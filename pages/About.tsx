import React, { useEffect } from 'react';
import SEO from '../components/SEO';
import { Link } from 'react-router-dom';
import { Sparkles, Users, Zap, BookOpen, Award, Globe, Mail } from 'lucide-react';

const STATS = [
  { label: 'AI Prompts Curated', value: '10,000+', icon: <Sparkles size={20} /> },
  { label: 'AI Platforms Supported', value: '6+', icon: <Zap size={20} /> },
  { label: 'Artists Inspired', value: '50,000+', icon: <Users size={20} /> },
  { label: 'Countries Reached', value: '120+', icon: <Globe size={20} /> },
];

const About: React.FC = () => {
  useEffect(() => { window.scrollTo(0, 0); }, []);

  return (
    <div className="min-h-screen bg-background text-textPrimary pt-32 md:pt-40 pb-20 px-6 page-enter">
      <SEO
        title="About ProGall"
        description="ProGall is the premier free AI prompt gallery for Midjourney, DALL-E, Stable Diffusion, and Gemini. Learn about our mission to democratize AI art creation."
        url="https://progall.tech/about"
      />

      {/* Hero */}
      <div className="max-w-4xl mx-auto px-6 text-center mb-16">
        <h1 className="text-4xl md:text-5xl font-bold mb-6 bg-clip-text text-transparent bg-gradient-to-r from-accent to-purple-500">
          About ProGall
        </h1>
        <p className="text-xl text-textSecondary leading-relaxed max-w-2xl mx-auto">
          The premium library for AI art enthusiasts. We curate the world's best prompts to help you overcome
          "blank canvas syndrome" and create stunning visuals instantly.
        </p>
      </div>

      <div className="max-w-5xl mx-auto px-6 space-y-12">

        {/* Stats */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {STATS.map(({ label, value, icon }) => (
            <div key={label} className="bg-surface border border-surfaceHighlight rounded-2xl p-6 text-center">
              <div className="text-accent mx-auto mb-3 flex justify-center">{icon}</div>
              <p className="text-2xl font-extrabold text-textPrimary">{value}</p>
              <p className="text-xs text-textSecondary mt-1">{label}</p>
            </div>
          ))}
        </div>

        {/* Mission */}
        <section className="bg-surface border border-surfaceHighlight rounded-2xl p-8 md:p-10 shadow-lg">
          <h2 className="text-2xl font-bold mb-4 text-textPrimary">Our Mission</h2>
          <p className="text-textSecondary leading-relaxed mb-4">
            In the age of Generative AI, the <strong className="text-textPrimary">"Prompt"</strong> is the new paintbrush. However, finding consistent, high-quality prompts is difficult. ProGall was built to solve this by creating a centralized, community-driven archive where creators can share their exact "recipes" for Midjourney, Stable Diffusion, DALL-E 3, and Google Gemini.
          </p>
          <p className="text-textSecondary leading-relaxed">
            We believe that great AI-generated art shouldn't be locked behind paywalls or hidden in scattered Discord servers. Every prompt on ProGall is freely available to copy, remix, and use in your creative projects.
          </p>
        </section>

        {/* About the Creator / E-A-T */}
        <section className="bg-surface border border-surfaceHighlight rounded-2xl p-8 md:p-10">
          <div className="flex items-center gap-3 mb-6">
            <div className="w-10 h-10 rounded-xl bg-accent/10 flex items-center justify-center text-accent">
              <Award size={20} />
            </div>
            <h2 className="text-2xl font-bold text-textPrimary">About the Team</h2>
          </div>
          <div className="flex flex-col sm:flex-row gap-6 items-start">
            <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-accent to-teal-600 flex items-center justify-center text-white text-2xl font-extrabold flex-shrink-0">
              PG
            </div>
            <div>
              <h3 className="text-lg font-bold text-textPrimary">The ProGall Team</h3>
              <p className="text-sm text-accent font-medium mb-3">AI Art Curators &amp; Prompt Engineers</p>
              <p className="text-textSecondary text-sm leading-relaxed mb-3">
                We are a dedicated team of AI art enthusiasts, developers, and creative professionals who have been deeply involved in the generative AI space since its early days. Our curators manually review and test every prompt before it appears in the gallery, ensuring quality and accuracy across all major platforms.
              </p>
              <p className="text-textSecondary text-sm leading-relaxed">
                With expertise spanning Midjourney, Stable Diffusion, DALL-E, and Google Gemini, we understand the nuances of prompt engineering — from lighting control and camera angles to style modifiers and negative prompts. Our goal is to share this knowledge freely with the global creative community.
              </p>
              <div className="flex flex-wrap gap-2 mt-4">
                {['Prompt Engineering', 'AI Art', 'Midjourney', 'Stable Diffusion', 'DALL-E 3', 'Gemini'].map(tag => (
                  <span key={tag} className="px-2.5 py-1 rounded-full text-[11px] font-medium bg-accent/10 text-accent border border-accent/20">
                    {tag}
                  </span>
                ))}
              </div>
            </div>
          </div>
        </section>

        {/* Features Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {[
            {
              icon: '🎨',
              title: 'Curated Inspiration',
              color: 'accent',
              desc: 'Every image in our gallery is selected for its aesthetic quality and technical accuracy. We prioritize "clean" prompts that are easy to remix and adapt to your creative vision.'
            },
            {
              icon: '🔓',
              title: 'Open Access',
              color: 'accent',
              desc: 'We believe knowledge should be free. All prompts on ProGall are open for you to copy, modify, and use in your own commercial or personal projects — no sign-up required.'
            },
            {
              icon: '⚡',
              title: 'Multi-Model Support',
              color: 'accent',
              desc: 'Whether you use Midjourney v6, DALL-E 3, Stable Diffusion XL, or Google Gemini, our prompts are tagged and categorized to help you find exactly what works for your tool.'
            },
            {
              icon: '🤝',
              title: 'Community Driven',
              color: 'accent',
              desc: 'ProGall is built by creators, for creators. We actively listen to feedback and continuously update our platform to support the latest AI advancements and models.'
            },
          ].map(({ icon, title, desc }) => (
            <div key={title} className="bg-surface border border-surfaceHighlight rounded-2xl p-8">
              <h3 className="text-xl font-bold text-accent mb-3">{icon} {title}</h3>
              <p className="text-textSecondary text-sm leading-relaxed">{desc}</p>
            </div>
          ))}
        </div>

        {/* How to Use Guide */}
        <section className="bg-gradient-to-br from-accent/5 to-purple-500/5 border border-accent/20 rounded-2xl p-8 md:p-10">
          <div className="flex items-center gap-3 mb-6">
            <div className="w-10 h-10 rounded-xl bg-accent/10 flex items-center justify-center text-accent">
              <BookOpen size={20} />
            </div>
            <h2 className="text-2xl font-bold text-textPrimary">How to Use ProGall</h2>
          </div>
          <ol className="space-y-4">
            {[
              { step: '01', title: 'Browse the Gallery', desc: 'Explore thousands of AI-generated images organised by category — Anime, Cyberpunk, Photorealism, Fantasy, and more.' },
              { step: '02', title: 'Click on Any Image', desc: 'Open the full detail page to see the complete prompt, tags, model used, and aspect ratio settings.' },
              { step: '03', title: 'Copy the Prompt', desc: 'Tap "Copy Prompt" to instantly copy the exact text to your clipboard — including all parameters and negative prompts.' },
              { step: '04', title: 'Paste and Create', desc: 'Paste into Midjourney\'s /imagine command, DALL-E\'s prompt box, Stable Diffusion WebUI, or Google Gemini to generate your own version.' },
            ].map(({ step, title, desc }) => (
              <li key={step} className="flex gap-4">
                <span className="text-2xl font-extrabold text-accent/30 w-10 flex-shrink-0">{step}</span>
                <div>
                  <p className="font-bold text-textPrimary text-sm">{title}</p>
                  <p className="text-textSecondary text-sm leading-relaxed">{desc}</p>
                </div>
              </li>
            ))}
          </ol>
        </section>

        {/* CTA */}
        <div className="text-center py-6">
          <p className="text-textSecondary mb-6">Ready to explore the gallery?</p>
          <div className="flex flex-col sm:flex-row gap-3 justify-center">
            <Link
              to="/"
              className="inline-flex items-center gap-2 px-8 py-3.5 rounded-full bg-gradient-to-r from-accent to-teal-500 text-white font-bold text-sm hover:opacity-90 transition-all shadow-sm"
            >
              <Sparkles size={16} /> Browse Gallery
            </Link>
            <Link
              to="/contact"
              className="inline-flex items-center gap-2 px-8 py-3.5 rounded-full border border-border bg-surface text-textPrimary font-semibold text-sm hover:bg-surfaceHighlight transition-all"
            >
              <Mail size={16} /> Contact Us
            </Link>
          </div>
        </div>

      </div>
    </div>
  );
};

export default About;
