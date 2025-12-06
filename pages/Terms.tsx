import React from 'react';

const Terms: React.FC = () => {
  return (
    <div className="max-w-4xl mx-auto px-4 py-12">
      <h1 className="text-3xl font-bold text-primary mb-6">Terms of Use</h1>
      <div className="prose prose-invert text-textSecondary">
        <p className="mb-4">Welcome to ProGall. By accessing our website, you agree to these terms.</p>
        
        <h3 className="text-xl text-primary font-semibold mt-6 mb-2">1. Use of Prompts</h3>
        <p>The AI prompts displayed on this gallery are for educational and creative purposes. You are free to use them to generate your own images.</p>

        <h3 className="text-xl text-primary font-semibold mt-6 mb-2">2. User Conduct</h3>
        <p>You agree not to misuse the service or attempt to access restricted areas of the site.</p>
        
        <p className="mt-8 text-sm text-gray-500">Last Updated: December 2025</p>
      </div>
    </div>
  );
};

export default Terms;
