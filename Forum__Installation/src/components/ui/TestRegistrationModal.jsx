import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X, CheckCircle, Loader2, AlertCircle } from "lucide-react";

const API_URL = import.meta.env.VITE_API_URL || "https://aces-backkend.onrender.com";
const YEAR_OPTIONS = ["First Year", "Second Year", "Third Year", "Final Year"];
const INITIAL_FORM = {
  team_name: "", member1_name: "", member1_email: "", member1_mobile: "",
  member2_name: "", member2_email: "", member2_mobile: "",
  college_name: "", department: "", year: "",
};

function validate(form) {
  const emailRe = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  const mobileRe = /^\d{10}$/;
  if (!form.team_name.trim())       return "Team Name is required.";
  if (!form.member1_name.trim())    return "Member 1 Name is required.";
  if (!form.member1_email.trim())   return "Member 1 Email is required.";
  if (!emailRe.test(form.member1_email.trim())) return "Member 1 Email is not valid.";
  if (!form.member1_mobile.trim())  return "Member 1 Mobile is required.";
  if (!mobileRe.test(form.member1_mobile.trim())) return "Member 1 Mobile must be exactly 10 digits.";
  if (!form.member2_name.trim())    return "Member 2 Name is required.";
  if (!form.member2_email.trim())   return "Member 2 Email is required.";
  if (!emailRe.test(form.member2_email.trim())) return "Member 2 Email is not valid.";
  if (!form.member2_mobile.trim())  return "Member 2 Mobile is required.";
  if (!mobileRe.test(form.member2_mobile.trim())) return "Member 2 Mobile must be exactly 10 digits.";
  if (!form.college_name.trim())    return "College Name is required.";
  if (!form.department.trim())      return "Department is required.";
  if (!form.year)                   return "Year is required.";
  return null;
}

const inputCls = "w-full bg-white/5 border border-white/10 rounded-xl px-4 py-2.5 text-white text-sm placeholder-gray-500 focus:outline-none focus:border-blue-500/60 transition-colors duration-200";
const labelCls = "block text-xs font-semibold text-gray-400 uppercase tracking-wider mb-1.5";

