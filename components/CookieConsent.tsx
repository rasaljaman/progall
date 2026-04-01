import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Cookie, X, Shield, ChevronDown, ChevronUp } from 'lucide-react';

type ConsentState = 'accepted' | 'declined' | null;

const COOKIE_KEY = 'progall_cookie_consent';

const CookieConsent: React.FC = () => {
  const [consent, setConsent] = useState<ConsentState>(null);
  const [showDetails, setShowDetails] = useState(false);
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const stored = localStorage.getItem(COOKIE_KEY) as ConsentState;
    if (!stored) {
      // Slight delay so it doesn't flash immediately on load
      const timer = setTimeout(() => setVisible(true), 1200);
      return () => clearTimeout(timer);
    } else {
      setConsent(stored);
    }
  }, []);

  const handleAccept = () => {
    localStorage.setItem(COOKIE_KEY, 'accepted');
    setConsent('accepted');
    setVisible(false);
  };

  const handleDecline = () => {
    localStorage.setItem(COOKIE_KEY, 'declined');
    setConsent('declined');
    setVisible(false);
  };

  if (!visible || consent !== null) return null;

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-label="Cookie consent"
      className="fixed bottom-4 left-4 right-4 sm:left-auto sm:right-4 sm:max-w-sm z-[9999] animate-slide-up"
    >
      <div className="bg-surface border border-border/60 rounded-2xl shadow-2xl overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between px-5 pt-5 pb-3">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-accent/10 flex items-center justify-center text-accent flex-shrink-0">
              <Cookie size={18} />
            </div>
            <div>
              <p className="text-sm font-bold text-textPrimary">Cookie Preferences</p>
              <p className="text-[11px] text-textSecondary">We respect your privacy</p>
            </div>
          </div>
          <button
            onClick={handleDecline}
            aria-label="Dismiss cookie banner"
            className="text-textSecondary hover:text-textPrimary transition-colors p-1 rounded-lg hover:bg-surfaceHighlight"
          >
            <X size={16} />
          </button>
        </div>

        {/* Body */}
        <div className="px-5 pb-4">
          <p className="text-xs text-textSecondary leading-relaxed">
            We use cookies to improve your experience, analyse traffic via Google Analytics, and display relevant ads via Google AdSense.
          </p>

          {/* Details toggle */}
          <button
            onClick={() => setShowDetails(s => !s)}
            className="mt-2 flex items-center gap-1 text-[11px] text-accent font-medium hover:underline"
          >
            {showDetails ? <ChevronUp size={12} /> : <ChevronDown size={12} />}
            {showDetails ? 'Hide details' : 'Learn more'}
          </button>

          {showDetails && (
            <div className="mt-3 space-y-2 bg-surfaceHighlight rounded-xl p-3 border border-border/40">
              <div className="flex items-start gap-2">
                <Shield size={12} className="text-accent mt-0.5 flex-shrink-0" />
                <div>
                  <p className="text-[11px] font-semibold text-textPrimary">Essential Cookies</p>
                  <p className="text-[10px] text-textSecondary">Theme preference, session state. Always active.</p>
                </div>
              </div>
              <div className="flex items-start gap-2">
                <Shield size={12} className="text-blue-400 mt-0.5 flex-shrink-0" />
                <div>
                  <p className="text-[11px] font-semibold text-textPrimary">Analytics (Google Analytics)</p>
                  <p className="text-[10px] text-textSecondary">Helps us understand which prompts are popular.</p>
                </div>
              </div>
              <div className="flex items-start gap-2">
                <Shield size={12} className="text-purple-400 mt-0.5 flex-shrink-0" />
                <div>
                  <p className="text-[11px] font-semibold text-textPrimary">Advertising (Google AdSense)</p>
                  <p className="text-[10px] text-textSecondary">Powers relevant ads that keep ProGall free.</p>
                </div>
              </div>
              <Link
                to="/privacy"
                onClick={handleDecline}
                className="text-[11px] text-accent hover:underline block mt-1"
              >
                Read our full Privacy Policy →
              </Link>
            </div>
          )}
        </div>

        {/* Actions */}
        <div className="flex gap-2 px-5 pb-5">
          <button
            id="cookie-accept-btn"
            onClick={handleAccept}
            className="flex-1 py-2.5 rounded-xl text-xs font-bold bg-gradient-to-r from-accent to-teal-500 text-white hover:opacity-90 transition-all active:scale-95 shadow-sm"
          >
            Accept All
          </button>
          <button
            id="cookie-decline-btn"
            onClick={handleDecline}
            className="flex-1 py-2.5 rounded-xl text-xs font-semibold bg-surfaceHighlight text-textSecondary border border-border/60 hover:text-textPrimary hover:border-accent/30 transition-all active:scale-95"
          >
            Decline
          </button>
        </div>
      </div>
    </div>
  );
};

export default CookieConsent;
