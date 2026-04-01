import React, { useEffect } from 'react';
import SEO from '../components/SEO';
import { Shield, Cookie, Users, Mail, Database, Eye, Lock, AlertTriangle } from 'lucide-react';

const SectionCard: React.FC<{ icon: React.ReactNode; title: string; children: React.ReactNode }> = ({ icon, title, children }) => (
  <section className="bg-surface border border-surfaceHighlight rounded-2xl p-8">
    <div className="flex items-center gap-3 mb-5">
      <div className="w-9 h-9 rounded-xl bg-accent/10 flex items-center justify-center text-accent flex-shrink-0">
        {icon}
      </div>
      <h2 className="text-xl font-bold text-textPrimary">{title}</h2>
    </div>
    {children}
  </section>
);

const Privacy: React.FC = () => {
  useEffect(() => { window.scrollTo(0, 0); }, []);

  return (
    <div className="min-h-screen bg-background text-textPrimary pt-32 pb-20 px-6 page-enter">
      <SEO
        title="Privacy Policy"
        description="Learn how ProGall collects, uses, and protects your personal data. We are transparent about our use of Google AdSense, Google Analytics, and cookies."
        url="https://progall.tech/privacy"
      />
      <div className="max-w-3xl mx-auto">

        <header className="mb-12">
          <span className="text-accent text-xs font-bold tracking-wider uppercase">Data Protection</span>
          <h1 className="text-4xl font-bold mt-2 mb-4">Privacy Policy</h1>
          <p className="text-textSecondary leading-relaxed">
            Your privacy is important to us. This policy explains how ProGall collects, uses, and protects your information. 
            We are committed to full transparency, especially regarding advertising and analytics.
          </p>
          <p className="text-xs text-textSecondary mt-4 opacity-60">Last Updated: April 1, 2026 · Effective: December 28, 2025</p>
        </header>

        <div className="space-y-6">

          {/* 1. What We Collect */}
          <SectionCard icon={<Database size={18} />} title="1. Information We Collect">
            <ul className="space-y-4 text-textSecondary text-sm">
              <li>
                <strong className="text-textPrimary">Usage Data:</strong> We automatically collect anonymous data on how you use the site — pages visited, search terms entered, buttons clicked, and time spent — via Google Analytics.
              </li>
              <li>
                <strong className="text-textPrimary">Technical Data:</strong> Your IP address (anonymized), browser type, operating system, device type, and referring URL are logged to help us optimize site performance.
              </li>
              <li>
                <strong className="text-textPrimary">Cookies &amp; Local Storage:</strong> We use browser cookies and localStorage to remember your preferences (such as light/dark theme), maintain session state, and support advertising and analytics.
              </li>
              <li>
                <strong className="text-textPrimary">Contact Data:</strong> If you contact us via our Contact page, we receive your name, email address, and message content. This information is used solely to respond to your inquiry.
              </li>
            </ul>
          </SectionCard>

          {/* 2. Cookie Policy */}
          <SectionCard icon={<Cookie size={18} />} title="2. Cookie Policy">
            <p className="text-textSecondary text-sm mb-4">
              We use cookies to make ProGall work correctly and to fund its operation through advertising. Here is a breakdown of all cookies used:
            </p>
            <div className="space-y-4">
              <div className="bg-surfaceHighlight rounded-xl p-4 border border-border/40">
                <p className="text-sm font-bold text-textPrimary mb-1">🔒 Essential Cookies</p>
                <p className="text-xs text-textSecondary leading-relaxed">Required for the site to function. These store your theme preference, sidebar state, and cookie consent choice. These cannot be disabled.</p>
              </div>
              <div className="bg-surfaceHighlight rounded-xl p-4 border border-border/40">
                <p className="text-sm font-bold text-textPrimary mb-1">📊 Analytics Cookies (Google Analytics / GA4)</p>
                <p className="text-xs text-textSecondary leading-relaxed">Help us understand how users interact with ProGall. Analytics data is anonymized and aggregated. We use this to improve content and performance. You may opt out via <a href="https://tools.google.com/dlpage/gaoptout" target="_blank" rel="noopener noreferrer" className="text-accent hover:underline">Google Analytics Opt-out</a>.</p>
              </div>
              <div className="bg-surfaceHighlight rounded-xl p-4 border border-border/40">
                <p className="text-sm font-bold text-textPrimary mb-1">📢 Advertising Cookies (Google AdSense)</p>
                <p className="text-xs text-textSecondary leading-relaxed">
                  ProGall uses Google AdSense to display advertisements. Google and its partners use cookies to serve ads based on your prior visits to this website and other websites. These ads help us keep ProGall free.
                  <br /><br />
                  Google's use of advertising cookies enables it and its partners to serve ads to your users based on their visit to your sites and/or other sites on the Internet. You may opt out of personalized advertising by visiting <a href="https://www.google.com/settings/ads" target="_blank" rel="noopener noreferrer" className="text-accent hover:underline">Google Ad Settings</a> or <a href="https://www.aboutads.info" target="_blank" rel="noopener noreferrer" className="text-accent hover:underline">aboutads.info</a>.
                </p>
              </div>
            </div>
          </SectionCard>

          {/* 3. How We Use Your Data */}
          <SectionCard icon={<Eye size={18} />} title="3. How We Use Your Data">
            <ul className="list-disc pl-5 space-y-2 text-textSecondary text-sm">
              <li>To provide, operate, and maintain the ProGall service.</li>
              <li>To improve user experience by analyzing popular categories and search trends.</li>
              <li>To display relevant, personalized advertisements through Google AdSense.</li>
              <li>To monitor and analyze site performance and technical reliability.</li>
              <li>To detect, prevent, and address technical issues or abuse.</li>
              <li>To respond to your inquiries when you contact us.</li>
            </ul>
          </SectionCard>

          {/* 4. Third-Party Services */}
          <SectionCard icon={<Users size={18} />} title="4. Third-Party Services">
            <p className="text-textSecondary text-sm leading-relaxed mb-4">
              We rely on trusted third-party providers to operate ProGall. Each has its own privacy policy governing data it processes:
            </p>
            <div className="space-y-3 text-sm">
              <div className="flex gap-3">
                <span className="font-semibold text-textPrimary w-40 flex-shrink-0">Supabase</span>
                <span className="text-textSecondary">Database hosting and backend infrastructure. <a href="https://supabase.com/privacy" target="_blank" rel="noopener noreferrer" className="text-accent hover:underline">Privacy Policy</a></span>
              </div>
              <div className="flex gap-3">
                <span className="font-semibold text-textPrimary w-40 flex-shrink-0">Google Analytics</span>
                <span className="text-textSecondary">Website traffic analysis. <a href="https://policies.google.com/privacy" target="_blank" rel="noopener noreferrer" className="text-accent hover:underline">Privacy Policy</a></span>
              </div>
              <div className="flex gap-3">
                <span className="font-semibold text-textPrimary w-40 flex-shrink-0">Google AdSense</span>
                <span className="text-textSecondary">Advertising platform. <a href="https://policies.google.com/privacy" target="_blank" rel="noopener noreferrer" className="text-accent hover:underline">Privacy Policy</a></span>
              </div>
              <div className="flex gap-3">
                <span className="font-semibold text-textPrimary w-40 flex-shrink-0">Vercel / CDN</span>
                <span className="text-textSecondary">Hosting and content delivery network. <a href="https://vercel.com/legal/privacy-policy" target="_blank" rel="noopener noreferrer" className="text-accent hover:underline">Privacy Policy</a></span>
              </div>
            </div>
          </SectionCard>

          {/* 5. Data Retention */}
          <SectionCard icon={<Lock size={18} />} title="5. Data Retention">
            <p className="text-textSecondary text-sm leading-relaxed">
              We retain anonymized analytics data for up to 26 months, after which it is automatically deleted per Google Analytics' default retention settings. Contact data submitted through our Contact page is retained for up to 12 months. Cookie preferences stored in your browser persist until you clear your browser data or withdraw consent.
            </p>
          </SectionCard>

          {/* 6. Your Rights (GDPR) */}
          <SectionCard icon={<Shield size={18} />} title="6. Your Rights (GDPR &amp; Privacy Laws)">
            <p className="text-textSecondary text-sm leading-relaxed mb-4">
              If you are located in the European Union, UK, or California (CCPA), you have the following rights:
            </p>
            <ul className="list-disc pl-5 space-y-2 text-textSecondary text-sm">
              <li><strong className="text-textPrimary">Access:</strong> Request a copy of the personal data we hold about you.</li>
              <li><strong className="text-textPrimary">Erasure:</strong> Request deletion of your personal data.</li>
              <li><strong className="text-textPrimary">Portability:</strong> Request your data in a machine-readable format.</li>
              <li><strong className="text-textPrimary">Objection:</strong> Object to processing of your data for advertising purposes.</li>
              <li><strong className="text-textPrimary">Withdraw Consent:</strong> Withdraw cookie consent at any time by clearing your browser cookies or using browser privacy settings.</li>
            </ul>
            <p className="text-textSecondary text-sm mt-4">
              To exercise any of these rights, contact us at <a href="mailto:support@progall.tech" className="text-accent hover:underline">support@progall.tech</a>.
            </p>
          </SectionCard>

          {/* 7. Children's Privacy */}
          <SectionCard icon={<AlertTriangle size={18} />} title="7. Children's Privacy">
            <p className="text-textSecondary text-sm leading-relaxed">
              ProGall is not directed to children under the age of 13. We do not knowingly collect personal information from children under 13. If you believe a child has provided us with personal information, please contact us at <a href="mailto:support@progall.tech" className="text-accent hover:underline">support@progall.tech</a> and we will promptly delete it.
            </p>
          </SectionCard>

          {/* 8. Contact */}
          <SectionCard icon={<Mail size={18} />} title="8. Contact Us About Privacy">
            <p className="text-textSecondary text-sm leading-relaxed">
              If you have any questions, concerns, or requests regarding this Privacy Policy or your personal data, please contact us:
            </p>
            <div className="mt-4 bg-surfaceHighlight rounded-xl p-4 border border-border/40">
              <p className="text-sm text-textPrimary font-semibold">ProGall Privacy Team</p>
              <a href="mailto:support@progall.tech" className="text-sm text-accent hover:underline">support@progall.tech</a>
              <p className="text-xs text-textSecondary mt-1">We typically respond within 2 business days.</p>
            </div>
          </SectionCard>

        </div>
      </div>
    </div>
  );
};

export default Privacy;
