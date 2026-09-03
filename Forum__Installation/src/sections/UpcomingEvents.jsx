import React, { useState, useEffect } from "react";
import { motion } from "framer-motion";
import EventRegistrationModal from "../components/ui/EventRegistrationModal";
import TestRegistrationModal from "../components/ui/TestRegistrationModal";
import { Users } from "lucide-react";
import { fetchPublicEvents } from "../admin/adminApi";
import { getBaseUrl } from "../lib/apiConfig";



// ── Hardcoded Bug Hunt event & results (fallback if DB is unreachable) ──
const BUG_HUNT_RESULT_FALLBACK = {
  event_id: 1,
  winner: "Team CODEVIPERS",
  winner_details: "Members\n- Rugved Dhomne\n- Aryan Raut\n\nRegistration ID: BUG-021\nYear: 3rd Year\n\nCongratulations to Team CODEVIPERS on securing First Place in BUG HUNT - DEBUG THE WEB 2026. Your exceptional debugging skills, logical thinking, creativity, and outstanding teamwork made you the top performers of this competition. Your dedication and technical excellence truly set you apart. Wishing you continued success in your future academic and professional journey.",
  runner_up: "Team TECHZACK",
  runner_up_details: "Members\n- Pranjal Godbole\n- Rushabh Kamble\n\nRegistration ID: BUG-029\nYear: 2nd Year\n\nCongratulations to Team TECHZACK on securing Second Place in BUG HUNT - DEBUG THE WEB 2026. Your strong problem-solving abilities, persistence, and teamwork helped you achieve this remarkable accomplishment. Keep learning, keep innovating, and continue reaching greater heights.",
  second_runner_up: null,
  second_runner_up_details: null,
  announcement_date: "2026-08-09T10:00"
};

const BUG_HUNT_FALLBACK = {
  id: 1,
  title: "🐞 Bug Hunt: Debug the Web",
  description:
    "Challenges teams to identify and fix real HTML, CSS, and JavaScript issues in a web application. Winners are decided by accuracy and completion time.",
  is_registration_open: false,
  registration_status: "closed",
  result_status: "announced",
  max_teams: 30,
  team_size: 2,
  fee: 40,
  registered_teams_count: 30,
  isFallback: true,
};

// ── Winner Cards Component ─────────────────────────────────────────────────
function parseWinnerDetails(details) {
  const lines = (details || '').split('\n');
  const members = [];
  let regId = '', year = '', congrats = '';
  let inMembers = false, inCongrats = false;
  for (const line of lines) {
    const t = line.trim();
    if (t === 'Members') { inMembers = true; continue; }
    if (t.startsWith('Registration ID:')) { inMembers = false; regId = t.replace('Registration ID:', '').trim(); continue; }
    if (t.startsWith('Year:')) { year = t.replace('Year:', '').trim(); continue; }
    if (t.startsWith('Congratulations')) { inCongrats = true; congrats = t; continue; }
    if (inCongrats && t) { congrats += ' ' + t; continue; }
    if (inMembers && t) { members.push(t.replace(/^[-•*]\s*/, '')); }
  }
  return { members, regId, year, congrats };
}

