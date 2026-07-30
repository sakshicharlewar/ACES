import React, { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, CheckCircle, AlertCircle, Loader2, Copy, Upload, CreditCard, Users } from 'lucide-react';
import { QRCodeSVG } from 'qrcode.react';
import RegistrationSuccess from './RegistrationSuccess';

const UPI_ID = 'yatharthdonarkar2909@oksbi';
const UPI_NAME = 'Yatharth Donarkar';
const FEE_AMOUNT = '40';
const UPI_STRING = `upi://pay?pa=${UPI_ID}&pn=${encodeURIComponent(UPI_NAME)}&am=${FEE_AMOUNT}&cu=INR&tn=${encodeURIComponent('ACES Bug Hunt Registration')}`;

export default function EventRegistrationModal({ isOpen, onClose, eventDetails, onSuccess }) {
  const [step, setStep] = useState(1);

  const handleUPIPayment = (e) => {
    e.preventDefault();
    window.location.href = UPI_STRING;
  };

  const handleCopyUPI = () => {
    navigator.clipboard.writeText(UPI_ID).then(() => {
      setUpiCopied(true);
      setTimeout(() => setUpiCopied(false), 2500);
    }).catch(() => {
      // fallback for browsers without clipboard API
      const el = document.createElement('textarea');
      el.value = UPI_ID;
      document.body.appendChild(el);
      el.select();
      document.execCommand('copy');
      document.body.removeChild(el);
      setUpiCopied(true);
      setTimeout(() => setUpiCopied(false), 2500);
    });
  };
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
    agreedToRules: false,
    transactionId: '',
    paymentScreenshot: null,
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [successData, setSuccessData] = useState(null);
  const [showSuccessPopup, setShowSuccessPopup] = useState(false);
  const [pendingSuccessData, setPendingSuccessData] = useState(null);
  const [qrPreviewOpen, setQrPreviewOpen] = useState(false);
  const [upiCopied, setUpiCopied] = useState(false);
  const fileRef = useRef(null);

  // Close QR preview on Esc key
  useEffect(() => {
    if (!qrPreviewOpen) return;
    const onKey = (e) => { if (e.key === 'Escape') setQrPreviewOpen(false); };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [qrPreviewOpen]);

  if (!isOpen) return null;

  const handleChange = (e) => {
    const value = e.target.type === 'checkbox' ? e.target.checked : e.target.value;
    setFormData({ ...formData, [e.target.name]: value });
    setError(null);
  };



  const copyUPI = () => {
    navigator.clipboard.writeText(UPI_ID);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const validateStep1 = () => {
    if (!formData.teamName.trim() || !formData.leaderName.trim() || !formData.leaderEmail.trim() || !formData.leaderPhone.trim()) {
      setError('Please fill all required leader fields.');
      return false;
    }
    if (formData.leaderPhone.length !== 10) {
      setError('Phone number must be exactly 10 digits.');
      return false;
    }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.leaderEmail)) {
      setError('Please enter a valid email address.');
      return false;
    }
    return true;
  };

  const validateStep2 = () => {
    if (!formData.member2Name.trim() || !formData.member2Email.trim() || !formData.member2Phone.trim()) {
      setError('Please fill all required member fields.');
      return false;
    }
    if (formData.member2Phone.length !== 10) {
      setError('Phone number must be exactly 10 digits.');
      return false;
    }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.member2Email)) {
      setError('Please enter a valid email address.');
      return false;
    }
    if (formData.leaderEmail === formData.member2Email) {
      setError('Leader and member cannot have the same email.');
      return false;
    }
    if (formData.leaderPhone === formData.member2Phone) {
      setError('Leader and member cannot have the same phone number.');
      return false;
    }
    if (!formData.agreedToRules) {
      setError('You must agree to the event rules to register.');
      return false;
    }
    return true;
  };

  const nextStep = () => {
    if (step === 1 && validateStep1()) { setStep(2); setError(null); }
    else if (step === 2 && validateStep2()) { setStep(3); setError(null); }
  };

  const prevStep = () => {
    setStep(s => s - 1);
    setError(null);
  };

  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (!file) return;

    if (file.size > 10 * 1024 * 1024) {
      setError('File size must be less than 10MB');
      return;
    }

    const reader = new FileReader();
    reader.onloadend = () => {
      setFormData(prev => ({ ...prev, paymentScreenshot: reader.result }));
      setError(null);
    };
    reader.onerror = () => setError('Failed to read file');
    reader.readAsDataURL(file);
  };

  const validateStep3 = () => {
    if (!formData.transactionId.trim()) {
      setError('Transaction ID is required.');
      return false;
    }
    if (formData.transactionId.trim().length < 12) {
      setError('Transaction ID must be at least 12 characters.');
      return false;
    }
    if (!/^[a-zA-Z0-9]+$/.test(formData.transactionId.trim())) {
      setError('Transaction ID must contain only letters and numbers.');
      return false;
    }
    if (!formData.paymentScreenshot) {
      setError('Payment screenshot is required.');
      return false;
    }
    return true;
  };

  const handleSubmit = async (e) => {
    e?.preventDefault();
    if (loading) return;
    if (!validateStep3()) return;

    setLoading(true);
    setError(null);

    const apiUrl = import.meta.env.VITE_API_URL || 'http://localhost:8000';
    const eventId = eventDetails?.id || 1;
    
    const payload = {
      event_id: eventId,
      team_name: formData.teamName,
      leader_name: formData.leaderName,
      leader_email: formData.leaderEmail,
      leader_phone: formData.leaderPhone,
      leader_year: formData.leaderYear,
      leader_branch: formData.leaderBranch,
      member2_name: formData.member2Name,
      member2_email: formData.member2Email,
      member2_phone: formData.member2Phone,
      member2_year: formData.member2Year,
      transaction_id: formData.transactionId.trim(),
      payment_screenshot: formData.paymentScreenshot,
    };

    try {
      const response = await fetch(`${apiUrl}/api/events/${eventId}/team-register`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
      const data = await response.json();

      if (response.ok && data.success) {
        setPendingSuccessData({
          ...formData,
          registrationId: data.registration_id,
          eventName: eventDetails?.title || 'Bug Hunt: Debug the Web',
          transactionId: formData.transactionId,
          paymentStatus: 'Pending Verification',
          registeredAt: new Date().toLocaleString(),
        });
        setShowSuccessPopup(true);
      } else {
        setError(toFriendlyError(null, data));
      }
    } catch (err) {
      setError('Registration failed. Please contact the event coordinator.');
    } finally {
      setLoading(false);
    }
  };

  // ── Friendly error sanitiser: never expose raw JS/network errors to users ──
  const toFriendlyError = (err, responseData) => {
    // Backend sent a known message (e.g., registration closed, duplicate team)
    if (responseData?.error) {
      const msg = responseData.error;
      if (msg.toLowerCase().includes('maximum limit') || msg.toLowerCase().includes('closed')) {
        const limitMatch = msg.match(/limit of (\d+) teams/i);
        const limitNum = limitMatch ? limitMatch[1] : (eventDetails?.max_teams || 31);
        return `⚠️ Registration is now closed. The maximum limit of ${limitNum} teams has been reached.`;
      }
      if (msg.toLowerCase().includes('already registered') || msg.toLowerCase().includes('already be registered') || msg.toLowerCase().includes('duplicate')) {
        return 'You have already completed your registration.';
      }
      if (msg.toLowerCase().includes('event not found')) {
        return 'This event is no longer available. Please refresh the page and try again.';
      }
      // Return backend message only if it looks safe (not a stack trace)
      if (msg.length < 200 && !msg.includes('Traceback') && !msg.includes('Exception')) {
        return msg;
      }
    }
    // Network / fetch failures
    if (!err) return 'We are unable to process your registration right now. Please try again in a few moments or contact the event coordinator if the issue continues.';
    const raw = err.message || '';
    if (raw.includes('fetch') || raw.includes('network') || raw.includes('Network') || raw.includes('Failed to fetch')) {
      return 'Unable to connect to the server. Please check your internet connection and try again.';
    }
    if (raw.includes('timeout') || raw.includes('AbortError')) {
      return 'The request timed out. Please try again in a moment.';
    }
    return 'We are unable to process your registration right now. Please try again in a few moments or contact the event coordinator if the issue continues.';
  };

  if (successData) {
    return <RegistrationSuccess data={successData} onClose={onClose} />;
  }

  if (showSuccessPopup) {
    return (
      <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
        <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={onClose} />
        <motion.div 
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          className="relative w-full max-w-md bg-[#0B0B0B] border border-blue-500/30 rounded-2xl p-8 shadow-[0_0_40px_rgba(59,130,246,0.15)] flex flex-col items-center text-center"
        >
          <div className="w-20 h-20 bg-green-500/10 rounded-full flex items-center justify-center mb-5 border border-green-500/30 shadow-[0_0_20px_rgba(34,197,94,0.2)]">
            <CheckCircle className="text-green-500" size={40} />
          </div>
          <h2 className="text-2xl font-bold text-white mb-3">✅ Registration Successful!</h2>
          <div className="text-gray-300 space-y-1.5 mb-8">
            <p>Your Bug Hunt registration has been completed successfully.</p>
            <p>Thank you for registering.</p>
          </div>
          <button 
            onClick={() => {
              if (onSuccess) onSuccess();
              setSuccessData(pendingSuccessData);
            }}
            className="w-full bg-blue-600 hover:bg-blue-500 text-white font-semibold py-3.5 rounded-xl transition-all shadow-[0_0_20px_rgba(37,99,235,0.3)] hover:shadow-[0_0_25px_rgba(37,99,235,0.5)]"
          >
            OK
          </button>
        </motion.div>
      </div>
    );
  }

  const years = ['Second Year', 'Third Year'];
  const progressWidth = step === 1 ? '33%' : step === 2 ? '66%' : '100%';


  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
        {/* Backdrop */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="absolute inset-0 bg-black/80 backdrop-blur-md"
          onClick={onClose}
        />

        {/* Modal */}
        <motion.div
          initial={{ opacity: 0, scale: 0.92, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.92, y: 20 }}
          transition={{ type: 'spring', stiffness: 300, damping: 30 }}
          className="relative w-full max-w-2xl bg-[#0B0B0B] border border-white/10 rounded-2xl shadow-2xl overflow-hidden my-auto"
        >
          {/* Header */}
          <div className="flex justify-between items-center px-6 py-4 border-b border-white/10">
            <div>
              <h2 className="text-xl font-bold text-white">Bug Hunt Registration</h2>
              <p className="text-sm text-gray-400 mt-1">
                Team Registration (2 Members) •{' '}
                <span className="text-blue-400">Step {step} of 3</span>
              </p>
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
              initial={{ width: '33%' }}
              animate={{ width: progressWidth }}
              transition={{ duration: 0.4 }}
            />
          </div>

          {/* Step Labels */}
          <div className="flex justify-between px-6 pt-3 pb-1">
            {['Leader Info', 'Member 2', '💳 Payment'].map((label, i) => (
              <span key={i} className={`text-xs font-medium ${step === i + 1 ? 'text-blue-400' : step > i + 1 ? 'text-green-400' : 'text-gray-600'}`}>
                {step > i + 1 ? '✓ ' : ''}{label}
              </span>
            ))}
          </div>

          <div className="px-6 md:px-8 max-h-[70vh] overflow-y-auto custom-scrollbar pb-2">
            {error && (
              <div className="mb-4 mt-4 p-4 rounded-xl bg-red-500/10 border border-red-500/20 flex items-start gap-3">
                <AlertCircle className="text-red-500 shrink-0 mt-0.5" size={20} />
                <p className="text-red-200 text-sm">{error}</p>
              </div>
            )}

            <form onSubmit={step === 3 ? handleSubmit : (e) => e.preventDefault()}>

              {/* ── EVENT INFO CARD (always visible at top of Step 1) ── */}
              {step === 1 && (
                <div className="relative mt-4 mb-6 rounded-2xl overflow-hidden">
                  {/* Blue glow border */}
                  <div className="absolute inset-0 rounded-2xl bg-gradient-to-br from-blue-500/30 via-blue-600/10 to-purple-500/20 blur-sm" />
                  <div className="relative rounded-2xl border border-blue-500/40 bg-white/[0.03] backdrop-blur-md p-5">
                    {/* Top accent line */}
                    <div className="absolute top-0 left-0 right-0 h-[2px] rounded-t-2xl bg-gradient-to-r from-blue-500 via-blue-400 to-purple-500" />

                    <div className="flex items-center gap-2 mb-3">
                      <span className="text-base">📌</span>
                      <h4 className="text-white font-semibold text-sm tracking-wide uppercase">Event Details</h4>
                    </div>

                    <p className="text-gray-200 text-sm leading-relaxed mb-3">
                      <span className="text-white font-semibold">Bug Hunt: Debug the Web</span> challenges teams to identify and fix
                      real HTML, CSS, and JavaScript issues in a web application.
                    </p>

                    <div className="flex flex-wrap gap-2 mt-3">
                      <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-blue-500/15 border border-blue-500/25 text-blue-300 text-xs font-medium">
                        👥 Team of 2
                      </span>
                      <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-yellow-500/15 border border-yellow-500/25 text-yellow-300 text-xs font-medium">
                        💳 Registration Fee: ₹40
                      </span>
                      <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-purple-500/15 border border-purple-500/25 text-purple-300 text-xs font-medium">
                        🏆 Maximum 30 Teams
                      </span>
                      <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-green-500/15 border border-green-500/25 text-green-300 text-xs font-medium">
                        ⚡ Accuracy &amp; Speed
                      </span>
                    </div>
                  </div>
                </div>
              )}

              {/* ── STEP 1: LEADER ── */}
              <div className={step === 1 ? 'block pt-4' : 'hidden'}>
                <h3 className="text-lg font-semibold text-blue-400 mb-5 flex items-center gap-2">
                  <span className="flex items-center justify-center w-6 h-6 rounded-full bg-blue-500/20 text-sm">1</span>
                  Team &amp; Leader Details
                </h3>

                <div className="space-y-5">
                  <div>
                    <label className="block text-sm text-gray-300 mb-2">Team Name *</label>
                    <input
                      type="text" name="teamName" value={formData.teamName} onChange={handleChange}
                      placeholder="e.g. Code Breakers"
                      className="w-full px-4 py-3 rounded-xl bg-white/5 border border-white/10 text-white placeholder-gray-500 focus:border-blue-500 focus:ring-1 focus:ring-blue-500 outline-none transition-all"
                    />
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                    <div>
                      <label className="block text-sm text-gray-300 mb-2">Leader Name *</label>
                      <input
                        type="text" name="leaderName" value={formData.leaderName} onChange={handleChange}
                        placeholder="Full Name"
                        className="w-full px-4 py-3 rounded-xl bg-white/5 border border-white/10 text-white placeholder-gray-500 focus:border-blue-500 outline-none transition-all"
                      />
                    </div>
                    <div>
                      <label className="block text-sm text-gray-300 mb-2">Leader Phone *</label>
                      <input
                        type="tel" name="leaderPhone" value={formData.leaderPhone} onChange={handleChange}
                        placeholder="10-digit number" maxLength="10"
                        className="w-full px-4 py-3 rounded-xl bg-white/5 border border-white/10 text-white placeholder-gray-500 focus:border-blue-500 outline-none transition-all"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm text-gray-300 mb-2">Leader Email *</label>
                    <input
                      type="email" name="leaderEmail" value={formData.leaderEmail} onChange={handleChange}
                      placeholder="Email Address"
                      className="w-full px-4 py-3 rounded-xl bg-white/5 border border-white/10 text-white placeholder-gray-500 focus:border-blue-500 outline-none transition-all"
                    />
                  </div>

                  <div>
                    <label className="block text-sm text-gray-300 mb-2">Year *</label>
                    <select
                      name="leaderYear" value={formData.leaderYear} onChange={handleChange}
                      className="w-full px-4 py-3 rounded-xl bg-white/5 border border-white/10 text-white focus:border-blue-500 outline-none transition-all [&>option]:bg-[#0B0B0B]"
                    >
                      {years.map(y => <option key={y} value={y}>{y}</option>)}
                    </select>
                  </div>

                  <div className="flex items-center gap-3 px-4 py-3 rounded-xl bg-blue-500/10 border border-blue-500/20">
                    <span className="text-blue-400 text-lg">🎓</span>
                    <p className="text-sm text-blue-300 font-medium">Only for Computer Engineering Students</p>
                  </div>
                </div>
              </div>

              {/* ── STEP 2: MEMBER 2 ── */}
              <div className={step === 2 ? 'block pt-4' : 'hidden'}>
                <h3 className="text-lg font-semibold text-blue-400 mb-5 flex items-center gap-2">
                  <span className="flex items-center justify-center w-6 h-6 rounded-full bg-blue-500/20 text-sm">2</span>
                  Member 2 Details
                </h3>

                <div className="space-y-5">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                    <div>
                      <label className="block text-sm text-gray-300 mb-2">Member Name *</label>
                      <input
                        type="text" name="member2Name" value={formData.member2Name} onChange={handleChange}
                        placeholder="Full Name"
                        className="w-full px-4 py-3 rounded-xl bg-white/5 border border-white/10 text-white placeholder-gray-500 focus:border-blue-500 outline-none transition-all"
                      />
                    </div>
                    <div>
                      <label className="block text-sm text-gray-300 mb-2">Member Phone *</label>
                      <input
                        type="tel" name="member2Phone" value={formData.member2Phone} onChange={handleChange}
                        placeholder="10-digit number" maxLength="10"
                        className="w-full px-4 py-3 rounded-xl bg-white/5 border border-white/10 text-white placeholder-gray-500 focus:border-blue-500 outline-none transition-all"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm text-gray-300 mb-2">Member Email *</label>
                    <input
                      type="email" name="member2Email" value={formData.member2Email} onChange={handleChange}
                      placeholder="Email Address"
                      className="w-full px-4 py-3 rounded-xl bg-white/5 border border-white/10 text-white placeholder-gray-500 focus:border-blue-500 outline-none transition-all"
                    />
                  </div>

                  <div>
                    <label className="block text-sm text-gray-300 mb-2">Year *</label>
                    <select
                      name="member2Year" value={formData.member2Year} onChange={handleChange}
                      className="w-full px-4 py-3 rounded-xl bg-white/5 border border-white/10 text-white focus:border-blue-500 outline-none transition-all [&>option]:bg-[#0B0B0B]"
                    >
                      {years.map(y => <option key={y} value={y}>{y}</option>)}
                    </select>
                  </div>

                  <div className="pt-4 border-t border-white/10">
                    <label className="flex items-center gap-3 cursor-pointer group">
                      <div className="relative flex items-center">
                        <input
                          type="checkbox" name="agreedToRules" checked={formData.agreedToRules} onChange={handleChange}
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

              {/* ── STEP 3: PAYMENT ── */}
              <div className={step === 3 ? 'block pt-4' : 'hidden'}>
                <h3 className="text-lg font-semibold text-blue-400 mb-5 flex items-center gap-2">
                  <CreditCard size={18} />
                  Registration Payment
                </h3>
                <p className="text-sm text-gray-400 mb-6">Complete the registration fee to confirm your participation.</p>

                {/* Payment Details */}
                <div className="flex flex-col items-center p-5 rounded-2xl bg-white/5 border border-white/10 mb-8 relative overflow-hidden">
                  <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-blue-500 to-purple-500" />
                  <h4 className="text-white font-semibold mb-5 text-lg">Payment Details</h4>

                  {/* QR Code — tap to pay */}
                  <a
                    href={UPI_STRING}
                    className="relative bg-white rounded-2xl p-3 shadow-[0_8px_40px_rgba(59,130,246,0.25)] mb-3 w-full max-w-[280px] block group cursor-pointer"
                    title="Tap to pay ₹40 via UPI"
                  >
                    <img
                      src="/YatharthScanner.jpeg"
                      alt="ACES Bug Hunt Payment QR Code"
                      style={{ width: '100%', height: 'auto', objectFit: 'contain', display: 'block', borderRadius: '10px' }}
                    />
                    {/* Tap overlay */}
                    <div className="absolute inset-0 rounded-2xl bg-black/0 group-hover:bg-black/10 group-active:bg-black/20 transition-colors flex items-end justify-center pb-3 pointer-events-none">
                      <span className="opacity-0 group-hover:opacity-100 transition-opacity text-xs font-bold text-white bg-blue-600/90 px-3 py-1 rounded-full shadow-lg backdrop-blur-sm">
                        💳 Tap to Pay ₹40
                      </span>
                    </div>
                  </a>
                  <p className="text-xs text-blue-300/70 mb-5 text-center">Tap the QR to open GPay · PhonePe · Paytm with ₹40 pre-filled</p>

                  {/* UPI ID block */}
                  <div className="w-full bg-black/30 rounded-xl p-4 border border-white/8 mb-4">
                    <p className="text-xs text-gray-400 uppercase tracking-widest mb-2 text-center">UPI ID</p>
                    <div
                      className="w-full text-center font-mono font-semibold text-white break-all select-all bg-white/5 rounded-lg px-3 py-3 border border-white/10 text-sm sm:text-base cursor-text mb-3"
                      style={{ wordBreak: 'break-all' }}
                    >
                      {UPI_ID}
                    </div>

                    {/* Copy button */}
                    <button
                      type="button"
                      onClick={handleCopyUPI}
                      className={`w-full flex items-center justify-center gap-2 py-2.5 rounded-lg font-medium text-sm transition-all duration-300 ${
                        upiCopied
                          ? 'bg-green-500/20 text-green-400 border border-green-500/40'
                          : 'bg-white/8 hover:bg-white/15 text-gray-300 border border-white/10'
                      }`}
                    >
                      {upiCopied ? (
                        <><CheckCircle size={15} /> ✅ UPI ID Copied!</>
                      ) : (
                        <><Copy size={15} /> 📋 Copy UPI ID</>
                      )}
                    </button>
                  </div>

                  {/* Amount */}
                  <div className="flex items-center gap-3 mb-4">
                    <span className="text-gray-400 text-sm">Amount:</span>
                    <span className="text-2xl font-bold text-white">₹{FEE_AMOUNT}</span>
                  </div>


                </div>

                <div className="space-y-5">

                  {/* Transaction ID */}
                  <div className="rounded-2xl bg-white/5 border border-white/10 p-4">
                    <label className="flex items-center gap-2 text-sm font-semibold text-white mb-3">
                      <span className="text-lg">🔢</span>
                      UPI Transaction ID <span className="text-red-400">*</span>
                    </label>
                    <input
                      type="text"
                      name="transactionId"
                      value={formData.transactionId}
                      onChange={handleChange}
                      placeholder="e.g. 318512345678"
                      className="w-full px-4 py-3 rounded-xl bg-black/30 border border-white/10 text-white placeholder-gray-600 focus:border-blue-500 focus:bg-black/50 outline-none transition-all font-mono text-sm"
                      minLength="12"
                      maxLength="40"
                    />
                    <p className="text-xs text-gray-500 mt-2">Enter the 12-digit UTR / Transaction ID from your UPI app after payment.</p>
                  </div>

                  {/* Screenshot Upload */}
                  <div className="rounded-2xl bg-white/5 border border-white/10 p-4">
                    <label className="flex items-center gap-2 text-sm font-semibold text-white mb-3">
                      <span className="text-lg">📸</span>
                      Payment Screenshot / Proof <span className="text-red-400">*</span>
                    </label>

                    {formData.paymentScreenshot ? (
                      <div className="relative rounded-xl border border-white/10 overflow-hidden bg-white/5 p-2">
                        <img
                          src={formData.paymentScreenshot}
                          alt="Screenshot preview"
                          className="w-full h-48 object-contain rounded-lg bg-black/50"
                        />
                        <div className="absolute inset-0 bg-black/60 opacity-0 hover:opacity-100 transition-opacity flex items-center justify-center gap-4 rounded-xl">
                          <button
                            type="button"
                            onClick={() => fileRef.current?.click()}
                            className="px-4 py-2 bg-white/20 hover:bg-white/30 rounded-lg text-white text-sm font-medium backdrop-blur-md transition-colors"
                          >
                            Replace
                          </button>
                          <button
                            type="button"
                            onClick={() => setFormData(p => ({ ...p, paymentScreenshot: null }))}
                            className="px-4 py-2 bg-red-500/80 hover:bg-red-500 rounded-lg text-white text-sm font-medium backdrop-blur-md transition-colors"
                          >
                            Remove
                          </button>
                        </div>
                      </div>
                    ) : (
                      <div
                        onClick={() => fileRef.current?.click()}
                        className="w-full border-2 border-dashed border-white/20 rounded-xl p-8 flex flex-col items-center justify-center cursor-pointer hover:border-blue-500/50 hover:bg-blue-500/5 transition-all group"
                      >
                        <div className="w-14 h-14 rounded-full bg-blue-500/10 border border-blue-500/20 flex items-center justify-center mb-3 group-hover:scale-110 transition-transform">
                          <Upload className="text-blue-400" size={26} />
                        </div>
                        <p className="text-sm text-gray-300 font-medium text-center">Tap to upload payment screenshot</p>
                        <p className="text-xs text-gray-500 mt-1 text-center">JPG, PNG, PDF · Max 10MB</p>
                      </div>
                    )}

                    <input
                      type="file"
                      ref={fileRef}
                      onChange={handleFileChange}
                      accept="image/jpeg, image/png, image/jpg, application/pdf"
                      className="hidden"
                    />
                    <p className="text-xs text-gray-500 mt-2">Upload a screenshot of the payment confirmation from your UPI app.</p>
                  </div>

                </div>

            </form>
          </div>

          {/* Footer */}
          <div className="px-6 py-4 border-t border-white/10 bg-[#0B0B0B]">
            {step === 3 && (
              <div className="flex justify-between items-center mb-3 px-1 text-xs">
                <span className="text-gray-500">Registered Teams</span>
                <span className="text-blue-400 font-bold">{eventDetails?.registered_teams_count ?? 0} / {eventDetails?.max_teams ?? 30}</span>
              </div>
            )}
            <div className="flex justify-between items-center gap-3">
              {step > 1 && (
                <button
                  type="button" onClick={prevStep} disabled={loading}
                  className="px-6 py-2.5 rounded-xl text-gray-300 hover:bg-white/5 transition-colors font-medium disabled:opacity-50"
                >
                  Back
                </button>
              )}
              {step < 3 ? (
                <button
                  type="button" onClick={nextStep}
                  className="ml-auto px-8 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-500 text-white transition-colors font-medium shadow-[0_0_20px_rgba(59,130,246,0.3)]"
                >
                  Continue →
                </button>
              ) : (
                <button
                  type="submit" disabled={loading || !formData.transactionId || !formData.paymentScreenshot}
                  className="ml-auto px-8 py-2.5 rounded-xl bg-green-600 hover:bg-green-500 text-white transition-colors font-medium shadow-[0_0_20px_rgba(22,163,74,0.3)] disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
                >
                  {loading ? <Loader2 className="animate-spin" size={18} /> : null}
                  Complete Registration
                </button>
              )}
            </div>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
}
