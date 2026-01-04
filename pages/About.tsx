import React, { useEffect } from 'react';

const About: React.FC = () => {
  // FIX: Force scroll to top on load
  useEffect(() => {
    window.scrollTo(0, 0);
  }, []);

  return (
    // FIX: Added 'pt-32 md:pt-40' padding
    <div className="min-h-screen bg-background text-textPrimary pt-32 md:pt-40 pb-20 px-6 page-enter">
      
      {/* Hero Section */}
      <div className="max-w-4xl mx-auto px-6 text-center mb-16">
        <h1 className="text-4xl md:text-5xl font-bold mb-6 bg-clip-text text-transparent bg-gradient-to-r from-accent to-purple-500">
          About ProGall
        </h1>
        <p className="text-xl text-textSecondary leading-relaxed max-w-2xl mx-auto">
          The premium library for AI art enthusiasts. We curate the world's best prompts to help you overcome "blank canvas syndrome" and create stunning visuals instantly.
        </p>
      </div>

      {/* Main Content */}
      <div className="max-w-5xl mx-auto px-6 space-y-12">
        
        {/* Mission Card */}
        <section className="bg-surface border border-surfaceHighlight rounded-2xl p-8 md:p-10 shadow-lg">
          <h2 className="text-2xl font-bold mb-4 text-textPrimary">Our Mission</h2>
          <p className="text-textSecondary leading-relaxed">
            In the age of Generative AI, the "Prompt" is the new paintbrush. However, finding consistent, high-quality prompts is difficult. ProGall was built to solve this by creating a centralized, community-driven archive where creators can share their exact "recipes" for Midjourney, Stable Diffusion, and DALL-E.
          </p>
        </section>

        {/* Features Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="bg-surface border border-surfaceHighlight rounded-2xl p-8">
            <h3 className="text-xl font-bold text-accent mb-3">🎨 Curated Inspiration</h3>
            <p className="text-textSecondary text-sm leading-relaxed">
              Every image in our gallery is selected for its aesthetic quality and technical accuracy. We prioritize "clean" prompts that are easy to remix.
            </p>
          </div>
          <div className="bg-surface border border-surfaceHighlight rounded-2xl p-8">
            <h3 className="text-xl font-bold text-accent mb-3">🔓 Open Access</h3>
            <p className="text-textSecondary text-sm leading-relaxed">
              We believe knowledge should be free. All prompts on ProGall are open for you to copy, modify, and use in your own commercial or personal projects.
            </p>
          </div>
          <div className="bg-surface border border-surfaceHighlight rounded-2xl p-8">
            <h3 className="text-xl font-bold text-accent mb-3">⚡ Multi-Model Support</h3>
            <p className="text-textSecondary text-sm leading-relaxed">
              Whether you use Midjourney v6, DALL-E 3, or Stable Diffusion XL, our prompts are tagged and categorized to help you find exactly what works for your tool.
            </p>
          </div>
          <div className="bg-surface border border-surfaceHighlight rounded-2xl p-8">
            <h3 className="text-xl font-bold text-accent mb-3">🤝 Community Driven</h3>
            <p className="text-textSecondary text-sm leading-relaxed">
              ProGall is built by creators, for creators. We actively listen to feedback and continuously update our platform to support the latest AI advancements.
            </p>
          </div>
        </div>

      </div>
    </div>
  );
};

export default About;
