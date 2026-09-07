import { useEffect, useState } from "react";
import { useParams, useNavigate, Link } from "react-router-dom";
import { AdminLayout } from "./AdminLayout";
import { fetchSubmission, deleteSubmission, updateSubmissionStatus } from "./adminApi";
import {
  ArrowLeft, Trash2, Loader2, AlertCircle,
  User, Mail, Phone, Building2, Calendar,
  Lightbulb, FileText, Globe, Paperclip, Eye
} from "lucide-react";
import { ImagePreviewModal } from "../components/ui/ImagePreviewModal";

function DetailRow({ icon: Icon, label, value }) {
  if (!value) return null;
  return (
    <div className="flex gap-4 py-4 border-b border-white/5 last:border-0">
      <div className="w-8 h-8 rounded-lg bg-white/5 flex items-center justify-center shrink-0 mt-0.5">
        <Icon className="w-4 h-4 text-white/40" />
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-white/40 text-xs uppercase tracking-wider mb-1">{label}</p>
        <p className="text-white text-sm leading-relaxed whitespace-pre-wrap break-words">{value}</p>
      </div>
    </div>
  );
}

function fmt(d) {
  if (!d) return "—";
  return new Date(d).toLocaleString("en-IN", {
    day: "2-digit", month: "long", year: "numeric",
    hour: "2-digit", minute: "2-digit",
  });
}

