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
          className="fixed top-0 left-0 right-0 z-50 flex items-center justify-between px-8 py-4"
          style={{
            background: "rgba(0,0,0,0.72)",
            backdropFilter: "blur(20px)",
            WebkitBackdropFilter: "blur(20px)",
            borderBottom: "1px solid rgba(255,255,255,0.07)",
          }}
        >
          {/* Logo */}
          <button
            onClick={() => window.scrollTo({ top: 0, behavior: "smooth" })}
            className="font-poppins font-bold text-white text-lg tracking-widest uppercase hover:text-blue-400 transition-colors"
          >
            ACES
          </button>

          {/* Links */}
          <div className="hidden md:flex items-center gap-8">
            {NAV_LINKS.map((link) => (
              <button
                key={link.id}
                onClick={() => scrollTo(link.id)}
                className="text-sm font-medium text-white/70 hover:text-white transition-colors tracking-wide"
              >
                {link.label}
              </button>
            ))}
          </div>

          {/* CTA */}
          <div className="flex items-center gap-3">
            <button
              onClick={() => navigate("/faculty")}
              className="hidden md:block text-sm text-white/70 hover:text-white transition-colors"
            >
              Faculty
            </button>
            <button
              onClick={() => scrollTo("contact-section")}
              className="px-4 py-2 rounded-full border border-blue-500/50 text-blue-400 text-sm font-medium hover:bg-blue-500/10 transition-all duration-300 hover:border-blue-400"
            >
              Contact Us
            </button>
          </div>
        </motion.nav>
      )}
    </AnimatePresence>
  );
}
