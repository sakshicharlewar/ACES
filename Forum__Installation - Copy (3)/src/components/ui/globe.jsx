import React, { useEffect, useRef, useState } from "react";

const Globe = () => {
  return (
    <>
      <style>
        {`
          @keyframes earthRotate {
            0% { background-position: 0 0; }
            100% { background-position: 400px 0; }
          }

          @keyframes twinkling {
            0%,100% { opacity: 0.1; }
            50% { opacity: 1; }
          }

          @keyframes twinkling-slow {
            0%,100% { opacity: 0.1; }
            50% { opacity: 1; }
          }

          @keyframes twinkling-long {
            0%,100% { opacity: 0.1; }
            50% { opacity: 1; }
          }

          @keyframes twinkling-fast {
            0%,100% { opacity: 0.1; }
            50% { opacity: 1; }
          }
        `}
      </style>

      <div className="flex items-center justify-center" aria-hidden="true">
        <div
          className="relative rounded-full overflow-hidden"
          style={{
            width: "clamp(220px, 30vw, 300px)",
            height: "clamp(220px, 30vw, 300px)",
            backgroundImage:
              "url('https://pub-940ccf6255b54fa799a9b01050e6c227.r2.dev/globe.jpeg')",
            backgroundSize: "cover",
            backgroundPosition: "left",
            animation: "earthRotate 30s linear infinite",
            boxShadow:
              "0 0 20px rgba(255,255,255,0.2), -5px 0 8px #c3f4ff inset, 15px 2px 25px #000 inset, -24px -2px 34px #c3f4ff99 inset, 250px 0 44px #00000066 inset, 150px 0 38px #000000aa inset",
          }}
        >
          {/* Stars inside globe */}
          <div
            className="absolute left-[-20px] w-1 h-1 bg-white rounded-full"
            style={{ animation: "twinkling 3s infinite" }}
          />
          <div
            className="absolute left-[-40px] top-[30px] w-1 h-1 bg-white rounded-full"
            style={{ animation: "twinkling-slow 2s infinite" }}
          />
          <div
            className="absolute left-[350px] top-[90px] w-1 h-1 bg-white rounded-full"
            style={{ animation: "twinkling-long 4s infinite" }}
          />
          <div
            className="absolute left-[200px] top-[290px] w-1 h-1 bg-white rounded-full"
            style={{ animation: "twinkling 3s infinite" }}
          />
          <div
            className="absolute left-[50px] top-[270px] w-1 h-1 bg-white rounded-full"
            style={{ animation: "twinkling-fast 1.5s infinite" }}
          />
          <div
            className="absolute left-[250px] top-[-50px] w-1 h-1 bg-white rounded-full"
            style={{ animation: "twinkling-long 4s infinite" }}
          />
          <div
            className="absolute left-[290px] top-[60px] w-1 h-1 bg-white rounded-full"
            style={{ animation: "twinkling-slow 2s infinite" }}
          />
        </div>
      </div>
    </>
  );
};

export function GlobeSection() {
  const sectionRef = useRef(null);
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setVisible(true);
          observer.disconnect();
        }
      },
      { threshold: 0.15 }
    );
    if (sectionRef.current) observer.observe(sectionRef.current);
    return () => observer.disconnect();
  }, []);

  return (
    <section
      ref={sectionRef}
      className="relative mt-16 rounded-2xl overflow-hidden"
      style={{
        background:
          "radial-gradient(ellipse at 50% 0%, rgba(37,99,235,0.18) 0%, rgba(17,24,39,0.98) 55%), radial-gradient(ellipse at 80% 100%, rgba(99,102,241,0.12) 0%, transparent 60%), #060c1a",
      }}
      aria-label="Global network section"
    >
      {/* Background stars */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none" aria-hidden="true">
        {[
          { top: "8%", left: "12%", size: 2, anim: "twinkling 4s infinite" },
          { top: "15%", left: "88%", size: 1.5, anim: "twinkling-slow 3s infinite" },
          { top: "70%", left: "5%", size: 1.5, anim: "twinkling-long 5s infinite" },
          { top: "80%", left: "92%", size: 2, anim: "twinkling-fast 2.5s infinite" },
          { top: "40%", left: "3%", size: 1, anim: "twinkling 6s infinite" },
          { top: "55%", left: "95%", size: 1, anim: "twinkling-slow 4s infinite" },
          { top: "25%", left: "6%", size: 1, anim: "twinkling-fast 3s infinite" },
          { top: "90%", left: "40%", size: 1.5, anim: "twinkling 5s infinite" },
        ].map((star, i) => (
          <div
            key={i}
            className="absolute rounded-full bg-white"
            style={{
              top: star.top,
              left: star.left,
              width: star.size,
              height: star.size,
              animation: star.anim,
              opacity: 0.3,
            }}
          />
        ))}
      </div>

      {/* Soft radial blue glow behind globe */}
      <div
        className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 rounded-full pointer-events-none"
        style={{
          width: "420px",
          height: "420px",
          background:
            "radial-gradient(circle, rgba(59,130,246,0.15) 0%, rgba(99,102,241,0.08) 40%, transparent 70%)",
          filter: "blur(8px)",
        }}
        aria-hidden="true"
      />

      {/* Content */}
      <div
        className="relative z-10 flex flex-col items-center text-center px-6 py-16"
        style={{
          opacity: visible ? 1 : 0,
          transform: visible ? "translateY(0) scale(1)" : "translateY(24px) scale(0.97)",
          transition: "opacity 0.8s ease, transform 0.8s ease",
        }}
      >
        {/* Heading */}
        <h2 className="text-white font-bold text-2xl md:text-3xl tracking-tight mb-3">
          Connect Beyond Your Campus
        </h2>

        {/* Subtitle */}
        <p className="text-white/40 text-sm md:text-base max-w-xs md:max-w-sm mb-10 leading-relaxed">
          Explore the growing network of forum installations and communities.
        </p>

        {/* Globe */}
        <Globe />

        {/* Tag line */}
        <p className="mt-10 text-xs md:text-sm text-white/30 tracking-widest uppercase font-medium">
          Connected&nbsp;&nbsp;•&nbsp;&nbsp;Collaborative&nbsp;&nbsp;•&nbsp;&nbsp;Global
        </p>
      </div>
    </section>
  );
}

export default Globe;
