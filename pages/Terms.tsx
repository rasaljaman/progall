import React, { useEffect } from 'react';

const Terms: React.FC = () => {
  // FIX: Force scroll to top on load
  useEffect(() => {
    window.scrollTo(0, 0);
  }, []);

  return (
    // FIX: Added 'pt-32' padding
    <div className="min-h-screen bg-background text-textPrimary pt-32 pb-20 px-6 page-enter">
      <div className="max-w-3xl mx-auto">
        
        <header className="mb-12">
          <span className="text-accent text-xs font-bold tracking-wider uppercase">Legal</span>
          <h1 className="text-4xl font-bold mt-2 mb-4">Terms of Service</h1>
          <p className="text-textSecondary">
            Please read these terms carefully before using ProGall. These rules help us maintain a respectful, inspiring space for AI artists everywhere.
          </p>
          <p className="text-xs text-textSecondary mt-4 opacity-50">Effective Date: December 28, 2025</p>
        </header>

        <div className="space-y-8">
          
          {/* Card 1 */}
          <section className="bg-surface border border-surfaceHighlight rounded-2xl p-8">
            <h2 className="text-xl font-bold text-textPrimary mb-4">1. Acceptance of Terms</h2>
            <p className="text-textSecondary text-sm leading-relaxed">
              By accessing or using ProGall, you agree to follow these Terms. They create a legal agreement between you and ProGall. If you disagree with any term, you should stop using the service immediately.
            </p>
          </section>

          {/* Card 2 */}
          <section className="bg-surface border border-surfaceHighlight rounded-2xl p-8">
            <h2 className="text-xl font-bold text-textPrimary mb-4">2. Eligibility & Accounts</h2>
            <p className="text-textSecondary text-sm leading-relaxed mb-4">
              You must be at least 13 years old to use this service. When you use ProGall, you agree to provide accurate information and accept responsibility for any activity that occurs under your IP or account.
            </p>
          </section>

          {/* Card 3 */}
          <section className="bg-surface border border-surfaceHighlight rounded-2xl p-8">
            <h2 className="text-xl font-bold text-textPrimary mb-4">3. Community Conduct</h2>
            <p className="text-textSecondary text-sm leading-relaxed mb-4">
              ProGall is a collaborative gallery. We encourage remixing and sharing. However, you agree <strong>NOT</strong> to:
            </p>
            <ul className="list-disc pl-5 space-y-2 text-textSecondary text-sm">
              <li>Upload content that is illegal, harmful, threatening, or sexually explicit.</li>
              <li>Infringe on the copyright or trademark rights of others.</li>
              <li>Use automated scripts (scraping) to collect information from our Service.</li>
              <li>Attempt to disrupt the servers or networks connected to ProGall.</li>
            </ul>
          </section>

          {/* Card 4 */}
          <section className="bg-surface border border-surfaceHighlight rounded-2xl p-8">
            <h2 className="text-xl font-bold text-textPrimary mb-4">4. Intellectual Property</h2>
            <p className="text-textSecondary text-sm leading-relaxed mb-4">
              <strong>Your Content:</strong> You retain ownership of the AI-generated images you create. However, by uploading them to ProGall, you grant us a worldwide, non-exclusive license to display, reproduce, and distribute your content on this platform.
            </p>
            <p className="text-textSecondary text-sm leading-relaxed">
              <strong>Our Content:</strong> The ProGall logo, design, code, and "look and feel" are owned by ProGall and protected by copyright laws.
            </p>
          </section>

        </div>
      </div>
    </div>
  );
};

export default Terms;
