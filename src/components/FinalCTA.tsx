import { useState } from 'react';
import { motion } from 'framer-motion';
import { Mail, ArrowRight, Download, Shield, CheckCircle } from 'lucide-react';
import { useBreach } from '../App';

export function FinalCTA() {
  const { isSystemUnderAttack } = useBreach();
  const [email, setEmail] = useState('');
  const [submitted, setSubmitted] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (email) {
      setSubmitted(true);
      setTimeout(() => {
        setSubmitted(false);
        setEmail('');
      }, 3000);
    }
  };

  return (
    <div className="py-12 px-6">
      <motion.div
        initial={{ opacity: 0, y: 30 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true }}
        className={`max-w-4xl mx-auto rounded-3xl overflow-hidden ${
          isSystemUnderAttack 
            ? 'bg-gradient-to-br from-[rgba(255,46,99,0.15)] to-[rgba(255,46,99,0.05)] border border-[rgba(255,46,99,0.3)]'
            : 'bg-gradient-to-br from-[rgba(0,245,255,0.15)] to-[rgba(139,92,246,0.05)] border border-[rgba(0,245,255,0.3)]'
        }`}
      >
        <div className="p-8 md:p-12">
          {/* Header */}
          <div className="text-center mb-8">
            <motion.div
              initial={{ scale: 0 }}
              whileInView={{ scale: 1 }}
              viewport={{ once: true }}
              className={`inline-flex items-center justify-center w-16 h-16 rounded-2xl mb-6 ${
                isSystemUnderAttack ? 'bg-[#FF2E63]/20' : 'bg-[#00F5FF]/20'
              }`}
            >
              <Shield className={`w-8 h-8 ${isSystemUnderAttack ? 'text-[#FF2E63]' : 'text-[#00F5FF]'}`} strokeWidth={1.5} />
            </motion.div>
            
            <h2 className={`font-heading text-3xl md:text-4xl font-bold mb-4 ${
              isSystemUnderAttack ? 'text-[#FF2E63]' : 'text-[#F5F7FF]'
            }`}>
              Ready to Defend?
            </h2>
            <p className="text-[#A7B0C8] text-lg max-w-xl mx-auto">
              Talk to our team. Get a comprehensive threat assessment in 24 hours.
            </p>
          </div>

          {/* Email Form */}
          {!submitted ? (
            <form onSubmit={handleSubmit} className="max-w-md mx-auto mb-8">
              <div className="flex gap-3">
                <div className="flex-1 relative">
                  <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-[#A7B0C8]" strokeWidth={1.5} />
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="Enter your email"
                    className="w-full pl-12 pr-4 py-4 rounded-xl bg-[rgba(0,0,0,0.3)] border border-[rgba(0,245,255,0.2)] text-[#F5F7FF] placeholder-[#A7B0C8] focus:outline-none focus:border-[rgba(0,245,255,0.5)] transition-colors"
                  />
                </div>
                <motion.button
                  type="submit"
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  className={`px-6 py-4 rounded-xl font-micro text-sm tracking-widest uppercase flex items-center gap-2 transition-all duration-200 ${
                    isSystemUnderAttack
                      ? 'bg-[#FF2E63] text-white hover:bg-[#FF2E63]/90'
                      : 'bg-gradient-to-r from-[#00F5FF] to-[#8B5CF6] text-[#0A0A0C] font-semibold'
                  }`}
                >
                  Request Demo
                  <ArrowRight className="w-4 h-4" strokeWidth={1.5} />
                </motion.button>
              </div>
            </form>
          ) : (
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              className="max-w-md mx-auto mb-8 p-6 rounded-xl bg-[rgba(0,255,148,0.1)] border border-[rgba(0,255,148,0.3)] text-center"
            >
              <CheckCircle className="w-8 h-8 text-[#00FF94] mx-auto mb-2" strokeWidth={1.5} />
              <p className="text-[#00FF94] font-medium">Thank you! We&apos;ll be in touch soon.</p>
            </motion.div>
          )}

          {/* Secondary Actions */}
          <div className="flex flex-wrap justify-center gap-4 mb-8">
            <motion.button
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              className="flex items-center gap-2 px-5 py-3 rounded-xl border border-[rgba(0,245,255,0.3)] text-[#00F5FF] hover:bg-[rgba(0,245,255,0.1)] transition-colors"
            >
              <Download className="w-4 h-4" strokeWidth={1.5} />
              <span className="font-micro text-xs tracking-widest uppercase">Download Security Brief</span>
            </motion.button>
          </div>

          {/* Contact Info */}
          <div className="flex flex-wrap justify-center gap-6 text-sm text-[#A7B0C8]">
            <a href="mailto:contact@cyberrakshak.ai" className="hover:text-[#00F5FF] transition-colors">
              contact@cyberrakshak.ai
            </a>
            <span className="hidden md:inline">|</span>
            <a href="#" className="hover:text-[#00F5FF] transition-colors">Privacy Policy</a>
            <span className="hidden md:inline">|</span>
            <a href="#" className="hover:text-[#00F5FF] transition-colors">Terms of Service</a>
            <span className="hidden md:inline">|</span>
            <a href="#" className="hover:text-[#00F5FF] transition-colors">Security</a>
          </div>

          {/* Copyright */}
          <div className="mt-8 pt-6 border-t border-[rgba(255,255,255,0.05)] text-center">
            <p className="text-xs text-[#A7B0C8]">
              © 2026 CyberRakshak AI. All rights reserved. Autonomous Defense. Zero Downtime.
            </p>
          </div>
        </div>
      </motion.div>
    </div>
  );
}
