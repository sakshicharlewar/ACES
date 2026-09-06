import { useEffect, useRef, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useNavigate } from "react-router-dom";

const NAV_LINKS = [
  { label: "About", id: "collegelogo" },
  { label: "Department", id: "department-info" },
  { label: "Committee", id: "committee-section" },
  { label: "Events", id: "events-section" },
  { label: "Toppers", id: "academic-toppers" },
  { label: "Contact", id: "contact-section" },
];

export function Navbar() {
  const [visible, setVisible] = useState(false);
  const [inHero, setInHero] = useState(true);
  const lastScrollY = useRef(0);
  const hasLeftHero = useRef(false);
  const navigate = useNavigate();

  useEffect(() => {
    const heroHeight = window.innerHeight;

    const handleScroll = () => {
      const currentY = window.scrollY;
      const scrollingDown = currentY > lastScrollY.current;

      // Check if we're in hero zone
      const nowInHero = currentY < heroHeight * 0.5;
      setInHero(nowInHero);

      if (nowInHero) {
        // Back in hero — hide navbar
        hasLeftHero.current = false;
        setVisible(false);
      } else {
        // We are past the hero
        if (!hasLeftHero.current) {
          // First time leaving hero — show navbar
          hasLeftHero.current = true;
          setVisible(true);
        } else {
          // Already left hero — hide on scroll down, keep hidden on scroll up
          if (scrollingDown) {
            setVisible(false);
          }
          // On scroll up, do NOT show navbar again
        }
      }

      lastScrollY.current = currentY;
    };

    window.addEventListener("scroll", handleScroll, { passive: true });
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  const scrollTo = (id) => {
    const el = document.getElementById(id);
    if (el) {
      el.scrollIntoView({ behavior: "smooth" });
    }
  };

  return (
    <AnimatePresence>
      {visible && !inHero && (
        <motion.nav
          key="navbar"
          initial={{ y: -80, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          exit={{ y: -80, opacity: 0 }}
          transition={{ duration: 0.4, ease: [0.25, 0.46, 0.45, 0.94] }}
          className="fixed top-4 left-1/2 -translate-x-1/2 z-50 flex items-center justify-between px-6 py-3 w-[94%] max-w-6xl rounded-full transition-all duration-300"
          style={{
            background: "rgba(17, 19, 23, 0.85)",
            backdropFilter: "blur(24px)",
            WebkitBackdropFilter: "blur(24px)",
            border: "1px solid rgba(255, 255, 255, 0.10)",
            boxShadow: "0 16px 40px rgba(0, 0, 0, 0.5), inset 0 1px 1px rgba(255, 255, 255, 0.08)",
          }}
        >
          {/* Logo */}
          <button
            onClick={() => window.scrollTo({ top: 0, behavior: "smooth" })}
            className="font-poppins font-bold text-white text-base tracking-widest uppercase hover:text-blue-400 transition-colors flex items-center gap-2"
          >
            <span className="w-2 h-2 rounded-full bg-blue-500 animate-pulse" />
            ACES
          </button>

          {/* Links */}
          <div className="hidden md:flex items-center gap-6">
            {NAV_LINKS.map((link) => (
              <button
                key={link.id}
                onClick={() => scrollTo(link.id)}
                className="text-xs font-medium text-slate-400 hover:text-white transition-colors tracking-wide uppercase"
              >
                {link.label}
              </button>
            ))}
          </div>

          {/* CTA */}
          <div className="flex items-center gap-2.5">
            <button
              onClick={() => navigate("/faculty")}
              className="hidden md:block text-xs font-medium text-slate-400 hover:text-white transition-colors px-3 py-1.5"
            >
              Faculty
            </button>
            <button
              onClick={() => navigate("/admin")}
              className="text-xs px-3.5 py-1.5 rounded-full bg-white/5 border border-white/10 text-slate-300 hover:text-white hover:bg-white/10 transition-all"
            >
              Admin
            </button>
            <button
              onClick={() => scrollTo("contact-section")}
              className="px-4 py-1.5 rounded-full bg-white text-black text-xs font-semibold hover:bg-neutral-200 transition-all shadow-sm"
            >
              Contact
            </button>
          </div>
        </motion.nav>
      )}
    </AnimatePresence>
  );
}
