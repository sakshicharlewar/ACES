import React, { useState, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, CheckCircle, AlertCircle, Loader2, Copy, Upload, CreditCard, Users } from 'lucide-react';
import { QRCodeSVG } from 'qrcode.react';
import RegistrationSuccess from './RegistrationSuccess';

const UPI_ID = 'acesbughunt@ybl';
const UPI_NAME = 'ACES Bug Hunt';
const FEE_AMOUNT = '40';
const UPI_STRING = `upi://pay?pa=${UPI_ID}&pn=${encodeURIComponent(UPI_NAME)}&am=${FEE_AMOUNT}&cu=INR&tn=${encodeURIComponent('Bug Hunt Registration Fee')}`;

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
    agreedToRules: false,
    // Payment
    transactionId: '',
    paymentScreenshot: null,
    paymentScreenshotName: '',
    paymentConfirmed: false,
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [successData, setSuccessData] = useState(null);
  const [copied, setCopied] = useState(false);
  const fileRef = useRef(null);

  if (!isOpen) return null;

  const handleChange = (e) => {
    const value = e.target.type === 'checkbox' ? e.target.checked : e.target.value;
    setFormData({ ...formData, [e.target.name]: value });
    setError(null);
  };

  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    const allowed = ['image/jpeg', 'image/jpg', 'image/png', 'application/pdf'];
    if (!allowed.includes(file.type)) {
      setError('Only JPG, JPEG, PNG, or PDF files are allowed.');
      return;
    }
    if (file.size > 5 * 1024 * 1024) {
      setError('File size must be less than 5MB.');
      return;
    }
    const reader = new FileReader();
    reader.onloadend = () => {
      setFormData(prev => ({
        ...prev,
        paymentScreenshot: reader.result,
        paymentScreenshotName: file.name
      }));
    };
    reader.readAsDataURL(file);
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

  const validateStep3 = () => {
    if (!formData.transactionId.trim()) {
      setError('Please enter your UPI Transaction ID.');
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
    if (!formData.paymentConfirmed) {
      setError('Please confirm that you have completed the payment.');
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

  const handleSubmit = async (e) => {
    e?.preventDefault();
    if (!validateStep3()) return;

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
          member2_year: formData.member2Year,
          transaction_id: formData.transactionId.trim(),
          payment_screenshot: formData.paymentScreenshot || null,
          registration_fee: '₹40',
          payment_status: 'pending',
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Registration failed');
      }

      setSuccessData({
        ...formData,
        registrationId: data.registration_id,
        eventName: eventDetails.title || 'Bug Hunt: Debug the Web',
        transactionId: formData.transactionId.trim(),
        paymentStatus: 'Paid',
        registeredAt: new Date().toLocaleString(),
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

  const years = ['Second Year', 'Third Year'];
  const progressWidth = step === 1 ? '33%' : step === 2 ? '66%' : '100%';

  const canSubmit = formData.transactionId.trim().length >= 12 && formData.paymentConfirmed;

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

                {/* Fee Banner */}
                <div className="flex items-center justify-between px-5 py-4 rounded-xl bg-gradient-to-r from-blue-600/20 to-purple-600/20 border border-blue-500/30 mb-6">
                  <div>
                    <p className="text-xs text-gray-400 uppercase tracking-wider font-medium">Registration Fee</p>
                    <p className="text-3xl font-bold text-white mt-1">₹40 <span className="text-sm font-normal text-gray-400">per Team</span></p>
                  </div>
                  <div className="text-4xl">💳</div>
                </div>

                {/* QR Card */}
                <div className="flex flex-col items-center p-6 rounded-2xl bg-white/5 border border-white/10 mb-5">
                  <p className="text-sm text-gray-400 mb-4 font-medium">Scan to Pay</p>
                  <div className="bg-white p-4 rounded-2xl shadow-[0_0_30px_rgba(59,130,246,0.25)]">
                    <QRCodeSVG
                      value={UPI_STRING}
                      size={180}
                      level="H"
                      bgColor="#ffffff"
                      fgColor="#000000"
                    />
                  </div>
                  <p className="text-sm text-gray-300 mt-4 font-medium">Scan using any UPI App</p>
                  <p className="text-xs text-gray-500 mt-1">Google Pay • PhonePe • Paytm • BHIM</p>
                </div>

                {/* UPI ID */}
                <div className="mb-5">
                  <label className="block text-sm text-gray-400 mb-2">UPI ID</label>
                  <div className="flex items-center gap-2">
                    <div className="flex-1 px-4 py-3 rounded-xl bg-white/5 border border-white/10 text-white font-mono text-sm">
                      {UPI_ID}
                    </div>
                    <button
                      type="button"
                      onClick={copyUPI}
                      className={`flex items-center gap-2 px-4 py-3 rounded-xl border text-sm font-medium transition-all ${copied ? 'bg-green-500/20 border-green-500/40 text-green-400' : 'bg-blue-500/10 border-blue-500/30 text-blue-400 hover:bg-blue-500/20'}`}
                    >
                      <Copy size={15} />
                      {copied ? 'Copied!' : 'Copy'}
                    </button>
                  </div>
                </div>

                {/* Transaction ID */}
                <div className="mb-5">
                  <label className="block text-sm text-gray-300 mb-2">
                    UPI Transaction ID <span className="text-red-400">*</span>
                  </label>
                  <input
                    type="text"
                    name="transactionId"
                    value={formData.transactionId}
                    onChange={handleChange}
                    placeholder="Enter your UPI Transaction ID"
                    className="w-full px-4 py-3 rounded-xl bg-white/5 border border-white/10 text-white placeholder-gray-500 focus:border-blue-500 focus:ring-1 focus:ring-blue-500 outline-none transition-all font-mono"
                  />
                  <p className="text-xs text-gray-500 mt-1.5">Min. 12 characters • Letters and numbers only</p>
                </div>

                {/* Screenshot Upload */}
                <div className="mb-5">
                  <label className="block text-sm text-gray-300 mb-2">
                    Upload Payment Screenshot <span className="text-gray-500">(Optional)</span>
                  </label>
                  <div
                    onClick={() => fileRef.current?.click()}
                    className="w-full px-4 py-4 rounded-xl bg-white/5 border border-dashed border-white/20 hover:border-blue-500/50 text-center cursor-pointer transition-all group"
                  >
                    {formData.paymentScreenshotName ? (
                      <div className="flex items-center justify-center gap-2 text-green-400">
                        <CheckCircle size={16} />
                        <span className="text-sm font-medium">{formData.paymentScreenshotName}</span>
                      </div>
                    ) : (
                      <div className="flex flex-col items-center gap-1 text-gray-500 group-hover:text-gray-400">
                        <Upload size={20} />
                        <span className="text-sm">Click to upload (JPG, PNG, PDF • Max 5MB)</span>
                      </div>
                    )}
                  </div>
                  <input
                    ref={fileRef} type="file" className="hidden"
                    accept=".jpg,.jpeg,.png,.pdf"
                    onChange={handleFileChange}
                  />
                </div>

                {/* Payment Confirmation Checkbox */}
                <div className="pt-4 border-t border-white/10">
                  <label className="flex items-center gap-3 cursor-pointer group">
                    <div className="relative flex items-center shrink-0">
                      <input
                        type="checkbox"
                        name="paymentConfirmed"
                        checked={formData.paymentConfirmed}
                        onChange={handleChange}
                        className="peer appearance-none w-5 h-5 border-2 border-white/20 rounded cursor-pointer checked:bg-blue-500 checked:border-blue-500 transition-colors"
                      />
                      <CheckCircle size={14} className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 text-white opacity-0 peer-checked:opacity-100 pointer-events-none transition-opacity" />
                    </div>
                    <span className="text-sm text-gray-300 group-hover:text-white transition-colors">
                      ☑ I confirm that I have successfully completed the payment of ₹40. <span className="text-red-400">*</span>
                    </span>
                  </label>
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
            <div className="flex justify-end gap-3">
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
                  className="px-8 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-500 text-white transition-colors font-medium shadow-[0_0_20px_rgba(59,130,246,0.3)]"
                >
                  Continue →
                </button>
              ) : (
                <button
                  onClick={handleSubmit}
                  disabled={loading || !canSubmit}
                  className="px-8 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-500 text-white transition-colors font-medium flex items-center gap-2 shadow-[0_0_20px_rgba(59,130,246,0.4)] disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {loading ? (
                    <><Loader2 className="animate-spin" size={18} /> Submitting...</>
                  ) : (
                    <><CheckCircle size={18} /> Complete Registration</>
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
