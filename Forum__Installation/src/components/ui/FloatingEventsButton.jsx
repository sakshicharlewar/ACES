import { useState, useRef, useEffect } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { CalendarDays } from "lucide-react";

export function FloatingEventsButton() {
  const navigate = useNavigate();
  const location = useLocation();
  const [ripple, setRipple] = useState(false);
  const [ripplePos, setRipplePos] = useState({ x: 0, y: 0 });
  const [isVisible, setIsVisible] = useState(true);
  const btnRef = useRef(null);

  useEffect(() => {
    const handleToggle = (e) => setIsVisible(e.detail);
    window.addEventListener('toggleFloatingButton', handleToggle);
    return () => window.removeEventListener('toggleFloatingButton', handleToggle);
  }, []);

  // Hide on all admin pages
  if (location.pathname.startsWith("/admin")) return null;

  const handleClick = (e) => {
    // Ripple position
    const rect = btnRef.current.getBoundingClientRect();
    setRipplePos({ x: e.clientX - rect.left, y: e.clientY - rect.top });
    setRipple(true);
    setTimeout(() => setRipple(false), 600);

    if (location.pathname === "/") {
      const section = document.getElementById("events-upcoming");
      if (section) section.scrollIntoView({ behavior: "smooth", block: "start" });
    } else {
      navigate("/");
      setTimeout(() => {
        const section = document.getElementById("events-upcoming");
        if (section) section.scrollIntoView({ behavior: "smooth", block: "start" });
      }, 650);
    }
  };

  const handleKeyDown = (e) => {
    if (e.key === "Enter" || e.key === " ") {
      e.preventDefault();
      handleClick({ clientX: 0, clientY: 0 });
    }
  };

  // Don't render on admin pages at all
  if (location.pathname.startsWith("/admin")) return null;

  return (
    <>
      <style>{`
        /* Fade transition for the floating button */
        .fab-pill-wrapper {
          transition: opacity 0.25s ease, transform 0.25s ease;
        }
        .fab-pill-wrapper.fab-hidden {
          opacity: 0;
          pointer-events: none;
          transform: translateY(8px);
        }
        .fab-pill-wrapper.fab-visible {
          opacity: 1;
          pointer-events: auto;
          transform: translateY(0px);
        }
        @keyframes pill-float {
          0%, 100% { transform: translateY(0px); }
          50%       { transform: translateY(-4px); }
        }
        @keyframes pill-pulse-glow {
          0%, 100% {
            box-shadow:
              0 0 0 0 rgba(37,99,235,0.40),
              0 8px 28px rgba(37,99,235,0.30),
              0 2px 8px rgba(0,0,0,0.25);
          }
          55% {
            box-shadow:
              0 0 0 10px rgba(37,99,235,0),
              0 8px 28px rgba(37,99,235,0.30),
              0 2px 8px rgba(0,0,0,0.25);
          }
        }
        @keyframes pill-ripple {
          0%   { transform: scale(0); opacity: 0.55; }
          100% { transform: scale(5); opacity: 0; }
        }

        .fab-pill {
          position: fixed;
          bottom: 24px;
          right: 24px;
          z-index: 9999;
          display: inline-flex;
          align-items: center;
          gap: 10px;
          padding: 0 22px;
          height: 56px;
          border-radius: 100px;
          border: 1px solid rgba(255, 255, 255, 0.20);
          background: linear-gradient(135deg, #2563EB 0%, #3B82F6 100%);
          backdrop-filter: blur(12px);
          -webkit-backdrop-filter: blur(12px);
          cursor: pointer;
          outline: none;
          overflow: hidden;
          animation:
            pill-float 3.5s ease-in-out infinite,
            pill-pulse-glow 3.5s ease-in-out infinite;
          transition:
            transform 0.28s cubic-bezier(.34,1.56,.64,1),
            box-shadow  0.25s ease,
            filter      0.25s ease;
          /* prevent animation fighting on hover */
          will-change: transform;
        }

        .fab-pill:hover,
        .fab-pill:focus-visible {
          animation: none;
          transform: translateY(-3px) scale(1.05) !important;
          box-shadow:
            0 0 0 12px rgba(37,99,235,0.10),
            0 14px 38px rgba(37,99,235,0.55),
            0 2px 8px rgba(0,0,0,0.25);
          filter: brightness(1.10);
        }

        .fab-pill:focus-visible {
          outline: 3px solid #93C5FD;
          outline-offset: 3px;
        }

        .fab-pill:active {
          transform: translateY(0px) scale(0.97) !important;
        }

        /* Ripple */
        .fab-pill-ripple {
          position: absolute;
          width: 16px;
          height: 16px;
          border-radius: 50%;
          background: rgba(255,255,255,0.40);
          pointer-events: none;
          transform: scale(0);
          animation: pill-ripple 0.6s ease-out forwards;
        }

        /* Icon */
        .fab-pill-icon {
          color: #fff;
          flex-shrink: 0;
          position: relative;
          z-index: 1;
          filter: drop-shadow(0 0 5px rgba(255,255,255,0.45));
          transition: filter 0.25s ease;
        }
        .fab-pill:hover .fab-pill-icon,
        .fab-pill:focus-visible .fab-pill-icon {
          filter: drop-shadow(0 0 9px rgba(255,255,255,0.75));
        }

        /* Label */
        .fab-pill-label {
          color: #fff;
          font-size: 15px;
          font-weight: 700;
          letter-spacing: 0.01em;
          white-space: nowrap;
          position: relative;
          z-index: 1;
          text-shadow: 0 1px 4px rgba(0,0,0,0.18);
          font-family: inherit;
        }

        /* Divider line between icon and text */
        .fab-pill-divider {
          width: 1px;
          height: 22px;
          background: rgba(255,255,255,0.28);
          flex-shrink: 0;
          position: relative;
          z-index: 1;
        }

        /* Tablet */
        @media (max-width: 768px) {
          .fab-pill {
            height: 52px;
            padding: 0 18px;
            gap: 9px;
          }
          .fab-pill-label {
            font-size: 14px;
          }
        }

        /* Mobile */
        @media (max-width: 480px) {
          .fab-pill {
            bottom: 18px;
            right: 18px;
            height: 48px;
            padding: 0 16px;
            gap: 8px;
          }
          .fab-pill-label {
            font-size: 13.5px;
          }
        }
      `}</style>

      <button
        ref={btnRef}
        className={`fab-pill fab-pill-wrapper ${isVisible ? 'fab-visible' : 'fab-hidden'}`}
        onClick={handleClick}
        onKeyDown={handleKeyDown}
        aria-label="Go to Upcoming Events"
        title="Go to Upcoming Events"
        tabIndex={isVisible ? 0 : -1}
        aria-hidden={!isVisible}
      >
        {/* Ripple layer */}
        {ripple && (
          <span
            className="fab-pill-ripple"
            style={{
              left: ripplePos.x - 8,
              top: ripplePos.y - 8,
            }}
          />
        )}

        {/* Calendar icon */}
        <CalendarDays className="fab-pill-icon" size={22} strokeWidth={1.9} />

        {/* Divider */}
        <span className="fab-pill-divider" aria-hidden="true" />

        {/* Label */}
        <span className="fab-pill-label">Upcoming Events</span>
      </button>
    </>
  );
}
