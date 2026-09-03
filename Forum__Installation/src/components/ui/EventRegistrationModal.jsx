import React, { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, CheckCircle, AlertCircle, Loader2, Copy, Upload, CreditCard, Users } from 'lucide-react';
import { QRCodeSVG } from 'qrcode.react';
import RegistrationSuccess from './RegistrationSuccess';

const DEFAULT_UPI_ID = 'yatharthdonarkar2909@oksbi';
const DEFAULT_UPI_NAME = 'Yatharth Donarkar';

export default function EventRegistrationModal({ isOpen, onClose, eventDetails, onSuccess }) {
  const [step, setStep] = useState(1);

  // Dynamic payment values based on the specific event
  const UPI_ID = DEFAULT_UPI_ID;
  const UPI_NAME = DEFAULT_UPI_NAME;
  const FEE_AMOUNT = String(eventDetails?.fee ?? eventDetails?.registration_fee ?? 40);
  const eventName = eventDetails?.title || 'ACES Event';
  const UPI_STRING = `upi://pay?pa=${UPI_ID}&pn=${encodeURIComponent(UPI_NAME)}&am=${FEE_AMOUNT}&cu=INR&tn=${encodeURIComponent(eventName + ' Registration')}`;

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
  const teamSize = eventDetails?.team_size || 2;
  const makeEmptyMembers = (size) =>
    Array.from({ length: Math.max(0, size - 1) }, () => ({ name: '', email: '', phone: '', year: '' }));

  const [formData, setFormData] = useState({
    teamName: '',
    leaderName: '',
    leaderEmail: '',
    leaderPhone: '',
    leaderYear: '',
    leaderBranch: 'Computer Engineering',
    members: makeEmptyMembers(teamSize),
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

  // Reset form when a different event is opened
  useEffect(() => {
    if (isOpen && eventDetails?.id) {
      const size = eventDetails.team_size || 2;
      setFormData({
        teamName: '',
        leaderName: '',
        leaderEmail: '',
        leaderPhone: '',
        leaderYear: '',
        leaderBranch: 'Computer Engineering',
        members: makeEmptyMembers(size),
        agreedToRules: false,
        transactionId: '',
        paymentScreenshot: null,
      });
      setStep(1);
      setError(null);
    }
  }, [isOpen, eventDetails?.id]);

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

  const handleMemberChange = (idx, field, value) => {
    const updated = formData.members.map((m, i) => i === idx ? { ...m, [field]: value } : m);
    setFormData({ ...formData, members: updated });
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
    // If no extra members needed (solo team)
    if (formData.members.length === 0) {
      if (!formData.agreedToRules) {
        setError('You must agree to the event rules to register.');
        return false;
      }
      return true;
    }

    // Member 2 (first extra member) is REQUIRED for team events (2-4 members)
    const member2 = formData.members[0];
    if (!member2.name?.trim() || !member2.email?.trim() || !member2.phone?.trim()) {
      setError('Please fill all required fields for Member 2.');
      return false;
    }
    if (member2.phone.trim().length !== 10) {
      setError('Member 2 phone number must be exactly 10 digits.');
      return false;
    }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(member2.email.trim())) {
      setError('Member 2 email is invalid.');
      return false;
    }
    if (member2.email.trim().toLowerCase() === formData.leaderEmail.trim().toLowerCase()) {
      setError('Member 2 cannot have the same email as the team leader.');
      return false;
    }
    if (member2.phone.trim() === formData.leaderPhone.trim()) {
      setError('Member 2 cannot have the same phone number as the team leader.');
      return false;
    }

    // Members 3 & 4 are OPTIONAL (teams of 2, 3, or 4 members)
    const seenEmails = new Set([formData.leaderEmail.trim().toLowerCase(), member2.email.trim().toLowerCase()]);
    const seenPhones = new Set([formData.leaderPhone.trim(), member2.phone.trim()]);

    for (let i = 1; i < formData.members.length; i++) {
      const m = formData.members[i];
      const num = i + 2;
      const hasAnyField = (m.name && m.name.trim()) || (m.email && m.email.trim()) || (m.phone && m.phone.trim()) || m.year;

      if (hasAnyField) {
        if (!m.name || !m.name.trim()) {
          setError(`Please enter the name for Member ${num}, or leave Member ${num} completely blank.`);
          return false;
        }
        if (!m.phone || m.phone.trim().length !== 10) {
          setError(`Member ${num} phone number must be exactly 10 digits.`);
          return false;
        }
        if (!m.email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(m.email.trim())) {
          setError(`Member ${num} email is invalid.`);
          return false;
        }
        const mEmail = m.email.trim().toLowerCase();
        const mPhone = m.phone.trim();
        if (seenEmails.has(mEmail)) {
          setError(`Member ${num} has an email address that is already used by another team member.`);
          return false;
        }
        if (seenPhones.has(mPhone)) {
          setError(`Member ${num} has a phone number that is already used by another team member.`);
          return false;
        }
        seenEmails.add(mEmail);
        seenPhones.add(mPhone);
      }
    }

    if (!formData.agreedToRules) {
      setError('You must agree to the event rules to register.');
      return false;
    }
    return true;
  };

  const nextStep = (e) => {
    if (step === 1 && validateStep1()) { setStep(2); setError(null); }
    else if (step === 2 && validateStep2()) { 
      const isFree = Number(eventDetails?.fee ?? eventDetails?.registration_fee ?? 0) === 0;
      if (isFree) {
        handleSubmit(e); // Skip payment step if free
      } else {
        setStep(3); 
        setError(null); 
      }
    }
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
    
    const isFree = Number(eventDetails?.fee ?? eventDetails?.registration_fee ?? 0) === 0;
    if (!isFree && !validateStep3()) return;

    setLoading(true);
    setError(null);

    const apiUrl = import.meta.env.VITE_API_URL || 'https://aces-backkend.onrender.com';
    const eventId = eventDetails?.id || 1;

    // Build member fields: member2 goes as flat fields, members 3+ go as extra_members array
    const firstMember = formData.members[0] || {};
    const extraMembers = formData.members
      .slice(1)
      .filter(m => m.name && m.name.trim())
      .map(m => ({
        name: m.name.trim(),
        email: m.email?.trim() || null,
        phone: m.phone?.trim() || null,
        year: m.year || null,
      }));

    const payload = {
      event_id: eventId,
      team_name: formData.teamName.trim(),
      leader_name: formData.leaderName.trim(),
      leader_email: formData.leaderEmail.trim(),
      leader_phone: formData.leaderPhone.trim(),
      leader_year: formData.leaderYear || null,
      leader_branch: formData.leaderBranch || "Computer Engineering",
      member2_name: firstMember.name?.trim() || null,
      member2_email: firstMember.email?.trim() || null,
      member2_phone: firstMember.phone?.trim() || null,
      member2_year: firstMember.year || null,
      extra_members: extraMembers.length > 0 ? extraMembers : null,
      transaction_id: isFree ? "FREE" : formData.transactionId.trim(),
      payment_screenshot: isFree ? null : formData.paymentScreenshot,
    };

    // Retry up to 2 times on network failure
    let lastErr = null;
    let response = null;
    let data = null;
    for (let attempt = 0; attempt < 2; attempt++) {
      try {
        response = await fetch(`${apiUrl}/api/events/${eventId}/team-register`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload),
        });
        data = await response.json();
        lastErr = null;
        break; // success — exit retry loop
      } catch (err) {
        lastErr = err;
        // wait 1.5s before retry
        if (attempt === 0) await new Promise(r => setTimeout(r, 1500));
      }
    }

    const handleLocalFallback = () => {
      const localRegs = JSON.parse(localStorage.getItem('local_registrations') || '[]');
      const mockEvents = JSON.parse(localStorage.getItem("aces_mock_events") || '[]');
      const eventData = mockEvents.find(e => String(e.id) === String(eventId)) || eventDetails || { title: "EVENT" };
      const prefix = (eventData.title || "EVENT").replace(/[^A-Za-z0-9]/g, "").toUpperCase().slice(0, 10) || "EVENT";
      const eventRegsCount = localRegs.filter(r => String(r.event_id) === String(eventId)).length;
      const seq = String(eventRegsCount + 1).padStart(3, "0");
      const newRegId = `${prefix}-${seq}`;
      
      const newReg = {
        ...payload,
        event_id: eventId,
        id: `LOC-${Date.now()}-${Math.floor(Math.random()*1000)}`,
        registration_id: newRegId,
        payment_status: 'pending',
        created_at: new Date().toISOString(),
      };
      localRegs.push(newReg);
      localStorage.setItem('local_registrations', JSON.stringify(localRegs));
      
      // Update mock event's registered_teams_count
      const mockEvIdx = mockEvents.findIndex(e => String(e.id) === String(eventId));
      if (mockEvIdx !== -1) {
        mockEvents[mockEvIdx].registered_teams_count = (mockEvents[mockEvIdx].registered_teams_count || 0) + 1;
        mockEvents[mockEvIdx].registered_count = (mockEvents[mockEvIdx].registered_count || 0) + 1;
        localStorage.setItem("aces_mock_events", JSON.stringify(mockEvents));
      }

      window.dispatchEvent(new CustomEvent("aces_events_updated"));
      window.dispatchEvent(new CustomEvent("aces_registrations_updated"));
      
      setPendingSuccessData({
        ...formData,
        registrationId: newReg.registration_id,
        eventName: eventDetails?.title || 'Event',
        transactionId: formData.transactionId,
        paymentStatus: 'Pending Verification',
        registeredAt: new Date().toLocaleString(),
      });
      setShowSuccessPopup(true);
      setLoading(false);
    };

    if (lastErr) {
      console.warn("Backend network error, saving to resilient local store", lastErr);
      handleLocalFallback();
      return;
    }

    if (!response || !response.ok) {
      if (response && response.status === 400 && data && data.detail) {
        setError(toFriendlyError(null, data));
        setLoading(false);
        return;
      }
      console.warn("Backend error, saving to resilient local store", response?.status);
      handleLocalFallback();
      return;
    }

    // Backend succeeded
    const localRegs = JSON.parse(localStorage.getItem('local_registrations') || '[]');
    const newReg = {
      ...payload,
      event_id: eventId,
      id: data.id || `LOC-${Date.now()}`,
      registration_id: data.registration_id,
      payment_status: 'pending',
      created_at: new Date().toISOString(),
    };
    localRegs.push(newReg);
    localStorage.setItem('local_registrations', JSON.stringify(localRegs));

    window.dispatchEvent(new CustomEvent("aces_events_updated"));
    window.dispatchEvent(new CustomEvent("aces_registrations_updated"));

    setPendingSuccessData({
      ...formData,
      registrationId: data.registration_id,
      eventName: eventDetails?.title || 'Event',
      transactionId: formData.transactionId,
      paymentStatus: 'Pending Verification',
      registeredAt: new Date().toLocaleString(),
    });
    setShowSuccessPopup(true);
    setLoading(false);
  };

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
      if (msg.toLowerCase().includes('transaction id') && msg.toLowerCase().includes('already been used')) {
        return '⚠️ This Transaction ID has already been used. Please use a unique transaction ID from your UPI payment.';
      }
      if (msg.toLowerCase().includes('transaction id') || msg.toLowerCase().includes('payment screenshot')) {
        return '⚠️ Transaction ID and Payment Screenshot are required to complete registration.';
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
          className="relative w-full max-w-md bg-[#0B0B0B] border border-green-500/30 rounded-2xl p-8 shadow-[0_0_40px_rgba(34,197,94,0.12)] flex flex-col items-center text-center"
        >
          {/* Success icon */}
          <div className="w-20 h-20 bg-green-500/10 rounded-full flex items-center justify-center mb-5 border border-green-500/30 shadow-[0_0_20px_rgba(34,197,94,0.15)]">
            <span className="text-4xl">🎉</span>
          </div>
          <h2 className="text-xl font-bold text-white mb-1">Registration Successful!</h2>
          <p className="text-green-400 font-semibold text-sm mb-5">Your registration has been received successfully.</p>
          
          {/* Registration ID */}
          <div className="w-full bg-white/5 border border-white/10 rounded-xl p-4 mb-5 text-center">
            <p className="text-xs text-gray-400 uppercase tracking-wider mb-1">Your Registration ID</p>
            <p className="text-2xl font-mono font-bold text-blue-400">{pendingSuccessData?.registrationId}</p>
          </div>

          <div className="w-full bg-green-500/10 border border-green-500/20 rounded-xl p-4 mb-6 text-left space-y-2">
            <p className="text-green-200 text-sm font-semibold mb-2">📋 What happens next?</p>
            <div className="flex items-start gap-2 text-xs text-gray-300">
              <span className="text-green-400 mt-0.5 shrink-0">1️⃣</span>
              <span>Our team will verify your payment screenshot &amp; Transaction ID.</span>
            </div>
            <div className="flex items-start gap-2 text-xs text-gray-300">
              <span className="text-green-400 mt-0.5 shrink-0">2️⃣</span>
              <span>Once verified, you will receive an email: <b className="text-green-400">"Your Seat is Confirmed! 🎉"</b></span>
            </div>
            {eventDetails?.whatsapp_link && (
              <div className="flex items-start gap-2 text-xs text-gray-300 mt-4 pt-4 border-t border-green-500/20">
                <span className="text-green-500 mt-0.5 shrink-0">💬</span>
                <span className="flex-1">
                  <p className="mb-3 font-medium">Join our WhatsApp Group for updates:</p>
                  <a 
                    href={eventDetails.whatsapp_link} 
                    target="_blank" 
                    rel="noreferrer" 
                    className="inline-flex items-center justify-center gap-2 w-full py-2.5 px-4 bg-[#25D366] hover:bg-[#1DA851] text-white font-bold rounded-xl transition-all shadow-[0_4px_14px_0_rgba(37,211,102,0.39)] hover:shadow-[0_6px_20px_rgba(37,211,102,0.23)] hover:-translate-y-0.5 active:translate-y-0"
                  >
                    <svg className="w-5 h-5 fill-current" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                      <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/>
                    </svg>
                    Join WhatsApp Group
                  </a>
                </span>
              </div>
            )}
          </div>
          <button 
            onClick={() => {
              if (onSuccess) onSuccess();
              setSuccessData(pendingSuccessData);
            }}
            className="w-full bg-green-500 hover:bg-green-400 text-black font-semibold py-3.5 rounded-xl transition-all shadow-[0_0_20px_rgba(34,197,94,0.25)] hover:shadow-[0_0_28px_rgba(34,197,94,0.4)]"
          >
            OK, Got it!
          </button>
        </motion.div>
      </div>
    );
  }


  // Build year options dynamically based on event eligibility
  const eligibility = eventDetails?.eligibility || '';
  let years;
  if (eligibility === 'All Years' || eligibility === '' || eligibility === 'Any / Not Specified') {
    years = ['First Year', 'Second Year', 'Third Year', 'Fourth Year'];
  } else if (eligibility === '1st Year Only') {
    years = ['First Year'];
  } else if (eligibility === '2nd Year Only') {
    years = ['Second Year'];
  } else if (eligibility === '3rd Year Only') {
    years = ['Third Year'];
  } else if (eligibility === '4th Year Only') {
    years = ['Fourth Year'];
  } else if (eligibility === '1st & 2nd Year') {
    years = ['First Year', 'Second Year'];
  } else if (eligibility === '2nd & 3rd Year') {
    years = ['Second Year', 'Third Year'];
  } else if (eligibility === '3rd & 4th Year') {
    years = ['Third Year', 'Fourth Year'];
  } else {
    years = ['First Year', 'Second Year', 'Third Year', 'Fourth Year'];
  }
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
              <h2 className="text-xl font-bold text-white">{eventName} Registration</h2>
              <p className="text-sm text-gray-400 mt-1">
                Team Registration ({teamSize > 2 ? `2 - ${teamSize}` : teamSize} Members) •{' '}
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
            {[
              'Leader Info',
              teamSize > 2 ? `Members (2-${teamSize})` : 'Member 2',
              '💳 Payment'
            ].map((label, i) => (
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

            <form onSubmit={step === 3 ? handleSubmit : (e) => e.preventDefault()} noValidate>

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

                    <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 text-xs">
                      {eventDetails?.date && (
                        <div className="bg-white/5 rounded-xl p-2.5 border border-white/5">
                          <span className="text-gray-400 block mb-0.5">Date</span>
                          <span className="text-white font-medium">{eventDetails.date}</span>
                        </div>
                      )}
                      {eventDetails?.time && (
                        <div className="bg-white/5 rounded-xl p-2.5 border border-white/5">
                          <span className="text-gray-400 block mb-0.5">Time</span>
                          <span className="text-white font-medium">{eventDetails.time}</span>
                        </div>
                      )}
                      {eventDetails?.venue && (
                        <div className="bg-white/5 rounded-xl p-2.5 border border-white/5 col-span-2 sm:col-span-1">
                          <span className="text-gray-400 block mb-0.5">Venue</span>
                          <span className="text-white font-medium truncate block">{eventDetails.venue}</span>
                        </div>
                      )}
                      <div className="bg-white/5 rounded-xl p-2.5 border border-white/5">
                        <span className="text-gray-400 block mb-0.5">Fee</span>
                        <span className="text-green-400 font-bold">
                          {Number(eventDetails?.fee ?? eventDetails?.registration_fee ?? 0) === 0 ? 'FREE' : `₹${eventDetails?.fee ?? eventDetails?.registration_fee}`}
                        </span>
                      </div>
                      <div className="bg-white/5 rounded-xl p-2.5 border border-white/5">
                        <span className="text-gray-400 block mb-0.5">Team Size</span>
                        <span className="text-blue-400 font-medium">{teamSize > 2 ? `2 - ${teamSize}` : teamSize} Members</span>
                      </div>
                      {eventDetails?.eligibility && (
                        <div className="bg-white/5 rounded-xl p-2.5 border border-white/5">
                          <span className="text-gray-400 block mb-0.5">Eligibility</span>
                          <span className="text-purple-400 font-medium truncate block">{eventDetails.eligibility}</span>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              )}

              {/* ── STEP 1: LEADER ── */}
              <div className={step === 1 ? 'block pt-2' : 'hidden'}>
                <h3 className="text-lg font-semibold text-blue-400 mb-4 flex items-center gap-2">
                  <span className="flex items-center justify-center w-6 h-6 rounded-full bg-blue-500/20 text-sm">👑</span>
                  Team Leader Details
                </h3>
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm text-gray-300 mb-2">Team Name *</label>
                    <input
                      type="text" name="teamName" value={formData.teamName} onChange={handleChange}
                      placeholder="e.g. Code Warriors"
                      className="w-full px-4 py-3 rounded-xl bg-white/5 border border-white/10 text-white placeholder-gray-500 focus:border-blue-500 outline-none transition-all"
                    />
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
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
                        type="tel" name="leaderPhone" value={formData.leaderPhone} maxLength="10" onChange={handleChange}
                        placeholder="10-digit number"
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
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm text-gray-300 mb-2">Department</label>
                      <input
                        type="text" name="leaderBranch" value={formData.leaderBranch} onChange={handleChange}
                        className="w-full px-4 py-3 rounded-xl bg-white/5 border border-white/10 text-white focus:border-blue-500 outline-none transition-all"
                      />
                    </div>
                    <div>
                      <label className="block text-sm text-gray-300 mb-2">Year *</label>
                      <select
                        name="leaderYear" value={formData.leaderYear} onChange={handleChange}
                        className="w-full px-4 py-3 rounded-xl bg-white/5 border border-white/10 text-white focus:border-blue-500 outline-none transition-all [&>option]:bg-[#0B0B0B]"
                      >
                        <option value="">-- Select Year --</option>
                        {years.map(y => <option key={y} value={y}>{y}</option>)}
                      </select>
                    </div>
                  </div>
                </div>
              </div>

              {/* ── STEP 2: ALL EXTRA MEMBERS (dynamic) ── */}
              <div className={step === 2 ? 'block pt-4' : 'hidden'}>
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-5">
                  <h3 className="text-lg font-semibold text-blue-400 flex items-center gap-2">
                    <span className="flex items-center justify-center w-6 h-6 rounded-full bg-blue-500/20 text-sm"><Users size={14} /></span>
                    Team Members Details
                  </h3>
                  {teamSize > 2 && (
                    <span className="text-xs text-blue-300/80 bg-blue-500/10 border border-blue-500/20 px-3 py-1 rounded-full">
                      ✓ Teams of 2, 3, or 4 members can register
                    </span>
                  )}
                </div>

                <div className="space-y-8">
                  {formData.members.map((member, idx) => {
                    const isRequired = idx === 0;
                    const memberNum = idx + 2;
                    return (
                      <div key={idx} className="p-4 rounded-xl border border-white/10 bg-white/3 space-y-4">
                        <div className="flex items-center justify-between">
                          <p className="text-sm font-semibold text-blue-300">
                            Member {memberNum} {isRequired ? <span className="text-red-400">*</span> : <span className="text-xs text-gray-400 font-normal">(Optional — leave blank if team of {memberNum - 1})</span>}
                          </p>
                          {!isRequired && (
                            <span className="text-xs px-2.5 py-0.5 rounded-full bg-white/5 text-gray-400 border border-white/10">Optional</span>
                          )}
                        </div>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          <div>
                            <label className="block text-sm text-gray-300 mb-2">Name {isRequired && <span className="text-red-400">*</span>}</label>
                            <input
                              type="text" value={member.name}
                              onChange={e => handleMemberChange(idx, 'name', e.target.value)}
                              placeholder={`Member ${memberNum} Full Name`}
                              className="w-full px-4 py-3 rounded-xl bg-white/5 border border-white/10 text-white placeholder-gray-500 focus:border-blue-500 outline-none transition-all"
                            />
                          </div>
                          <div>
                            <label className="block text-sm text-gray-300 mb-2">Phone {isRequired && <span className="text-red-400">*</span>}</label>
                            <input
                              type="tel" value={member.phone} maxLength="10"
                              onChange={e => handleMemberChange(idx, 'phone', e.target.value)}
                              placeholder="10-digit number"
                              className="w-full px-4 py-3 rounded-xl bg-white/5 border border-white/10 text-white placeholder-gray-500 focus:border-blue-500 outline-none transition-all"
                            />
                          </div>
                        </div>
                        <div>
                          <label className="block text-sm text-gray-300 mb-2">Email {isRequired && <span className="text-red-400">*</span>}</label>
                          <input
                            type="email" value={member.email}
                            onChange={e => handleMemberChange(idx, 'email', e.target.value)}
                            placeholder="Email Address"
                            className="w-full px-4 py-3 rounded-xl bg-white/5 border border-white/10 text-white placeholder-gray-500 focus:border-blue-500 outline-none transition-all"
                          />
                        </div>
                        <div>
                          <label className="block text-sm text-gray-300 mb-2">Year {isRequired && <span className="text-red-400">*</span>}</label>
                          <select
                            value={member.year}
                            onChange={e => handleMemberChange(idx, 'year', e.target.value)}
                            className="w-full px-4 py-3 rounded-xl bg-white/5 border border-white/10 text-white focus:border-blue-500 outline-none transition-all [&>option]:bg-[#0B0B0B]"
                          >
                            <option value="">-- Select Year --</option>
                            {years.map(y => <option key={y} value={y}>{y}</option>)}
                          </select>
                        </div>
                      </div>
                    );
                  })}

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

                  {/* QR Code — Custom or default image */}
                  <div className="bg-white rounded-2xl p-3 shadow-[0_8px_40px_rgba(59,130,246,0.20)] mb-3 w-full max-w-[280px]">
                    <img
                      src={eventDetails?.qr_image || "/YatharthScanner.jpeg"}
                      alt="Payment QR Code"
                      style={{ width: '100%', height: 'auto', objectFit: 'contain', display: 'block', borderRadius: '10px' }}
                    />
                  </div>
                  <p className="text-xs text-blue-300/70 mb-3 text-center">Scan this QR using GPay · PhonePe · Paytm · BHIM</p>

                  {/* Info box — explain GPay "not debited" message */}
                  <div className="w-full bg-yellow-500/10 border border-yellow-500/30 rounded-xl px-4 py-3 mb-5 flex gap-3 items-start">
                    <span className="text-yellow-400 text-base mt-0.5 shrink-0">ℹ️</span>
                    <p className="text-xs text-yellow-200 leading-relaxed">
                      <span className="font-semibold block mb-0.5">Seeing "Your money has not been debited"?</span>
                      That is normal — it is Google Pay's safety screen shown <span className="font-semibold">before</span> payment.
                      Simply enter your <span className="font-semibold">UPI PIN</span> to complete the ₹{eventDetails?.fee || eventDetails?.registration_fee || 0} payment.
                    </p>
                  </div>

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
                        <p className="text-xs text-gray-500 mt-1 text-center">JPG, PNG · Max 10MB</p>
                      </div>
                    )}

                    <input
                      type="file"
                      ref={fileRef}
                      onChange={handleFileChange}
                      accept="image/jpeg, image/png, image/jpg"
                      className="hidden"
                    />
                    <p className="text-xs text-gray-500 mt-2">Upload a screenshot of the payment confirmation from your UPI app.</p>
                  </div>

                </div> {/* end space-y-5 */}

                {/* Complete Registration CTA — inside step 3 */}
                <div className="mt-6 pt-5 border-t border-white/10">
                  {error && (
                    <div className="flex items-start gap-2 p-3 mb-4 rounded-xl bg-red-500/10 border border-red-500/20 text-red-400 text-sm">
                      <AlertCircle size={16} className="shrink-0 mt-0.5" />
                      <span>{error}</span>
                    </div>
                  )}
                  <button
                    type="submit"
                    disabled={loading || !formData.transactionId || !formData.paymentScreenshot}
                    className="w-full py-4 rounded-2xl font-bold text-base transition-all duration-300 flex items-center justify-center gap-3 disabled:opacity-50 disabled:cursor-not-allowed
                      bg-gradient-to-r from-green-600 to-emerald-500
                      hover:from-green-500 hover:to-emerald-400
                      text-white shadow-[0_4px_24px_rgba(22,163,74,0.4)]
                      hover:shadow-[0_4px_32px_rgba(22,163,74,0.55)]
                      active:scale-[0.98]"
                  >
                    {loading ? (
                      <><Loader2 className="animate-spin" size={20} /> Submitting...</>
                    ) : (
                      <><CheckCircle size={20} /> Complete Registration</>
                    )}
                  </button>
                  {(!formData.transactionId || !formData.paymentScreenshot) && (
                    <p className="text-xs text-gray-500 text-center mt-2">
                      {!formData.transactionId && !formData.paymentScreenshot
                        ? '⚠️ Enter Transaction ID and upload Payment Screenshot to continue.'
                        : !formData.transactionId
                        ? '⚠️ Please enter your UPI Transaction ID.'
                        : '⚠️ Please upload your payment screenshot.'}
                    </p>
                  )}
                </div>

              </div> {/* end step 3 */}

            </form>
          </div>

          {/* Footer */}
          <div className="px-6 py-4 border-t border-white/10 bg-[#0B0B0B]">
            {step === 3 && (
              <div className="flex justify-between items-center mb-3 px-1 text-xs">
                <span className="text-gray-500">Registered Teams</span>
                <span className="text-blue-400 font-bold">{eventDetails?.registered_teams_count ?? 0} / {eventDetails?.max_participants ?? eventDetails?.max_teams ?? 30}</span>
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
                <div className="ml-auto"></div>
              )}
            </div>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
}
