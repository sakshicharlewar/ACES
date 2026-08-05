import React, { useState, useEffect } from "react";
import { motion } from "framer-motion";
import EventRegistrationModal from "../components/ui/EventRegistrationModal";
import TestRegistrationModal from "../components/ui/TestRegistrationModal";
import { Users } from "lucide-react";

// ── Test event (second card — hardcoded) ──────────────────────────────────────
const TEST_EVENT = {
  id: "test-event-local",
  title: "Upcoming Event",
  subtitle: "Check the Website",
  description:
    "Test the website by participating in this sample event. This event is only for testing the registration system and database performance.",
  isTestEvent: true,
};

// ── Hardcoded Bug Hunt event (fallback if DB is unreachable) ──
const BUG_HUNT_FALLBACK = {
  id: "bughunt-local",
  title: "🐞 Bug Hunt: Debug the Web",
  description:
    "Challenges teams to identify and fix real HTML, CSS, and JavaScript issues in a web application. Winners are decided by accuracy and completion time.",
  is_registration_open: false,
  max_teams: 30,
  team_size: 2,
  fee: 40,
  registered_teams_count: 30,
  isFallback: true,
};

export function UpcomingEvents() {
  const [events, setEvents] = useState([]);
  const [selectedEvent, setSelectedEvent] = useState(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [loadFailed, setLoadFailed] = useState(false);
  const [isWakingUp, setIsWakingUp] = useState(false);
  const [winnersPopupOpen, setWinnersPopupOpen] = useState(false);
  const [testModalOpen, setTestModalOpen] = useState(false);
  const retryRef = React.useRef(null);

  // Close winners popup on ESC key
  React.useEffect(() => {
    const handleEsc = (e) => { if (e.key === 'Escape') setWinnersPopupOpen(false); };
    window.addEventListener('keydown', handleEsc);
    return () => window.removeEventListener('keydown', handleEsc);
  }, []);

  useEffect(() => {
    fetchEvents();
    // Poll every 30 seconds to stay in sync with seat count
    const interval = setInterval(fetchEvents, 30000);
    return () => {
      clearInterval(interval);
      if (retryRef.current) clearTimeout(retryRef.current);
    };
  }, []);

  const fetchEvents = async (attempt = 0) => {
    try {
      const apiUrl = import.meta.env.VITE_API_URL || "https://aces-backkend.onrender.com";
      
      let eventsData = [];
      let loadFailed = false;

      // 1. Fetch Events
      try {
        const res = await fetch(`${apiUrl}/api/events`);
        if (res.ok) {
          eventsData = await res.json();
        } else {
          loadFailed = true;
        }
      } catch (e) {
        console.error("Failed to fetch events", e);
        loadFailed = true;
      }

      // 2. Fetch Bug Hunt Stats
      try {
        const statsRes = await fetch(`${apiUrl}/api/events/bug-hunt/stats`);
        if (statsRes.ok) {
          const stats = await statsRes.json();
          // If we have live events, find Bug Hunt and update it
          if (eventsData.length > 0) {
            const bhIndex = eventsData.findIndex(e => e.id === 1 || String(e.title).includes('Bug Hunt'));
            if (bhIndex !== -1) {
              eventsData[bhIndex].registered_teams_count = 30; // Hardcoded to 30
              eventsData[bhIndex].max_teams = 30; // Hardcoded to 30
              eventsData[bhIndex].is_registration_open = false; // Hardcoded to closed
            }
          } else {
            // Update fallback
            BUG_HUNT_FALLBACK.registered_teams_count = 30;
            BUG_HUNT_FALLBACK.max_teams = 30;
            BUG_HUNT_FALLBACK.is_registration_open = false;
          }
        }
      } catch (e) {
        console.error("Failed to fetch bug hunt stats", e);
      }

      if (!loadFailed) {
        setEvents(eventsData);
        setLoadFailed(false);
      } else {
        // Force state update to use fallback
        setEvents([]);
        setLoadFailed(true);
      }
    } catch (e) {
      console.error(e);
      setLoadFailed(true);
    }
    setIsWakingUp(false);
  };

  // ── Floating button visibility helpers ──
  const hideFloatingButton = () =>
    window.dispatchEvent(new CustomEvent('toggleFloatingButton', { detail: false }));
  const showFloatingButton = () =>
    window.dispatchEvent(new CustomEvent('toggleFloatingButton', { detail: true }));

  const handleRegisterClick = (event) => {
    const isFull =
      event.max_teams > 0 &&
      event.registered_teams_count >= event.max_teams;
    if (event.is_registration_open && !isFull) {
      hideFloatingButton();
      setSelectedEvent(event);
      setIsModalOpen(true);
    }
  };

  const handleModalClose = () => {
    setIsModalOpen(false);
    showFloatingButton();
  };

  const handleRegistrationSuccess = () => {
    fetchEvents(); // Refresh seat count immediately
    // Button stays hidden until the success screen is also closed (handled by onClose)
  };

  // ── Build display list ──
  // Slot 0: real Bug Hunt (or fallback)
  // Slot 1: TEST_EVENT (hardcoded, always shown)
  // Slots 2-3: remaining real events or Coming Soon fillers
  let liveEvents = [...events];
  if (liveEvents.length === 0) {
    liveEvents = [BUG_HUNT_FALLBACK];
  }

  // Insert TEST_EVENT at index 1
  const displayEvents = [liveEvents[0], TEST_EVENT, ...liveEvents.slice(1)];
  while (displayEvents.length < 4) {
    displayEvents.push({ id: `filler-${displayEvents.length}`, isFiller: true });
  }

  return (
    <section id="events" className="py-24 px-6 md:px-12 lg:px-24 relative overflow-hidden">
      <div className="container mx-auto">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.8 }}
          className="text-center mb-16"
        >
          <h2 className="font-sans text-3xl md:text-5xl font-medium mb-4">Upcoming Events</h2>
          <p className="font-cambria text-text-secondary text-lg">Participate &amp; Showcase your skills</p>
        </motion.div>

        {/* ── Server warm-up banner ── */}
        {isWakingUp && (
          <motion.div
            initial={{ opacity: 0, y: -8 }}
            animate={{ opacity: 1, y: 0 }}
            className="flex items-center justify-center gap-3 mb-8 px-5 py-3 rounded-2xl bg-amber-500/10 border border-amber-500/30 text-amber-300 text-sm max-w-md mx-auto"
          >
            <span className="relative flex h-2.5 w-2.5 flex-shrink-0">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-amber-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-amber-400"></span>
            </span>
            <span>Server is waking up — events will load in a few seconds…</span>
          </motion.div>
        )}

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {displayEvents.map((event, index) => {
            // ── Coming Soon filler card ──
            if (event.isFiller) {
              return (
                <motion.div
                  key={event.id}
                  initial={{ opacity: 0, y: 30 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ duration: 0.8, delay: index * 0.2 }}
                  className="relative p-[1px] rounded-[28px] overflow-hidden group"
                >
                  <div className="absolute inset-0 bg-gradient-to-r from-transparent via-accent/50 to-transparent translate-x-[-100%] group-hover:animate-[marquee_2s_linear_infinite] opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
                  <div className="relative h-full bg-card/80 backdrop-blur-xl rounded-[28px] p-8 flex flex-col items-center justify-center text-center border border-border group-hover:bg-card transition-colors duration-500 min-h-[300px]">
                    <div className="w-16 h-16 rounded-full bg-white/5 flex items-center justify-center mb-6">
                      <span className="text-2xl">⏳</span>
                    </div>
                    <h4 className="font-sans text-xl font-medium text-white mb-3">Coming Soon</h4>
                    <p className="font-cambria text-text-secondary text-sm mb-6">Registration Opens Soon</p>
                    <div className="mt-auto inline-flex items-center justify-center px-6 py-2 rounded-full border border-white/10 text-xs font-label uppercase tracking-wider text-text-secondary">
                      Stay Tuned
                    </div>
                  </div>
                </motion.div>
              );
            }

            // ── Test Event card ──
            if (event.isTestEvent) {
              return (
                <motion.div
                  key={event.id}
                  initial={{ opacity: 0, y: 30 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ duration: 0.8, delay: index * 0.2 }}
                  className="relative p-[1px] rounded-[28px] overflow-hidden group h-full flex"
                >
                  <div className="absolute inset-0 bg-gradient-to-br from-purple-500/50 via-blue-500/50 to-purple-500/50 opacity-100 group-hover:animate-[spin_4s_linear_infinite] transition-all duration-500" />
                  <div className="relative w-full h-full bg-[#0B0B0B]/90 backdrop-blur-xl rounded-[28px] p-6 flex flex-col border border-white/10 group-hover:bg-[#111111] transition-colors duration-500">
                    <div className="w-12 h-12 rounded-xl bg-purple-500/20 text-purple-400 flex items-center justify-center mb-4">
                      <span className="text-xl">🧪</span>
                    </div>
                    <h4 className="font-sans text-xl font-bold text-white mb-1 leading-tight">{event.title}</h4>
                    <p className="font-sans text-xs font-semibold text-purple-400 uppercase tracking-widest mb-3">{event.subtitle}</p>
                    <p className="font-cambria text-gray-400 text-sm mb-4 line-clamp-3">{event.description}</p>
                    <div className="space-y-2 mb-6 text-sm text-gray-300">
                      <div className="flex items-center justify-between mb-4">
                        <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-blue-500/20 text-blue-400 text-xs font-semibold uppercase tracking-wider">
                          🔥 Registration Open
                        </span>
                      </div>
                      <div className="flex items-center gap-2">
                        <Users size={14} className="text-purple-400" />
                        <span>Individual Participation</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="text-green-400">✅</span>
                        <span>Free — No Registration Fee</span>
                      </div>
                    </div>
                    <div className="mt-auto pt-4 border-t border-white/10">
                      <button
                        id="register-btn-test-event"
                        onClick={() => { hideFloatingButton(); setTestModalOpen(true); }}
                        className="w-full py-3 rounded-xl font-medium transition-all duration-300 flex justify-center items-center bg-blue-600 hover:bg-blue-500 text-white shadow-[0_0_15px_rgba(59,130,246,0.4)]"
                      >
                        Register Now
                      </button>
                    </div>
                  </div>
                </motion.div>
              );
            }

            // ── Real event card ──
            const isFull =
              event.max_teams > 0 &&
              event.registered_teams_count >= event.max_teams;
            const isOpen = event.is_registration_open && !isFull;
            const seatsLeft = Math.max(0, event.max_teams - event.registered_teams_count);

            return (
              <motion.div
                key={event.id}
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.8, delay: index * 0.2 }}
                className="relative p-[1px] rounded-[28px] overflow-hidden group h-full flex"
              >
                {/* Glowing border when open */}
                {isOpen && (
                  <div className="absolute inset-0 bg-gradient-to-br from-blue-500/50 via-purple-500/50 to-blue-500/50 opacity-100 group-hover:animate-[spin_4s_linear_infinite] transition-all duration-500" />
                )}
                {!isOpen && (
                  <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/10 to-transparent translate-x-[-100%] group-hover:animate-[marquee_2s_linear_infinite] opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
                )}

                <div className="relative w-full h-full bg-[#0B0B0B]/90 backdrop-blur-xl rounded-[28px] p-6 flex flex-col border border-white/10 group-hover:bg-[#111111] transition-colors duration-500">
                  {/* Icon */}
                  <div className="w-12 h-12 rounded-xl bg-blue-500/20 text-blue-400 flex items-center justify-center mb-4">
                    <span className="text-xl">🐞</span>
                  </div>

                  {/* Title */}
                  <h4 className="font-sans text-xl font-bold text-white mb-2 leading-tight">{event.title}</h4>
                  <p className="font-cambria text-gray-400 text-sm mb-4 line-clamp-3">{event.description}</p>

                  {/* Badges & meta */}
                  <div className="space-y-2 mb-6 text-sm text-gray-300">
                    <div className="flex items-center justify-between mb-4">
                      {isFull ? (
                        <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-green-500/20 text-green-400 text-xs font-semibold uppercase tracking-wider">
                          🟢 Completed
                        </span>
                      ) : isOpen ? (
                        <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-blue-500/20 text-blue-400 text-xs font-semibold uppercase tracking-wider">
                          🔥 Registration Open
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-green-500/20 text-green-400 text-xs font-semibold uppercase tracking-wider">
                          🟢 Completed
                        </span>
                      )}
                    </div>

                    <div className="flex items-center gap-2">
                      <span className="text-gray-400 font-medium">Maximum Teams: {event.max_teams}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Users size={14} className="text-blue-400" />
                      <span>Team Size: {event.team_size} Members</span>
                    </div>
                    {(event.fee || event.registration_fee) && (
                      <div className="flex items-center gap-2">
                        <span className="text-yellow-400">💳</span>
                        <span>Registration Fee: <span className="text-white font-semibold">₹{event.fee ?? event.registration_fee}</span></span>
                      </div>
                    )}
                    <div className="flex items-center gap-2">
                      <span className="text-purple-400">🏆</span>
                      <span className="text-gray-400 text-xs">Winners by accuracy &amp; completion time</span>
                    </div>
                  </div>

                  {/* Seat Tracker */}
                  <div className="mt-auto pt-4 border-t border-white/10">


                    {isFull ? (
                      <div
                        className="w-full py-3 rounded-xl font-medium text-center text-sm bg-amber-500/10 text-amber-400 border border-amber-500/30 cursor-pointer hover:bg-amber-500/20 transition-colors duration-200"
                        onClick={() => setWinnersPopupOpen(true)}
                      >
                        🎉 The Result Has Been Officially Announced!
                      </div>
                    ) : (
                      <button
                        id={`register-btn-${event.id}`}
                        onClick={() => handleRegisterClick(event)}
                        disabled={!isOpen}
                        className={`w-full py-3 rounded-xl font-medium transition-all duration-300 flex justify-center items-center ${
                          isOpen
                            ? "bg-blue-600 hover:bg-blue-500 text-white shadow-[0_0_15px_rgba(59,130,246,0.4)]"
                            : "bg-white/5 text-red-400 cursor-not-allowed border border-red-500/30"
                        }`}
                      >
                        {isOpen ? "Register Now" : "Registration Closed"}
                      </button>
                    )}
                  </div>
                </div>
              </motion.div>
            );
          })}
        </div>
      </div>

      <EventRegistrationModal
        isOpen={isModalOpen}
        onClose={handleModalClose}
        eventDetails={selectedEvent}
        onSuccess={handleRegistrationSuccess}
      />

      <TestRegistrationModal
        isOpen={testModalOpen}
        onClose={() => { setTestModalOpen(false); showFloatingButton(); }}
      />

      {/* ── Winners Popup ── */}
      {winnersPopupOpen && (
        <div
          onClick={() => setWinnersPopupOpen(false)}
          style={{
            position: 'fixed', inset: 0, zIndex: 9999,
            background: 'rgba(0,0,0,0.75)', backdropFilter: 'blur(4px)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            padding: '16px',
            animation: 'winnersOverlayIn 0.25s ease'
          }}
        >
          <div
            onClick={(e) => e.stopPropagation()}
            style={{
              background: '#0f0f0f',
              border: '1px solid rgba(255,255,255,0.1)',
              borderRadius: '20px',
              width: '100%',
              maxWidth: '560px',
              maxHeight: '90vh',
              overflowY: 'auto',
              padding: '32px 28px',
              position: 'relative',
              animation: 'winnersPopupIn 0.3s cubic-bezier(0.34,1.56,0.64,1)'
            }}
          >
            {/* Close button */}
            <button
              onClick={() => setWinnersPopupOpen(false)}
              style={{
                position: 'absolute', top: '16px', right: '16px',
                background: 'rgba(255,255,255,0.08)', border: 'none',
                borderRadius: '50%', width: '32px', height: '32px',
                color: '#aaa', fontSize: '18px', cursor: 'pointer',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                lineHeight: 1
              }}
            >×</button>

            {/* Header */}
            <div style={{ textAlign: 'center', marginBottom: '24px' }}>
              <div style={{ fontSize: '2rem', marginBottom: '8px' }}>🏆</div>
              <h2 style={{ color: '#fff', fontWeight: 700, fontSize: '1.2rem', letterSpacing: '0.05em', margin: 0 }}>
                BUG HUNT – DEBUG THE WEB 2026
              </h2>
              <p style={{ color: '#f59e0b', fontWeight: 600, margin: '4px 0 8px', fontSize: '1rem' }}>Official Winners</p>
              <p style={{ color: '#9ca3af', fontSize: '0.78rem', margin: 0 }}>
                Organized by ACES Forum, Department of Computer Engineering
              </p>
            </div>

            {/* 1st Place */}
            <div style={{
              border: '1px solid rgba(251,191,36,0.35)',
              borderRadius: '14px',
              padding: '20px',
              marginBottom: '16px',
              background: 'rgba(251,191,36,0.05)'
            }}>
              <div style={{ color: '#fbbf24', fontWeight: 700, fontSize: '0.85rem', letterSpacing: '0.08em', marginBottom: '6px' }}>🥇 FIRST PLACE</div>
              <div style={{ color: '#fff', fontWeight: 700, fontSize: '1.1rem', marginBottom: '12px' }}>Team CODEVIPERS</div>
              <div style={{ color: '#d1d5db', fontSize: '0.82rem', marginBottom: '4px' }}><span style={{ color: '#9ca3af' }}>Members</span></div>
              <div style={{ color: '#e5e7eb', fontSize: '0.85rem', marginBottom: '2px' }}>• Rugved Dhomne</div>
              <div style={{ color: '#e5e7eb', fontSize: '0.85rem', marginBottom: '12px' }}>• Aryan Raut</div>
              <div style={{ color: '#9ca3af', fontSize: '0.78rem', marginBottom: '2px' }}>Registration ID: <span style={{ color: '#fbbf24' }}>BUG-021</span></div>
              <div style={{ color: '#9ca3af', fontSize: '0.78rem', marginBottom: '12px' }}>Year: <span style={{ color: '#e5e7eb' }}>3rd Year</span></div>
              <p style={{ color: '#d1d5db', fontSize: '0.82rem', lineHeight: '1.6', margin: 0 }}>
                Congratulations to Team CODEVIPERS on securing First Place in BUG HUNT – DEBUG THE WEB 2026.
                Your exceptional debugging skills, logical thinking, creativity, and outstanding teamwork made you the top performers of this competition.
                Your dedication and technical excellence truly set you apart.
                Wishing you continued success in your future academic and professional journey.
              </p>
            </div>

            {/* 2nd Place */}
            <div style={{
              border: '1px solid rgba(209,213,219,0.25)',
              borderRadius: '14px',
              padding: '20px',
              marginBottom: '24px',
              background: 'rgba(209,213,219,0.04)'
            }}>
              <div style={{ color: '#d1d5db', fontWeight: 700, fontSize: '0.85rem', letterSpacing: '0.08em', marginBottom: '6px' }}>🥈 SECOND PLACE</div>
              <div style={{ color: '#fff', fontWeight: 700, fontSize: '1.1rem', marginBottom: '12px' }}>Team TECHZACK</div>
              <div style={{ color: '#d1d5db', fontSize: '0.82rem', marginBottom: '4px' }}><span style={{ color: '#9ca3af' }}>Members</span></div>
              <div style={{ color: '#e5e7eb', fontSize: '0.85rem', marginBottom: '2px' }}>• Pranjal Godbole</div>
              <div style={{ color: '#e5e7eb', fontSize: '0.85rem', marginBottom: '12px' }}>• Rushabh Kamble</div>
              <div style={{ color: '#9ca3af', fontSize: '0.78rem', marginBottom: '2px' }}>Registration ID: <span style={{ color: '#d1d5db' }}>BUG-029</span></div>
              <div style={{ color: '#9ca3af', fontSize: '0.78rem', marginBottom: '12px' }}>Year: <span style={{ color: '#e5e7eb' }}>2nd Year</span></div>
              <p style={{ color: '#d1d5db', fontSize: '0.82rem', lineHeight: '1.6', margin: 0 }}>
                Congratulations to Team TECHZACK on securing Second Place in BUG HUNT – DEBUG THE WEB 2026.
                Your strong problem-solving abilities, persistence, and teamwork helped you achieve this remarkable accomplishment.
                Keep learning, keep innovating, and continue reaching greater heights.
              </p>
            </div>

            {/* Divider + Footer */}
            <div style={{ borderTop: '1px solid rgba(255,255,255,0.08)', paddingTop: '20px', textAlign: 'center' }}>
              <div style={{ fontSize: '1.3rem', marginBottom: '8px' }}>🎉</div>
              <p style={{ color: '#f59e0b', fontWeight: 600, fontSize: '0.95rem', margin: '0 0 10px' }}>Congratulations to Every Participant!</p>
              <p style={{ color: '#9ca3af', fontSize: '0.8rem', lineHeight: '1.7', margin: '0 0 12px' }}>
                Thank you for participating in BUG HUNT – DEBUG THE WEB 2026.<br />
                Your enthusiasm, debugging skills, teamwork, and passion for technology made this event a great success.<br />
                Every challenge you solved helped you learn something new.<br />
                Keep exploring. Keep debugging. Keep building.<br />
                We look forward to seeing you again in our future technical events.
              </p>
              <p style={{ color: '#6b7280', fontSize: '0.78rem', lineHeight: '1.6', margin: 0 }}>
                Best Wishes from<br />
                <span style={{ color: '#e5e7eb', fontWeight: 600 }}>ACES Forum</span><br />
                Department of Computer Engineering<br />
                Suryodaya College of Engineering &amp; Technology, Nagpur
              </p>
            </div>
          </div>

          {/* Keyframes injected inline */}
          <style>{`
            @keyframes winnersOverlayIn { from { opacity: 0; } to { opacity: 1; } }
            @keyframes winnersPopupIn { from { opacity: 0; transform: scale(0.88); } to { opacity: 1; transform: scale(1); } }
          `}</style>
        </div>
      )}
    </section>
  );
}
