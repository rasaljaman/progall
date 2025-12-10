import React from 'react';

const About: React.FC = () => {
  return (
    <div className="min-h-screen bg-background pt-24 pb-20 px-6">
      <div className="max-w-3xl mx-auto">
        <h1 className="text-4xl font-bold text-textPrimary mb-8">About ProGall</h1>
        
        <div className="bg-surface border border-surfaceHighlight rounded-2xl p-8 md:p-12 shadow-neumorphic space-y-6 text-textSecondary text-lg leading-relaxed">
          <p>
            Welcome to <strong className="text-textPrimary">ProGall</strong>, the premier destination for digital artists, designers, and creators seeking high-quality AI art prompts.
          </p>

          <h2 className="text-2xl font-semibold text-textPrimary mt-6">Our Mission</h2>
          <p>
            In the age of Artificial Intelligence, the "Prompt" is the new paintbrush. Our mission is to curate, categorize, and share the most effective prompts for tools like Midjourney, Stable Diffusion, and DALL-E. We believe that by sharing exact prompt engineering data, we can help the community learn and create stunning visuals faster.
          </p>

          <h2 className="text-2xl font-semibold text-textPrimary mt-6">What We Offer</h2>
          <ul className="list-disc pl-6 space-y-2">
            <li><strong>Curated Gallery:</strong> A hand-picked selection of high-resolution AI generations.</li>
            <li><strong>Exact Prompts:</strong> We provide the exact text inputs used to generate every image.</li>
            <li><strong>Style Guides:</strong> Categories ranging from Cyberpunk and Anime to Realistic Portraiture.</li>
          </ul>

          <h2 className="text-2xl font-semibold text-textPrimary mt-6">The Creator</h2>
          <p>
            ProGall was built by a passionate developer and AI enthusiast dedicated to building tools for the next generation of art.
          </p>
        </div>
      </div>
    </div>
  );
};

export default About;
