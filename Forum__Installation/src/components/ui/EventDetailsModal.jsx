import React from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X, MapPin, Users, GraduationCap, Calendar, ArrowRight, Mail, Phone } from "lucide-react";

export default function EventDetailsModal({ isOpen, onClose, onRegister }) {
  if (!isOpen) return null;

  const organizers = [
    { name: "Sakshi Charlewar", email: "sakshicharlewar4@gmail.com", phone: "8087436159", initial: "SC", color: "text-pink-400", bg: "bg-pink-500/20" },
    { name: "Tushar Kherde", email: "tusharkherde83@gmail.com", phone: "88300016058", initial: "TK", color: "text-blue-400", bg: "bg-blue-500/20" },
    { name: "Krutika Yewale", email: "krutikayewale8@gmail.com", phone: "84462 99531", initial: "KY", color: "text-emerald-400", bg: "bg-emerald-500/20" }
  ];

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
          initial={{ opacity: 0, scale: 0.95, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 20 }}
          transition={{ type: "spring", damping: 25, stiffness: 300 }}
          className="relative w-full max-w-4xl bg-[#0F0F12] border border-amber-500/30 rounded-3xl shadow-[0_0_50px_rgba(251,191,36,0.15)] text-white z-10 max-h-[90vh] flex flex-col overflow-hidden"
        >
          {/* Close button (Fixed top right) */}
          <button
            onClick={onClose}
            className="absolute top-4 right-4 sm:top-5 sm:right-5 w-9 h-9 rounded-full bg-black/50 hover:bg-white/20 border border-white/15 flex items-center justify-center text-white/80 hover:text-white transition-all cursor-pointer z-30 backdrop-blur-sm"
          >
            <X size={18} />
          </button>

          {/* Scrollable Body */}
          <div className="overflow-y-auto custom-scrollbar flex-1 pb-6">
            
            {/* Header Section */}
            <div className="bg-gradient-to-b from-amber-500/10 to-[#0F0F12] border-b border-white/5 p-6 sm:p-10 pt-12 sm:pt-14 relative">
              <div className="flex items-center gap-2 text-amber-400 font-bold tracking-wider text-xs sm:text-sm mb-3 uppercase">
                <span className="w-2 h-2 rounded-full bg-amber-500 animate-pulse"></span>
                Full Stack Web Development
              </div>
              <h2 className="text-3xl sm:text-5xl font-extrabold text-white tracking-tight leading-tight mb-6">
                BUILDX
              </h2>

              {/* Quick Info Badges */}
              <div className="flex flex-wrap gap-3 sm:gap-4">
                <div className="flex items-center gap-2 bg-white/5 border border-white/10 px-4 py-2.5 rounded-xl text-sm text-neutral-300">
                  <MapPin size={16} className="text-amber-400" />
                  <span className="leading-tight">Suryodaya College of Engineering and Technology, Nagpur</span>
                </div>
                <div className="flex items-center gap-2 bg-white/5 border border-white/10 px-4 py-2.5 rounded-xl text-sm text-neutral-300">
                  <Users size={16} className="text-amber-400" />
                  <span>Team Size: 2-4 Members</span>
                </div>
              </div>
            </div>

            {/* Content Container */}
            <div className="p-6 sm:p-10 space-y-12">
              
              {/* Eligibility */}
              <section>
                <h3 className="text-xl font-bold text-white mb-4 flex items-center gap-3">
                  <div className="w-1.5 h-6 bg-amber-500 rounded-full"></div>
                  Eligibility
                </h3>
                <div className="flex items-center gap-3 bg-white/5 border border-white/10 p-4 rounded-xl text-neutral-300">
                  <GraduationCap className="text-amber-400" size={24} />
                  <span className="text-sm sm:text-base font-medium">All B.Tech, Polytechnic, and Engineering students</span>
                </div>
              </section>

              {/* Stages and Timelines */}
              <section>
                <h3 className="text-xl font-bold text-white mb-6 flex items-center gap-3">
                  <div className="w-1.5 h-6 bg-amber-500 rounded-full"></div>
                  Stages and Timelines
                </h3>
                
                <div className="relative border-l-2 border-dashed border-white/20 ml-4 sm:ml-6 space-y-10 pb-4">
                  {/* Timeline Node 1 */}
                  <div className="relative pl-8 sm:pl-10">
                    <div className="absolute -left-[17px] top-0 bg-[#0F0F12] border-2 border-amber-500 w-8 h-8 rounded-full flex flex-col items-center justify-center text-[9px] font-bold text-amber-500">
                      <span>8</span>
                      <span>Sep</span>
                    </div>
                    <div className="bg-white/5 border border-white/10 p-5 rounded-2xl relative">
                      <div className="absolute top-4 right-4 bg-emerald-500/20 text-emerald-400 text-[10px] font-bold px-2 py-1 rounded-md border border-emerald-500/30 uppercase tracking-wide">
                        Live
                      </div>
                      <h4 className="text-lg font-bold text-white mb-1">Registration Phase</h4>
                      <div className="flex items-center gap-1.5 text-amber-400/90 text-sm mb-3 font-medium">
                        <Calendar size={14} />
                        <span>08 Sep 2026 - 20 Sep 2026</span>
                      </div>
                      <p className="text-neutral-400 text-sm leading-relaxed">
                        Registrations may close early! We have unlimited seats, but spots can fill up quickly depending on the response.
                      </p>
                    </div>
                  </div>

                  {/* Timeline Node 2 */}
                  <div className="relative pl-8 sm:pl-10">
                    <div className="absolute -left-[17px] top-0 bg-[#0F0F12] border-2 border-amber-500 w-8 h-8 rounded-full flex flex-col items-center justify-center text-[9px] font-bold text-amber-500">
                      <span>22</span>
                      <span>Sep</span>
                    </div>
                    <div className="bg-white/5 border border-white/10 p-5 rounded-2xl">
                      <h4 className="text-lg font-bold text-white mb-1">Event Day</h4>
                      <div className="flex items-center gap-1.5 text-amber-400/90 text-sm mb-3 font-medium">
                        <Calendar size={14} />
                        <span>22 Sep 2026, 08:00 AM onwards</span>
                      </div>
                      <p className="text-neutral-400 text-sm leading-relaxed">
                        The main event kicks off! All other event details and challenges will be given on the event day itself.
                      </p>
                    </div>
                  </div>
                </div>
              </section>

              {/* All that you need to know */}
              <section>
                <h3 className="text-xl font-bold text-white mb-4 flex items-center gap-3">
                  <div className="w-1.5 h-6 bg-amber-500 rounded-full"></div>
                  All that you need to know about BUILDX
                </h3>
                <div className="bg-white/5 border border-white/10 p-6 sm:p-8 rounded-2xl text-neutral-300 text-sm sm:text-base leading-relaxed space-y-4">
                  <p>
                    <strong className="text-white">BUILD – X</strong> is an intercollegiate full stack web development technical event organized by the A.C.E.S. Forum, Department of Computer Engineering, designed to bring together talented students from various colleges on a single platform.
                  </p>
                  <p>
                    The event encourages participants to showcase their technical expertise, creativity, innovation, and problem-solving abilities through engaging competitions and challenges, while fostering collaboration, learning, and healthy competition. 
                  </p>
                  <div className="bg-amber-500/10 border border-amber-500/20 p-4 rounded-xl text-amber-100">
                    <p className="font-semibold mb-1">💡 Theme Hint:</p>
                    <p>There is a main theme <strong className="text-amber-400">"CITY"</strong> as a hint for our event.</p>
                  </div>
                  <p>
                    Additionally, use any technology, programming language, AI tools, frameworks, or your own creativity to bring your ideas to life. The only limit is your imagination.
                  </p>
                  <p className="text-white font-bold text-lg pt-2 tracking-wide">
                    Think. Create. Innovate. BUILD!
                  </p>
                </div>
              </section>

              {/* Contact Organisers */}
              <section>
                <h3 className="text-xl font-bold text-white mb-6 flex items-center gap-3">
                  <div className="w-1.5 h-6 bg-amber-500 rounded-full"></div>
                  Contact the Organisers
                </h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                  {organizers.map((org, idx) => (
                    <div key={idx} className="bg-white/5 border border-white/10 p-4 rounded-2xl flex items-center gap-4 hover:bg-white/10 transition-colors">
                      <div className={`w-12 h-12 rounded-full ${org.bg} ${org.color} flex items-center justify-center font-bold text-lg flex-shrink-0`}>
                        {org.initial}
                      </div>
                      <div className="overflow-hidden">
                        <h5 className="text-white font-semibold text-sm sm:text-base mb-1 truncate">{org.name}</h5>
                        <div className="space-y-1">
                          <a href={`mailto:${org.email}`} className="text-neutral-400 hover:text-white text-xs flex items-center gap-1.5 transition-colors truncate">
                            <Mail size={12} className="flex-shrink-0" />
                            <span className="truncate">{org.email}</span>
                          </a>
                          <a href={`tel:${org.phone}`} className="text-neutral-400 hover:text-white text-xs flex items-center gap-1.5 transition-colors truncate">
                            <Phone size={12} className="flex-shrink-0" />
                            <span className="truncate">{org.phone}</span>
                          </a>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </section>

            </div>
          </div>

          {/* Footer CTA Actions */}
          <div className="border-t border-white/10 p-5 sm:p-6 bg-[#0F0F12] flex flex-col sm:flex-row gap-4 items-center justify-between z-20">
            <button
              onClick={onClose}
              className="w-full sm:w-auto px-6 py-2.5 rounded-full text-sm font-semibold text-neutral-400 hover:text-white bg-white/5 hover:bg-white/10 transition-all cursor-pointer text-center"
            >
              Close Details
            </button>

            {onRegister && (
              <button
                onClick={() => {
                  onClose();
                  onRegister();
                }}
                className="w-full sm:w-auto px-8 py-3.5 rounded-full text-sm font-extrabold text-black bg-gradient-to-r from-amber-400 via-amber-300 to-amber-500 hover:scale-[1.02] hover:shadow-[0_0_30px_rgba(251,191,36,0.4)] transition-all flex items-center justify-center gap-2 cursor-pointer"
              >
                <span>Register for BUILDX Now</span>
                <ArrowRight size={18} />
              </button>
            )}
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
}
