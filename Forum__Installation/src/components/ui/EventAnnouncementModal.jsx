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
            initial={{ opacity: 0, scale: 0.95, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 20 }}
            transition={{ type: 'spring', damping: 25, stiffness: 300 }}
            className="relative w-full max-w-[440px] bg-[#121417]/95 border border-white/15 backdrop-blur-2xl rounded-[28px] shadow-[0_20px_60px_rgba(0,0,0,0.9),0_0_0_1px_rgba(255,255,255,0.05)] overflow-hidden my-auto p-6 sm:p-7 text-center select-none"
          >
            {/* Top Bar: Tech Pill + Notification Bell + Close Button */}
            <div className="flex items-center justify-between mb-4 relative z-10">
              {/* Left Badge */}
              <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-white/10 border border-white/15 text-white text-xs font-semibold">
                <span className="text-white text-xs font-bold">•</span>
                <span>ACES</span>
              </div>

              {/* Center Notification Bell */}
              <div className="relative flex items-center justify-center">
                <div className="w-12 h-12 rounded-full bg-white/10 border border-white/20 flex items-center justify-center text-white shadow-lg">
                  <Bell className="w-6 h-6 text-white" />
                </div>
              </div>

              {/* Close Button */}
              <button
                onClick={handleClose}
                className="w-9 h-9 rounded-full bg-white/5 hover:bg-white/15 border border-white/10 text-neutral-400 hover:text-white flex items-center justify-center transition-colors cursor-pointer"
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
              <h3 className="text-2xl sm:text-3xl font-bold tracking-widest text-neutral-400 uppercase font-sans">
                PLEASE
              </h3>
            </div>

            {/* Divider */}
            <div className="w-16 h-[1px] bg-white/20 mx-auto my-3" />

            {/* Notification Text */}
            <p className="text-neutral-300 text-xs sm:text-sm leading-relaxed mb-4 font-sans">
              This is to notify that <span className="text-white font-semibold">Registrations are officially LIVE</span> for our mega tech challenge:
            </p>

            {/* Highlighted Event & Date Card */}
            <div className="relative rounded-2xl bg-black/40 border border-white/10 p-4 mb-4">
              {/* Event Date Badge */}
              <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-white/10 border border-white/15 text-white text-xs font-semibold mb-3">
                <Calendar size={14} className="text-white shrink-0" />
                <span>22-09-2026 (22-09-26)</span>
              </div>

              {/* Event Name */}
              <h4 className="text-xl sm:text-2xl font-bold text-white tracking-wide mb-1 font-sans">
                BUILDX
              </h4>
              <p className="text-xs text-neutral-400 font-medium mb-3 font-sans">
                Build. Break. Adapt. Repeat.
              </p>

              {/* Event Details Chips */}
              <div className="grid grid-cols-2 gap-2 text-xs font-medium text-neutral-300 pt-2 border-t border-white/10">
                <div className="bg-white/5 rounded-lg py-1.5 px-2 flex items-center justify-center gap-1.5 text-neutral-200">
                  <Users size={13} className="text-white" />
                  <span>2 to 4 Members</span>
                </div>
                <div className="bg-white/5 rounded-lg py-1.5 px-2 flex items-center justify-center gap-1.5 text-neutral-200">
                  <Zap size={13} className="text-white" />
                  <span>Entry Fee: ₹200</span>
                </div>
              </div>
            </div>

            {/* Venue & Urgency Info Box */}
            <div className="flex items-center gap-3 p-3 rounded-xl bg-white/[0.03] border border-white/10 text-left mb-5">
              <div className="w-9 h-9 rounded-lg bg-white/10 border border-white/15 flex items-center justify-center text-white shrink-0">
                <Building2 size={18} />
              </div>
              <div className="text-xs">
                <p className="text-white font-semibold leading-tight font-sans">
                  Suryodaya College of Engg. & Tech.
                </p>
                <p className="text-neutral-400 text-[11px] mt-0.5 font-sans">
                  Limited to 60 Teams • Live seats filling fast!
                </p>
              </div>
            </div>

            {/* CTA Button: Registrations are Live — Register Now */}
            <motion.button
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              onClick={handleRegisterCTA}
              className="group relative w-full py-3.5 px-5 bg-white text-black font-bold rounded-full text-sm sm:text-base tracking-wide transition-all hover:bg-neutral-200 shadow-[0_4px_20px_rgba(255,255,255,0.15)] flex items-center justify-center gap-2 overflow-hidden mb-3.5 cursor-pointer"
            >
              <Sparkles size={16} className="text-black" />
              <span>Registrations are Live — Register Now</span>
              <ChevronRight size={18} className="text-black group-hover:translate-x-1 transition-transform" />
            </motion.button>

            {/* Bottom Footer Accent */}
            <div className="flex items-center justify-center text-[11px] text-neutral-500 pt-1">
              <span>Tap button to view Upcoming Events</span>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}