export default function TestRegistrationModal({ isOpen, onClose }) {
  const [form, setForm]       = useState(INITIAL_FORM);
  const [error, setError]     = useState(null);
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);

  useEffect(() => {
    if (!isOpen) return;
    const onKey = (e) => { if (e.key === "Escape" && !loading) onClose(); };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [isOpen, loading]);

  useEffect(() => {
    if (isOpen) { setForm(INITIAL_FORM); setError(null); setLoading(false); setSuccess(false); }
  }, [isOpen]);

  if (!isOpen) return null;

  const handleClose = () => { if (!loading) onClose(); };
  const handleChange = (e) => { setForm(p => ({ ...p, [e.target.name]: e.target.value })); setError(null); };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (loading) return;
    const err = validate(form);
    if (err) { setError(err); return; }
    setLoading(true); setError(null);
    try {
      const res = await fetch(`${API_URL}/api/test-event/register`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          team_name: form.team_name.trim(), member1_name: form.member1_name.trim(),
          member1_email: form.member1_email.trim().toLowerCase(), member1_mobile: form.member1_mobile.trim(),
          member2_name: form.member2_name.trim(), member2_email: form.member2_email.trim().toLowerCase(),
          member2_mobile: form.member2_mobile.trim(), college_name: form.college_name.trim(),
          department: form.department.trim(), year: form.year,
        }),
      });
      const data = await res.json();
      if (res.status === 201 && data.success) { setSuccess(true); setForm(INITIAL_FORM); }
      else if (res.status === 409) setError("This team or email is already registered.");
      else if (res.status === 429) setError("Too many requests. Please wait a moment and try again.");
      else setError(data.error || "Registration failed. Please try again.");
    } catch { setError("Network error. Please check your connection and try again."); }
    finally { setLoading(false); }
  };

  const overlay = { position:"fixed", inset:0, zIndex:9999, background:"rgba(0,0,0,0.78)", backdropFilter:"blur(6px)", display:"flex", alignItems:"center", justifyContent:"center", padding:"16px" };
  const modal   = { background:"#0f0f0f", border:"1px solid rgba(255,255,255,0.10)", borderRadius:"24px", width:"100%", maxWidth:"560px", maxHeight:"92vh", overflowY:"auto", padding:"32px 28px", position:"relative" };

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div initial={{opacity:0}} animate={{opacity:1}} exit={{opacity:0}} transition={{duration:0.2}} style={overlay} onClick={handleClose}>
          <motion.div initial={{opacity:0,scale:0.92,y:20}} animate={{opacity:1,scale:1,y:0}} exit={{opacity:0,scale:0.92,y:20}} transition={{duration:0.28,ease:[0.34,1.56,0.64,1]}} style={modal} onClick={e=>e.stopPropagation()}>

            {/* Close */}
            {!loading && (
              <button onClick={handleClose} style={{position:"absolute",top:"16px",right:"16px",background:"rgba(255,255,255,0.08)",border:"none",borderRadius:"50%",width:"32px",height:"32px",color:"#aaa",cursor:"pointer",display:"flex",alignItems:"center",justifyContent:"center"}}>
                <X size={16}/>
              </button>
            )}

            {/* Success */}
            {success ? (
              <div style={{textAlign:"center",padding:"20px 0"}}>
                <div style={{fontSize:"3rem",marginBottom:"12px"}}>🎉</div>
                <CheckCircle size={48} color="#22c55e" style={{margin:"0 auto 16px"}}/>
                <h2 style={{color:"#fff",fontWeight:700,fontSize:"1.35rem",marginBottom:"8px"}}>Registration Successful!</h2>
                <p style={{color:"#9ca3af",fontSize:"0.9rem",lineHeight:1.7,marginBottom:"28px"}}>Your team has been registered successfully.</p>
                <button onClick={handleClose} style={{background:"#2563eb",color:"#fff",border:"none",borderRadius:"12px",padding:"12px 32px",fontSize:"0.95rem",fontWeight:600,cursor:"pointer"}}>Close</button>
              </div>
            ) : (
              <>
                {/* Header */}
                <div style={{marginBottom:"24px"}}>
                  <div style={{display:"flex",alignItems:"center",gap:"10px",marginBottom:"6px"}}>
                    <span style={{fontSize:"1.4rem"}}>🧪</span>
                    <h2 style={{color:"#fff",fontWeight:700,fontSize:"1.2rem",margin:0}}>Test Event Registration</h2>
                  </div>
                  <p style={{color:"#6b7280",fontSize:"0.82rem",margin:0}}>Check the Website — All fields are required.</p>
                </div>

                <form onSubmit={handleSubmit} noValidate>
                  {/* Team Name */}
                  <div style={{marginBottom:"16px"}}>
                    <label className={labelCls}>Team Name</label>
                    <input className={inputCls} type="text" name="team_name" value={form.team_name} onChange={handleChange} placeholder="Enter your team name" disabled={loading} maxLength={100}/>
                  </div>

                  {/* Member 1 */}
                  <div style={{borderTop:"1px solid rgba(255,255,255,0.06)",margin:"18px 0 14px",paddingTop:"14px"}}>
                    <p style={{color:"#3b82f6",fontSize:"0.78rem",fontWeight:700,letterSpacing:"0.1em",textTransform:"uppercase",marginBottom:"14px"}}>👤 Member 1 (Leader)</p>
                  </div>
                  <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:"12px",marginBottom:"12px"}}>
                    <div><label className={labelCls}>Name</label><input className={inputCls} type="text" name="member1_name" value={form.member1_name} onChange={handleChange} placeholder="Full name" disabled={loading} maxLength={100}/></div>
                    <div><label className={labelCls}>Mobile</label><input className={inputCls} type="tel" name="member1_mobile" value={form.member1_mobile} onChange={handleChange} placeholder="10-digit number" disabled={loading} maxLength={10}/></div>
                  </div>
                  <div style={{marginBottom:"16px"}}>
                    <label className={labelCls}>Email</label>
                    <input className={inputCls} type="email" name="member1_email" value={form.member1_email} onChange={handleChange} placeholder="email@example.com" disabled={loading} maxLength={200}/>
                  </div>

                  {/* Member 2 */}
                  <div style={{borderTop:"1px solid rgba(255,255,255,0.06)",margin:"18px 0 14px",paddingTop:"14px"}}>
                    <p style={{color:"#a78bfa",fontSize:"0.78rem",fontWeight:700,letterSpacing:"0.1em",textTransform:"uppercase",marginBottom:"14px"}}>👤 Member 2</p>
                  </div>
                  <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:"12px",marginBottom:"12px"}}>
                    <div><label className={labelCls}>Name</label><input className={inputCls} type="text" name="member2_name" value={form.member2_name} onChange={handleChange} placeholder="Full name" disabled={loading} maxLength={100}/></div>
                    <div><label className={labelCls}>Mobile</label><input className={inputCls} type="tel" name="member2_mobile" value={form.member2_mobile} onChange={handleChange} placeholder="10-digit number" disabled={loading} maxLength={10}/></div>
                  </div>
                  <div style={{marginBottom:"16px"}}>
                    <label className={labelCls}>Email</label>
                    <input className={inputCls} type="email" name="member2_email" value={form.member2_email} onChange={handleChange} placeholder="email@example.com" disabled={loading} maxLength={200}/>
                  </div>

                  {/* College Info */}
                  <div style={{borderTop:"1px solid rgba(255,255,255,0.06)",margin:"18px 0 14px",paddingTop:"14px"}}>
                    <p style={{color:"#34d399",fontSize:"0.78rem",fontWeight:700,letterSpacing:"0.1em",textTransform:"uppercase",marginBottom:"14px"}}>🏫 College Info</p>
                  </div>
                  <div style={{marginBottom:"12px"}}>
                    <label className={labelCls}>College Name</label>
                    <input className={inputCls} type="text" name="college_name" value={form.college_name} onChange={handleChange} placeholder="Your college / university" disabled={loading} maxLength={300}/>
                  </div>
                  <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:"12px",marginBottom:"20px"}}>
                    <div>
                      <label className={labelCls}>Department</label>
                      <input className={inputCls} type="text" name="department" value={form.department} onChange={handleChange} placeholder="e.g. Computer Engg." disabled={loading} maxLength={100}/>
                    </div>
                    <div>
                      <label className={labelCls}>Year</label>
                      <select className={inputCls} name="year" value={form.year} onChange={handleChange} disabled={loading} style={{cursor:"pointer"}}>
                        <option value="" disabled>Select year</option>
                        {YEAR_OPTIONS.map(y=><option key={y} value={y} style={{background:"#1a1a1a"}}>{y}</option>)}
                      </select>
                    </div>
                  </div>

                  {/* Error */}
                  {error && (
                    <div style={{display:"flex",alignItems:"center",gap:"8px",background:"rgba(239,68,68,0.1)",border:"1px solid rgba(239,68,68,0.3)",borderRadius:"10px",padding:"10px 14px",color:"#fca5a5",fontSize:"0.83rem",marginBottom:"16px"}}>
                      <AlertCircle size={15} style={{flexShrink:0}}/>{error}
                    </div>
                  )}

                  {/* Submit */}
                  <button type="submit" disabled={loading} style={{width:"100%",padding:"13px",borderRadius:"14px",border:"none",background:loading?"rgba(37,99,235,0.5)":"#2563eb",color:"#fff",fontSize:"0.95rem",fontWeight:700,cursor:loading?"not-allowed":"pointer",display:"flex",alignItems:"center",justifyContent:"center",gap:"8px",transition:"background 0.2s",boxShadow:loading?"none":"0 0 20px rgba(37,99,235,0.35)"}}>
                    {loading ? <><Loader2 size={18} className="animate-spin"/>Submitting…</> : "Register Now"}
                  </button>
                </form>
              </>
            )}
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
