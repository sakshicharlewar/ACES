import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Bell, Calendar, X, Users, Sparkles, Building2, ChevronRight, Zap, Flame } from 'lucide-react';

const STORAGE_KEY = 'aces_announcement_seen_v2';

export default function EventAnnouncementModal() {
  // Show only once when website is initially opened in a session
  const [isOpen, setIsOpen] = useState(() => {
    try {
      return !sessionStorage.getItem(STORAGE_KEY);
    } catch {
      return true;
    }
  });

  useEffect(() => {
    // Hide floating events button whenever this modal is open
    if (isOpen) {
      window.dispatchEvent(new CustomEvent('toggleFloatingButton', { detail: false }));
    }
  }, [isOpen]);

  useEffect(() => {
    const handleReopen = () => {
      setIsOpen(true);
      window.dispatchEvent(new CustomEvent('toggleFloatingButton', { detail: false }));
    };
    window.addEventListener('openAnnouncementModal', handleReopen);

    return () => {
      window.removeEventListener('openAnnouncementModal', handleReopen);
    };
  }, []);

  const handleClose = () => {
    try {
      sessionStorage.setItem(STORAGE_KEY, 'true');
    } catch {}
    setIsOpen(false);
    window.dispatchEvent(new CustomEvent('toggleFloatingButton', { detail: true }));
  };

  const handleRegisterCTA = () => {
    try {
      sessionStorage.setItem(STORAGE_KEY, 'true');
    } catch {}
    setIsOpen(false);

    // Open Google Form directly
    window.open("https://forms.gle/HtQ597VEWiioLZFj9", "_blank", "noopener,noreferrer");
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
            initial={{ opacity: 0, scale: 0.92, y: 24 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.92, y: 24 }}
            transition={{ type: 'spring', damping: 26, stiffness: 320 }}
            className="relative w-full max-w-[460px] bg-[#0E1015]/95 border border-white/20 backdrop-blur-2xl rounded-[32px] shadow-[0_25px_70px_rgba(0,0,0,0.95),0_0_40px_rgba(251,191,36,0.12)] overflow-hidden my-auto p-6 sm:p-7 text-center select-none"
          >
            {/* Ambient Background Glow */}
            <div className="absolute top-0 right-0 w-44 h-44 bg-amber-500/10 rounded-full blur-3xl pointer-events-none" />
            <div className="absolute bottom-0 left-0 w-44 h-44 bg-purple-500/10 rounded-full blur-3xl pointer-events-none" />

            {/* Top Bar: Live Badge + Notification Bell + Close Button */}
            <div className="flex items-center justify-between mb-4 relative z-10">
              {/* Left Live Badge */}
              <div className="flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/25 text-emerald-300 text-xs font-semibold font-sans">
                <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                <span>MEGA EVENT LIVE</span>
              </div>

              {/* Center Notification Bell with Glow */}
              <div className="relative flex items-center justify-center">
                <div className="w-12 h-12 rounded-2xl bg-amber-500/15 border border-amber-500/30 flex items-center justify-center text-amber-300 shadow-[0_0_20px_rgba(251,191,36,0.25)]">
                  <Bell className="w-6 h-6 text-amber-300" />
                </div>
              </div>

              {/* Close Button */}
              <button
                onClick={handleClose}
                className="w-9 h-9 rounded-full bg-white/5 hover:bg-white/15 border border-white/15 text-neutral-400 hover:text-white flex items-center justify-center transition-all cursor-pointer hover:scale-110 active:scale-95"
                aria-label="Close Notice"
              >
                <X size={18} />
              </button>
            </div>

            {/* Main Title Heading */}
            <div className="mb-2">
              <h2 className="text-2xl sm:text-3xl font-black tracking-wider text-white uppercase font-sans">
                ATTENTION PLEASE
              </h2>
              <p 
                className="text-amber-200 text-base sm:text-lg font-serif italic mt-0.5"
                style={{ fontFamily: "'Cormorant Garamond', serif" }}
              >
                Official Department Announcement
              </p>
            </div>

            {/* Divider */}
            <div className="w-20 h-[1px] bg-gradient-to-r from-transparent via-amber-200/50 to-transparent mx-auto my-3" />

            {/* Notification Text */}
            <p className="text-neutral-300 text-xs sm:text-sm leading-relaxed mb-4 font-sans">
              Registrations are officially <span className="text-white font-bold underline decoration-amber-300 underline-offset-2">LIVE</span> for our flagship tech innovation challenge:
            </p>

            {/* Highlighted Event & Date Card */}
            <div className="relative rounded-2xl bg-gradient-to-br from-white/[0.07] via-white/[0.03] to-transparent border border-white/15 p-4 sm:p-5 mb-4 backdrop-blur-md shadow-inner">
              {/* Event Date Badge */}
              <div className="inline-flex items-center gap-2 px-3.5 py-1 rounded-full bg-amber-500/15 border border-amber-500/30 text-amber-200 text-xs font-bold mb-2.5 font-sans">
                <Calendar size={13} className="text-amber-300 shrink-0" />
                <span>📅 22 September 2026 (22-09-26)</span>
              </div>

              {/* Event Name */}
              <h4 className="text-2xl sm:text-3xl font-black text-white tracking-wide mb-1 font-sans">
                BUILDX
              </h4>
              <p 
                className="text-xs sm:text-sm text-amber-100/90 font-serif italic mb-3"
                style={{ fontFamily: "'Cormorant Garamond', serif" }}
              >
                "Build. Break. Adapt. Repeat."
              </p>

              {/* Event Details 4 Color Badges */}
              <div className="grid grid-cols-2 gap-2 text-xs font-medium pt-2.5 border-t border-white/10 font-sans">
                <div className="bg-sky-500/10 border border-sky-500/25 rounded-xl py-2 px-2.5 flex items-center justify-center gap-1.5 text-sky-200">
                  <Users size={13} className="text-sky-300 shrink-0" />
                  <span>2 to 4 Members</span>
                </div>
                <div className="bg-emerald-500/10 border border-emerald-500/25 rounded-xl py-2 px-2.5 flex items-center justify-center gap-1.5 text-emerald-200 font-semibold">
                  <Zap size={13} className="text-emerald-300 shrink-0" />
                  <span>Entry: ₹200</span>
                </div>
                <div className="bg-purple-500/10 border border-purple-500/25 rounded-xl py-2 px-2.5 col-span-2 flex items-center justify-center gap-1.5 text-purple-200">
                  <Flame size={13} className="text-red-400 shrink-0" />
                  <span className="text-red-300 font-bold">🔥 Limited to 60 Teams • Seats Filling Fast!</span>
                </div>
              </div>
            </div>

            {/* Venue Info Box */}
            <div className="flex items-center gap-3 p-3 rounded-xl bg-white/[0.04] border border-white/10 text-left mb-5">
              <div className="w-9 h-9 rounded-xl bg-white/10 border border-white/15 flex items-center justify-center text-amber-200 shrink-0">
                <Building2 size={18} />
              </div>
              <div className="text-xs">
                <p className="text-white font-semibold leading-tight font-sans">
                  Suryodaya College of Engg. &amp; Tech., Nagpur
                </p>
                <p className="text-neutral-400 text-[11px] mt-0.5 font-sans">
                  Department of Computer Engineering (ACES)
                </p>
              </div>
            </div>

            {/* CTA Button: Registrations are Live — Register Now */}
            <motion.button
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              onClick={handleRegisterCTA}
              className="group relative w-full py-4 px-5 bg-gradient-to-r from-amber-200 via-white to-amber-100 text-black font-extrabold rounded-full text-sm sm:text-base tracking-wide transition-all shadow-[0_0_30px_rgba(251,191,36,0.45)] hover:shadow-[0_0_40px_rgba(251,191,36,0.65)] flex items-center justify-center gap-2 overflow-hidden mb-3 cursor-pointer font-sans"
            >
              <Sparkles size={17} className="text-black" />
              <span>Register for BUILDX Now</span>
              <ChevronRight size={19} className="text-black group-hover:translate-x-1 transition-transform" />
            </motion.button>

            {/* Dismiss link */}
            <button
              onClick={handleClose}
              className="text-xs text-neutral-400 hover:text-white transition-colors cursor-pointer font-sans hover:underline underline-offset-4"
            >
              Maybe later • Continue to website
            </button>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}
