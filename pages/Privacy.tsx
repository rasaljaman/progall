import React from 'react';

const Privacy: React.FC = () => {
  return (
    <div className="min-h-screen bg-background text-textPrimary pt-8 pb-20 px-6 page-enter">
      <div className="max-w-3xl mx-auto">
        
        <header className="mb-12">
          <span className="text-accent text-xs font-bold tracking-wider uppercase">Data Protection</span>
          <h1 className="text-4xl font-bold mt-2 mb-4">Privacy Policy</h1>
          <p className="text-textSecondary">
            Your privacy matters to us. This policy explains how ProGall collects, uses, and protects your personal information.
          </p>
          <p className="text-xs text-textSecondary mt-4 opacity-50">Last Updated: December 28, 2025</p>
        </header>

        <div className="space-y-8">
          
          {/* Section 1 */}
          <section className="bg-surface border border-surfaceHighlight rounded-2xl p-8">
            {/* FIX: Changed text-white to text-textPrimary */}
            <h2 className="text-xl font-bold text-textPrimary mb-4">1. Information We Collect</h2>
            <ul className="list-disc pl-5 space-y-3 text-textSecondary text-sm">
              <li>
                <strong>Usage Data:</strong> We collect anonymous data on how you interact with the site, such as pages visited, search terms used, and buttons clicked (via Google/Firebase Analytics).
              </li>
              <li>
                <strong>Technical Data:</strong> Your IP address, browser type, and device information are collected automatically to help us optimize the website.
              </li>
              <li>
                <strong>Cookies:</strong> We use cookies to remember your preferences (like Light/Dark mode) and ensure the site functions correctly.
              </li>
            </ul>
          </section>

          {/* Section 2 */}
          <section className="bg-surface border border-surfaceHighlight rounded-2xl p-8">
            {/* FIX: Changed text-white to text-textPrimary */}
            <h2 className="text-xl font-bold text-textPrimary mb-4">2. How We Use Your Data</h2>
            <p className="text-textSecondary text-sm leading-relaxed mb-4">
              We use the collected information to:
            </p>
            <ul className="list-disc pl-5 space-y-2 text-textSecondary text-sm">
              <li>Provide and maintain the Service.</li>
              <li>Improve user experience by analyzing popular search categories.</li>
              <li>Detect and prevent technical issues or abuse.</li>
            </ul>
          </section>

          {/* Section 3 */}
          <section className="bg-surface border border-surfaceHighlight rounded-2xl p-8">
            {/* FIX: Changed text-white to text-textPrimary */}
            <h2 className="text-xl font-bold text-textPrimary mb-4">3. Third-Party Services</h2>
            <p className="text-textSecondary text-sm leading-relaxed mb-4">
              We rely on trusted third-party providers to run ProGall. These partners may process data on our behalf:
            </p>
            <ul className="list-disc pl-5 space-y-2 text-textSecondary text-sm">
              <li><strong>Supabase:</strong> For secure database management and authentication.</li>
              <li><strong>Vercel:</strong> For hosting and content delivery (CDN).</li>
              <li><strong>Google Analytics:</strong> For understanding website traffic trends.</li>
            </ul>
          </section>

          {/* Section 4 */}
          <section className="bg-surface border border-surfaceHighlight rounded-2xl p-8">
            {/* FIX: Changed text-white to text-textPrimary */}
            <h2 className="text-xl font-bold text-textPrimary mb-4">4. Your Rights</h2>
            <p className="text-textSecondary text-sm leading-relaxed">
              You have the right to request access to the personal data we hold about you (if any). You can also request the deletion of your account or data at any time by contacting us via our Contact page.
            </p>
          </section>

        </div>
      </div>
    </div>
  );
};

export default Privacy;
