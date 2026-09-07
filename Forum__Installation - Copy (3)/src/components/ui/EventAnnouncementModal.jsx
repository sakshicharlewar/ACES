import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Bell, Calendar, X, Users, Sparkles, Building2, ChevronRight, Zap } from 'lucide-react';

export default function EventAnnouncementModal() {
  const [isOpen, setIsOpen] = useState(true);

  useEffect(() => {
    const handleReopen = () => setIsOpen(true);
    window.addEventListener('openAnnouncementModal', handleReopen);

    return () => {
      window.removeEventListener('openAnnouncementModal', handleReopen);
    };
  }, []);

  const handleClose = () => {
    setIsOpen(false);
  };

  const handleRegisterCTA = () => {
    setIsOpen(false);

    // Smooth scroll to Upcoming Events section
    const targetSection = document.getElementById('events-upcoming');
    if (targetSection) {
      targetSection.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }

    // Trigger the BUILDX registration modal
    setTimeout(() => {
      window.dispatchEvent(
        new CustomEvent('openEventRegistrationModal', { detail: { slug: 'buildx' } })
      );
    }, 450);
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 sm:p-6 overflow-y-auto">
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={handleClose}
            className="fixed inset-0 bg-black/85 backdrop-blur-md"
          />

          {/* Modal Container */}
          <motion.div
            initial={{ opacity: 0, scale: 0.9, y: 25 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.9, y: 25 }}
            transition={{ type: 'spring', damping: 25, stiffness: 300 }}
            className="relative w-full max-w-[440px] bg-gradient-to-b from-[#0D1424] via-[#090D18] to-[#050810] border border-cyan-500/35 rounded-[28px] shadow-[0_0_50px_rgba(6,182,212,0.25),0_20px_60px_rgba(0,0,0,0.9)] overflow-hidden my-auto p-6 sm:p-7 text-center select-none"
          >
            {/* Top Accent Neon Glow Bar */}
            <div className="absolute top-0 left-0 right-0 h-[3px] bg-gradient-to-r from-transparent via-cyan-400 to-transparent" />

            {/* Top Bar: Tech Pill + Notification Bell + Close Button */}
            <div className="flex items-center justify-between mb-4 relative z-10">
              {/* Left Tech Badge */}
              <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-cyan-950/60 border border-cyan-500/30 text-cyan-400 text-xs font-mono font-semibold shadow-[0_0_15px_rgba(6,182,212,0.2)]">
                <span className="text-cyan-400 text-sm font-black">+</span>
                <span>ACES</span>
              </div>

              {/* Center Notification Bell with Glow */}
              <div className="relative flex items-center justify-center">
                <div className="absolute -inset-1 rounded-full bg-cyan-400/20 blur-sm animate-pulse" />
                <div className="w-12 h-12 rounded-full bg-gradient-to-b from-cyan-900/50 to-blue-950/80 border border-cyan-400/40 flex items-center justify-center text-cyan-300 shadow-[0_0_20px_rgba(6,182,212,0.35)]">
                  <Bell className="w-6 h-6 animate-bounce text-cyan-300" />
                </div>
              </div>

              {/* Close Button */}
              <button
                onClick={handleClose}
                className="w-9 h-9 rounded-xl bg-white/5 hover:bg-white/15 border border-white/10 text-gray-400 hover:text-white flex items-center justify-center transition-colors cursor-pointer"
                aria-label="Close Notice"
              >
                <X size={18} />
              </button>
            </div>

            {/* Main Title Heading */}
            <div className="mb-2">
              <h2 className="text-2xl sm:text-3xl font-black tracking-wider text-white uppercase font-sans">
                ATTENTION
              </h2>
              <h3 className="text-2xl sm:text-3xl font-black tracking-widest text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 via-sky-300 to-blue-400 uppercase">
                PLEASE
              </h3>
            </div>

            {/* Glowing ECG / Waveform Divider */}
            <div className="flex items-center justify-center gap-2 my-2.5 opacity-80">
              <svg className="w-48 h-4 text-cyan-400" viewBox="0 0 160 16" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path
                  d="M0 8H55L62 2L68 14L74 4L80 12L86 8H160"
                  stroke="currentColor"
                  strokeWidth="1.8"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              </svg>
            </div>

            {/* Notification Text */}
            <p className="text-gray-300 text-xs sm:text-sm leading-relaxed mb-4">
              This is to notify that <span className="text-cyan-300 font-semibold">Registrations are officially LIVE</span> for our mega tech challenge:
            </p>

            {/* Highlighted Event & Date Card */}
            <div className="relative rounded-2xl bg-gradient-to-b from-[#111C30]/90 to-[#0A1120]/90 border border-cyan-500/40 p-4 mb-4 shadow-[inset_0_1px_1px_rgba(255,255,255,0.1),0_8px_24px_rgba(0,0,0,0.4)]">
              {/* Event Date Badge */}
              <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-xl bg-cyan-500/15 border border-cyan-400/40 text-cyan-200 text-sm font-bold mb-3 shadow-[0_0_15px_rgba(6,182,212,0.25)]">
                <Calendar size={16} className="text-cyan-400 shrink-0" />
                <span className="tracking-wide font-mono">22-09-2026 (22-09-26)</span>
              </div>

              {/* Event Name */}
              <h4 className="text-xl sm:text-2xl font-black text-white tracking-wide mb-1">
                BUILDX
              </h4>
              <p className="text-xs text-cyan-300/90 font-medium mb-3">
                Build. Break. Adapt. Repeat.
              </p>

              {/* Event Details Chips */}
              <div className="grid grid-cols-2 gap-2 text-[11px] font-medium text-gray-300 pt-1 border-t border-white/10">
                <div className="bg-black/30 rounded-lg py-1.5 px-2 flex items-center justify-center gap-1.5 text-blue-200">
                  <Users size={12} className="text-cyan-400" />
                  <span>2 to 4 Members</span>
                </div>
                <div className="bg-black/30 rounded-lg py-1.5 px-2 flex items-center justify-center gap-1.5 text-green-300">
                  <Zap size={12} className="text-green-400" />
                  <span>Entry Fee: ₹200</span>
                </div>
              </div>
            </div>

            {/* Venue & Urgency Info Box */}
            <div className="flex items-center gap-3 p-3 rounded-xl bg-white/[0.04] border border-white/10 text-left mb-5">
              <div className="w-9 h-9 rounded-lg bg-blue-500/20 border border-blue-500/30 flex items-center justify-center text-blue-400 shrink-0">
                <Building2 size={18} />
              </div>
              <div className="text-xs">
                <p className="text-white font-semibold leading-tight">
                  Suryodaya College of Engg. & Tech.
                </p>
                <p className="text-gray-400 text-[11px] mt-0.5">
                  Limited to 60 Teams • Live seats filling fast!
                </p>
              </div>
            </div>

            {/* CTA Button: Registrations are Live — Register Now */}
            <motion.button
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              onClick={handleRegisterCTA}
              className="group relative w-full py-3.5 px-5 bg-gradient-to-r from-blue-600 via-cyan-500 to-blue-600 hover:from-blue-500 hover:via-cyan-400 hover:to-blue-500 text-white font-bold rounded-xl text-sm sm:text-base tracking-wide transition-all shadow-[0_0_25px_rgba(6,182,212,0.45)] hover:shadow-[0_0_35px_rgba(6,182,212,0.7)] flex items-center justify-center gap-2 overflow-hidden mb-3.5 cursor-pointer"
            >
              <div className="absolute inset-0 bg-white/20 translate-x-[-100%] group-hover:translate-x-[100%] transition-transform duration-700 ease-in-out" />
              <Sparkles size={18} className="text-yellow-300 animate-spin" style={{ animationDuration: '4s' }} />
              <span>Registrations are Live — Register Now</span>
              <ChevronRight size={18} className="text-white group-hover:translate-x-1 transition-transform" />
            </motion.button>

            {/* Bottom Heartbeat Line & Footer Accent */}
            <div className="flex items-center justify-between text-[10px] text-gray-500 px-1 pt-1">
              <svg className="w-10 h-3 text-cyan-500/60" viewBox="0 0 40 10" fill="none">
                <path d="M0 5H15L18 1L22 9L25 5H40" stroke="currentColor" strokeWidth="1.5" />
              </svg>
              <span className="text-gray-400 font-mono">Tap button to view Upcoming Events</span>
              <svg className="w-10 h-3 text-cyan-500/60" viewBox="0 0 40 10" fill="none">
                <path d="M0 5H15L18 1L22 9L25 5H40" stroke="currentColor" strokeWidth="1.5" />
              </svg>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}
