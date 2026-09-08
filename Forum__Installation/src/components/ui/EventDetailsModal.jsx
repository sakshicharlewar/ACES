import React from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X, Sparkles, Layers, Target, ShieldCheck, ArrowRight } from "lucide-react";

export default function EventDetailsModal({ isOpen, onClose, onRegister }) {
  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-[110] flex items-center justify-center p-4 sm:p-6 overflow-y-auto font-sans">
        {/* Backdrop */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={onClose}
          className="fixed inset-0 bg-black/85 backdrop-blur-md"
        />

        {/* Modal Window */}
        <motion.div
          initial={{ opacity: 0, scale: 0.9, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.9, y: 20 }}
          transition={{ type: "spring", damping: 25, stiffness: 300 }}
          className="relative w-full max-w-2xl bg-[#0F0F12] border border-amber-500/30 rounded-3xl p-6 sm:p-8 shadow-[0_0_50px_rgba(251,191,36,0.2)] text-white z-10 max-h-[90vh] overflow-y-auto custom-scrollbar flex flex-col"
        >
          {/* Close button */}
          <button
            onClick={onClose}
            className="absolute top-4 right-4 sm:top-5 sm:right-5 w-9 h-9 rounded-full bg-white/10 hover:bg-white/20 border border-white/15 flex items-center justify-center text-white/80 hover:text-white transition-all cursor-pointer z-20"
          >
            <X size={18} />
          </button>

          {/* Header Badge & Title */}
          <div className="mb-5 pr-8">
            <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-amber-500/15 border border-amber-500/30 text-amber-300 text-xs font-bold uppercase tracking-wider mb-3">
              <Sparkles size={14} className="text-amber-400" />
              <span>Official Event Guide &amp; Structure</span>
            </div>
            
            <h2 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight leading-tight">
              🚀 BUILD X — <span className="bg-gradient-to-r from-amber-200 via-amber-400 to-amber-100 bg-clip-text text-transparent">Build for the City</span>
            </h2>
          </div>

          {/* Body Content */}
          <div className="space-y-4 text-sm sm:text-base text-neutral-300 leading-relaxed font-normal">
            
            {/* Overview Box */}
            <div className="p-4 sm:p-5 rounded-2xl bg-white/[0.04] border border-white/10 backdrop-blur-sm">
              <p className="text-neutral-200 font-medium leading-relaxed text-sm sm:text-base">
                Build X is a challenge based on the theme <strong className="text-amber-300 font-bold">“City”</strong>, where participants will tackle real-world urban challenges across <strong className="text-white font-semibold">6 different tracks</strong>.
              </p>
            </div>

            {/* Tracks & Scenarios */}
            <div className="p-4 sm:p-5 rounded-2xl bg-gradient-to-br from-amber-500/[0.08] to-transparent border border-amber-500/20 space-y-2">
              <div className="flex items-center gap-2.5 text-amber-300 font-bold text-sm sm:text-base">
                <Layers size={18} className="text-amber-400 shrink-0" />
                <span>6 Specialized Tracks &amp; Scenario Reveal</span>
              </div>
              <p className="text-neutral-300 text-xs sm:text-sm leading-relaxed">
                The 6 tracks, along with their detailed scenarios and problem statements, will be revealed on the day of the event. Participants will then choose one track based on their interests and understanding of the given scenario.
              </p>
            </div>

            {/* Objective */}
            <div className="p-4 sm:p-5 rounded-2xl bg-white/[0.03] border border-white/10 space-y-2">
              <div className="flex items-center gap-2.5 text-white font-bold text-sm sm:text-base">
                <Target size={18} className="text-sky-400 shrink-0" />
                <span>Core Objective</span>
              </div>
              <p className="text-neutral-300 text-xs sm:text-sm leading-relaxed">
                The objective is not to simply follow a predefined solution. Participants must understand the scenario, identify the core problem, and develop their own innovative solution within the given time.
              </p>
            </div>

            {/* Capacity & Rule */}
            <div className="p-4 sm:p-5 rounded-2xl bg-red-500/[0.06] border border-red-500/20 space-y-2">
              <div className="flex items-center gap-2.5 text-red-300 font-bold text-sm sm:text-base">
                <ShieldCheck size={18} className="text-red-400 shrink-0" />
                <span>Track Capacity &amp; Selection Rule</span>
              </div>
              <p className="text-neutral-300 text-xs sm:text-sm leading-relaxed">
                Each track will have a maximum capacity of <strong className="text-amber-200 font-bold">10 teams</strong>, and track selection will follow a <strong className="text-amber-200 font-bold">first-come, first-served basis</strong>. Participants are required to complete and submit their solution within the given submission deadline.
              </p>
            </div>

            {/* Quote / Motto Callout */}
            <div className="py-3.5 px-4 rounded-2xl bg-gradient-to-r from-amber-400/20 via-amber-300/10 to-amber-400/20 border border-amber-400/30 text-center">
              <p className="text-amber-200 font-bold text-xs sm:text-sm tracking-wide font-sans">
                💡 Understand the City. Identify the Problem. Build Your Solution.
              </p>
            </div>
          </div>

          {/* Footer CTA Actions */}
          <div className="mt-6 pt-4 border-t border-white/10 flex flex-col sm:flex-row gap-3 items-center justify-between">
            <button
              onClick={onClose}
              className="w-full sm:w-auto px-5 py-2.5 rounded-full text-xs sm:text-sm font-semibold text-neutral-400 hover:text-white bg-white/5 hover:bg-white/10 transition-all cursor-pointer text-center"
            >
              Close Guide
            </button>

            {onRegister && (
              <button
                onClick={() => {
                  onClose();
                  onRegister();
                }}
                className="w-full sm:w-auto px-6 py-3 rounded-full text-xs sm:text-sm font-extrabold text-black bg-gradient-to-r from-amber-200 via-white to-amber-100 hover:scale-[1.02] hover:shadow-[0_0_30px_rgba(251,191,36,0.6)] transition-all flex items-center justify-center gap-2 cursor-pointer"
              >
                <span>Register for BUILDX Now</span>
                <ArrowRight size={16} />
              </button>
            )}
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
}
