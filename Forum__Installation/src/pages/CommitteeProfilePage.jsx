import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { ArrowLeft, Link, Globe, Mail, Award, Briefcase, Code, GraduationCap, X, Loader2 } from "lucide-react";
import { GlassCard } from "../components/ui/GlassCard";

const BASE_URL = import.meta.env.VITE_API_URL || "https://aces-backkend.onrender.com";

function ensureArray(val) {
  if (!val) return [];
  if (Array.isArray(val)) return val;
  if (typeof val === "string") {
    try {
      const parsed = JSON.parse(val);
      if (Array.isArray(parsed)) return parsed;
    } catch (e) {}
    return [val];
  }
  return [];
}

export function CommitteeProfilePage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [activeCert, setActiveCert] = useState(null);
  
  const [member, setMember] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    window.scrollTo(0, 0);
    fetch(`${BASE_URL}/api/committee`)
      .then(res => res.json())
      .then(data => {
        const found = data.find(m => m.key === id || m.key?.toLowerCase() === id?.toLowerCase());
        if (found) {
          setMember({
            ...found,
            skills: ensureArray(found.skills),
            experience: ensureArray(found.experience),
            projects: ensureArray(found.projects),
            achievements: ensureArray(found.achievements),
            certificates: ensureArray(found.certificates),
          });
        } else {
          setMember(null);
        }
        setLoading(false);
      })
      .catch(err => {
        console.error("Failed to fetch committee data:", err);
        setLoading(false);
      });
  }, [id]);

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex flex-col items-center justify-center text-white">
        <Loader2 className="w-10 h-10 animate-spin text-blue-500 mb-4" />
        <p className="text-white/50">Loading profile...</p>
      </div>
    );
  }

  if (!member) {
    return (
      <div className="min-h-screen bg-background flex flex-col items-center justify-center text-white">
        <h1 className="text-3xl font-bold mb-4">Member Not Found</h1>
        <button 
          onClick={() => navigate("/")}
          className="text-accent hover:underline flex items-center gap-2"
        >
          <ArrowLeft className="w-4 h-4" /> Back to Home
        </button>
      </div>
    );
  }

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: { 
      opacity: 1,
      transition: { staggerChildren: 0.1 }
    }
  };

  const itemVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: { 
      opacity: 1, 
      y: 0,
      transition: { duration: 0.6, ease: "easeOut" }
    }
  };

  return (
    <div className="min-h-screen bg-background text-text-primary pt-24 pb-16 px-6 md:px-12 relative overflow-hidden">
      {/* Ambient background glow */}
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[800px] h-[500px] bg-accent/10 blur-[120px] rounded-full pointer-events-none" />

      <div className="container mx-auto max-w-5xl relative z-10">
        
        {/* Navigation */}
        <button 
          onClick={() => navigate(-1)}
          className="group flex items-center gap-2 text-text-secondary hover:text-white transition-colors mb-12 font-medium"
        >
          <div className="w-8 h-8 rounded-full bg-white/5 flex items-center justify-center border border-white/10 group-hover:border-accent/40 group-hover:bg-accent/10 transition-all">
            <ArrowLeft className="w-4 h-4" />
          </div>
          Back to Committee
        </button>

        <motion.div 
          variants={containerVariants}
          initial="hidden"
          animate="visible"
          className="grid grid-cols-1 lg:grid-cols-[1fr_2fr] gap-12"
        >
          {/* Left Column - Profile Info */}
          <div className="space-y-8">
            <motion.div variants={itemVariants}>
              <GlassCard className="p-8 flex flex-col items-center text-center">
                <div className="w-48 h-48 rounded-2xl overflow-hidden mb-6 border-2 border-accent/40 shadow-[0_0_30px_rgba(59,130,246,0.3)] relative">
                  <div className="absolute inset-0 bg-gradient-to-t from-background/80 to-transparent z-10" />
                  <img src={member.image} alt={member.name} className="w-full h-full object-cover relative z-0" />
                </div>
                
                <h1 className="text-3xl font-bold text-white mb-2">{member.name}</h1>
                <p className="text-accent text-lg font-medium mb-6">{member.role}</p>

                {/* Social Links */}
                <div className="flex gap-4 justify-center">
                  {member.social?.linkedin && (
                    <a href={member.social.linkedin} target="_blank" rel="noopener noreferrer" className="p-3 rounded-full bg-white/5 hover:bg-accent hover:text-white text-text-secondary transition-all shadow-[0_0_15px_rgba(59,130,246,0)] hover:shadow-[0_0_15px_rgba(59,130,246,0.5)]" title="LinkedIn">
                      <Link className="w-5 h-5" />
                    </a>
                  )}
                  {member.social?.github && (
                    <a href={member.social.github} target="_blank" rel="noopener noreferrer" className="p-3 rounded-full bg-white/5 hover:bg-accent hover:text-white text-text-secondary transition-all shadow-[0_0_15px_rgba(59,130,246,0)] hover:shadow-[0_0_15px_rgba(59,130,246,0.5)]" title="GitHub">
                      <Globe className="w-5 h-5" />
                    </a>
                  )}
                  {member.social?.email && (
                    <a href={member.social.email} className="p-3 rounded-full bg-white/5 hover:bg-accent hover:text-white text-text-secondary transition-all shadow-[0_0_15px_rgba(59,130,246,0)] hover:shadow-[0_0_15px_rgba(59,130,246,0.5)]" title="Email">
                      <Mail className="w-5 h-5" />
                    </a>
                  )}
                </div>
              </GlassCard>
            </motion.div>

            {/* Skills */}
            <motion.div variants={itemVariants}>
              <GlassCard className="p-8">
                <h3 className="text-xl font-bold text-white mb-6 flex items-center gap-2">
                  <Code className="w-5 h-5 text-accent" /> Skills & Expertise
                </h3>
                <div className="flex flex-wrap gap-3">
                  {(() => {
                    const skills = Array.isArray(member.skills) ? member.skills : (typeof member.skills === 'string' ? [member.skills] : []);
                    return skills.map((skill, index) => (
                      <span 
                        key={index}
                        className="px-4 py-2 rounded-full text-sm font-medium bg-accent/10 text-accent border border-accent/20 shadow-[0_0_15px_rgba(59,130,246,0.1)] hover:shadow-[0_0_20px_rgba(59,130,246,0.3)] transition-all"
                      >
                        {typeof skill === 'string' ? skill : skill?.title || JSON.stringify(skill)}
                      </span>
                    ));
                  })()}
                </div>
              </GlassCard>
            </motion.div>
          </div>

          {/* Right Column - Details */}
          <div className="space-y-8">
            {/* Bio */}
            <motion.div variants={itemVariants}>
              <GlassCard className="p-8 md:p-10">
                <h2 className="text-2xl font-bold text-white mb-4">About</h2>
                <p className="text-text-secondary leading-relaxed font-cambria text-lg">
                  {member.bio}
                </p>
              </GlassCard>
            </motion.div>

            {/* Experience — only show if there are entries */}
            {member.experience && member.experience.length > 0 && (
              <motion.div variants={itemVariants}>
                <GlassCard className="p-8 md:p-10">
                  <h3 className="text-xl font-bold text-white mb-6 flex items-center gap-2">
                    <Briefcase className="w-5 h-5 text-accent" /> Experience
                  </h3>
                  <div className="space-y-6">
                    {member.experience.map((exp, idx) => (
                      <div key={idx} className="relative pl-6 border-l-2 border-accent/30 hover:border-accent transition-colors duration-300">
                        <div className="absolute -left-[9px] top-1.5 w-4 h-4 rounded-full bg-background border-2 border-accent shadow-[0_0_10px_rgba(59,130,246,0.5)]" />
                        <h4 className="text-white font-bold text-lg">{exp.role}</h4>
                        <p className="text-accent text-sm mb-2 font-medium">{exp.company}</p>
                        <p className="text-text-secondary text-sm font-label uppercase tracking-wider">{exp.duration}</p>
                      </div>
                    ))}
                  </div>
                </GlassCard>
              </motion.div>
            )}

            {/* Projects & Achievements Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              {member.projects && member.projects.length > 0 && (
                <motion.div variants={itemVariants}>
                  <GlassCard className="p-8 h-full">
                    <h3 className="text-xl font-bold text-white mb-6 flex items-center gap-2">
                      <Code className="w-5 h-5 text-accent" /> Projects
                    </h3>
                    <div className="space-y-6">
                      {member.projects.map((proj, idx) => (
                        <div key={idx} className="group cursor-default">
                          <h4 className="text-white font-bold mb-1 group-hover:text-accent transition-colors">{proj.title}</h4>
                          <p className="text-text-secondary text-sm line-clamp-3">{proj.desc}</p>
                        </div>
                      ))}
                    </div>
                  </GlassCard>
                </motion.div>
              )}

              {member.achievements && member.achievements.length > 0 && (
                <motion.div variants={itemVariants}>
                  <GlassCard className="p-8 h-full">
                    <h3 className="text-xl font-bold text-white mb-6 flex items-center gap-2">
                      <Award className="w-5 h-5 text-accent" /> Achievements
                    </h3>
                    <div className="space-y-6">
                      {member.achievements.map((ach, idx) => (
                        <div key={idx} className="group cursor-default">
                          <h4 className="text-white font-bold mb-1 group-hover:text-accent transition-colors">{ach.title}</h4>
                          <p className="text-text-secondary text-sm line-clamp-3">{ach.desc}</p>
                        </div>
                      ))}
                    </div>
                  </GlassCard>
                </motion.div>
              )}
            </div>

            {/* Certificates */}
            {member.certificates && member.certificates.length > 0 && (
              <motion.div variants={itemVariants}>
                <GlassCard className="p-8 md:p-10">
                  <h3 className="text-xl font-bold text-white mb-6 flex items-center gap-2">
                    <GraduationCap className="w-5 h-5 text-accent" /> Certifications
                  </h3>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                    {member.certificates.map((cert, idx) => (
                      <div 
                        key={idx} 
                        className="rounded-xl overflow-hidden cursor-pointer group relative aspect-video border border-white/10"
                        onClick={() => setActiveCert(cert)}
                      >
                        <div className="absolute inset-0 bg-accent/20 opacity-0 group-hover:opacity-100 transition-opacity z-10 flex items-center justify-center backdrop-blur-[2px]">
                          <span className="bg-background/80 text-white px-4 py-2 rounded-full text-sm font-medium border border-accent/30 shadow-[0_0_15px_rgba(59,130,246,0.3)]">View Certificate</span>
                        </div>
                        <img src={cert} alt="Certificate" className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105" />
                      </div>
                    ))}
                  </div>
                </GlassCard>
              </motion.div>
            )}
          </div>
        </motion.div>
      </div>

      {/* Lightbox Modal for Certificates */}
      <AnimatePresence>
        {activeCert && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[100] bg-black/90 backdrop-blur-xl flex items-center justify-center"
            onClick={() => setActiveCert(null)}
          >
            <button
              className="absolute top-8 right-8 text-white/50 hover:text-white transition-colors"
              onClick={() => setActiveCert(null)}
            >
              <X className="w-8 h-8" />
            </button>
            <div 
              className="relative w-full max-w-5xl aspect-video px-12 flex items-center justify-center"
              onClick={(e) => e.stopPropagation()}
            >
              <motion.img
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.95 }}
                transition={{ duration: 0.4 }}
                src={activeCert}
                className="max-h-[80vh] object-contain rounded-lg shadow-2xl border border-white/10"
                alt="Certificate Full View"
              />
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
