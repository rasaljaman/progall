import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import SEO from '../components/SEO';
import { Mail, MessageSquare, User, Send, CheckCircle, Instagram, HelpCircle, Clock } from 'lucide-react';

const Contact: React.FC = () => {
  useEffect(() => { window.scrollTo(0, 0); }, []);

  const [form, setForm] = useState({ name: '', email: '', subject: '', message: '' });
  const [submitted, setSubmitted] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    setForm(prev => ({ ...prev, [e.target.name]: e.target.value }));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    // Build mailto link as a functional fallback
    const mailtoLink = `mailto:support@progall.tech?subject=${encodeURIComponent(form.subject || 'Contact from ProGall')}&body=${encodeURIComponent(`Name: ${form.name}\nEmail: ${form.email}\n\n${form.message}`)}`;
    window.location.href = mailtoLink;
    setTimeout(() => {
      setLoading(false);
      setSubmitted(true);
    }, 800);
  };

  const isValid = form.name.trim() && form.email.includes('@') && form.message.trim().length > 10;

  return (
    <div className="min-h-screen bg-background text-textPrimary pt-32 pb-20 px-6 page-enter">
      <SEO
        title="Contact Us"
        description="Get in touch with the ProGall team. We're here to help with prompt questions, feature requests, and feedback."
        url="https://progall.tech/contact"
      />
      <div className="max-w-5xl mx-auto">

        {/* Header */}
        <div className="text-center mb-12">
          <span className="text-accent text-xs font-bold tracking-wider uppercase">Get in Touch</span>
          <h1 className="text-4xl font-bold mt-2 mb-4">Contact Us</h1>
          <p className="text-textSecondary max-w-lg mx-auto leading-relaxed">
            Have a question about a prompt, a feature suggestion, or a collaboration idea? We'd love to hear from you.
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-5 gap-8">

          {/* Left: Contact Info */}
          <div className="lg:col-span-2 space-y-6">

            {/* Email */}
            <div className="bg-surface border border-surfaceHighlight rounded-2xl p-6">
              <div className="flex items-center gap-3 mb-3">
                <div className="w-9 h-9 rounded-xl bg-accent/10 flex items-center justify-center text-accent">
                  <Mail size={18} />
                </div>
                <h2 className="font-bold text-textPrimary">Email</h2>
              </div>
              <a href="mailto:support@progall.tech" className="text-accent hover:underline text-sm font-medium">
                support@progall.tech
              </a>
              <div className="flex items-center gap-1.5 mt-2">
                <Clock size={12} className="text-textSecondary" />
                <p className="text-xs text-textSecondary">Typically responds within 24–48 hours</p>
              </div>
            </div>

            {/* Social */}
            <div className="bg-surface border border-surfaceHighlight rounded-2xl p-6">
              <div className="flex items-center gap-3 mb-4">
                <div className="w-9 h-9 rounded-xl bg-pink-500/10 flex items-center justify-center text-pink-500">
                  <Instagram size={18} />
                </div>
                <h2 className="font-bold text-textPrimary">Social Media</h2>
              </div>
              <div className="space-y-2">
                <a
                  href="https://www.instagram.com/progall_"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-2 text-sm text-textSecondary hover:text-accent transition-colors"
                >
                  <Instagram size={14} />
                  @progall_ on Instagram
                </a>
                <a
                  href="https://www.threads.net/@progall_"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-2 text-sm text-textSecondary hover:text-accent transition-colors"
                >
                  <MessageSquare size={14} />
                  @progall_ on Threads
                </a>
              </div>
            </div>

            {/* FAQ link */}
            <div className="bg-accent/5 border border-accent/20 rounded-2xl p-6">
              <div className="flex items-center gap-3 mb-3">
                <div className="w-9 h-9 rounded-xl bg-accent/10 flex items-center justify-center text-accent">
                  <HelpCircle size={18} />
                </div>
                <h2 className="font-bold text-textPrimary">Common Questions</h2>
              </div>
              <p className="text-sm text-textSecondary mb-3">
                Check our FAQ before reaching out — your answer may already be there.
              </p>
              <Link
                to="/faq"
                className="inline-flex items-center gap-2 text-sm text-accent font-semibold hover:underline"
              >
                Browse the FAQ →
              </Link>
            </div>
          </div>

          {/* Right: Contact Form */}
          <div className="lg:col-span-3">
            <div className="bg-surface border border-surfaceHighlight rounded-2xl p-8">

              {submitted ? (
                <div className="flex flex-col items-center justify-center py-12 text-center gap-4">
                  <div className="w-16 h-16 rounded-full bg-green-500/10 flex items-center justify-center text-green-500">
                    <CheckCircle size={32} />
                  </div>
                  <h2 className="text-xl font-bold text-textPrimary">Message Sent!</h2>
                  <p className="text-textSecondary text-sm max-w-xs">
                    Your default email client has opened with the pre-filled message. We'll get back to you within 24–48 hours.
                  </p>
                  <button
                    onClick={() => { setSubmitted(false); setForm({ name: '', email: '', subject: '', message: '' }); }}
                    className="mt-2 text-sm text-accent hover:underline"
                  >
                    Send another message
                  </button>
                </div>
              ) : (
                <form onSubmit={handleSubmit} className="space-y-5" aria-label="Contact form">
                  <h2 className="text-xl font-bold text-textPrimary mb-6">Send us a Message</h2>

                  {/* Name */}
                  <div>
                    <label htmlFor="contact-name" className="block text-xs font-semibold text-textSecondary uppercase tracking-wide mb-1.5">
                      Your Name *
                    </label>
                    <div className="relative">
                      <User size={15} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-textSecondary" />
                      <input
                        id="contact-name"
                        type="text"
                        name="name"
                        value={form.name}
                        onChange={handleChange}
                        required
                        placeholder="e.g. Alex Johnson"
                        className="w-full bg-surfaceHighlight border border-border rounded-xl pl-10 pr-4 py-3 text-sm focus:ring-2 focus:ring-accent/30 focus:border-accent outline-none placeholder:text-textSecondary/40 transition-all"
                      />
                    </div>
                  </div>

                  {/* Email */}
                  <div>
                    <label htmlFor="contact-email" className="block text-xs font-semibold text-textSecondary uppercase tracking-wide mb-1.5">
                      Email Address *
                    </label>
                    <div className="relative">
                      <Mail size={15} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-textSecondary" />
                      <input
                        id="contact-email"
                        type="email"
                        name="email"
                        value={form.email}
                        onChange={handleChange}
                        required
                        placeholder="you@example.com"
                        className="w-full bg-surfaceHighlight border border-border rounded-xl pl-10 pr-4 py-3 text-sm focus:ring-2 focus:ring-accent/30 focus:border-accent outline-none placeholder:text-textSecondary/40 transition-all"
                      />
                    </div>
                  </div>

                  {/* Subject */}
                  <div>
                    <label htmlFor="contact-subject" className="block text-xs font-semibold text-textSecondary uppercase tracking-wide mb-1.5">
                      Subject
                    </label>
                    <select
                      id="contact-subject"
                      name="subject"
                      value={form.subject}
                      onChange={handleChange}
                      className="w-full bg-surfaceHighlight border border-border rounded-xl px-4 py-3 text-sm focus:ring-2 focus:ring-accent/30 focus:border-accent outline-none text-textPrimary transition-all"
                    >
                      <option value="">Select a topic…</option>
                      <option value="Prompt Question">Prompt Question</option>
                      <option value="Feature Request">Feature Request</option>
                      <option value="Report an Issue">Report an Issue</option>
                      <option value="Collaboration / Partnership">Collaboration / Partnership</option>
                      <option value="Other">Other</option>
                    </select>
                  </div>

                  {/* Message */}
                  <div>
                    <label htmlFor="contact-message" className="block text-xs font-semibold text-textSecondary uppercase tracking-wide mb-1.5">
                      Message *
                    </label>
                    <div className="relative">
                      <MessageSquare size={15} className="absolute left-3.5 top-3.5 text-textSecondary" />
                      <textarea
                        id="contact-message"
                        name="message"
                        value={form.message}
                        onChange={handleChange}
                        required
                        rows={5}
                        placeholder="Tell us how we can help…"
                        className="w-full bg-surfaceHighlight border border-border rounded-xl pl-10 pr-4 py-3 text-sm focus:ring-2 focus:ring-accent/30 focus:border-accent outline-none placeholder:text-textSecondary/40 transition-all resize-none"
                      />
                    </div>
                    <p className="text-[11px] text-textSecondary mt-1">{form.message.length} / 1000 characters</p>
                  </div>

                  <button
                    id="contact-submit-btn"
                    type="submit"
                    disabled={!isValid || loading}
                    className="w-full flex items-center justify-center gap-2 py-3.5 rounded-xl bg-gradient-to-r from-accent to-teal-500 text-white font-bold text-sm hover:opacity-90 active:scale-[.98] transition-all disabled:opacity-40 disabled:cursor-not-allowed shadow-sm"
                  >
                    {loading ? (
                      <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                    ) : (
                      <><Send size={15} /> Send Message</>
                    )}
                  </button>
                </form>
              )}
            </div>
          </div>

        </div>
      </div>
    </div>
  );
};

export default Contact;
