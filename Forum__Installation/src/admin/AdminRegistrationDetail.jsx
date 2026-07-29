import { useEffect, useState } from "react";
import { useParams, useNavigate, Link } from "react-router-dom";
import { AdminLayout } from "./AdminLayout";
import { fetchRegistration, deleteRegistration } from "./adminApi";
import {
  ArrowLeft, Trash2, Loader2, AlertCircle,
  User, Mail, Phone, Building2, Calendar,
  Ticket,
} from "lucide-react";

function DetailRow({ icon: Icon, label, value }) {
  if (!value) return null;
  return (
    <div className="flex gap-4 py-4 border-b border-white/5 last:border-0">
      <div className="w-8 h-8 rounded-lg bg-white/5 flex items-center justify-center shrink-0 mt-0.5">
        <Icon className="w-4 h-4 text-white/40" />
      </div>
      <div>
        <p className="text-white/40 text-xs uppercase tracking-wider mb-1">{label}</p>
        <p className="text-white text-sm">{value}</p>
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

export function AdminRegistrationDetail() {
  const { id }     = useParams();
  const navigate   = useNavigate();
  const [reg,      setReg]      = useState(null);
  const [loading,  setLoading]  = useState(true);
  const [error,    setError]    = useState("");
  const [showDel,  setShowDel]  = useState(false);
  const [delLoading, setDelLoading] = useState(false);

  useEffect(() => {
    fetchRegistration(id)
      .then(setReg)
      .catch(e => setError(e.message))
      .finally(() => setLoading(false));
  }, [id]);

  async function handleDelete() {
    setDelLoading(true);
    try {
      await deleteRegistration(id);
      navigate("/admin/registrations", { replace: true });
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
            to="/admin/registrations"
            className="flex items-center gap-2 text-white/50 hover:text-white text-sm transition-colors"
          >
            <ArrowLeft className="w-4 h-4" /> Back to Registrations
          </Link>
          {reg && (
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
            <Loader2 className="w-8 h-8 text-purple-400 animate-spin" />
          </div>
        )}

        {/* Content */}
        {reg && (
          <>
            {/* Header */}
            <div className="bg-gradient-to-r from-purple-700 to-purple-600 rounded-2xl p-6 shadow-xl shadow-purple-600/20">
              <div className="flex items-start gap-4">
                <div className="w-12 h-12 bg-white/20 rounded-xl flex items-center justify-center shrink-0">
                  <Ticket className="w-6 h-6 text-white" />
                </div>
                <div>
                  <p className="text-purple-200 text-xs uppercase tracking-wider mb-1">Registration #{reg.id}</p>
                  <h1 className="text-white text-xl font-bold">{reg.full_name}</h1>
                  <p className="text-purple-200 text-sm mt-1">{reg.event_title} · {fmt(reg.created_at)}</p>
                </div>
              </div>
            </div>

            {/* Details */}
            <div className="bg-[#0d1426] border border-white/10 rounded-2xl overflow-hidden">
              <div className="px-6 py-4 border-b border-white/10">
                <h2 className="text-white font-semibold text-sm">Registration Details</h2>
              </div>
              <div className="px-6">
                <DetailRow icon={User}      label="Full Name"    value={reg.full_name} />
                <DetailRow icon={Mail}      label="Email"        value={reg.email} />
                <DetailRow icon={Phone}     label="Mobile"       value={reg.mobile} />
                <DetailRow icon={Building2} label="Department"   value={reg.department} />
                <DetailRow icon={Calendar}  label="Year"         value={reg.year} />
                <DetailRow icon={Ticket}    label="Event"        value={`${reg.event_title} (ID: ${reg.event_id})`} />
                <DetailRow icon={Calendar}  label="Registered At" value={fmt(reg.created_at)} />
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
              <h3 className="text-white font-bold text-lg">Delete Registration?</h3>
              <p className="text-white/50 text-sm mt-2">This cannot be undone.</p>
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
    </AdminLayout>
  );
}