function WinnerCard({ place, teamName, details, borderColor, bgColor, labelColor, medal }) {
  if (!teamName) return null;
  const { members, regId, year, congrats } = parseWinnerDetails(details);
  return (
    <div style={{ border: `1px solid ${borderColor}`, borderRadius: '14px', padding: '20px', marginBottom: '16px', background: bgColor }}>
      <div style={{ color: labelColor, fontWeight: 700, fontSize: '0.85rem', letterSpacing: '0.08em', marginBottom: '6px' }}>{medal} {place}</div>
      <div style={{ color: '#fff', fontWeight: 700, fontSize: '1.1rem', marginBottom: '12px' }}>{teamName}</div>
      {members.length > 0 && (
        <div>
          <div style={{ color: '#9ca3af', fontSize: '0.82rem', marginBottom: '4px' }}>Members</div>
          {members.map((m, i) => <div key={i} style={{ color: '#e5e7eb', fontSize: '0.85rem', marginBottom: '2px' }}>• {m}</div>)}
        </div>
      )}
      {regId && <div style={{ color: '#9ca3af', fontSize: '0.78rem', marginTop: '10px', marginBottom: '2px' }}>Registration ID: <span style={{ color: labelColor }}>{regId}</span></div>}
      {year && <div style={{ color: '#9ca3af', fontSize: '0.78rem', marginBottom: '12px' }}>Year: <span style={{ color: '#e5e7eb' }}>{year}</span></div>}
      {congrats && <p style={{ color: '#d1d5db', fontSize: '0.82rem', lineHeight: '1.6', margin: '10px 0 0', textAlign: 'justify' }}>{congrats}</p>}
    </div>
  );
}

function WinnerCards({ data }) {
  return (
    <div>
      <WinnerCard place="FIRST PLACE" teamName={data.winner} details={data.winner_details} borderColor="rgba(251,191,36,0.35)" bgColor="rgba(251,191,36,0.05)" labelColor="#fbbf24" medal="🥇" />
      <WinnerCard place="SECOND PLACE" teamName={data.runner_up} details={data.runner_up_details} borderColor="rgba(209,213,219,0.25)" bgColor="rgba(209,213,219,0.04)" labelColor="#d1d5db" medal="🥈" />
      <WinnerCard place="THIRD PLACE" teamName={data.second_runner_up} details={data.second_runner_up_details} borderColor="rgba(249,115,22,0.35)" bgColor="rgba(249,115,22,0.05)" labelColor="#f97316" medal="🥉" />
    </div>
  );
}

