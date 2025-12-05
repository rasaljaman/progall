import React from 'react';
import { Mail } from 'lucide-react';

const Contact: React.FC = () => {
  return (
    <div className="max-w-4xl mx-auto px-4 py-12">
      <h1 className="text-3xl font-bold text-white mb-6">Contact Us</h1>
      <div className="bg-surface border border-surfaceHighlight rounded-xl p-8">
        <p className="text-textSecondary mb-6">
          Have questions about a prompt? Want to suggest a feature? We'd love to hear from you.
        </p>
        
        <div className="flex items-center gap-4 text-white">
          <div className="bg-accent/10 p-3 rounded-full text-accent">
            <Mail size={24} />
          </div>
          <div>
            <p className="text-sm text-gray-400">Email us at</p>
            <a href="mailto:support@progall.tech" className="text-lg font-medium hover:text-accent transition-colors">
              support@progall.tech
            </a>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Contact;
