import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, CheckCircle, AlertCircle, Loader2 } from 'lucide-react';
import RegistrationSuccess from './RegistrationSuccess';

export default function EventRegistrationModal({ isOpen, onClose, eventDetails, onSuccess }) {
  const [step, setStep] = useState(1);
  const [formData, setFormData] = useState({
    teamName: '',
    leaderName: '',
    leaderEmail: '',
    leaderPhone: '',
    leaderYear: 'Second Year',
    leaderBranch: 'Computer Engineering',
    member2Name: '',
    member2Email: '',
    member2Phone: '',
    member2Year: 'Second Year',
    agreedToRules: false
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [successData, setSuccessData] = useState(null);

  if (!isOpen) return null;

  const handleChange = (e) => {
    const value = e.target.type === 'checkbox' ? e.target.checked : e.target.value;
    setFormData({ ...formData, [e.target.name]: value });
    setError(null);
  };

  const validateStep1 = () => {
    if (!formData.teamName.trim() || !formData.leaderName.trim() || !formData.leaderEmail.trim() || !formData.leaderPhone.trim()) {
      setError("Please fill all required leader fields.");
      return false;
    }
    if (formData.leaderPhone.length !== 10) {
      setError("Phone number must be exactly 10 digits.");
      return false;
    }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.leaderEmail)) {
      setError("Please enter a valid email address.");
      return false;
    }
    return true;
  };

  const validateStep2 = () => {
    if (!formData.member2Name.trim() || !formData.member2Email.trim() || !formData.member2Phone.trim()) {
      setError("Please fill all required member fields.");
      return false;
    }
    if (formData.member2Phone.length !== 10) {
      setError("Phone number must be exactly 10 digits.");
      return false;
    }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.member2Email)) {
      setError("Please enter a valid email address.");
      return false;
    }
    if (formData.leaderEmail === formData.member2Email) {
      setError("Leader and member cannot have the same email.");
      return false;
    }
    if (formData.leaderPhone === formData.member2Phone) {
      setError("Leader and member cannot have the same phone number.");
      return false;
    }
    if (!formData.agreedToRules) {
      setError("You must agree to the event rules to register.");
      return false;
    }
    return true;
  };

  const nextStep = () => {
    if (validateStep1()) {
      setStep(2);
    }
  };

  const prevStep = () => {
    setStep(1);
    setError(null);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validateStep2()) return;
    
    setLoading(true);
    setError(null);
    
    try {
      const apiUrl = import.meta.env.VITE_API_URL || 'http://localhost:8000';
      const response = await fetch(`${apiUrl}/api/events/${eventDetails.id || 1}/team-register`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          event_id: eventDetails.id || 1,
          team_name: formData.teamName,
          leader_name: formData.leaderName,
          leader_email: formData.leaderEmail,
          leader_phone: formData.leaderPhone,
          leader_year: formData.leaderYear,
          leader_branch: formData.leaderBranch,
          member2_name: formData.member2Name,
          member2_email: formData.member2Email,
          member2_phone: formData.member2Phone,
          member2_year: formData.member2Year
        }),
      });

      const data = await response.json();
      
      if (!response.ok) {
        throw new Error(data.error || 'Registration failed');
      }
      
      setSuccessData({
        ...formData,
        registrationId: data.registration_id,
        eventName: eventDetails.title || 'Bug Hunt: Debug the Web'
      });
      if (onSuccess) onSuccess();
      
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  if (successData) {
    return <RegistrationSuccess data={successData} onClose={onClose} />;
  }

  const branches = ["Computer Engineering", "IT", "EnTC", "Mechanical", "Civil"];
  const years = ["Second Year", "Third Year"];

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-center justify-center px-4 pt-20 pb-4 overflow-y-auto">
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={onClose}
          className="fixed inset-0 bg-black/60 backdrop-blur-sm"
        />
        
        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 20 }}
          className="relative w-full max-w-2xl bg-[#0B0B0B] border border-white/10 rounded-2xl shadow-2xl overflow-hidden my-auto"
        >
          {/* Header */}
          <div className="flex justify-between items-center px-6 py-4 border-b border-white/10">
            <div>
              <h2 className="text-xl font-bold text-white">Bug Hunt Registration</h2>
              <p className="text-sm text-gray-400 mt-1">Team Registration (2 Members) • {eventDetails.title}</p>
            </div>
            <button
              onClick={onClose}
              className="p-2 rounded-full hover:bg-white/10 text-gray-400 hover:text-white transition-colors"
            >
              <X size={20} />
            </button>
          </div>

          {/* Progress Bar */}
          <div className="w-full bg-white/5 h-1">
            <motion.div 
              className="h-full bg-blue-500"
              initial={{ width: '50%' }}
              animate={{ width: step === 1 ? '50%' : '100%' }}
            />
          </div>

          <div className="p-6 md:p-8 max-h-[70vh] overflow-y-auto custom-scrollbar">
            {error && (
              <div className="mb-6 p-4 rounded-xl bg-red-500/10 border border-red-500/20 flex items-start gap-3">
                <AlertCircle className="text-red-500 shrink-0 mt-0.5" size={20} />
                <p className="text-red-200 text-sm">{error}</p>
              </div>
            )}

            <form onSubmit={step === 2 ? handleSubmit : (e) => e.preventDefault()}>
              
              {/* STEP 1: LEADER DETAILS */}
              <div className={step === 1 ? 'block' : 'hidden'}>
                <h3 className="text-lg font-semibold text-blue-400 mb-6 flex items-center gap-2">
                  <span className="flex items-center justify-center w-6 h-6 rounded-full bg-blue-500/20 text-sm">1</span>
                  Team & Leader Details
                </h3>
                
                <div className="space-y-5">
                  <div>
                    <label className="block text-sm text-gray-300 mb-2">Team Name *</label>
                    <input
                      type="text"
                      name="teamName"
                      value={formData.teamName}
                      onChange={handleChange}
                      placeholder="e.g. Code Breakers"
                      className="w-full px-4 py-3 rounded-xl bg-white/5 border border-white/10 text-white placeholder-gray-500 focus:border-blue-500 focus:ring-1 focus:ring-blue-500 outline-none transition-all"
                    />
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                    <div>
                      <label className="block text-sm text-gray-300 mb-2">Leader Name *</label>
                      <input
                        type="text"
                        name="leaderName"
                        value={formData.leaderName}
                        onChange={handleChange}
                        placeholder="Full Name"
                        className="w-full px-4 py-3 rounded-xl bg-white/5 border border-white/10 text-white placeholder-gray-500 focus:border-blue-500 outline-none transition-all"
                      />
                    </div>
                    <div>
                      <label className="block text-sm text-gray-300 mb-2">Leader Phone *</label>
                      <input
                        type="tel"
                        name="leaderPhone"
                        value={formData.leaderPhone}
                        onChange={handleChange}
                        placeholder="10-digit number"
                        maxLength="10"
                        className="w-full px-4 py-3 rounded-xl bg-white/5 border border-white/10 text-white placeholder-gray-500 focus:border-blue-500 outline-none transition-all"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm text-gray-300 mb-2">Leader Email *</label>
                    <input
                      type="email"
                      name="leaderEmail"
                      value={formData.leaderEmail}
                      onChange={handleChange}
                      placeholder="Email Address"
                      className="w-full px-4 py-3 rounded-xl bg-white/5 border border-white/10 text-white placeholder-gray-500 focus:border-blue-500 outline-none transition-all"
                    />
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                    <div>
                      <label className="block text-sm text-gray-300 mb-2">Year *</label>
                      <select
                        name="leaderYear"
                        value={formData.leaderYear}
                        onChange={handleChange}
                        className="w-full px-4 py-3 rounded-xl bg-white/5 border border-white/10 text-white focus:border-blue-500 outline-none transition-all [&>option]:bg-[#0B0B0B]"
                      >
                        {years.map(y => <option key={y} value={y}>{y}</option>)}
                      </select>
                    </div>
                    <div>
                      <label className="block text-sm text-gray-300 mb-2">Branch *</label>
                      <select
                        name="leaderBranch"
                        value={formData.leaderBranch}
                        onChange={handleChange}
                        className="w-full px-4 py-3 rounded-xl bg-white/5 border border-white/10 text-white focus:border-blue-500 outline-none transition-all [&>option]:bg-[#0B0B0B]"
                      >
                        {branches.map(b => <option key={b} value={b}>{b}</option>)}
                      </select>
                    </div>
                  </div>
                </div>
              </div>

              {/* STEP 2: MEMBER 2 DETAILS */}
              <div className={step === 2 ? 'block' : 'hidden'}>
                <h3 className="text-lg font-semibold text-blue-400 mb-6 flex items-center gap-2">
                  <span className="flex items-center justify-center w-6 h-6 rounded-full bg-blue-500/20 text-sm">2</span>
                  Member 2 Details
                </h3>
                
                <div className="space-y-5">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                    <div>
                      <label className="block text-sm text-gray-300 mb-2">Member Name *</label>
                      <input
                        type="text"
                        name="member2Name"
                        value={formData.member2Name}
                        onChange={handleChange}
                        placeholder="Full Name"
                        className="w-full px-4 py-3 rounded-xl bg-white/5 border border-white/10 text-white placeholder-gray-500 focus:border-blue-500 outline-none transition-all"
                      />
                    </div>
                    <div>
                      <label className="block text-sm text-gray-300 mb-2">Member Phone *</label>
                      <input
                        type="tel"
                        name="member2Phone"
                        value={formData.member2Phone}
                        onChange={handleChange}
                        placeholder="10-digit number"
                        maxLength="10"
                        className="w-full px-4 py-3 rounded-xl bg-white/5 border border-white/10 text-white placeholder-gray-500 focus:border-blue-500 outline-none transition-all"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm text-gray-300 mb-2">Member Email *</label>
                    <input
                      type="email"
                      name="member2Email"
                      value={formData.member2Email}
                      onChange={handleChange}
                      placeholder="Email Address"
                      className="w-full px-4 py-3 rounded-xl bg-white/5 border border-white/10 text-white placeholder-gray-500 focus:border-blue-500 outline-none transition-all"
                    />
                  </div>

                  <div>
                    <label className="block text-sm text-gray-300 mb-2">Year *</label>
                    <select
                      name="member2Year"
                      value={formData.member2Year}
                      onChange={handleChange}
                      className="w-full px-4 py-3 rounded-xl bg-white/5 border border-white/10 text-white focus:border-blue-500 outline-none transition-all [&>option]:bg-[#0B0B0B]"
                    >
                      {years.map(y => <option key={y} value={y}>{y}</option>)}
                    </select>
                  </div>
                  
                  <div className="pt-4 border-t border-white/10 mt-4">
                    <label className="flex items-center gap-3 cursor-pointer group">
                      <div className="relative flex items-center">
                        <input
                          type="checkbox"
                          name="agreedToRules"
                          checked={formData.agreedToRules}
                          onChange={handleChange}
                          className="peer appearance-none w-5 h-5 border-2 border-white/20 rounded cursor-pointer checked:bg-blue-500 checked:border-blue-500 transition-colors"
                        />
                        <CheckCircle size={14} className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 text-white opacity-0 peer-checked:opacity-100 pointer-events-none transition-opacity" />
                      </div>
                      <span className="text-sm text-gray-300 group-hover:text-white transition-colors">
                        ☑ I agree to all event rules. <span className="text-red-400">*</span>
                      </span>
                    </label>
                  </div>
                </div>
              </div>

            </form>
          </div>

          {/* Footer Actions */}
          <div className="px-6 py-4 border-t border-white/10 bg-[#0B0B0B]">
            {step === 2 && (
              <div className="flex justify-between items-center mb-4 px-2">
                <span className="text-sm text-gray-400">Registered Teams</span>
                <span className="text-sm font-bold text-blue-400">{eventDetails.registered_teams_count} / {eventDetails.max_teams}</span>
              </div>
            )}
            <div className="flex justify-end gap-3">
              {step === 2 && (
                <button
                  type="button"
                  onClick={prevStep}
                  disabled={loading}
                  className="px-6 py-2.5 rounded-xl text-gray-300 hover:bg-white/5 transition-colors font-medium disabled:opacity-50"
                >
                  Back
                </button>
              )}
              
              {step === 1 ? (
                <button
                  type="button"
                  onClick={nextStep}
                  className="px-8 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-500 text-white transition-colors font-medium shadow-[0_0_20px_rgba(59,130,246,0.3)]"
                >
                  Continue
                </button>
              ) : (
                <button
                  onClick={handleSubmit}
                  disabled={loading || !formData.agreedToRules}
                  className="px-8 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-500 text-white transition-colors font-medium flex items-center gap-2 shadow-[0_0_20px_rgba(59,130,246,0.3)] disabled:opacity-70 disabled:cursor-not-allowed"
                >
                  {loading ? (
                    <><Loader2 className="animate-spin" size={18} /> Submitting...</>
                  ) : (
                    <><CheckCircle size={18} /> Register Team</>
                  )}
                </button>
              )}
            </div>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
}
