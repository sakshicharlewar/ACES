import { useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Link, Loader2 } from "lucide-react";

const BASE_URL = import.meta.env.VITE_API_URL || "http://localhost:8000";

/* ── Leader Card (For President & Vice President) ── */
function LeaderCard({ memberKey, role, name, image, social }) {
  const navigate = useNavigate();

  return (
    <div
      onClick={() => navigate(`/committee/${memberKey}`)}
      style={{
        width: "420px",
        flexShrink: 0,
        background: "#171717",
        border: "1px solid rgba(255,255,255,0.08)",
        borderRadius: "28px",
        padding: "32px 36px",
        boxShadow: "0 4px 50px rgba(0,0,0,0.6)",
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        gap: "16px",
        transition: "transform 0.3s, box-shadow 0.3s, border-color 0.3s",
        cursor: "pointer"
      }}
      onMouseEnter={e => {
        e.currentTarget.style.transform = "scale(1.05)";
        e.currentTarget.style.boxShadow = "0 0 40px rgba(59,130,246,0.28)";
        e.currentTarget.style.borderColor = "rgba(59,130,246,0.45)";
      }}
      onMouseLeave={e => {
        e.currentTarget.style.transform = "scale(1)";
        e.currentTarget.style.boxShadow = "0 4px 40px rgba(0,0,0,0.5)";
        e.currentTarget.style.borderColor = "rgba(255,255,255,0.08)";
      }}
    >
      {/* Square image with blue glow */}
      <div style={{
        width: "240px",
        height: "240px",
        borderRadius: "16px",
        overflow: "hidden",
        border: "2px solid rgba(59,130,246,0.55)",
        boxShadow: "0 0 24px rgba(59,130,246,0.25)",
        flexShrink: 0,
      }}>
        <img
          src={image}
          alt={name}
          style={{ width: "100%", height: "100%", objectFit: "cover" }}
        />
      </div>

      {/* Text block — centered */}
      <div style={{ textAlign: "center", position: "relative", zIndex: 10 }}>
        <p style={{
          fontSize: "36px",
          fontWeight: 800,
          color: "#ffffff",
          letterSpacing: "-0.02em",
          marginBottom: "10px",
          lineHeight: 1.1,
        }}>
          {role}
        </p>
        <p style={{
          fontSize: "20px",
          fontWeight: 500,
          color: "#60A5FA",
          fontStyle: "italic",
          letterSpacing: "0.01em",
          marginBottom: "16px",
        }}>
          {name}
        </p>
        
        {/* Link Icon (Replacing LinkedIn) */}
        <a 
          href={social?.linkedin || "#"}
          target="_blank"
          rel="noopener noreferrer"
          onClick={(e) => e.stopPropagation()}
          className="inline-flex items-center justify-center w-10 h-10 rounded-full bg-accent/10 text-accent hover:bg-accent hover:text-white transition-colors duration-300"
        >
          <Link className="w-5 h-5" />
        </a>
      </div>
    </div>
  );
}

/* ─── Constants ─── */
const CARD_WIDTH = 420;
const GAP        = 24;   // px — matches gap-6 in Tailwind
const CARD_STEP  = CARD_WIDTH + GAP; // 444 px per card slot
const GROUP_CARDS = 4;
const GROUP_STEP  = CARD_STEP * GROUP_CARDS; // 1776 px per group
const SPEED       = 2.5; // px per rAF tick (~150 px/s at 60 fps)
const PAUSE_MS    = 2000;

export function Committee() {
  const [committeeData, setCommitteeData] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch(`${BASE_URL}/api/committee`)
      .then(res => res.json())
      .then(data => {
        setCommitteeData(data);
        setLoading(false);
      })
      .catch(err => {
        console.error("Failed to fetch committee:", err);
        setLoading(false);
      });
  }, []);

  return (
    <section id="committee" className="py-24 overflow-hidden relative">
      <div className="container mx-auto px-6 md:px-12 mb-16 text-center">
          <p className="text-xs font-semibold tracking-[0.35em] uppercase text-white mb-3 opacity-80 text-center w-full">
            Academic Year
          </p>
          <h2
            className="font-serif italic font-medium text-4xl md:text-6xl text-white text-center"
            style={{ letterSpacing: "-0.01em" }}
          >
            ACES COMMITTEE
          </h2>
          <p
            className="text-lg md:text-xl font-medium mt-1 tracking-widest uppercase text-white text-center w-full"
            style={{ letterSpacing: "0.25em" }}
          >
            2026 – 27
          </p>
          <div className="flex items-center justify-center gap-3 mt-4">
            <div className="h-px w-16 bg-gradient-to-r from-transparent to-[#3B82F6]" />
            <div className="w-2 h-2 rounded-full bg-[#3B82F6]" />
            <div className="h-px w-16 bg-gradient-to-l from-transparent to-[#3B82F6]" />
          </div>
        </div>

      <div className="relative w-full overflow-hidden min-h-[450px]">
        {loading ? (
          <div className="absolute inset-0 flex items-center justify-center text-white/50 z-20">
            <Loader2 className="w-8 h-8 animate-spin text-blue-500 mb-4" />
          </div>
        ) : committeeData.length === 0 ? (
          <div className="absolute inset-0 flex items-center justify-center text-white/50 z-20">
            No committee members found
          </div>
        ) : (
          <>
            {/* Fade overlays */}
            <div className="absolute left-0 top-0 bottom-0 w-32 bg-gradient-to-r from-[#0B0B0B] to-transparent z-10 pointer-events-none" />
            <div className="absolute right-0 top-0 bottom-0 w-32 bg-gradient-to-l from-[#0B0B0B] to-transparent z-10 pointer-events-none" />

            <marquee
              behavior="scroll"
              direction="left"
              scrollamount="12"
              onMouseOver={(e) => e.target.stop()}
              onMouseOut={(e) => e.target.start()}
              style={{ width: "100%", padding: "20px 0" }}
            >
              <div style={{ display: "inline-flex", gap: "24px", paddingLeft: "24px" }}>
                {committeeData.map(m => (
                  <LeaderCard key={m.key} memberKey={m.key} role={m.role} name={m.name} image={m.image} social={{ linkedin: m.linkedin, github: m.github, email: m.email }} />
                ))}
              </div>
            </marquee>
          </>
        )}
      </div>
    </section>
  );
}
