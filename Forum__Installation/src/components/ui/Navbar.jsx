import { useEffect, useState } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { Box, User, ArrowUpRight } from "lucide-react";

export function Navbar() {
  const [activeTab, setActiveTab] = useState("Home");
  const [scrolled, setScrolled] = useState(false);
  const navigate = useNavigate();
  const location = useLocation();

  useEffect(() => {
    const handleScroll = () => {
      setScrolled(window.scrollY > 20);
    };
    window.addEventListener("scroll", handleScroll, { passive: true });
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  const navItems = [
    { label: "Home", action: () => { setActiveTab("Home"); window.scrollTo({ top: 0, behavior: "smooth" }); } },
    { label: "About", action: () => { setActiveTab("About"); document.getElementById("about-section")?.scrollIntoView({ behavior: "smooth" }); } },
    { label: "Academics", action: () => { setActiveTab("Academics"); document.getElementById("department-info")?.scrollIntoView({ behavior: "smooth" }); } },
    { label: "Departments", action: () => { setActiveTab("Departments"); navigate("/department"); } },
    { label: "Campus", action: () => { setActiveTab("Campus"); navigate("/laboratories"); } },
    { label: "Faculty", action: () => { setActiveTab("Faculty"); navigate("/faculty"); } },
    { label: "Placements", action: () => { setActiveTab("Placements"); document.getElementById("academic-toppers")?.scrollIntoView({ behavior: "smooth" }); } },
    { label: "Events", action: () => { setActiveTab("Events"); document.getElementById("events-upcoming")?.scrollIntoView({ behavior: "smooth" }); } },
    { label: "Contact", action: () => { setActiveTab("Contact"); document.getElementById("contact-section")?.scrollIntoView({ behavior: "smooth" }); } },
  ];

  return (
    <header className="fixed top-0 left-0 right-0 z-50 px-4 md:px-8 pt-3 pb-2 transition-all duration-300">
      <div 
        className={`max-w-7xl mx-auto flex items-center justify-between px-4 md:px-6 py-2.5 rounded-full transition-all duration-300 ${
          scrolled 
            ? "bg-[#0c0e12]/90 backdrop-blur-2xl border border-white/10 shadow-[0_16px_40px_rgba(0,0,0,0.7)]" 
            : "bg-[#101217]/80 backdrop-blur-xl border border-white/10"
        }`}
      >
        {/* Left: Brand Logo */}
        <button
          onClick={() => { setActiveTab("Home"); window.scrollTo({ top: 0, behavior: "smooth" }); }}
          className="flex items-center gap-3 group text-left"
        >
          <div className="w-8 h-8 rounded-lg bg-white/10 border border-white/15 flex items-center justify-center text-white group-hover:scale-105 transition-transform">
            <Box className="w-4 h-4 text-white" />
          </div>
          <div className="flex flex-col">
            <span className="font-sans font-extrabold text-white text-sm md:text-base tracking-wider uppercase leading-none">
              ACES
            </span>
            <span className="text-[9px] md:text-[10px] text-neutral-400 font-medium tracking-widest uppercase mt-0.5">
              NAGPUR • AUTONOMOUS
            </span>
          </div>
        </button>

        {/* Center: Floating Nav Pills */}
        <nav className="hidden lg:flex items-center gap-1 bg-[#14171d]/90 p-1 rounded-full border border-white/5">
          {navItems.map((item) => {
            const isActive = activeTab === item.label;
            return (
              <button
                key={item.label}
                onClick={item.action}
                className={`px-3.5 py-1.5 rounded-full text-xs font-medium transition-all duration-200 ${
                  isActive
                    ? "bg-[#252830] text-white shadow-sm font-semibold"
                    : "text-neutral-400 hover:text-white hover:bg-white/5"
                }`}
              >
                {item.label}
              </button>
            );
          })}
        </nav>

        {/* Right: CTA + User Profile */}
        <div className="flex items-center gap-2.5">
          <button
            onClick={() => {
              const el = document.getElementById("events-upcoming");
              if (el) el.scrollIntoView({ behavior: "smooth" });
              else navigate("/");
            }}
            className="px-3.5 md:px-4 py-1.5 md:py-2 rounded-full bg-white text-black text-xs font-semibold hover:bg-neutral-200 transition-all shadow-md active:scale-95"
          >
            Upcoming Events
          </button>
          <button
            onClick={() => navigate("/admin")}
            title="Admin & Control Panel"
            className="w-8 h-8 md:w-9 md:h-9 rounded-full bg-white/10 border border-white/15 flex items-center justify-center text-neutral-300 hover:text-white hover:bg-white/20 transition-all"
          >
            <User className="w-4 h-4" />
          </button>
        </div>
      </div>
    </header>
  );
}