export function UpcomingEvents() {

  const [events, setEvents] = useState([]);
  const [selectedEvent, setSelectedEvent] = useState(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [loadFailed, setLoadFailed] = useState(false);
  const [isWakingUp, setIsWakingUp] = useState(false);
  const [winnersPopupOpen, setWinnersPopupOpen] = useState(false);
  const [winnersPopupEvent, setWinnersPopupEvent] = useState(null);
  const [winnersData, setWinnersData] = useState(null);
  const [loadingWinners, setLoadingWinners] = useState(false);
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
    // Also instantly refresh when admin creates/edits an event
    const onEventsUpdated = () => fetchEvents();
    window.addEventListener("aces_events_updated", onEventsUpdated);
    return () => {
      clearInterval(interval);
      window.removeEventListener("aces_events_updated", onEventsUpdated);
      if (retryRef.current) clearTimeout(retryRef.current);
    };
  }, []);

  const fetchEvents = async (attempt = 0) => {
    try {
      let eventsData = await fetchPublicEvents({ status: "upcoming" });
      // Ensure we have an array
      if (!Array.isArray(eventsData)) {
        eventsData = eventsData.items || [];
      }
      
      if (eventsData.length > 0) {
        setEvents(eventsData);
        setLoadFailed(false);
      } else {
        // Only show fallback if we have no real data yet
        setEvents(prev => prev.length > 0 && !prev[0]?.isFallback ? prev : [BUG_HUNT_FALLBACK]);
        setLoadFailed(false);
      }
    } catch (e) {
      console.error("Failed to fetch events", e);
      // Only replace with fallback if no real events are loaded yet
      setEvents(prev => prev.length > 0 && !prev[0]?.isFallback ? prev : [BUG_HUNT_FALLBACK]);
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
    const maxTeams = event.max_participants ?? event.max_teams ?? 30;
    const isFull = maxTeams > 0 && event.registered_teams_count >= maxTeams;
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

  const openWinnersPopup = async (event) => {
    setWinnersPopupEvent(event);
    setWinnersPopupOpen(true);
    setLoadingWinners(true);
    setWinnersData(null);
    try {
      const apiUrl = getBaseUrl();
      const res = await fetch(`${apiUrl}/api/events/${event.id}/result`);
      if (res.ok) {
        const data = await res.json();
        setWinnersData(data);
      } else if (String(event.id) === "1" || String(event.id) === "bughunt-local" || event.title?.toLowerCase().includes("bug hunt")) {
        setWinnersData(BUG_HUNT_RESULT_FALLBACK);
      }
    } catch (e) {
      console.error("Failed to fetch winners:", e);
      if (String(event.id) === "1" || String(event.id) === "bughunt-local" || event.title?.toLowerCase().includes("bug hunt")) {
        setWinnersData(BUG_HUNT_RESULT_FALLBACK);
      }
    } finally {
      setLoadingWinners(false);
    }
  };

  // ── Build display list ──
  let displayEvents = [...events].sort((a, b) => {
    const isEventCompleted = (e) => e.result_status === "announced" || (e.announcement_date && new Date() >= new Date(e.announcement_date));
    const aCompleted = isEventCompleted(a);
    const bCompleted = isEventCompleted(b);
    if (aCompleted && !bCompleted) return 1; // a is completed, put it after b
    if (!aCompleted && bCompleted) return -1; // b is completed, put it after a
    
    // Both are either completed or not completed, sort by created_at DESC
    const dateA = a.created_at ? new Date(a.created_at) : new Date(0);
    const dateB = b.created_at ? new Date(b.created_at) : new Date(0);
    return dateB - dateA;
  });
  
  if (displayEvents.length === 0) {
    displayEvents = [BUG_HUNT_FALLBACK];
  }

  // Pad with fillers to make it look nice if there are very few events
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


            // ✨ Real event card ✨
            const maxTeams = event.max_participants ?? event.max_teams ?? 0;
            const seatsLeft = event.seats_left !== undefined ? event.seats_left : Math.max(0, maxTeams - (event.registered_teams_count || 0));
            const isFull = maxTeams > 0 && seatsLeft <= 0;
            
            const hasPassedAnnouncement = event.announcement_date && new Date() >= new Date(event.announcement_date);
            const isResultAnnounced = event.result_status === "announced" || hasPassedAnnouncement;
            
            const isOpen = event.is_registration_open && !isFull && !isResultAnnounced;
            const isResultScheduled = !isOpen && !isResultAnnounced && event.announcement_date && new Date() < new Date(event.announcement_date);
            
            const formatAnnouncementDate = (d) => {
              try {
                return new Date(d).toLocaleString('en-IN', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit', hour12: true });
              } catch { return d; }
            };

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
                  {/* Icon / Banner */}
                  {event.banner ? (
                    <div className="w-full h-32 rounded-xl mb-4 overflow-hidden bg-white/5 border border-white/10">
                      <img src={event.banner} alt={event.title} className="w-full h-full object-cover" />
                    </div>
                  ) : (
                    <div className="w-12 h-12 rounded-xl bg-blue-500/20 text-blue-400 flex items-center justify-center mb-4">
                      <span className="text-xl">🐞</span>
                    </div>
                  )}

                  {/* Title */}
                  <h4 className="font-sans text-xl font-bold text-white mb-2 leading-tight">{event.title}</h4>
                  {event.subtitle && <p className="font-sans text-xs font-semibold text-blue-400 uppercase tracking-widest mb-3">{event.subtitle}</p>}
                  <p className="font-cambria text-gray-400 text-sm mb-4 line-clamp-3">{event.short_description || event.description}</p>

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

                    {(event.date || event.time) && (
                      <div className="flex items-center gap-2">
                        <span className="text-blue-400">📅</span>
                        <span>{event.date}{event.date && event.time ? ' | ' : ''}{event.time}</span>
                      </div>
                    )}
                    {event.venue && (
                      <div className="flex items-center gap-2">
                        <span className="text-green-400">📍</span>
                        <span className="truncate">{event.venue}</span>
                      </div>
                    )}
                    <div className="flex items-center gap-2">
                      <span className="text-gray-400 font-medium">Seats Left: {seatsLeft} / {maxTeams}</span>
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
                    {event.eligibility && (
                      <div className="flex items-center gap-2">
                        <span className="text-pink-400">🎓</span>
                        <span className="text-gray-300 text-sm">Eligibility: {event.eligibility}</span>
                      </div>
                    )}
                    {(event.prizes || event.prize_pool) && (
                      <div className="flex items-center gap-2">
                        <span className="text-purple-400">🏆</span>
                        <span className="text-gray-300 text-sm truncate">{event.prizes || event.prize_pool}</span>
                      </div>
                    )}
                    {event.whatsapp_link && (
                      <div className="flex items-center gap-2">
                        <span className="text-green-500">💬</span>
                        <a href={event.whatsapp_link} target="_blank" rel="noopener noreferrer" className="text-green-400 text-sm hover:underline hover:text-green-300 transition-colors">
                          Join WhatsApp Group
                        </a>
                      </div>
                    )}
                  </div>

                  {/* Seat Tracker */}
                  <div className="mt-auto pt-4 border-t border-white/10">


                    {isResultAnnounced ? (
                      <div
                        className="w-full py-3 rounded-xl font-medium text-center text-sm bg-amber-500/10 text-amber-400 border border-amber-500/30 cursor-pointer hover:bg-amber-500/20 transition-colors duration-200"
                        onClick={() => openWinnersPopup(event)}
                      >
                        🎉 The Result Has Been Officially Announced!
                      </div>
                    ) : isResultScheduled ? (
                      <div className="w-full py-3 rounded-xl font-medium text-center text-sm bg-blue-500/10 text-blue-400 border border-blue-500/30">
                        ⏳ Result will be announced on {formatAnnouncementDate(event.announcement_date)}
                      </div>
                    ) : isOpen ? (
                      <button
                        id={`register-btn-${event.id}`}
                        onClick={() => handleRegisterClick(event)}
                        className="w-full py-3 rounded-xl font-medium transition-all duration-300 flex justify-center items-center bg-blue-600 hover:bg-blue-500 text-white shadow-[0_0_15px_rgba(59,130,246,0.4)]"
                      >
                        Register Now
                      </button>
                    ) : (
                      <div className="w-full py-3 rounded-xl font-medium text-center text-sm bg-red-500/10 text-red-400 border border-red-500/30 flex items-center justify-center gap-2">
                        <span>🔒</span>
                        <span>Registration Has Closed</span>
                      </div>
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
              <h2 style={{ color: '#fff', fontWeight: 700, fontSize: '1.2rem', letterSpacing: '0.05em', margin: 0, textTransform: 'uppercase' }}>
                {winnersPopupEvent?.title || "EVENT RESULTS"}
              </h2>
              <p style={{ color: '#f59e0b', fontWeight: 600, margin: '4px 0 8px', fontSize: '1rem' }}>Official Winners</p>
              <p style={{ color: '#9ca3af', fontSize: '0.78rem', margin: 0 }}>
                Organized by ACES Forum
              </p>
            </div>
            
            {loadingWinners ? (
              <div style={{ textAlign: 'center', padding: '40px 0', color: '#9ca3af' }}>
                Loading results...
              </div>
            ) : !winnersData ? (
              <div style={{ textAlign: 'center', padding: '40px 0', color: '#ef4444' }}>
                Results are not yet available for this event.
              </div>
            ) : (
              <WinnerCards data={winnersData} />
            )}

            {/* Divider + Footer */}
            <div style={{ borderTop: '1px solid rgba(255,255,255,0.08)', marginTop: '24px', paddingTop: '20px', textAlign: 'center' }}>
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
