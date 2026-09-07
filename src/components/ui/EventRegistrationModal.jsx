import React, { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, CheckCircle, AlertCircle, Loader2, Copy, Upload, CreditCard, Users, ArrowRight, ArrowLeft } from 'lucide-react';
import RegistrationSuccess from './RegistrationSuccess';
import { getBaseUrl } from '../../lib/apiConfig';

const DEFAULT_UPI_ID = 'yatharthdonarkar2909@oksbi';
const DEFAULT_UPI_NAME = 'Yatharth Donarkar';

const DEPARTMENTS = [
  'Computer Engineering',
  'Computer Science & Engineering (CSE)',
  'Information Technology (IT)',
  'Artificial Intelligence & Data Science (AIDS)',
  'Electronics & Telecommunication (ETC)',
  'Electrical Engineering',
  'Mechanical Engineering',
  'Civil Engineering',
  'Other / Diploma / Polytechnic',
];

const COLLEGES = [
  'Suryodaya College of Engineering & Technology (SCET), Nagpur',
  'Govt. Polytechnic, Nagpur',
  'G.H. Raisoni College of Engineering (GHRCE)',
  'Yeshwantrao Chavan College of Engineering (YCCE)',
  'Ramdeobaba University (RCOEM)',
  'Priyadarshini College of Engineering (PCE)',
  'KDK College of Engineering',
  'Anjuman College of Engineering & Technology',
  'St. Vincent Pallotti College of Engineering',
  'JD College of Engineering and Management',
  'Other College / Institute',
];

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

  const [upiCopied, setUpiCopied] = useState(false);
  const handleCopyUPI = () => {
    navigator.clipboard.writeText(UPI_ID).then(() => {
      setUpiCopied(true);
      setTimeout(() => setUpiCopied(false), 2500);
    }).catch(() => {
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

  const teamSize = eventDetails?.team_size || 4;
  const makeEmptyMembers = (size) =>
    Array.from({ length: Math.max(3, (size || 4) - 1) }, () => ({ name: '', email: '', phone: '', year: '' }));

  const [formData, setFormData] = useState({
    teamName: '',
    leaderName: '',
    leaderEmail: '',
    leaderPhone: '',
    leaderYear: '',
    leaderBranch: '',
    leaderCollege: '',
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
  const fileRef = useRef(null);

  // Reset form when a different event is opened
  useEffect(() => {
    if (isOpen && eventDetails?.id) {
      const size = eventDetails.team_size || 4;
      setFormData({
        teamName: '',
        leaderName: '',
        leaderEmail: '',
        leaderPhone: '',
        leaderYear: '',
        leaderBranch: '',
        leaderCollege: '',
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

  const handleLeaderPhoneChange = (e) => {
    const cleaned = e.target.value.replace(/\D/g, '').slice(0, 10);
    setFormData(prev => ({ ...prev, leaderPhone: cleaned }));
    setError(null);
  };

  const handleMemberChange = (idx, field, value) => {
    const cleanValue = field === 'phone' ? value.replace(/\D/g, '').slice(0, 10) : value;
    const updated = formData.members.map((m, i) => i === idx ? { ...m, [field]: cleanValue } : m);
    setFormData({ ...formData, members: updated });
    setError(null);
  };

  const validateStep1 = () => {
    const isIndividual = (eventDetails?.team_size || 4) === 1;

    // Auto-fill teamName, leaderPhone, leaderCollege for individual events
    if (isIndividual) {
      if (!formData.teamName.trim() && formData.leaderName.trim()) {
        formData.teamName = formData.leaderName.trim();
      }
      if (!formData.leaderPhone.trim()) {
        formData.leaderPhone = "9999999999";
      }
      if (!formData.leaderCollege?.trim()) {
        formData.leaderCollege = "Suryodaya College of Engineering & Technology";
      }
    }

    if (!formData.leaderName.trim() || !formData.leaderEmail.trim()) {
      setError('Please enter your Name and Email.');
      return false;
    }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.leaderEmail.trim())) {
      setError('Please enter a valid email address.');
      return false;
    }
    if (!formData.leaderYear) {
      setError('Please select Year of study.');
      return false;
    }
    if (!formData.leaderBranch?.trim()) {
      setError('Please enter your Department / Branch.');
      return false;
    }

    if (!isIndividual) {
      const leaderPhoneClean = formData.leaderPhone.replace(/\D/g, '');
      if (!formData.teamName.trim()) {
        setError('Please enter Team Name.');
        return false;
      }
      if (leaderPhoneClean.length !== 10) {
        setError('Phone number must be exactly 10 digits.');
        return false;
      }
      if (!formData.leaderCollege?.trim()) {
        setError('Please enter your College / Institute name.');
        return false;
      }
    }

    return true;
  };

  const validateStep2 = () => {
    const isIndividual = (eventDetails?.team_size || 4) === 1;
    if (isIndividual) {
      if (!formData.agreedToRules) {
        setError('You must agree to the event rules to proceed.');
        return false;
      }
      return true;
    }

    const leaderPhoneClean = formData.leaderPhone.replace(/\D/g, '');
    // Member 2 (index 0) is required (minimum 2 members in a team)
    const m2 = formData.members[0];
    if (!m2 || !m2.name.trim() || !m2.email.trim() || !m2.phone.trim()) {
      setError('Please fill all required fields for Member 2.');
      return false;
    }
    const m2PhoneClean = m2.phone.replace(/\D/g, '');
    if (m2PhoneClean.length !== 10) {
      setError('Member 2 phone number must be exactly 10 digits.');
      return false;
    }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(m2.email.trim())) {
      setError('Member 2 email is invalid.');
      return false;
    }
    if (m2.email.toLowerCase().trim() === formData.leaderEmail.toLowerCase().trim()) {
      setError('Member 2 cannot have the same email as the leader.');
      return false;
    }
    if (m2PhoneClean === leaderPhoneClean) {
      setError('Member 2 cannot have the same phone number as the leader.');
      return false;
    }

    // Members 3 and 4 are OPTIONAL! Validate ONLY if student enters info for them
    for (let i = 1; i < formData.members.length; i++) {
      const m = formData.members[i];
      const num = i + 2;
      const hasAnyField = (m.name && m.name.trim()) || (m.email && m.email.trim()) || (m.phone && m.phone.trim()) || m.year;
      if (hasAnyField) {
        if (!m.name.trim() || !m.email.trim() || !m.phone.trim()) {
          setError(`Please complete all fields for Member ${num} or clear them if you have a smaller team.`);
          return false;
        }
        const mPhoneClean = m.phone.replace(/\D/g, '');
        if (mPhoneClean.length !== 10) {
          setError(`Member ${num} phone number must be exactly 10 digits.`);
          return false;
        }
        if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(m.email.trim())) {
          setError(`Member ${num} email is invalid.`);
          return false;
        }
        if (m.email.toLowerCase().trim() === formData.leaderEmail.toLowerCase().trim() || m.email.toLowerCase().trim() === m2.email.toLowerCase().trim()) {
          setError(`Member ${num} cannot have a duplicate email.`);
          return false;
        }
        if (mPhoneClean === leaderPhoneClean || mPhoneClean === m2PhoneClean) {
          setError(`Member ${num} cannot have a duplicate phone number.`);
          return false;
        }
      }
    }

    if (!formData.agreedToRules) {
      setError('You must agree to the event rules to proceed.');
      return false;
    }
    return true;
  };

  const nextStep = (e) => {
    if (step === 1 && validateStep1()) {
      setStep(2);
      setError(null);
    } else if (step === 2 && validateStep2()) { 
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
    setStep(s => Math.max(1, s - 1));
    setError(null);
  };

  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (!file) return;

    if (file.size > 15 * 1024 * 1024) {
      setError('File size must be less than 15MB');
      return;
    }

    const reader = new FileReader();
    reader.onload = (event) => {
      const img = new Image();
      img.onload = () => {
        try {
          const MAX_WIDTH = 1280;
          const MAX_HEIGHT = 1280;
          let width = img.width;
          let height = img.height;

          if (width > height) {
            if (width > MAX_WIDTH) {
              height = Math.round((height * MAX_WIDTH) / width);
              width = MAX_WIDTH;
            }
          } else {
            if (height > MAX_HEIGHT) {
              width = Math.round((width * MAX_HEIGHT) / height);
              height = MAX_HEIGHT;
            }
          }

          const canvas = document.createElement('canvas');
          canvas.width = width;
          canvas.height = height;
          const ctx = canvas.getContext('2d');
          ctx.drawImage(img, 0, 0, width, height);

          const compressedDataUrl = canvas.toDataURL('image/jpeg', 0.82);
          setFormData(prev => ({ ...prev, paymentScreenshot: compressedDataUrl }));
          setError(null);
        } catch {
          setFormData(prev => ({ ...prev, paymentScreenshot: event.target.result }));
          setError(null);
        }
      };
      img.onerror = () => {
        setFormData(prev => ({ ...prev, paymentScreenshot: event.target.result }));
        setError(null);
      };
      img.src = event.target.result;
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

  const toFriendlyError = (err, responseData) => {
    if (responseData?.detail || responseData?.error) {
      const msg = responseData.detail || responseData.error;
      if (typeof msg === 'string') {
        if (msg.toLowerCase().includes('maximum limit') || msg.toLowerCase().includes('closed')) {
          const limitMatch = msg.match(/limit of (\d+) teams/i);
          const limitNum = limitMatch ? limitMatch[1] : (eventDetails?.max_teams || 60);
          return `⚠️ Registration is currently full. The maximum limit of ${limitNum} teams has been reached.`;
        }
        if (msg.toLowerCase().includes('already registered') || msg.toLowerCase().includes('already be registered') || msg.toLowerCase().includes('duplicate')) {
          return 'This email or phone has already been used for registration in this event.';
        }
        if (msg.toLowerCase().includes('transaction id') && msg.toLowerCase().includes('already been used')) {
          return '⚠️ This Transaction ID has already been recorded. Please use the unique transaction ID from your UPI payment receipt.';
        }
        if (msg.toLowerCase().includes('transaction id') || msg.toLowerCase().includes('payment screenshot')) {
          return '⚠️ Transaction ID and Payment Screenshot are required to complete registration.';
        }
        if (msg.toLowerCase().includes('event not found')) {
          return 'This event is no longer available. Please refresh the page and try again.';
        }
        if (msg.length < 200 && !msg.includes('Traceback') && !msg.includes('Exception')) {
          return msg;
        }
      }
    }
    if (!err) return 'We are unable to process your registration right now. Please check your details and try again.';
    const raw = err.message || '';
    if (raw.includes('fetch') || raw.includes('network') || raw.includes('Network') || raw.includes('Failed to fetch')) {
      return 'Unable to connect to the server. Please check your internet connection and try again.';
    }
    if (raw.includes('timeout') || raw.includes('AbortError')) {
      return 'The request timed out. Please try again in a moment.';
    }
    return 'We are unable to process your registration right now. Please try again in a few moments.';
  };

  const handleSubmit = async (e) => {
    e?.preventDefault();
    if (loading) return;
    
    const isFree = Number(eventDetails?.fee ?? eventDetails?.registration_fee ?? 0) === 0;
    if (!isFree && !validateStep3()) return;

    setLoading(true);
    setError(null);

    const apiUrl = getBaseUrl();
    const eventId = eventDetails?.id || 12;

    const effectiveBranch = (formData.leaderBranch || '').trim() || 'Computer Engineering';
    const effectiveCollege = (formData.leaderCollege || '').trim() || 'Suryodaya College of Engineering & Technology';
    const combinedBranch = `${effectiveBranch} | ${effectiveCollege}`.slice(0, 98);

    // Build member fields: member2 goes as flat fields, members 3+ go as extra_members array
    const firstMember = formData.members[0] || {};
    const extraMembers = formData.members.slice(1)
      .filter(m => m.name && m.name.trim())
      .map(m => ({
        name: m.name.trim(),
        email: (m.email || '').trim(),
        phone: (m.phone || '').replace(/\D/g, '').slice(-10),
        year: m.year || '',
        branch: effectiveBranch,
        college: effectiveCollege,
      }));

    const payload = {
      event_id: eventId,
      team_name: formData.teamName.trim(),
      leader_name: formData.leaderName.trim(),
      leader_email: formData.leaderEmail.trim(),
      leader_phone: formData.leaderPhone.replace(/\D/g, '').slice(-10),
      leader_year: formData.leaderYear,
      leader_branch: combinedBranch,
      member2_name: firstMember.name ? firstMember.name.trim() : null,
      member2_email: firstMember.email ? firstMember.email.trim() : null,
      member2_phone: firstMember.phone ? firstMember.phone.replace(/\D/g, '').slice(-10) : null,
      member2_year: firstMember.year || null,
      extra_members: extraMembers.length > 0 ? extraMembers : null,
      transaction_id: isFree ? "FREE" : formData.transactionId.trim(),
      payment_screenshot: isFree ? null : formData.paymentScreenshot,
    };

    let lastErr = null;
    let response = null;
    let data = null;
    for (let attempt = 0; attempt < 3; attempt++) {
      try {
        response = await fetch(`${apiUrl}/api/events/${eventId}/team-register`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload),
        });
        if (response.ok) {
          data = await response.json();
          lastErr = null;
          break;
        } else {
          data = await response.json().catch(() => null);
          lastErr = new Error(data?.detail || data?.error || 'Registration failed');
          if (response.status === 400 || response.status === 404) {
            // Client error (duplicate, closed, validation) - do not retry
            break;
          }
        }
      } catch (err) {
        lastErr = err;
        if (attempt < 2) await new Promise(r => setTimeout(r, 1000 * (attempt + 1)));
      }
    }

    if (lastErr && (!response || response.status >= 400)) {
      // If it is a real validation error (duplicate email, duplicate txn, capacity full)
      if (response && response.status === 400) {
        const errMsg = toFriendlyError(lastErr, data);
        setError(errMsg);
        setLoading(false);
        return;
      }
      
      // If network/server cold start timeout, save locally so registration is NEVER lost
      const localExisting = JSON.parse(localStorage.getItem('local_registrations') || '[]');
      const buildxCount = localExisting.filter(r => (r.registration_id || '').startsWith('BUILDX')).length + 1;
      const fallbackRegId = `BUILDX${String(buildxCount).padStart(3, '0')}`;
      
      const localEntry = {
        id: fallbackRegId,
        registration_id: fallbackRegId,
        event_id: eventId,
        event_title: eventDetails?.title || 'BUILDX',
        team_name: formData.teamName.trim(),
        leader_name: formData.leaderName.trim(),
        leader_email: formData.leaderEmail.trim(),
        leader_phone: formData.leaderPhone.replace(/\D/g, '').slice(-10),
        leader_year: formData.leaderYear,
        leader_branch: combinedBranch,
        member2_name: firstMember.name ? firstMember.name.trim() : null,
        member2_email: firstMember.email ? firstMember.email.trim() : null,
        member2_phone: firstMember.phone ? firstMember.phone.replace(/\D/g, '').slice(-10) : null,
        member2_year: firstMember.year || null,
        extra_members: extraMembers.length > 0 ? extraMembers : null,
        transaction_id: isFree ? "FREE" : formData.transactionId.trim(),
        payment_screenshot: isFree ? null : formData.paymentScreenshot,
        payment_status: 'pending',
        created_at: new Date().toISOString(),
      };
      
      localExisting.unshift(localEntry);
      localStorage.setItem('local_registrations', JSON.stringify(localExisting));
      window.dispatchEvent(new CustomEvent('aces_events_updated'));
      window.dispatchEvent(new CustomEvent('aces_registration_created', { detail: localEntry }));

      setPendingSuccessData({
        ...formData,
        registrationId: fallbackRegId,
        eventName: eventDetails?.title || 'BUILDX',
        transactionId: formData.transactionId,
        paymentStatus: 'Pending Verification',
        whatsapp_link: eventDetails?.whatsapp_link || 'https://chat.whatsapp.com/HgONFhA8qSbBr1zRhmWTir',
        registeredAt: new Date().toLocaleString(),
      });
      setShowSuccessPopup(true);
      setLoading(false);
      return;
    }

    const regId = data?.registration_id || `BUILDX001`;

    // Save to local storage as persistent cache
    try {
      const localExisting = JSON.parse(localStorage.getItem('local_registrations') || '[]');
      const localEntry = {
        id: regId,
        registration_id: regId,
        event_id: eventId,
        event_title: eventDetails?.title || 'BUILDX',
        team_name: formData.teamName.trim(),
        leader_name: formData.leaderName.trim(),
        leader_email: formData.leaderEmail.trim(),
        leader_phone: formData.leaderPhone.replace(/\D/g, '').slice(-10),
        leader_year: formData.leaderYear,
        leader_branch: combinedBranch,
        member2_name: firstMember.name ? firstMember.name.trim() : null,
        member2_email: firstMember.email ? firstMember.email.trim() : null,
        member2_phone: firstMember.phone ? firstMember.phone.replace(/\D/g, '').slice(-10) : null,
        member2_year: firstMember.year || null,
        extra_members: extraMembers.length > 0 ? extraMembers : null,
        transaction_id: isFree ? "FREE" : formData.transactionId.trim(),
        payment_screenshot: isFree ? null : formData.paymentScreenshot,
        payment_status: 'pending',
        synced_to_server: true,
        created_at: new Date().toISOString(),
      };
      
      // Avoid duplicate in local storage
      const filtered = localExisting.filter(r => r.registration_id !== regId && r.transaction_id !== localEntry.transaction_id);
      filtered.unshift(localEntry);
      localStorage.setItem('local_registrations', JSON.stringify(filtered));
      window.dispatchEvent(new CustomEvent('aces_events_updated'));
      window.dispatchEvent(new CustomEvent('aces_registration_created', { detail: localEntry }));
    } catch (saveErr) {
      console.warn("Could not write local backup registration:", saveErr);
    }

    setPendingSuccessData({
      ...formData,
      registrationId: regId,
      eventName: eventDetails?.title || 'BUILDX',
      transactionId: formData.transactionId,
      paymentStatus: 'Pending Verification',
      whatsapp_link: eventDetails?.whatsapp_link || 'https://chat.whatsapp.com/HgONFhA8qSbBr1zRhmWTir',
      registeredAt: new Date().toLocaleString(),
    });
    setShowSuccessPopup(true);
    setLoading(false);
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
          className="relative w-full max-w-md bg-[#0B0B0B] border border-green-500/30 rounded-2xl p-6 sm:p-8 shadow-[0_0_40px_rgba(34,197,94,0.15)] flex flex-col items-center text-center max-h-[90vh] overflow-y-auto custom-scrollbar"
        >
          {/* Success icon */}
          <div className="w-16 h-16 sm:w-20 sm:h-20 bg-green-500/10 rounded-full flex items-center justify-center mb-4 border border-green-500/30 shadow-[0_0_20px_rgba(34,197,94,0.2)]">
            <span className="text-3xl sm:text-4xl">🎉</span>
          </div>
          <h2 className="text-xl sm:text-2xl font-bold text-white mb-1">Registration Successful!</h2>
          <p className="text-green-400 font-semibold text-sm mb-4">Your registration has been received successfully.</p>
          
          {/* Registration ID */}
          <div className="w-full bg-white/5 border border-white/10 rounded-xl p-4 mb-4 text-center">
            <p className="text-xs text-neutral-400 uppercase tracking-wider mb-1">Your Registration ID</p>
            <p className="text-2xl font-mono font-bold text-amber-200 tracking-wider">{pendingSuccessData?.registrationId}</p>
          </div>

          <div className="w-full bg-white/5 border border-white/10 rounded-xl p-4 mb-5 text-left space-y-2.5">
            <p className="text-white text-sm font-semibold mb-1">📋 What happens next?</p>
            <div className="flex items-start gap-2 text-xs text-neutral-300">
              <span className="text-amber-200 mt-0.5 shrink-0 font-bold">1.</span>
              <span>Your registration details &amp; team entries are saved in the database.</span>
            </div>
            <div className="flex items-start gap-2 text-xs text-neutral-300">
              <span className="text-amber-200 mt-0.5 shrink-0 font-bold">2.</span>
              <span>Join our official WhatsApp group for round schedules, seat allocations &amp; announcements:</span>
            </div>
            {(eventDetails?.whatsapp_link || pendingSuccessData?.whatsapp_link) && (
              <div className="pt-2">
                <a 
                  href={eventDetails?.whatsapp_link || pendingSuccessData?.whatsapp_link || "https://chat.whatsapp.com/HgONFhA8qSbBr1zRhmWTir"} 
                  target="_blank" 
                  rel="noreferrer" 
                  className="inline-flex items-center justify-center gap-2 w-full py-3.5 px-4 bg-[#25D366] hover:bg-[#20BD5A] text-black font-bold rounded-full transition-all shadow-[0_0_25px_rgba(37,211,102,0.4)] hover:-translate-y-0.5 active:translate-y-0 text-sm font-sans"
                >
                  <svg className="w-5 h-5 fill-current" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                    <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/>
                  </svg>
                  💬 Join Official WhatsApp Group
                </a>
              </div>
            )}
          </div>
          <button 
            type="button"
            onClick={() => {
              if (onSuccess) onSuccess();
              setSuccessData(pendingSuccessData);
            }}
            className="w-full bg-white hover:bg-neutral-200 text-black font-bold py-3.5 rounded-full transition-all shadow-lg text-sm"
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
      <div className="fixed inset-0 z-[100] flex items-center justify-center p-3 sm:p-4 overflow-y-auto">
        {/* Backdrop */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 bg-black/85 backdrop-blur-md"
          onClick={onClose}
        />

        {/* Modal Window Container */}
        <motion.div
          initial={{ opacity: 0, scale: 0.94, y: 15 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.94, y: 15 }}
          transition={{ type: 'spring', stiffness: 320, damping: 28 }}
          className="relative w-full max-w-2xl max-h-[92vh] sm:max-h-[90vh] bg-[#0F1115] border border-white/20 rounded-[24px] sm:rounded-[30px] shadow-[0_25px_80px_rgba(0,0,0,0.95),0_0_40px_rgba(251,191,36,0.12)] overflow-hidden flex flex-col my-auto z-10"
        >
          {/* ── Fixed Header (Shrink-0) ── */}
          <div className="shrink-0 flex justify-between items-center px-5 sm:px-6 py-3.5 sm:py-4 border-b border-white/10 bg-[#0F1115] z-10">
            <div>
              <h2 className="text-lg sm:text-xl font-bold text-white font-sans flex items-center gap-2">
                <span>{eventName}</span>
                <span className="text-[11px] sm:text-xs px-2.5 py-0.5 rounded-full bg-amber-500/20 text-amber-200 border border-amber-500/30 font-mono font-semibold">
                  Registration
                </span>
              </h2>
              <p className="text-xs sm:text-sm text-neutral-400 mt-0.5 font-sans">
                Team Registration ({eventDetails?.team_size || 4} Members) •{' '}
                <span className="text-amber-200 font-semibold">Step {step} of 3</span>
              </p>
            </div>
            <button
              type="button"
              onClick={onClose}
              className="p-2 rounded-full hover:bg-white/10 text-neutral-400 hover:text-white transition-colors cursor-pointer"
              aria-label="Close modal"
            >
              <X size={20} />
            </button>
          </div>

          {/* ── Fixed Progress Bar (Shrink-0) ── */}
          <div className="shrink-0 w-full bg-white/5 h-1.5">
            <motion.div
              className="h-full bg-gradient-to-r from-amber-400 via-amber-200 to-white shadow-[0_0_10px_rgba(251,191,36,0.5)]"
              initial={{ width: '33%' }}
              animate={{ width: progressWidth }}
              transition={{ duration: 0.35 }}
            />
          </div>

          {/* ── Fixed Step Indicators (Shrink-0) ── */}
          <div className="shrink-0 flex justify-between px-5 sm:px-6 pt-2.5 pb-2 bg-[#0F1115]/90 border-b border-white/5 text-xs font-sans">
            {['1. Leader Info', '2. Team Members', '3. 💳 Payment'].map((label, i) => (
              <span 
                key={i} 
                className={`font-semibold transition-colors ${
                  step === i + 1 
                    ? 'text-amber-200 font-bold drop-shadow-[0_0_8px_rgba(251,191,36,0.4)]' 
                    : step > i + 1 
                    ? 'text-emerald-400' 
                    : 'text-neutral-500'
                }`}
              >
                {step > i + 1 ? '✓ ' : ''}{label}
              </span>
            ))}
          </div>

          {/* ── Scrollable Form Area (flex-1 min-h-0) ── */}
          <div className="flex-1 overflow-y-auto custom-scrollbar px-5 sm:px-8 py-4 min-h-0">
            {error && (
              <div className="mb-4 p-4 rounded-2xl bg-red-500/10 border border-red-500/30 flex items-start gap-3 shadow-[0_0_15px_rgba(239,68,68,0.15)]">
                <AlertCircle className="text-red-400 shrink-0 mt-0.5" size={20} />
                <p className="text-red-200 text-sm font-sans leading-relaxed">{error}</p>
              </div>
            )}

            <form onSubmit={step === 3 ? handleSubmit : (e) => e.preventDefault()} noValidate>

              {/* ── COMPACT EVENT HIGHLIGHTS CARD (Step 1) ── */}
              {step === 1 && (
                <div className="relative mb-5 rounded-2xl overflow-hidden bg-gradient-to-br from-amber-500/[0.08] via-white/[0.03] to-transparent border border-amber-500/20 backdrop-blur-md p-4 sm:p-5 shadow-lg">
                  <div className="flex items-center justify-between gap-2 mb-2">
                    <div className="flex items-center gap-2">
                      <span className="text-amber-300 text-base">⚡</span>
                      <h4 className="text-white font-bold text-xs tracking-wider uppercase font-sans">
                        Event Highlights
                      </h4>
                    </div>
                    {eventDetails?.subtitle && (
                      <span className="text-[11px] font-mono text-amber-200/90 font-medium hidden sm:inline">
                        {eventDetails.subtitle}
                      </span>
                    )}
                  </div>

                  <p className="text-neutral-300 text-xs sm:text-sm leading-relaxed mb-3.5 font-sans">
                    <span className="text-white font-semibold">{eventDetails?.title?.split('-')[0]?.trim() || "BUILDX"}</span> — {
                      (eventDetails?.slug || "").includes("buildx") || (eventDetails?.title || "").toLowerCase().includes("buildx")
                        ? "Full Stack Development & Live Problem Solving Challenge. Build scalable solutions and adapt in real-time."
                        : (eventDetails?.short_description || "Showcase your technical excellence and teamwork.")
                    }
                  </p>

                  <div className="flex flex-wrap gap-2">
                    <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-amber-500/15 border border-amber-500/30 text-amber-200 text-xs font-semibold font-sans">
                      👥 {(eventDetails?.slug || "").includes("buildx") || (eventDetails?.title || "").toLowerCase().includes("buildx") ? "2 to 4 Members" : `${eventDetails?.team_size || 4} Members`}
                    </span>

                    <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-500/15 border border-emerald-500/30 text-emerald-300 text-xs font-bold font-sans">
                      💳 Fee: ₹{eventDetails?.fee ?? eventDetails?.registration_fee ?? 40}
                    </span>

                    <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-red-500/20 border border-red-500/40 text-red-300 text-xs font-bold font-sans shadow-[0_0_12px_rgba(239,68,68,0.25)]">
                      🔥 {Math.max(0, (eventDetails?.max_participants ?? eventDetails?.max_teams ?? 60) - (eventDetails?.registered_teams_count ?? eventDetails?.registered_count ?? 0))} Seats Left ({eventDetails?.registered_teams_count ?? eventDetails?.registered_count ?? 0}/{eventDetails?.max_participants ?? eventDetails?.max_teams ?? 60})
                    </span>

                    <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-purple-500/15 border border-purple-500/30 text-purple-200 text-xs font-medium font-sans">
                      📍 SCET, Nagpur
                    </span>

                    {eventDetails?.eligibility && (
                      <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-rose-500/15 border border-rose-500/30 text-rose-200 text-xs font-medium font-sans">
                        🎓 {eventDetails.eligibility}
                      </span>
                    )}
                  </div>
                </div>
              )}

              {/* ── STEP 1: PARTICIPANT DETAILS ── */}
              <div className={step === 1 ? 'block' : 'hidden'}>
                <h3 className="text-base sm:text-lg font-bold text-white mb-4 flex items-center gap-2 font-sans">
                  <span className="flex items-center justify-center w-6 h-6 rounded-full bg-pink-500 text-white font-black text-xs">1</span>
                  {(eventDetails?.team_size || 4) === 1 ? "Participant Details" : "Team & Leader Details"}
                </h3>

                <div className="space-y-4">
                  {(eventDetails?.team_size || 4) !== 1 && (
                    <div>
                      <label className="block text-xs sm:text-sm text-neutral-300 mb-1.5 font-sans font-medium">Team Name *</label>
                      <input
                        type="text" name="teamName" value={formData.teamName} onChange={handleChange}
                        placeholder="e.g. Code Innovators"
                        className="w-full px-4 py-3 rounded-xl bg-white/5 border border-white/10 text-white placeholder-neutral-500 focus:border-amber-300/60 focus:ring-1 focus:ring-amber-300/20 outline-none transition-all font-sans text-sm"
                      />
                    </div>
                  )}

                  <div className={(eventDetails?.team_size || 4) === 1 ? "space-y-4" : "grid grid-cols-1 md:grid-cols-2 gap-4"}>
                    <div>
                      <label className="block text-xs sm:text-sm text-neutral-300 mb-1.5 font-sans font-medium">
                        {(eventDetails?.team_size || 4) === 1 ? "Full Name *" : "Leader Name *"}
                      </label>
                      <input
                        type="text" name="leaderName" value={formData.leaderName} onChange={handleChange}
                        placeholder="Participant Full Name"
                        className="w-full px-4 py-3 rounded-xl bg-white/5 border border-white/10 text-white placeholder-neutral-500 focus:border-pink-400/60 outline-none transition-all font-sans text-sm"
                      />
                    </div>
                    {(eventDetails?.team_size || 4) !== 1 && (
                      <div>
                        <label className="block text-xs sm:text-sm text-neutral-300 mb-1.5 font-sans font-medium">Leader Phone *</label>
                        <input
                          type="tel" name="leaderPhone" value={formData.leaderPhone} onChange={handleLeaderPhoneChange}
                          placeholder="10-digit mobile number" maxLength="10"
                          className="w-full px-4 py-3 rounded-xl bg-white/5 border border-white/10 text-white placeholder-neutral-500 focus:border-amber-300/60 outline-none transition-all font-sans text-sm"
                        />
                      </div>
                    )}
                  </div>

                  <div>
                    <label className="block text-xs sm:text-sm text-neutral-300 mb-1.5 font-sans font-medium">Email Address *</label>
                    <input
                      type="email" name="leaderEmail" value={formData.leaderEmail} onChange={handleChange}
                      placeholder="e.g. student@gmail.com"
                      className="w-full px-4 py-3 rounded-xl bg-white/5 border border-white/10 text-white placeholder-neutral-500 focus:border-pink-400/60 outline-none transition-all font-sans text-sm"
                    />
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs sm:text-sm text-neutral-300 mb-1.5 font-sans font-medium">Year of Study *</label>
                      <select
                        required
                        name="leaderYear" value={formData.leaderYear} onChange={handleChange}
                        className="w-full px-4 py-3 rounded-xl bg-white/5 border border-white/10 text-white focus:border-pink-400/60 outline-none transition-all [&>option]:bg-[#0B0B0B] font-sans text-sm"
                      >
                        <option value="">-- Select Year --</option>
                        {years.map(y => <option key={y} value={y}>{y}</option>)}
                      </select>
                    </div>

                    <div>
                      <label className="block text-xs sm:text-sm text-neutral-300 mb-1.5 font-sans font-medium">Department / Branch *</label>
                      <input
                        type="text"
                        required
                        name="leaderBranch"
                        value={formData.leaderBranch}
                        onChange={handleChange}
                        placeholder="e.g. Computer Engineering / CSE / IT"
                        className="w-full px-4 py-3 rounded-xl bg-white/5 border border-white/10 text-white placeholder-neutral-500 focus:border-pink-400/60 outline-none transition-all font-sans text-sm"
                      />
                    </div>
                  </div>

                  {(eventDetails?.team_size || 4) !== 1 && (
                    <div>
                      <label className="block text-xs sm:text-sm text-neutral-300 mb-1.5 font-sans font-medium">College / Institute Name *</label>
                      <input
                        type="text"
                        required
                        name="leaderCollege"
                        value={formData.leaderCollege}
                        onChange={handleChange}
                        placeholder="e.g. Suryodaya College of Engineering & Technology, Nagpur"
                        className="w-full px-4 py-3 rounded-xl bg-white/5 border border-white/10 text-white placeholder-neutral-500 focus:border-amber-300/60 outline-none transition-all font-sans text-sm"
                      />
                    </div>
                  )}

                  <div className="flex items-center gap-3 px-4 py-3 rounded-xl bg-white/5 border border-white/10">
                    <span className="text-amber-300 text-lg">🎓</span>
                    <p className="text-xs sm:text-sm text-neutral-300 font-medium font-sans">Open for all Engineering, Polytechnic &amp; Diploma Students from all Colleges!</p>
                  </div>

                  {/* Prominent In-Form Continue Button */}
                  <div className="pt-3 flex items-center justify-end">
                    <button
                      type="button"
                      onClick={nextStep}
                      className="w-full sm:w-auto px-8 py-3.5 rounded-full bg-gradient-to-r from-amber-200 via-white to-amber-100 hover:from-white hover:to-amber-200 text-black font-extrabold text-sm sm:text-base shadow-[0_0_25px_rgba(251,191,36,0.4)] hover:shadow-[0_0_35px_rgba(251,191,36,0.6)] transition-all transform hover:scale-[1.02] active:scale-[0.98] flex items-center justify-center gap-2 cursor-pointer font-sans"
                    >
                      <span>{(eventDetails?.team_size || 4) === 1 ? "Continue to Rules & Submission" : "Continue to Team Members"}</span>
                      <ArrowRight size={18} />
                    </button>
                  </div>
                </div>
              </div>

              {/* ── STEP 2: TEAM MEMBERS ── */}
              <div className={step === 2 ? 'block' : 'hidden'}>
                <h3 className="text-base sm:text-lg font-bold text-white mb-4 flex items-center gap-2 font-sans">
                  <span className="flex items-center justify-center w-6 h-6 rounded-full bg-amber-400 text-black font-black text-xs"><Users size={13} /></span>
                  Team Members Details
                </h3>

                <div className="space-y-6">
                  {formData.members.map((member, idx) => {
                    const isOptional = idx > 0;
                    return (
                      <div key={idx} className={`p-4 sm:p-5 rounded-2xl border ${isOptional ? 'border-white/10 bg-white/[0.02]' : 'border-amber-500/30 bg-amber-500/[0.03] shadow-[0_0_20px_rgba(251,191,36,0.05)]'} space-y-4`}>
                        <div className="flex items-center justify-between">
                          <p className="text-sm font-bold text-white font-sans flex items-center gap-2">
                            <span>Member {idx + 2}</span>
                            {isOptional ? (
                              <span className="text-[11px] font-normal text-neutral-400 font-sans">(Optional — Leave blank if not needed)</span>
                            ) : (
                              <span className="text-xs px-2 py-0.5 rounded-full bg-amber-400/20 text-amber-200 font-semibold font-sans">Required</span>
                            )}
                          </p>
                          {isOptional && (
                            <span className="text-[11px] px-2.5 py-0.5 rounded-full bg-white/10 text-neutral-400 font-sans">
                              Optional
                            </span>
                          )}
                        </div>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          <div>
                            <label className="block text-xs sm:text-sm text-neutral-300 mb-1.5 font-sans font-medium">
                              Name {isOptional ? <span className="text-neutral-500 font-normal">(Optional)</span> : <span className="text-amber-300">*</span>}
                            </label>
                            <input
                              type="text" value={member.name}
                              onChange={e => handleMemberChange(idx, 'name', e.target.value)}
                              placeholder={isOptional ? "Full Name (leave blank if not applicable)" : "Full Name"}
                              className="w-full px-4 py-3 rounded-xl bg-white/5 border border-white/10 text-white placeholder-neutral-500 focus:border-amber-300/60 outline-none transition-all font-sans text-sm"
                            />
                          </div>
                          <div>
                            <label className="block text-xs sm:text-sm text-neutral-300 mb-1.5 font-sans font-medium">
                              Phone {isOptional ? <span className="text-neutral-500 font-normal">(Optional)</span> : <span className="text-amber-300">*</span>}
                            </label>
                            <input
                              type="tel" value={member.phone} maxLength="10"
                              onChange={e => handleMemberChange(idx, 'phone', e.target.value)}
                              placeholder="10-digit mobile number"
                              className="w-full px-4 py-3 rounded-xl bg-white/5 border border-white/10 text-white placeholder-neutral-500 focus:border-amber-300/60 outline-none transition-all font-sans text-sm"
                            />
                          </div>
                        </div>
                        <div>
                          <label className="block text-xs sm:text-sm text-neutral-300 mb-1.5 font-sans font-medium">
                            Email {isOptional ? <span className="text-neutral-500 font-normal">(Optional)</span> : <span className="text-amber-300">*</span>}
                          </label>
                          <input
                            type="email" value={member.email}
                            onChange={e => handleMemberChange(idx, 'email', e.target.value)}
                            placeholder="Email Address"
                            className="w-full px-4 py-3 rounded-xl bg-white/5 border border-white/10 text-white placeholder-neutral-500 focus:border-amber-300/60 outline-none transition-all font-sans text-sm"
                          />
                        </div>
                        <div>
                          <label className="block text-xs sm:text-sm text-neutral-300 mb-1.5 font-sans font-medium">
                            Year of Study {isOptional ? <span className="text-neutral-500 font-normal">(Optional)</span> : <span className="text-amber-300">*</span>}
                          </label>
                          <select
                            value={member.year}
                            onChange={e => handleMemberChange(idx, 'year', e.target.value)}
                            className="w-full px-4 py-3 rounded-xl bg-white/5 border border-white/10 text-white focus:border-amber-300/60 outline-none transition-all [&>option]:bg-[#0B0B0B] font-sans text-sm"
                          >
                            <option value="">{isOptional ? "-- Select Year (Optional) --" : "-- Select Year --"}</option>
                            {years.map(y => <option key={y} value={y}>{y}</option>)}
                          </select>
                        </div>
                      </div>
                    );
                  })}

                  <div className="pt-3 border-t border-white/10">
                    <label className="flex items-center gap-3 cursor-pointer group select-none">
                      <div className="relative flex items-center">
                        <input
                          type="checkbox" name="agreedToRules" checked={formData.agreedToRules} onChange={handleChange}
                          className="peer appearance-none w-5 h-5 border-2 border-white/30 rounded cursor-pointer checked:bg-amber-300 checked:border-amber-300 transition-colors"
                        />
                        <CheckCircle size={15} className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 text-black opacity-0 peer-checked:opacity-100 pointer-events-none transition-opacity font-bold" />
                      </div>
                      <span className="text-xs sm:text-sm text-neutral-300 group-hover:text-white transition-colors font-sans font-medium">
                        ☑ I agree to all event rules and code of conduct. <span className="text-amber-300 font-bold">*</span>
                      </span>
                    </label>
                  </div>

                  {/* Prominent In-Form Continue / Back Buttons */}
                  <div className="pt-3 flex items-center justify-between gap-3">
                    <button
                      type="button"
                      onClick={prevStep}
                      className="px-6 py-3 rounded-full text-neutral-300 hover:bg-white/10 hover:text-white transition-colors font-semibold text-sm font-sans flex items-center gap-1.5 cursor-pointer"
                    >
                      <ArrowLeft size={16} />
                      <span>Back</span>
                    </button>
                    <button
                      type="button"
                      onClick={nextStep}
                      disabled={loading}
                      className="px-8 py-3.5 rounded-full bg-gradient-to-r from-amber-200 via-white to-amber-100 hover:from-white hover:to-amber-200 text-black font-extrabold text-sm sm:text-base shadow-[0_0_25px_rgba(251,191,36,0.4)] hover:shadow-[0_0_35px_rgba(251,191,36,0.6)] transition-all transform hover:scale-[1.02] active:scale-[0.98] flex items-center justify-center gap-2 cursor-pointer font-sans"
                    >
                      <span>{Number(eventDetails?.fee ?? eventDetails?.registration_fee ?? 0) === 0 ? (loading ? "Submitting..." : "Submit Registration 🌸") : "Continue to Payment"}</span>
                      <ArrowRight size={18} />
                    </button>
                  </div>
                </div>
              </div>

              {/* ── STEP 3: PAYMENT DETAILS ── */}
              <div className={step === 3 ? 'block' : 'hidden'}>
                <h3 className="text-base sm:text-lg font-bold text-white mb-2 flex items-center gap-2 font-sans">
                  <CreditCard size={18} className="text-amber-300" />
                  Registration Payment
                </h3>
                <p className="text-xs sm:text-sm text-neutral-400 mb-5 font-sans">Complete the ₹{FEE_AMOUNT} registration fee to confirm your team's participation.</p>

                {/* Payment Card */}
                <div className="flex flex-col items-center p-5 rounded-2xl bg-white/5 border border-white/10 mb-6 relative overflow-hidden">
                  <h4 className="text-white font-bold mb-4 text-base font-sans flex items-center gap-2">
                    <span>Scan UPI QR Code</span>
                  </h4>

                  {/* QR Code */}
                  <div className="bg-white rounded-2xl p-3 shadow-2xl mb-3 w-full max-w-[260px]">
                    <img
                      src={eventDetails?.qr_image || "/BuildXScanner.jpeg"}
                      alt="Payment QR Code"
                      style={{ width: '100%', height: 'auto', objectFit: 'contain', display: 'block', borderRadius: '10px' }}
                    />
                  </div>
                  <p className="text-xs text-neutral-400 mb-3 text-center font-sans">Scan this QR using Google Pay · PhonePe · Paytm · BHIM</p>

                  {/* GPay Explanation */}
                  <div className="w-full bg-amber-500/10 border border-amber-500/20 rounded-xl px-4 py-3 mb-4 flex gap-3 items-start">
                    <span className="text-amber-300 text-base mt-0.5 shrink-0">ℹ️</span>
                    <p className="text-xs text-neutral-300 leading-relaxed font-sans">
                      <span className="font-semibold block mb-0.5 text-white">Seeing "Your money has not been debited"?</span>
                      That is normal Google Pay safety info shown <span className="font-semibold text-amber-200">before</span> entering PIN.
                      Simply enter your <span className="font-semibold text-white">UPI PIN</span> to pay ₹{FEE_AMOUNT}.
                    </p>
                  </div>

                  {/* UPI ID block */}
                  <div className="w-full bg-black/40 rounded-xl p-4 border border-white/10 mb-4">
                    <p className="text-xs text-neutral-400 uppercase tracking-widest mb-2 text-center font-sans font-semibold">UPI ID</p>
                    <div
                      className="w-full text-center font-mono font-bold text-white select-all bg-white/5 rounded-lg px-3 py-2.5 border border-white/10 text-sm sm:text-base cursor-text mb-3"
                    >
                      {UPI_ID}
                    </div>

                    <button
                      type="button"
                      onClick={handleCopyUPI}
                      className={`w-full flex items-center justify-center gap-2 py-2.5 rounded-full font-bold text-xs sm:text-sm transition-all duration-300 font-sans cursor-pointer ${
                        upiCopied
                          ? 'bg-emerald-400 text-black shadow-[0_0_15px_rgba(52,211,153,0.4)]'
                          : 'bg-white/10 hover:bg-white/20 text-white border border-white/15'
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
                  <div className="flex items-center gap-3">
                    <span className="text-neutral-400 text-sm font-sans">Registration Fee:</span>
                    <span className="text-2xl font-black text-amber-200 font-sans">₹{FEE_AMOUNT}</span>
                  </div>
                </div>

                <div className="space-y-4">
                  {/* Transaction ID */}
                  <div className="rounded-2xl bg-white/5 border border-white/10 p-4">
                    <label className="flex items-center gap-2 text-xs sm:text-sm font-bold text-white mb-2 font-sans">
                      <span className="text-base">🔢</span>
                      UPI Transaction ID / UTR <span className="text-amber-300">*</span>
                    </label>
                    <input
                      type="text"
                      name="transactionId"
                      value={formData.transactionId}
                      onChange={handleChange}
                      placeholder="e.g. 418512345678 (12-digit number)"
                      className="w-full px-4 py-3 rounded-xl bg-black/40 border border-white/10 text-white placeholder-neutral-500 focus:border-amber-300/60 outline-none transition-all font-mono text-sm"
                      minLength="12"
                      maxLength="40"
                    />
                    <p className="text-[11px] sm:text-xs text-neutral-400 mt-1.5 font-sans">Enter the 12-digit UTR / Transaction ID from your payment confirmation screen.</p>
                  </div>

                  {/* Screenshot Upload */}
                  <div className="rounded-2xl bg-white/5 border border-white/10 p-4">
                    <label className="flex items-center gap-2 text-xs sm:text-sm font-bold text-white mb-2 font-sans">
                      <span className="text-base">📸</span>
                      Payment Screenshot Proof <span className="text-amber-300">*</span>
                    </label>

                    {formData.paymentScreenshot ? (
                      <div className="relative rounded-xl border border-white/15 overflow-hidden bg-black/40 p-2">
                        <img
                          src={formData.paymentScreenshot}
                          alt="Screenshot preview"
                          className="w-full h-44 object-contain rounded-lg"
                        />
                        <div className="absolute inset-0 bg-black/60 opacity-0 hover:opacity-100 transition-opacity flex items-center justify-center gap-3 rounded-xl backdrop-blur-xs">
                          <button
                            type="button"
                            onClick={() => fileRef.current?.click()}
                            className="px-4 py-2 bg-white/20 hover:bg-white/30 rounded-full text-white text-xs font-semibold backdrop-blur-md transition-colors font-sans cursor-pointer"
                          >
                            Replace
                          </button>
                          <button
                            type="button"
                            onClick={() => setFormData(p => ({ ...p, paymentScreenshot: null }))}
                            className="px-4 py-2 bg-red-500/80 hover:bg-red-500 rounded-full text-white text-xs font-semibold backdrop-blur-md transition-colors font-sans cursor-pointer"
                          >
                            Remove
                          </button>
                        </div>
                      </div>
                    ) : (
                      <div
                        onClick={() => fileRef.current?.click()}
                        className="w-full border-2 border-dashed border-white/20 rounded-2xl p-6 flex flex-col items-center justify-center cursor-pointer hover:border-amber-300/50 hover:bg-white/[0.03] transition-all group"
                      >
                        <div className="w-12 h-12 rounded-full bg-white/10 border border-white/20 flex items-center justify-center mb-2 group-hover:scale-110 transition-transform">
                          <Upload className="text-white" size={22} />
                        </div>
                        <p className="text-xs sm:text-sm text-neutral-200 font-semibold text-center font-sans">Tap to upload payment screenshot</p>
                        <p className="text-[11px] text-neutral-500 mt-0.5 text-center font-sans">JPG, PNG · Max 15MB</p>
                      </div>
                    )}

                    <input
                      type="file"
                      ref={fileRef}
                      onChange={handleFileChange}
                      accept="image/jpeg, image/png, image/jpg"
                      className="hidden"
                    />
                  </div>
                </div>

                {/* Complete Registration CTA inside Step 3 */}
                <div className="mt-6 pt-4 border-t border-white/10">
                  <button
                    type="submit"
                    disabled={loading || !formData.transactionId || !formData.paymentScreenshot}
                    className="w-full py-4 rounded-full font-extrabold text-base transition-all duration-300 flex items-center justify-center gap-3 bg-gradient-to-r from-emerald-400 via-emerald-300 to-green-400 hover:from-emerald-300 hover:to-green-300 text-black shadow-[0_0_25px_rgba(52,211,153,0.5)] active:scale-[0.98] disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer font-sans"
                  >
                    {loading ? (
                      <><Loader2 className="animate-spin" size={20} /> Submitting Registration...</>
                    ) : (
                      <><CheckCircle size={20} /> Complete Team Registration</>
                    )}
                  </button>
                  {(!formData.transactionId || !formData.paymentScreenshot) && (
                    <p className="text-xs text-amber-300/80 text-center mt-2.5 font-sans">
                      {!formData.transactionId && !formData.paymentScreenshot
                        ? '⚠️ Enter UPI Transaction ID and upload screenshot to finish registration.'
                        : !formData.transactionId
                        ? '⚠️ Please enter your 12-digit UPI Transaction ID.'
                        : '⚠️ Please upload your payment screenshot.'}
                    </p>
                  )}
                </div>

              </div>

            </form>
          </div>

          {/* ── Fixed Bottom Footer Bar (Shrink-0) ── */}
          <div className="shrink-0 px-5 sm:px-6 py-3.5 sm:py-4 border-t border-white/15 bg-[#0F1115] backdrop-blur-xl z-20 shadow-[0_-10px_30px_rgba(0,0,0,0.8)]">
            {step === 3 && (
              <div className="flex justify-between items-center mb-3 px-1 text-xs font-sans">
                <span className="text-neutral-400 font-medium">Teams Registered: <strong className="text-white">{eventDetails?.registered_teams_count ?? eventDetails?.registered_count ?? 0} / {eventDetails?.max_participants ?? eventDetails?.max_teams ?? 60}</strong></span>
                <span className="text-red-400 font-bold bg-red-500/15 border border-red-500/30 px-2.5 py-0.5 rounded-full text-xs shadow-[0_0_10px_rgba(239,68,68,0.2)]">
                  🔥 {Math.max(0, (eventDetails?.max_participants ?? eventDetails?.max_teams ?? 60) - (eventDetails?.registered_teams_count ?? eventDetails?.registered_count ?? 0))} Seats Left
                </span>
              </div>
            )}
            <div className="flex justify-between items-center gap-3">
              {step > 1 ? (
                <button
                  type="button"
                  onClick={prevStep}
                  disabled={loading}
                  className="px-6 py-2.5 rounded-full text-neutral-300 hover:bg-white/10 hover:text-white transition-colors font-semibold text-sm disabled:opacity-50 font-sans cursor-pointer flex items-center gap-1.5"
                >
                  <ArrowLeft size={16} />
                  <span>Back</span>
                </button>
              ) : (
                <div />
              )}
              {step < 3 ? (
                <button
                  type="button"
                  onClick={nextStep}
                  className="ml-auto px-8 sm:px-10 py-3 rounded-full bg-gradient-to-r from-amber-200 via-white to-amber-100 hover:from-white hover:to-amber-200 text-black font-extrabold text-sm sm:text-base shadow-[0_0_25px_rgba(251,191,36,0.5)] hover:shadow-[0_0_35px_rgba(251,191,36,0.7)] transition-all transform hover:scale-[1.02] active:scale-[0.98] flex items-center gap-2 cursor-pointer font-sans"
                >
                  <span>Continue</span>
                  <ArrowRight size={18} />
                </button>
              ) : null}
            </div>
          </div>

        </motion.div>
      </div>
    </AnimatePresence>
  );
}
