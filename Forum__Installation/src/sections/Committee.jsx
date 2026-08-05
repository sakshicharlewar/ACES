import { useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { Link } from "lucide-react";
import { committeeData } from "../data/committeeData";

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
  const trackRef        = useRef(null);
  const posRef          = useRef(0);       // current scroll position in px
  const prevPosRef      = useRef(0);
  const pausedRef       = useRef(false);
  const hoveredRef      = useRef(false);
  const lastGroupRef    = useRef(-1);      // last group index we paused at
  const halfWidthRef    = useRef(0);       // width of one card-set (for looping)
  const rafRef          = useRef(null);
  const timerRef        = useRef(null);

  useEffect(() => {
    const track = trackRef.current;
    if (!track) return;

    // Always reset to position 0 on mount — ensures marquee starts from President card
    posRef.current        = 0;
    prevPosRef.current    = 0;
    lastGroupRef.current  = -1;
    track.style.transform = "translateX(0px)";

    requestAnimationFrame(() => {
      halfWidthRef.current = track.scrollWidth / 2;
    });

    const tick = () => {
      if (!pausedRef.current && !hoveredRef.current) {
        posRef.current += SPEED;

        // ── Detect group boundary crossing ──────────────────────────────
        const prevGroup = Math.floor(prevPosRef.current / GROUP_STEP);
        const currGroup = Math.floor(posRef.current  / GROUP_STEP);

        if (currGroup > prevGroup && currGroup !== lastGroupRef.current) {
          lastGroupRef.current = currGroup;
          // Snap to exact pixel boundary so no half-card shows
          posRef.current   = currGroup * GROUP_STEP;
          prevPosRef.current = posRef.current;
          pausedRef.current  = true;

          timerRef.current = setTimeout(() => {
            pausedRef.current = false;
          }, PAUSE_MS);
        }

        // ── Seamless loop ──────────────────────────────────────────────
        if (halfWidthRef.current > 0 && posRef.current >= halfWidthRef.current) {
          posRef.current    -= halfWidthRef.current;
          prevPosRef.current = posRef.current;
          lastGroupRef.current = -1; // reset so first group pauses again
        }

        prevPosRef.current = posRef.current;
        track.style.transform = `translateX(-${posRef.current}px)`;
      }

      rafRef.current = requestAnimationFrame(tick);
    };

    rafRef.current = requestAnimationFrame(tick);

    return () => {
      cancelAnimationFrame(rafRef.current);
      clearTimeout(timerRef.current);
    };
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

      <div
        className="relative w-full flex overflow-hidden"
        onMouseEnter={() => { hoveredRef.current = true;  }}
        onMouseLeave={() => { hoveredRef.current = false; }}
      >
        {/* Fade overlays */}
        <div className="absolute left-0 top-0 bottom-0 w-32 bg-gradient-to-r from-background to-transparent z-10 pointer-events-none" />
        <div className="absolute right-0 top-0 bottom-0 w-32 bg-gradient-to-l from-background to-transparent z-10 pointer-events-none" />

        {/* Marquee track — duplicated for seamless loop */}
        <div
          ref={trackRef}
          style={{
            display: "flex",
            gap: `${GAP}px`,
            paddingLeft: `${GAP}px`,
            willChange: "transform",
          }}
        >
          {/* Set 1 */}
          {committeeData.map(m => (
            <LeaderCard key={m.key} memberKey={m.key} role={m.role} name={m.name} image={m.image} social={m.social} />
          ))}
          {/* Set 2 — duplicate for seamless loop */}
          {committeeData.map(m => (
            <LeaderCard key={`dup-${m.key}`} memberKey={m.key} role={m.role} name={m.name} image={m.image} social={m.social} />
          ))}
        </div>
      </div>
    </section>
  );
}
