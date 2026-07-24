import { motion, AnimatePresence } from "framer-motion";
import { useState, useRef } from "react";
import { GlassCard } from "../components/ui/GlassCard";
import { MagneticButton } from "../components/ui/MagneticButton";
import { CheckCircle2, ArrowRight, X, Upload, Loader2, Rocket, Monitor, GraduationCap, Globe, Users, Star } from "lucide-react";

export function ComplaintForm() {
  const [activeModal, setActiveModal] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSubmitted, setIsSubmitted] = useState(false);
  
  const [formData, setFormData] = useState({
    fullName: "",
    email: "",
    mobile: "",
    department: "",
    year: "",
    category: "",
    subject: "",
    description: "",
    expectedOutcome: "",
    attachment: null,
  });

  const [errors, setErrors] = useState({});
  const fileInputRef = useRef(null);

  const openModal = () => {
    setActiveModal(true);
    setIsSubmitted(false);
    resetForm();
    window.dispatchEvent(new CustomEvent('toggleFloatingButton', { detail: false }));
  };

  const closeModal = () => {
    setActiveModal(false);
    resetForm();
    window.dispatchEvent(new CustomEvent('toggleFloatingButton', { detail: true }));
  };

  const resetForm = () => {
    setFormData({
      fullName: "",
      email: "",
      mobile: "",
      department: "",
      year: "",
      category: "",
      subject: "",
      description: "",
      expectedOutcome: "",
      attachment: null,
    });
    setErrors({});
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value
    }));
    if (errors[name]) {
      setErrors(prev => ({ ...prev, [name]: null }));
    }
  };

  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      const allowedTypes = ['application/pdf', 'image/jpeg', 'image/png'];
      if (!allowedTypes.includes(file.type)) {
        setErrors(prev => ({ ...prev, attachment: "Only PDF, JPG, and PNG are allowed." }));
        return;
      }
      setFormData(prev => ({ ...prev, attachment: file }));
      setErrors(prev => ({ ...prev, attachment: null }));
    }
  };

  const validateForm = () => {
    let newErrors = {};

    if (!formData.fullName.trim()) newErrors.fullName = "Name is required.";
    if (!formData.email.trim() || !/^\S+@\S+\.\S+$/.test(formData.email)) newErrors.email = "Valid email is required.";
    
    if (formData.mobile && !/^\d{10}$/.test(formData.mobile)) {
      newErrors.mobile = "Mobile number must be exactly 10 digits.";
    }

    if (!formData.department) newErrors.department = "Department is required.";
    if (!formData.year) newErrors.year = "Year is required.";
    if (!formData.category) newErrors.category = "Category is required.";
    if (!formData.subject.trim()) newErrors.subject = "Subject/Title is required.";
    if (!formData.description.trim()) newErrors.description = "Description is required.";

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validateForm()) return;

    setIsSubmitting(true);
    
    // Attempt automatic email notification (to acescomputer0101@gmail.com)
    try {
      await fetch('/api/submit-innovation', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          to: 'acescomputer0101@gmail.com',
          subject: '🚀 New Innovation Box Submission',
          details: {
            Name: formData.fullName,
            Email: formData.email,
            Department: formData.department,
            Year: formData.year,
            IdeaTitle: formData.subject,
            Category: formData.category,
            ProblemStatement: "Not provided directly, included in description.",
            ProposedSolution: formData.description,
            ExpectedImpact: formData.expectedOutcome || "None provided",
            AdditionalNotes: formData.mobile ? `Mobile: ${formData.mobile}` : "None",
            SubmissionTime: new Date().toISOString()
          }
        })
      });
    } catch (error) {
      console.error("Email notification failed:", error);
    }

    // Simulate API call for database save (fallback success)
    setTimeout(() => {
      setIsSubmitting(false);
      setIsSubmitted(true);
      setTimeout(() => {
        setIsSubmitted(false);
        closeModal();
      }, 3000);
    }, 2000);
  };

  const inputClass = (error) => 
    `w-full bg-white/5 border ${error ? 'border-red-500 focus:border-red-500' : 'border-white/10 focus:border-accent/50'} rounded-xl px-4 py-3 text-white focus:outline-none transition-colors text-sm placeholder-white/30`;

  return (
    <section className="py-24 px-6 md:px-12 relative overflow-hidden">
      {/* Background Glow */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[800px] bg-accent/5 rounded-full blur-[100px] pointer-events-none" />
      
      <div className="container mx-auto max-w-[1200px] relative z-10">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.8 }}
          className="text-center mb-12"
        >
          <h2 className="font-label tracking-wide text-3xl md:text-5xl font-medium mb-4">Innovation Box</h2>
          <p className="text-text-secondary">We value your privacy and input.</p>
        </motion.div>

        {/* Idea Box Layout */}
        <motion.div
          initial={{ opacity: 0, y: 40 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.8, delay: 0.2 }}
        >
          <GlassCard className="group p-8 md:p-10 transition-all duration-500 hover:-translate-y-2 hover:shadow-[0_0_30px_rgba(59,130,246,0.2)] hover:border-blue-500/30 overflow-hidden relative">
            <div className="grid grid-cols-1 md:grid-cols-12 gap-10 lg:gap-16 items-center">
              
              {/* Left Column (40%) */}
              <div className="md:col-span-5 flex flex-col items-start text-left z-10">
                <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-white/5 border border-white/10 text-accent font-medium text-sm mb-6">
                  <span>💡</span> Idea Box
                </div>
                <h3 className="font-sans text-3xl md:text-4xl font-bold text-white mb-4 leading-tight">
                  Turn Your Ideas <br /> Into Reality
                </h3>
                <p className="font-cambria text-text-secondary text-sm md:text-base leading-relaxed mb-8">
                  Have an innovative idea to improve ACES? We welcome your creative suggestions for technical events, workshops, hackathons, website enhancements, student activities, and new initiatives. Every submission is carefully reviewed by the ACES committee to help create a better learning experience for everyone.
                </p>

                {/* Feature List */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-y-4 gap-x-6 mb-10 w-full">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-full bg-blue-500/10 flex items-center justify-center flex-shrink-0">
                      <Rocket className="w-4 h-4 text-blue-400" />
                    </div>
                    <span className="text-sm text-gray-300 font-medium">Technical Events</span>
                  </div>
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-full bg-blue-500/10 flex items-center justify-center flex-shrink-0">
                      <Monitor className="w-4 h-4 text-blue-400" />
                    </div>
                    <span className="text-sm text-gray-300 font-medium">Coding Competitions</span>
                  </div>
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-full bg-blue-500/10 flex items-center justify-center flex-shrink-0">
                      <GraduationCap className="w-4 h-4 text-blue-400" />
                    </div>
                    <span className="text-sm text-gray-300 font-medium">Workshops & Seminars</span>
                  </div>
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-full bg-blue-500/10 flex items-center justify-center flex-shrink-0">
                      <Globe className="w-4 h-4 text-blue-400" />
                    </div>
                    <span className="text-sm text-gray-300 font-medium">Website Improvements</span>
                  </div>
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-full bg-blue-500/10 flex items-center justify-center flex-shrink-0">
                      <Users className="w-4 h-4 text-blue-400" />
                    </div>
                    <span className="text-sm text-gray-300 font-medium">Student Activities</span>
                  </div>
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-full bg-blue-500/10 flex items-center justify-center flex-shrink-0">
                      <Star className="w-4 h-4 text-blue-400" />
                    </div>
                    <span className="text-sm text-gray-300 font-medium">New Initiatives</span>
                  </div>
                </div>

                {/* Info Badge */}
                <div className="bg-white/5 border border-white/10 rounded-lg px-4 py-3 flex items-center gap-3 w-full sm:w-auto">
                  <CheckCircle2 className="w-5 h-5 text-green-400 flex-shrink-0" />
                  <span className="text-sm text-gray-300">Every idea is reviewed by the ACES Committee.</span>
                </div>
              </div>

              {/* Right Column (60%) */}
              <div className="md:col-span-7 flex flex-col items-center justify-center relative mt-10 md:mt-0">
                {/* Generated Illustration */}
                <div className="w-full max-w-[500px] mb-10 relative">
                  <img 
                    src="/ideabox-illustration.png" 
                    alt="Brainstorming Ideas" 
                    className="w-full h-auto object-contain"
                    style={{ filter: "drop-shadow(0 0 20px rgba(59,130,246,0.15))" }}
                  />
                </div>
                
                {/* CTA Button */}
                <MagneticButton 
                  onClick={openModal}
                  className="bg-[#2563EB] hover:bg-[#1D4ED8] text-white rounded-full px-8 py-4 font-semibold text-lg flex items-center gap-3 transition-all duration-300 hover:scale-105 hover:shadow-[0_0_20px_rgba(59,130,246,0.4)] border-none outline-none"
                >
                  Submit Your Idea <ArrowRight className="w-5 h-5" />
                </MagneticButton>
              </div>

            </div>
          </GlassCard>
        </motion.div>
      </div>

      {/* Modal Overlay */}
      <AnimatePresence>
        {activeModal && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6 bg-black/80 backdrop-blur-md"
          >
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              transition={{ duration: 0.3 }}
              className="w-full max-w-4xl max-h-[90vh] overflow-y-auto rounded-3xl hide-scrollbar"
            >
              <GlassCard className="relative p-6 sm:p-10 border border-white/20 bg-background/95 backdrop-blur-xl shadow-2xl">
                <button 
                  onClick={closeModal}
                  disabled={isSubmitting}
                  className="absolute top-6 right-6 text-text-secondary hover:text-white transition-colors bg-white/5 hover:bg-white/10 p-2 rounded-full disabled:opacity-50"
                >
                  <X className="w-5 h-5" />
                </button>

                {isSubmitted ? (
                  <motion.div 
                    initial={{ opacity: 0, scale: 0.9 }}
                    animate={{ opacity: 1, scale: 1 }}
                    className="flex flex-col items-center justify-center py-24 text-center"
                  >
                    <CheckCircle2 className="w-20 h-20 text-green-400 mb-6" />
                    <h3 className="text-3xl font-medium text-white mb-2">Success!</h3>
                    <p className="text-text-secondary text-lg">
                      Your valuable idea has been received and will be reviewed.
                    </p>
                  </motion.div>
                ) : (
                  <>
                    <h3 className="text-3xl font-sans font-medium text-white mb-2">
                      Submit Your Idea
                    </h3>
                    <p className="text-text-secondary mb-8 text-sm">
                      We would love to hear your ideas and suggestions for improvement.
                    </p>

                    <form onSubmit={handleSubmit} className="flex flex-col gap-6" noValidate>
                      
                      {/* Name & Email */}
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div className="flex flex-col gap-2">
                          <label className="font-label text-sm text-text-secondary">
                            Full Name <span className="text-accent">*</span>
                          </label>
                          <input 
                            name="fullName"
                            value={formData.fullName}
                            onChange={handleChange}
                            type="text"
                            className={inputClass(errors.fullName)}
                            placeholder="Enter your full name"
                          />
                          {errors.fullName && <span className="text-red-500 text-xs">{errors.fullName}</span>}
                        </div>
                        <div className="flex flex-col gap-2">
                          <label className="font-label text-sm text-text-secondary">
                            Email Address <span className="text-accent">*</span>
                          </label>
                          <input 
                            name="email"
                            value={formData.email}
                            onChange={handleChange}
                            type="email"
                            className={inputClass(errors.email)}
                            placeholder="Enter your email"
                          />
                          {errors.email && <span className="text-red-500 text-xs">{errors.email}</span>}
                        </div>
                      </div>

                      {/* Mobile & Department */}
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div className="flex flex-col gap-2">
                          <label className="font-label text-sm text-text-secondary">
                            Mobile Number (Optional)
                          </label>
                          <input 
                            name="mobile"
                            value={formData.mobile}
                            onChange={handleChange}
                            type="tel"
                            className={inputClass(errors.mobile)}
                            placeholder="10-digit mobile number"
                          />
                          {errors.mobile && <span className="text-red-500 text-xs">{errors.mobile}</span>}
                        </div>
                        <div className="flex flex-col gap-2">
                          <label className="font-label text-sm text-text-secondary">
                            Department / Branch <span className="text-accent">*</span>
                          </label>
                          <div className="relative">
                            <select 
                              name="department"
                              value={formData.department}
                              onChange={handleChange}
                              className={`appearance-none ${inputClass(errors.department)}`}
                            >
                              <option value="" disabled className="bg-background text-white/50">Select your department</option>
                              <option value="CSE" className="bg-background text-white">Computer Engineering</option>
                              <option value="IT" className="bg-background text-white">Information Technology</option>
                              <option value="ETC" className="bg-background text-white">E&TC Engineering</option>
                              <option value="ME" className="bg-background text-white">Mechanical Engineering</option>
                              <option value="CE" className="bg-background text-white">Civil Engineering</option>
                              <option value="EE" className="bg-background text-white">Electrical Engineering</option>
                            </select>
                          </div>
                          {errors.department && <span className="text-red-500 text-xs">{errors.department}</span>}
                        </div>
                      </div>

                      {/* Year & Category */}
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div className="flex flex-col gap-2">
                          <label className="font-label text-sm text-text-secondary">
                            Year <span className="text-accent">*</span>
                          </label>
                          <select 
                            name="year"
                            value={formData.year}
                            onChange={handleChange}
                            className={`appearance-none ${inputClass(errors.year)}`}
                          >
                            <option value="" disabled className="bg-background text-white/50">Select your year</option>
                            <option value="1st" className="bg-background text-white">1st Year</option>
                            <option value="2nd" className="bg-background text-white">2nd Year</option>
                            <option value="3rd" className="bg-background text-white">3rd Year</option>
                            <option value="4th" className="bg-background text-white">4th Year</option>
                          </select>
                          {errors.year && <span className="text-red-500 text-xs">{errors.year}</span>}
                        </div>
                        <div className="flex flex-col gap-2">
                          <label className="font-label text-sm text-text-secondary">
                            Idea Category <span className="text-accent">*</span>
                          </label>
                          <select 
                            name="category"
                            value={formData.category}
                            onChange={handleChange}
                            className={`appearance-none ${inputClass(errors.category)}`}
                          >
                            <option value="" disabled className="bg-background text-white/50">Select category</option>
                            <option value="Event" className="bg-background text-white">Event</option>
                            <option value="Workshop" className="bg-background text-white">Workshop</option>
                            <option value="Competition" className="bg-background text-white">Competition</option>
                            <option value="Website" className="bg-background text-white">Website</option>
                            <option value="Committee" className="bg-background text-white">Committee</option>
                            <option value="Other" className="bg-background text-white">Other</option>
                          </select>
                          {errors.category && <span className="text-red-500 text-xs">{errors.category}</span>}
                        </div>
                      </div>

                      {/* Subject / Title */}
                      <div className="flex flex-col gap-2">
                        <label className="font-label text-sm text-text-secondary">
                          Idea Title <span className="text-accent">*</span>
                        </label>
                        <input 
                          name="subject"
                          value={formData.subject}
                          onChange={handleChange}
                          type="text" 
                          className={inputClass(errors.subject)}
                          placeholder="Short title of your idea"
                        />
                        {errors.subject && <span className="text-red-500 text-xs">{errors.subject}</span>}
                      </div>

                      {/* Description */}
                      <div className="flex flex-col gap-2">
                        <label className="font-label text-sm text-text-secondary">
                          Idea Description <span className="text-accent">*</span>
                        </label>
                        <textarea 
                          name="description"
                          value={formData.description}
                          onChange={handleChange}
                          rows={5}
                          className={`resize-none ${inputClass(errors.description)}`}
                          placeholder="Please describe your idea in detail..."
                        />
                        {errors.description && <span className="text-red-500 text-xs">{errors.description}</span>}
                      </div>

                      {/* Expected Outcome */}
                      <div className="flex flex-col gap-2">
                        <label className="font-label text-sm text-text-secondary">Expected Outcome / Benefit (Optional)</label>
                        <textarea 
                          name="expectedOutcome"
                          value={formData.expectedOutcome}
                          onChange={handleChange}
                          rows={3}
                          className={`resize-none ${inputClass(false)}`}
                          placeholder="What positive impact will this idea bring?"
                        />
                      </div>

                      {/* File Upload */}
                      <div className="flex flex-col gap-2">
                        <label className="font-label text-sm text-text-secondary">Attachment Upload (Optional)</label>
                        <div className="relative group">
                          <input 
                            type="file" 
                            accept=".pdf, .jpg, .jpeg, .png"
                            onChange={handleFileChange}
                            ref={fileInputRef}
                            className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10"
                          />
                          <div className={`w-full bg-white/5 border border-dashed ${errors.attachment ? 'border-red-500' : 'border-white/20 group-hover:border-accent/50'} rounded-xl px-4 py-4 text-white flex items-center justify-center gap-3 transition-colors`}>
                            <Upload className="w-5 h-5 text-text-secondary group-hover:text-accent transition-colors" />
                            <span className="text-sm text-text-secondary group-hover:text-white transition-colors">
                              {formData.attachment ? formData.attachment.name : "Click to upload PDF, JPG, or PNG"}
                            </span>
                          </div>
                        </div>
                        {errors.attachment && <span className="text-red-500 text-xs">{errors.attachment}</span>}
                      </div>

                      {/* Buttons */}
                      <div className="pt-6 flex items-center justify-end gap-4 border-t border-white/10 mt-2">
                        <button 
                          type="button"
                          onClick={resetForm}
                          disabled={isSubmitting}
                          className="px-6 py-3 rounded-full text-sm font-medium text-text-secondary hover:text-white hover:bg-white/5 transition-colors disabled:opacity-50"
                        >
                          Reset
                        </button>
                        <MagneticButton 
                          type="submit"
                          disabled={isSubmitting}
                          className="bg-accent hover:bg-accent/90 disabled:bg-accent/50 text-white px-8 py-3 rounded-full text-sm font-medium transition-colors flex items-center gap-2"
                        >
                          {isSubmitting ? (
                            <>
                              <Loader2 className="w-4 h-4 animate-spin" /> Submitting...
                            </>
                          ) : (
                            'Submit Idea'
                          )}
                        </MagneticButton>
                      </div>
                    </form>
                  </>
                )}
              </GlassCard>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      <style>{`
        .hide-scrollbar::-webkit-scrollbar {
          display: none;
        }
        .hide-scrollbar {
          -ms-overflow-style: none;
          scrollbar-width: none;
        }
        select option {
          background-color: #000;
          color: #fff;
          padding: 10px;
        }
      `}</style>
    </section>
  );
}
