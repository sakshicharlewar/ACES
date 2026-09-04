import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { getBaseUrl } from "../../lib/apiConfig";

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

export default function ResultModal({ isOpen, onClose, eventDetails }) {
  const [loadingWinners, setLoadingWinners] = useState(true);
  const [winnersData, setWinnersData] = useState(null);

  useEffect(() => {
    const handleEsc = (e) => { if (e.key === 'Escape') onClose(); };
    window.addEventListener('keydown', handleEsc);
    return () => window.removeEventListener('keydown', handleEsc);
  }, [onClose]);

  useEffect(() => {
    if (!isOpen || !eventDetails) return;
    
    let cancelled = false;
    setLoadingWinners(true);
    setWinnersData(null);
    
    async function loadResult() {
      try {
        const apiUrl = getBaseUrl();
        const res = await fetch(`${apiUrl}/api/events/${eventDetails.id}/result`);
        if (res.ok) {
          const data = await res.json();
          if (!cancelled) setWinnersData(data);
        } else if (String(eventDetails.id) === "1" || eventDetails.title?.toLowerCase().includes("bug hunt")) {
          if (!cancelled) setWinnersData(BUG_HUNT_RESULT_FALLBACK);
        }
      } catch (e) {
        console.error("Failed to fetch winners:", e);
        if (String(eventDetails.id) === "1" || eventDetails.title?.toLowerCase().includes("bug hunt")) {
          if (!cancelled) setWinnersData(BUG_HUNT_RESULT_FALLBACK);
        }
      } finally {
        if (!cancelled) setLoadingWinners(false);
      }
    }
    
    loadResult();
    
    return () => { cancelled = true; };
  }, [isOpen, eventDetails]);

  return (
    <AnimatePresence>
      {isOpen && (
        <div style={{ position: 'fixed', inset: 0, zIndex: 1000, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '20px' }}>
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            style={{ position: 'absolute', inset: 0, background: 'rgba(0,0,0,0.6)', backdropFilter: 'blur(8px)' }}
            onClick={onClose}
          />
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 20 }}
            style={{
              position: 'relative', width: '100%', maxWidth: '500px', maxHeight: '90vh',
              background: 'linear-gradient(145deg, #1e293b, #0f172a)',
              borderRadius: '24px', overflowY: 'auto', padding: '32px',
              border: '1px solid rgba(255,255,255,0.1)',
              boxShadow: '0 25px 50px -12px rgba(0,0,0,0.5)',
              scrollbarWidth: 'thin', scrollbarColor: 'rgba(255,255,255,0.2) transparent'
            }}
          >
            {/* Close button */}
            <button
              onClick={onClose}
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
                {eventDetails?.title || "EVENT RESULTS"}
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
                Thank you for participating in {eventDetails?.title}.<br />
                Your enthusiasm, teamwork, and passion made this event a great success.<br />
                Every challenge you faced helped you learn something new.<br />
                Keep exploring and keep building.<br />
                We look forward to seeing you again in our future technical events.
              </p>
              <p style={{ color: '#6b7280', fontSize: '0.78rem', lineHeight: '1.6', margin: 0 }}>
                Best Wishes from<br />
                <span style={{ color: '#e5e7eb', fontWeight: 600 }}>ACES Forum</span><br />
              </p>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}
