import React from 'react';

const About: React.FC = () => {
  return (
    <div className="max-w-4xl mx-auto px-4 py-16">
      <div className="text-center mb-16">
        <h1 className="text-4xl md:text-5xl font-bold text-primary mb-6">Unleashing Creativity</h1>
        <p className="text-xl text-textSecondary max-w-2xl mx-auto">
          ProGall is more than just a gallery. It's a curated collection of AI-driven imagination, designed to inspire your next masterpiece.
        </p>
      </div>

      <div className="grid md:grid-cols-2 gap-12 items-center">
        <div className="space-y-6 text-textSecondary text-lg leading-relaxed">
          <p>
            In the age of Artificial Intelligence, the right prompt can change everything. We built ProGall to help artists, designers, and dreamers bridge the gap between idea and reality.
          </p>
          <p>
            Whether you are looking for cyberpunk landscapes, hyper-realistic portraits, or abstract concepts, our constantly updated library provides the exact words you need to generate stunning visuals.
          </p>
        </div>
        <div className="bg-surfaceHighlight rounded-2xl p-8 border border-white/5 shadow-2xl transform rotate-3 hover:rotate-0 transition-transform duration-500">
          <div className="aspect-video bg-gradient-to-br from-accent/20 to-purple-500/20 rounded-xl flex items-center justify-center">
            <span className="text-accent font-bold text-xl">Where Ideas Begin</span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default About;
