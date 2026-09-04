import { motion } from "framer-motion";
import { useRef, useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { X, ChevronLeft, ChevronRight } from "lucide-react";
import { GlassCard } from "../components/ui/GlassCard";
import { fetchPublicEvents } from "../admin/adminApi";

const CARD_WIDTH = 476; // card width + gap

const DEFAULT_COMPLETED_EVENTS = [
  {
    id: 1,
    title: "Bug Hunt: Debug the Web",
    slug: "bug-hunt-debug-the-web",
    subtitle: "Find the bugs",
    date: "11-08-2026",
    short_description: "Challenges teams to identify and fix real HTML, CSS, and JavaScript issues in a web application.",
    full_description: "Challenges teams to identify and fix real HTML, CSS, and JavaScript issues in a web application. Winners are decided by accuracy and completion time.",
    banner: "/Debugging.jpeg",
    event_status: "completed",
  },
  {
    id: 3,
    title: "REIMAGINE UI/UX Competition",
    slug: "reimagine-uiux-competition-completed",
    date: "15-09-2025",
    short_description: "UI/UX design challenge to redesign college portals.",
    banner: "/Reimagin.jpeg",
    event_status: "completed",
  },
  {
    id: 4,
    title: "Debugging Competition",
    slug: "debugging-competition-completed",
    date: "10-10-2025",
    short_description: "Annual code debugging competition.",
    banner: "/Debugging.jpeg",
    event_status: "completed",
  },
  {
    id: 5,
    title: "Logo Design Competition",
    slug: "logo-design-competition-completed",
    date: "20-10-2025",
    short_description: "Design the official ACES student chapter logo.",
    banner: "/LogoCompition.jpeg",
    event_status: "completed",
  },
  {
    id: 6,
    title: "Face the Panel",
    slug: "face-the-panel-completed",
    date: "05-11-2025",
    short_description: "Mock interview and panel defense session.",
    banner: "/FaceThePanel.jpeg",
    event_status: "completed",
  },
  {
    id: 7,
    title: "Kite Making",
    slug: "kite-making-completed",
    date: "14-01-2026",
    short_description: "Makar Sankranti special kite designing.",
    banner: "/KiteMaking.jpeg",
    event_status: "completed",
  },
  {
    id: 8,
    title: "National Conference 2026",
    slug: "national-conference-2026-completed",
    date: "18-02-2026",
    short_description: "National level conference on Emerging Trends in Computing.",
    banner: "/NationalConference.jpeg",
    event_status: "completed",
  },
  {
    id: 9,
    title: "International Conference 2026",
    slug: "international-conference-2026-completed",
    date: "22-03-2026",
    short_description: "International conference bringing researchers together.",
    banner: "/InternationalConference.jpeg",
    event_status: "completed",
  },
  {
    id: 10,
    title: "EduSkills 3-Day Workshop",
    slug: "eduskills-3-day-workshop-completed",
    date: "12-04-2026",
    short_description: "Hands-on cloud & cybersecurity skills training.",
    banner: "/EduSkill.jpeg",
    event_status: "completed",
  },
  {
    id: 11,
    title: "GUEST LECTURE - Smart India Hackathon",
    slug: "guest-lecture-sih-completed",
    date: "11-08-2026",
    short_description: "Informative session on Smart India Hackathon by Kunal Panche Sir.",
    banner: "/NationalConference.jpeg",
    event_status: "completed",
  },
  {
    id: 12,
    title: "BuildX - Project Innovation Challenge",
    slug: "buildx-project-innovation-challenge",
    date: "25-09-2026",
    short_description: "Flagship project innovation challenge for aspiring engineers.",
    banner: "/Reimagin.jpeg",
    event_status: "upcoming",
  },
];

export function CompletedEvents() {
  const navigate = useNavigate();
  const [events, setEvents] = useState(DEFAULT_COMPLETED_EVENTS);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [activeGallery, setActiveGallery] = useState(null);
  const [currentImgIndex, setCurrentImgIndex] = useState(0);
  const dragStartX = useRef(0);
  const containerRef = useRef(null);
  const [maxScrollX, setMaxScrollX] = useState(0);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    let cancelled = false;
    async function loadEvents() {
      try {
        let eventsData = await fetchPublicEvents({ status: "all" });
        if (!Array.isArray(eventsData)) {
          eventsData = eventsData.items || [];
        }
        if (!cancelled && eventsData.length > 0) {
          setEvents(eventsData);
        }
      } catch (err) {
        console.error("Failed to load completed events:", err);
      } finally {
        if (!cancelled) setIsLoading(false);
      }
    }
    loadEvents();
    return () => { cancelled = true; };
  }, []);

  // Compute the real max scroll so the last card aligns flush — no blank space
  useEffect(() => {
    const compute = () => {
      if (!containerRef.current || events.length === 0) return;
      const containerWidth = containerRef.current.clientWidth;
      // track = 96px left-pad + N*428px cards + (N-1)*32px gaps + 96px right-pad
      const trackWidth = 96 + events.length * 428 + (events.length - 1) * 32 + 96;
      const computed = Math.max(0, trackWidth - containerWidth);
      setMaxScrollX(computed);
    };
    compute();
    window.addEventListener("resize", compute);
    return () => window.removeEventListener("resize", compute);
  }, [events]);

  const maxIndex = events.length - 1;

  const prev = () => setCurrentIndex(i => Math.max(i - 1, 0));
  const next = () => setCurrentIndex(i => Math.min(i + 1, maxIndex));

  const openGallery = (event) => {
    setActiveGallery(event);
    setCurrentImgIndex(0);
  };

  // Clamp scroll so we never show blank space past the last card
  const scrollX = Math.min(currentIndex * CARD_WIDTH, maxScrollX);
  const progressPercent = maxIndex > 0 ? (currentIndex / maxIndex) * 100 : 0;

  return (
    <>
      <section id="gallery" className="py-24 bg-background" style={{ overflowX: "hidden", overflowY: "visible" }}>
        <div className="text-center mb-16 px-6">
          <h2 className="font-sans text-3xl md:text-5xl font-medium">Departmental Events</h2>
        </div>

        {/* Timeline progress bar */}
        <div className="relative w-full h-[2px] bg-border mb-12 px-24">
          <motion.div
            className="h-full bg-accent relative"
            animate={{ width: `${progressPercent}%` }}
            transition={{ type: "spring", stiffness: 120, damping: 20 }}
          >
            <div className="absolute right-0 top-1/2 -translate-y-1/2 w-2 h-2 rounded-full bg-accent shadow-[0_0_10px_#3B82F6]" />
          </motion.div>
        </div>

        {/* Carousel */}
        <div ref={containerRef} className="relative w-full" style={{ overflow: "visible", paddingTop: "40px", paddingBottom: "40px" }}>
          <motion.div
            className="flex gap-8 px-24"
            animate={{ x: -scrollX }}
            transition={{ type: "spring", stiffness: 200, damping: 30 }}
            drag="x"
            dragConstraints={{ left: -maxScrollX, right: 0 }}
            dragElastic={0.05}
            onDragStart={(_, info) => { dragStartX.current = info.point.x; }}
            onDragEnd={(_, info) => {
              const diff = dragStartX.current - info.point.x;
              if (diff > 60) next();
              else if (diff < -60) prev();
            }}
            style={{ cursor: "grab" }}
            whileTap={{ cursor: "grabbing" }}
          >
            {events.length === 0 && !isLoading && (
              <div className="w-full text-center text-white/50 py-12">No departmental events to show.</div>
            )}
            {events.map((event, index) => (
              <div key={event.id} className="w-[428px] shrink-0 relative z-10 cursor-pointer" onClick={() => { if(event.gallery_images?.length) openGallery(event); }}>
                <GlassCard
                  className={`p-6 group flex flex-col h-[620px] ${index % 2 === 0 ? '-translate-y-8' : 'translate-y-8'} transition-all duration-300 hover:scale-[1.02] hover:shadow-[0_0_40px_rgba(59,130,246,0.15)] hover:border-accent/40`}
                >
                  <div className="overflow-hidden rounded-xl mb-6 relative h-[380px] w-full shrink-0 bg-black/40">
                    <div className="absolute inset-0 bg-black/10 group-hover:bg-transparent transition-colors z-10" />
                    <img
                      src={event.banner || "/Reimagin.jpeg"}
                      alt={event.title}
                      loading="lazy"
                      decoding="async"
                      className="w-full h-full object-contain object-center transition-transform duration-500 p-2"
                    />
                  </div>
                  <div className="px-2 flex flex-col flex-1">
                    <div className="font-label text-xs text-accent mb-2 uppercase tracking-wider">{event.date}</div>
                    <h4 className="font-sans text-xl font-bold text-white mb-3 group-hover:text-accent transition-colors">{event.title}</h4>
                    <p className="font-cambria text-sm text-text-secondary line-clamp-2 flex-1">{event.full_description || event.short_description}</p>
                  </div>
                </GlassCard>
              </div>
            ))}
          </motion.div>
        </div>

        {/* Navigation Arrows */}
        <div className="flex items-center justify-center gap-4 mt-12">
          <button
            onClick={prev}
            disabled={currentIndex === 0}
            className="p-3 rounded-full bg-white/5 border border-white/10 text-white/60 hover:text-white hover:bg-white/10 hover:border-accent/40 transition-all duration-300 disabled:opacity-30 disabled:cursor-not-allowed"
          >
            <ChevronLeft className="w-6 h-6" />
          </button>
          <span className="font-label text-sm text-text-secondary">
            {currentIndex + 1} / {events.length}
          </span>
          <button
            onClick={next}
            disabled={currentIndex === maxIndex}
            className="p-3 rounded-full bg-white/5 border border-white/10 text-white/60 hover:text-white hover:bg-white/10 hover:border-accent/40 transition-all duration-300 disabled:opacity-30 disabled:cursor-not-allowed"
          >
            <ChevronRight className="w-6 h-6" />
          </button>
        </div>
      </section>

      {/* Lightbox Gallery */}
      {activeGallery && (
        <div className="fixed inset-0 z-[100] bg-black/95 backdrop-blur-xl flex">
          <button
            className="absolute top-8 right-8 text-white/50 hover:text-white z-50"
            onClick={() => setActiveGallery(null)}
          >
            <X className="w-8 h-8" />
          </button>

          <div className="flex-1 min-w-0 p-8 flex flex-col items-center justify-center relative">
            <div className="w-full max-w-4xl max-h-full flex items-center justify-center">
              <img
                src={activeGallery.gallery_images[currentImgIndex]}
                alt="Gallery"
                className="max-w-full max-h-[75vh] object-contain rounded-xl shadow-2xl"
              />
            </div>

            {activeGallery.gallery_images.length > 1 && (
              <div className="flex items-center gap-4 mt-4">
                <button
                  onClick={() => setCurrentImgIndex(i => Math.max(i - 1, 0))}
                  disabled={currentImgIndex === 0}
                  className="p-2 rounded-full bg-white/10 hover:bg-white/20 text-white disabled:opacity-30"
                >
                  <ChevronLeft className="w-5 h-5" />
                </button>
                <span className="text-white/60 text-sm">
                  {currentImgIndex + 1} / {activeGallery.gallery_images.length}
                </span>
                <button
                  onClick={() => setCurrentImgIndex(i => Math.min(i + 1, activeGallery.gallery_images.length - 1))}
                  disabled={currentImgIndex === activeGallery.gallery_images.length - 1}
                  className="p-2 rounded-full bg-white/10 hover:bg-white/20 text-white disabled:opacity-30"
                >
                  <ChevronRight className="w-5 h-5" />
                </button>
              </div>
            )}
          </div>
        </div>
      )}
    </>
  );
}