export function AdminSubmissionDetail() {
  const { id }     = useParams();
  const navigate   = useNavigate();
  const [sub,      setSub]      = useState(null);
  const [loading,  setLoading]  = useState(true);
  const [error,    setError]    = useState("");
  const [showDel,  setShowDel]  = useState(false);
  const [delLoading, setDelLoading] = useState(false);

  // Review states
  const [status, setStatus] = useState("");
  const [adminRemarks, setAdminRemarks] = useState("");
  const [saveLoading, setSaveLoading] = useState(false);
  
  // Modal state
  const [previewModal, setPreviewModal] = useState(null);

  useEffect(() => {
    fetchSubmission(id)
      .then((data) => {
        setSub(data);
        setStatus(data.status || "Pending Review");
        setAdminRemarks(data.admin_remarks || "");
      })
      .catch(e => setError(e.message))
      .finally(() => setLoading(false));
  }, [id]);

  async function handleSaveReview() {
    setSaveLoading(true);
    try {
      await updateSubmissionStatus(id, status, adminRemarks);
      alert("Review updated successfully!");
    } catch (e) {
      alert(e.message);
    } finally {
      setSaveLoading(false);
    }
  }

  async function handleDelete() {
    setDelLoading(true);
    try {
      await deleteSubmission(id);
      navigate("/admin/submissions", { replace: true });
    } catch (e) {
      alert(e.message);
      setDelLoading(false);
    }
  }

  return (
    <AdminLayout>
      <div className="max-w-3xl mx-auto space-y-6">
        {/* Back + actions */}
        <div className="flex items-center justify-between gap-4">
          <Link
            to="/admin/submissions"
            className="flex items-center gap-2 text-white/50 hover:text-white text-sm transition-colors"
          >
            <ArrowLeft className="w-4 h-4" /> Back to Submissions
          </Link>
          {sub && (
            <button
              onClick={() => setShowDel(true)}
              className="flex items-center gap-2 px-4 py-2 bg-red-600/20 hover:bg-red-600/40 text-red-400 rounded-xl text-sm font-medium transition-colors"
            >
              <Trash2 className="w-4 h-4" /> Delete
            </button>
          )}
        </div>

        {/* Error */}
        {error && (
          <div className="flex items-center gap-3 bg-red-500/10 border border-red-500/20 text-red-400 text-sm px-5 py-4 rounded-xl">
            <AlertCircle className="w-4 h-4 shrink-0" /> {error}
          </div>
        )}

        {/* Loading */}
        {loading && (
          <div className="flex items-center justify-center py-24">
            <Loader2 className="w-8 h-8 text-blue-400 animate-spin" />
          </div>
        )}

        {/* Content */}
        {sub && (
          <>
            {/* Header card */}
            <div className="bg-gradient-to-r from-blue-700 to-blue-600 rounded-2xl p-6 shadow-xl shadow-blue-600/20">
              <div className="flex items-start gap-4">
                <div className="w-12 h-12 bg-white/20 rounded-xl flex items-center justify-center shrink-0">
                  <Lightbulb className="w-6 h-6 text-white" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-blue-200 text-xs uppercase tracking-wider mb-1">Submission #{sub.id}</p>
                  <h1 className="text-white text-xl font-bold leading-tight break-words">{sub.idea_title}</h1>
                  <p className="text-blue-200 text-sm mt-1">{sub.category} · {fmt(sub.submitted_at)}</p>
                </div>
              </div>
            </div>

            {/* Detail sections */}
            <div className="bg-[#0d1426] border border-white/10 rounded-2xl overflow-hidden">
              <div className="px-6 py-4 border-b border-white/10">
                <h2 className="text-white font-semibold text-sm">Applicant Details</h2>
              </div>
              <div className="px-6">
                <DetailRow icon={User}     label="Full Name"   value={sub.full_name} />
                <DetailRow icon={Mail}     label="Email"       value={sub.email} />
                <DetailRow icon={Phone}    label="Mobile"      value={sub.mobile} />
                <DetailRow icon={Building2}label="Department"  value={sub.department} />
                <DetailRow icon={Calendar} label="Year"        value={sub.year} />
              </div>
            </div>

            <div className="bg-[#0d1426] border border-white/10 rounded-2xl overflow-hidden">
              <div className="px-6 py-4 border-b border-white/10">
                <h2 className="text-white font-semibold text-sm">Idea Details</h2>
              </div>
              <div className="px-6">
                <DetailRow icon={Lightbulb} label="Idea Title"       value={sub.idea_title} />
                <DetailRow icon={FileText}  label="Idea Description" value={sub.idea_description} />
                <DetailRow icon={FileText}  label="Expected Outcome" value={sub.expected_outcome} />
              </div>
            </div>

            {(sub.attachment_name) && (
              <div className="bg-[#0d1426] border border-white/10 rounded-2xl overflow-hidden">
                <div className="px-6 py-4 border-b border-white/10">
                  <h2 className="text-white font-semibold text-sm">Attachment</h2>
                </div>
                <div className="px-6 py-4 flex flex-col md:flex-row gap-6 items-start">
                  {sub.attachment_url && (
                    <div 
                      className="relative w-32 h-32 rounded-lg overflow-hidden border border-white/10 cursor-pointer group bg-black/20 flex-shrink-0 flex items-center justify-center"
                      onClick={() => setPreviewModal(sub.attachment_url)}
                    >
                      {(sub.attachment_url.startsWith("data:application/pdf") || sub.attachment_url.toLowerCase().endsWith(".pdf")) ? (
                        <div className="flex flex-col items-center justify-center text-white/50 group-hover:text-white transition-colors">
                          <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8 mb-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 21h10a2 2 0 002-2V9.414a1 1 0 00-.293-.707l-5.414-5.414A1 1 0 0012.586 3H7a2 2 0 00-2 2v14a2 2 0 002 2z" />
                          </svg>
                          <span className="text-[10px] font-medium uppercase">View PDF</span>
                        </div>
                      ) : (
                        <>
                          <img 
                            src={sub.attachment_url} 
                            alt="Attachment Preview" 
                            className="w-full h-full object-contain group-hover:scale-105 transition-transform duration-300" 
                          />
                          <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                            <Eye className="text-white w-6 h-6" />
                          </div>
                        </>
                      )}
                    </div>
                  )}
                  <div className="flex-1 w-full">
                    <DetailRow icon={Paperclip} label="File Name" value={sub.attachment_name} />
                    <DetailRow icon={Paperclip} label="File Type" value={sub.attachment_type} />
                  </div>
                </div>
              </div>
            )}

            {/* Review & Decision Section */}
            <div className="bg-[#0d1426] border border-white/10 rounded-2xl overflow-hidden">
              <div className="px-6 py-4 border-b border-white/10 flex items-center justify-between">
                <h2 className="text-white font-semibold text-sm">Review & Decision</h2>
                <button
                  onClick={handleSaveReview}
                  disabled={saveLoading}
                  className="px-4 py-1.5 bg-blue-600 hover:bg-blue-500 disabled:opacity-50 text-white rounded-lg text-xs font-medium flex items-center gap-2 transition-colors"
                >
                  {saveLoading && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
                  Save Changes
                </button>
              </div>
              <div className="p-6 space-y-6">
                <div>
                  <label className="block text-white/40 text-xs uppercase tracking-wider mb-2">Status</label>
                  <select
                    value={status}
                    onChange={(e) => setStatus(e.target.value)}
                    className="w-full sm:w-1/2 bg-white/5 border border-white/10 rounded-xl px-4 py-2.5 text-white text-sm focus:outline-none focus:border-blue-500 transition-colors"
                  >
                    <option value="Pending Review" className="bg-[#0d1426]">Pending Review</option>
                    <option value="Approved" className="bg-[#0d1426]">Approved</option>
                    <option value="Rejected" className="bg-[#0d1426]">Rejected</option>
                  </select>
                </div>
                <div>
                  <label className="block text-white/40 text-xs uppercase tracking-wider mb-2">Admin Remarks (Optional)</label>
                  <textarea
                    value={adminRemarks}
                    onChange={(e) => setAdminRemarks(e.target.value)}
                    placeholder="Add notes, feedback, or reasons for rejection..."
                    className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white text-sm focus:outline-none focus:border-blue-500 transition-colors resize-none h-32"
                  />
                </div>
              </div>
            </div>

            <div className="bg-[#0d1426] border border-white/10 rounded-2xl overflow-hidden">
              <div className="px-6 py-4 border-b border-white/10">
                <h2 className="text-white font-semibold text-sm">System Info</h2>
              </div>
              <div className="px-6">
                <DetailRow icon={Globe}    label="IP Address"  value={sub.ip_address} />
                <DetailRow icon={Globe}    label="User Agent"  value={sub.user_agent} />
                <DetailRow icon={Calendar} label="Submitted At" value={fmt(sub.submitted_at)} />
              </div>
            </div>
          </>
        )}
      </div>

      {/* Delete Modal */}
      {showDel && (
        <div className="fixed inset-0 z-50 flex items-center justify-center px-4 bg-black/70 backdrop-blur-sm">
          <div className="bg-[#0d1426] border border-white/10 rounded-2xl p-8 max-w-sm w-full shadow-2xl text-center space-y-6">
            <div className="w-14 h-14 bg-red-500/15 rounded-2xl flex items-center justify-center mx-auto">
              <Trash2 className="w-6 h-6 text-red-400" />
            </div>
            <div>
              <h3 className="text-white font-bold text-lg">Delete Submission?</h3>
              <p className="text-white/50 text-sm mt-2">
                This action cannot be undone. The record will be permanently removed.
              </p>
            </div>
            <div className="flex gap-3">
              <button
                onClick={() => setShowDel(false)}
                disabled={delLoading}
                className="flex-1 py-2.5 rounded-xl bg-white/5 hover:bg-white/10 text-white/70 text-sm font-medium transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleDelete}
                disabled={delLoading}
                className="flex-1 py-2.5 rounded-xl bg-red-600 hover:bg-red-500 disabled:opacity-60 text-white text-sm font-medium transition-colors flex items-center justify-center gap-2"
              >
                {delLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Trash2 className="w-4 h-4" />}
                Delete
              </button>
            </div>
          </div>
        </div>
      )}
      {/* Image Preview Modal */}
      <ImagePreviewModal
        isOpen={!!previewModal}
        onClose={() => setPreviewModal(null)}
        imageUrl={previewModal}
        altText="Innovation Box Attachment"
      />
    </AdminLayout>
  );
}
