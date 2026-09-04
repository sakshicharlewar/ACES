import { motion } from "framer-motion";
import { useRef, useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { X, ChevronLeft, ChevronRight } from "lucide-react";
import { GlassCard } from "../components/ui/GlassCard";
import { fetchPublicEvents } from "../admin/adminApi";

const CARD_WIDTH = 476; // card width + gap

const DEFAULT_COMPLETED_EVENTS = [
  {
    id: 3,
    title: "REIMAGINE UI/UX Competition",
    slug: "reimagine-uiux-competition-completed",
    date: "August 20, 2025",
    short_description: "UI/UX design challenge to redesign college portals.",
    full_description: "The Department of Computer Engineering, Suryodaya College of Engineering & Technology, organized the UI/UX Competition \"REIMAGINE\" under the ACES Forum on 20th August 2025 at MCA Seminar Hall for teams of two participants. A total of 40 teams (80 participants) competed in preliminary and final rounds.",
    banner: "/Reimagin.jpeg",
    event_status: "completed",
  },
  {
    id: 4,
    title: "Debugging Competition",
    slug: "debugging-competition-completed",
    date: "July 15, 2025",
    short_description: "Annual code debugging competition.",
    full_description: "The Department of Computer Engineering under Forum 'ACES' organized a Debugging Competition on 15th July 2025 at Room No. S-24 and S-30. The competition consisted of preliminary and final rounds for teams of three. A total of 60 teams (180 participants) participated.",
    banner: "/Debugging.jpeg",
    event_status: "completed",
  },
  {
    id: 5,
    title: "Logo Design Competition",
    slug: "logo-design-competition-completed",
    date: "August 13, 2025",
    short_description: "Design the official ACES student chapter logo.",
    full_description: "The Department of Computer Engineering, Suryodaya College of Engineering & Technology, organized a Logo Design Competition on 13th August 2025 at Lab-III. A total of 17 students participated and created logo designs for the ACES forum. The most creative and original design was selected as the official ACES logo.",
    banner: "/LogoCompition.jpeg",
    event_status: "completed",
  },
  {
    id: 6,
    title: "Face the Panel",
    slug: "face-the-panel-completed",
    date: "Upcoming Event",
    short_description: "Mock interview and panel defense session.",
    full_description: "Face the Panel was a career-oriented mock interview event organized by the Department of Computer Engineering under the Students Forum. Participants experienced real interview scenarios, where faculty members assessed their communication, technical knowledge, confidence, and problem-solving skills. The event provided valuable feedback, helping students improve their interview performance, boost confidence, and prepare for placements and future professional opportunities.",
    banner: "/FaceThePanel.jpeg",
    event_status: "completed",
  },
  {
    id: 7,
    title: "Kite Making",
    slug: "kite-making-completed",
    date: "Upcoming Event",
    short_description: "Makar Sankranti special kite designing.",
    full_description: "Kite Making and Flying Competition was a fun-filled event organized by the Department of Computer Engineering to encourage creativity, teamwork, and festive spirit. Students showcased their artistic skills by designing colorful kites and participated enthusiastically in the flying competition, making the event a memorable celebration of innovation, collaboration, and healthy competition.",
    banner: "/KiteMaking.jpeg",
    event_status: "completed",
  },
  {
    id: 8,
    title: "National Conference 2026",
    slug: "national-conference-2026-completed",
    date: "February 3, 2026",
    short_description: "National level conference on Emerging Trends in Computing.",
    full_description: "National Conference 2026 was organized on 03 February 2026 to bring together academicians, researchers, industry experts, and students for knowledge sharing and research discussions. The event featured technical paper presentations, keynote sessions, and interactive discussions, promoting innovation, collaboration, and academic excellence across various disciplines.",
    banner: "/NationalConference.jpeg",
    event_status: "completed",
  },
  {
    id: 9,
    title: "International Conference 2026",
    slug: "international-conference-2026-completed",
    date: "April 13, 2026",
    short_description: "International conference bringing researchers together.",
    full_description: "International Conference 2026 was organized on 13 April 2026 to provide a global platform for researchers, academicians, industry professionals, and students to share innovative research and emerging technologies. The conference featured keynote speeches, technical paper presentations, and interactive sessions, fostering international collaboration, knowledge exchange, and research excellence.",
    banner: "/InternationalConference.jpeg",
    event_status: "completed",
  },
  {
    id: 10,
    title: "EduSkills 3-Day Workshop",
    slug: "eduskills-3-day-workshop-completed",
    date: "30 July – 1 August 2026",
    short_description: "Hands-on cloud & cybersecurity skills training.",
    full_description: "The Department of Computer Engineering and Department of CSE (Data Science) at Suryodaya College of Engineering and Technology successfully organised a three-day EduSkills workshop focused on enhancing students' industry-oriented technical skills. The workshop provided students with practical learning, expert guidance and hands-on exposure to emerging technologies.",
    banner: "/EduSkill.jpeg",
    event_status: "completed",
  },
  {
    id: 11,
    title: "GUEST LECTURE - Smart India Hackathon",
    slug: "guest-lecture-sih-completed",
    date: "11-08-2026 (3:00 PM)",
    short_description: "Informative session on Smart India Hackathon by Kunal Panche Sir.",
    full_description: "An informative session designed to introduce students to the Smart India Hackathon (SIH), its objectives, problem statements, team formation, idea development, and the overall selection process. The session will guide students on how to identify real-world problems, develop innovative solutions, and prepare effectively for participation in SIH.",
    banner: "/NationalConference.jpeg",
    event_status: "completed",
  },
  {
    id: 13,
    title: "GUEST LECTURE - Dr. Lowlesh Yadav (HOD)",
    slug: "guest-lecture-hod-sir",
    date: "28-08-2025",
    short_description: "Special Guest Lecture and interactive technical guidance session by Dr. Lowlesh Yadav (Head of Department).",
    full_description: "Special Guest Lecture and interactive technical guidance session conducted by Dr. Lowlesh Yadav, Head of Computer Engineering Department, Suryodaya College of Engineering & Technology. The session guided students on emerging computing technologies, research opportunities, academic excellence, and career development in modern engineering.",
    banner: "/HODSIR1.jpeg",
    event_status: "completed",
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
        // Filter out only Bug Hunt and BuildX so all genuine Departmental Events (including Debugging Competition) are displayed
        const completedOnly = eventsData.filter(e => {
          const t = (e.title || "").toLowerCase();
          const s = (e.slug || "").toLowerCase();
          const isFlagship = e.id === 1 || s.includes("bug-hunt") || s.includes("bughunt") || t.includes("bug hunt") || s.includes("buildx") || t.includes("buildx");
          return !isFlagship;
        });
        if (!cancelled && completedOnly.length > 0) {
          setEvents(completedOnly);
        }
      } catch (err) {
        console.error("Failed to load completed events:", err);
      } finally {
        if (!cancelled) setIsLoading(false);
      }
    }
    loadEvents();
    window.addEventListener("aces_events_updated", loadEvents);
    return () => {
      cancelled = true;
      window.removeEventListener("aces_events_updated", loadEvents);
    };
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
