import React from 'react';

const Privacy: React.FC = () => {
  return (
    <div className="max-w-4xl mx-auto px-4 py-12">
      <h1 className="text-3xl font-bold text-white mb-6">Privacy Policy</h1>
      <div className="prose prose-invert text-textSecondary">
        <p className="mb-4">Your privacy is important to us. This policy explains how we handle your data.</p>
        
        <h3 className="text-xl text-white font-semibold mt-6 mb-2">Data Collection</h3>
        <p>We do not collect personal data from visitors unless you explicitly contact us via email. We may use cookies for site performance.</p>

        <h3 className="text-xl text-white font-semibold mt-6 mb-2">Third-Party Services</h3>
        <p>We use Supabase for our database and Vercel for hosting. Please review their privacy policies for more details.</p>
        
        <p className="mt-8 text-sm text-gray-500">Last Updated: December 2025</p>
      </div>
    </div>
  );
};

export default Privacy;
