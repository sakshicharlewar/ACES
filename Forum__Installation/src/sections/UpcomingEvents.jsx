import React, { useState, useEffect } from "react";
import { motion } from "framer-motion";
import EventRegistrationModal from "../components/ui/EventRegistrationModal";
import { Users } from "lucide-react";

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
  const retryRef = React.useRef(null);

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
  // Always show real events first. If the DB returned nothing (fail or empty),
  // show the hardcoded Bug Hunt fallback as the first card.
  let liveEvents = [...events];
  if (liveEvents.length === 0) {
    liveEvents = [BUG_HUNT_FALLBACK];
  }

  // Fill remaining slots up to 4 with "Coming Soon" placeholders
  const displayEvents = [...liveEvents];
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
                        <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-red-500/20 text-red-400 text-xs font-semibold uppercase tracking-wider">
                          🔴 FULL
                        </span>
                      ) : isOpen ? (
                        <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-blue-500/20 text-blue-400 text-xs font-semibold uppercase tracking-wider">
                          🔥 Registration Open
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-red-500/20 text-red-400 text-xs font-semibold uppercase tracking-wider">
                          🔴 FULL
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
                    <div className="flex justify-between items-center mb-1 text-xs font-medium">
                      <span className="text-gray-400">Registered Teams</span>
                      <span className={isFull ? "text-red-400" : "text-blue-400"}>
                        {event.registered_teams_count} / {event.max_teams}
                      </span>
                    </div>
                    <div className="flex justify-between items-center mb-3 text-xs">
                      <span className={isFull ? "text-red-400" : "text-green-400"}>
                        {isFull ? "No seats available" : `Seats Left: ${seatsLeft}`}
                      </span>
                    </div>

                    <div className="w-full bg-white/5 rounded-full h-1.5 mb-4 overflow-hidden">
                      <motion.div
                        className={`h-full rounded-full ${isFull ? "bg-red-500" : "bg-blue-500"}`}
                        initial={{ width: 0 }}
                        animate={{
                          width: `${Math.min(
                            (event.registered_teams_count / event.max_teams) * 100,
                            100
                          )}%`,
                        }}
                        transition={{ duration: 1, delay: 0.5 }}
                      />
                    </div>

                    {isFull ? (
                      <div className="w-full py-3 rounded-xl font-medium text-center text-sm bg-amber-500/10 text-amber-400 border border-amber-500/30 cursor-not-allowed">
                        Result will be announced soon
                        <div className="text-xs text-amber-500/70 mt-1">Pending</div>
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
    </section>
  );
}
