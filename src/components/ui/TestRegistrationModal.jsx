import React, { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X, CheckCircle, Loader2, AlertCircle, UploadCloud } from "lucide-react";
import { getBaseUrl } from "../../lib/apiConfig";
const YEAR_OPTIONS = ["First Year", "Second Year", "Third Year", "Final Year"];
const INITIAL_FORM = {
  full_name: "", email: "", mobile: "",
  college_name: "", department: "", year: "",
};

function validate(form, documentFile) {
  const emailRe = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  const mobileRe = /^\d{10}$/;
  if (!form.full_name.trim())    return "Name is required.";
  if (!form.email.trim())   return "Email is required.";
  if (!emailRe.test(form.email.trim())) return "Email is not valid.";
  if (!form.mobile.trim())  return "Mobile is required.";
  if (!mobileRe.test(form.mobile.trim())) return "Mobile must be exactly 10 digits.";
  if (!form.college_name.trim())    return "College Name is required.";
  if (!form.department.trim())      return "Department is required.";
  if (!form.year)                   return "Year is required.";
  if (!documentFile)                return "A document file is required.";
  return null;
}

const inputCls = "w-full bg-white/5 border border-white/10 rounded-xl px-4 py-2.5 text-white text-sm placeholder-gray-500 focus:outline-none focus:border-blue-500/60 transition-colors duration-200";
const labelCls = "block text-xs font-semibold text-gray-400 uppercase tracking-wider mb-1.5";

export default function TestRegistrationModal({ isOpen, onClose }) {
  const [form, setForm]       = useState(INITIAL_FORM);
  const [documentFile, setDocumentFile] = useState(null);
  const [error, setError]     = useState(null);
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const fileInputRef = useRef(null);

  useEffect(() => {
    if (!isOpen) return;
    const onKey = (e) => { if (e.key === "Escape" && !loading) onClose(); };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [isOpen, loading]);

  useEffect(() => {
    if (isOpen) { setForm(INITIAL_FORM); setDocumentFile(null); setError(null); setLoading(false); setSuccess(false); }
  }, [isOpen]);

  if (!isOpen) return null;

  const handleClose = () => { if (!loading) onClose(); };
  const handleChange = (e) => { setForm(p => ({ ...p, [e.target.name]: e.target.value })); setError(null); };
  const handleFileChange = (e) => { 
    if (e.target.files && e.target.files[0]) {
      setDocumentFile(e.target.files[0]);
    }
    setError(null);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (loading) return;
    const err = validate(form, documentFile);
    if (err) { setError(err); return; }
    setLoading(true); setError(null);
    try {
      const formData = new FormData();
      formData.append("full_name", form.full_name.trim());
      formData.append("email", form.email.trim().toLowerCase());
      formData.append("mobile", form.mobile.trim());
      formData.append("college_name", form.college_name.trim());
      formData.append("department", form.department.trim());
      formData.append("year", form.year);
      formData.append("document", documentFile);

      const apiUrl = getBaseUrl();
      const res = await fetch(`${apiUrl}/api/test-event/register`, {
        method: "POST",
        body: formData,
      });
      const data = await res.json();
      if (res.status === 201 && data.success) { setSuccess(true); setForm(INITIAL_FORM); setDocumentFile(null); }
      else if (res.status === 409) setError("This email is already registered.");
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
                <p style={{color:"#9ca3af",fontSize:"0.9rem",lineHeight:1.7,marginBottom:"28px"}}>Your registration and document have been submitted successfully.</p>
                <button onClick={handleClose} style={{background:"#2563eb",color:"#fff",border:"none",borderRadius:"12px",padding:"12px 32px",fontSize:"0.95rem",fontWeight:600,cursor:"pointer"}}>Close</button>
              </div>
            ) : (
              <>
                {/* Header */}
                <div style={{marginBottom:"24px"}}>
                  <div style={{display:"flex",alignItems:"center",gap:"10px",marginBottom:"6px"}}>
                    <span style={{fontSize:"1.4rem"}}>🧪</span>
                    <h2 style={{color:"#fff",fontWeight:700,fontSize:"1.2rem",margin:0}}>Individual Test Registration</h2>
                  </div>
                  <p style={{color:"#6b7280",fontSize:"0.82rem",margin:0}}>Check the Website — All fields are required.</p>
                </div>

                <form onSubmit={handleSubmit} noValidate>
                  {/* Participant */}
                  <div style={{borderTop:"1px solid rgba(255,255,255,0.06)",margin:"18px 0 14px",paddingTop:"14px"}}>
                    <p style={{color:"#3b82f6",fontSize:"0.78rem",fontWeight:700,letterSpacing:"0.1em",textTransform:"uppercase",marginBottom:"14px"}}>👤 Participant Details</p>
                  </div>
                  <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:"12px",marginBottom:"12px"}}>
                    <div><label className={labelCls}>Full Name</label><input className={inputCls} type="text" name="full_name" value={form.full_name} onChange={handleChange} placeholder="Full name" disabled={loading} maxLength={100}/></div>
                    <div><label className={labelCls}>Mobile</label><input className={inputCls} type="tel" name="mobile" value={form.mobile} onChange={handleChange} placeholder="10-digit number" disabled={loading} maxLength={10}/></div>
                  </div>
                  <div style={{marginBottom:"16px"}}>
                    <label className={labelCls}>Email</label>
                    <input className={inputCls} type="email" name="email" value={form.email} onChange={handleChange} placeholder="email@example.com" disabled={loading} maxLength={200}/>
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

                  {/* Document Upload */}
                  <div style={{borderTop:"1px solid rgba(255,255,255,0.06)",margin:"18px 0 14px",paddingTop:"14px"}}>
                    <p style={{color:"#f59e0b",fontSize:"0.78rem",fontWeight:700,letterSpacing:"0.1em",textTransform:"uppercase",marginBottom:"14px"}}>📄 Document Upload</p>
                  </div>
                  <div style={{marginBottom:"20px"}}>
                    <input type="file" ref={fileInputRef} onChange={handleFileChange} style={{display: 'none'}} disabled={loading} />
                    <div 
                      onClick={() => !loading && fileInputRef.current.click()}
                      style={{
                        border: '1px dashed rgba(255,255,255,0.2)',
                        borderRadius: '12px',
                        padding: '24px',
                        textAlign: 'center',
                        cursor: loading ? 'not-allowed' : 'pointer',
                        background: 'rgba(255,255,255,0.02)',
                        transition: 'background 0.2s',
                        display: 'flex',
                        flexDirection: 'column',
                        alignItems: 'center',
                        gap: '8px'
                      }}
                      onMouseOver={(e) => !loading && (e.currentTarget.style.background = 'rgba(255,255,255,0.05)')}
                      onMouseOut={(e) => !loading && (e.currentTarget.style.background = 'rgba(255,255,255,0.02)')}
                    >
                      <UploadCloud size={32} color={documentFile ? "#34d399" : "#9ca3af"} />
                      <div style={{color: documentFile ? "#34d399" : "#fff", fontSize: "0.9rem", fontWeight: 500}}>
                        {documentFile ? documentFile.name : "Click to select a document"}
                      </div>
                      <div style={{color: "#6b7280", fontSize: "0.75rem"}}>
                        Any file type is supported for testing (PDF, Image, DOC)
                      </div>
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
                    {loading ? <><Loader2 size={18} className="animate-spin"/>Submitting…</> : "Submit Registration"}
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
