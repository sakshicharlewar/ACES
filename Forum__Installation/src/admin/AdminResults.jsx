import { useState, useEffect } from "react";
import { AdminLayout } from "./AdminLayout";
import { fetchAdminEvents, fetchEventResult, saveEventResult, updateResultStatus } from "./adminApi";
import { Trophy, Save, CheckCircle, Clock, ChevronDown, Loader2, AlertCircle } from "lucide-react";

const InputField = ({ label, value, onChange, placeholder, textarea, type = "text" }) => (
  <div>
    <label className="block text-sm font-medium text-white/70 mb-1">{label}</label>
    {textarea ? (
      <textarea value={value} onChange={e => onChange(e.target.value)} placeholder={placeholder}
        className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-2.5 text-white text-sm focus:border-blue-500 focus:outline-none resize-none h-20" />
    ) : (
      <input type={type} value={value} onChange={e => onChange(e.target.value)} placeholder={placeholder}
        className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-2.5 text-white text-sm focus:border-blue-500 focus:outline-none [&::-webkit-calendar-picker-indicator]:invert" />
    )}
  </div>
);

export default function AdminResults() {
  const [events, setEvents] = useState([]);
  const [selectedEventId, setSelectedEventId] = useState("");
  const [result, setResult] = useState(null);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState("");
  const [form, setForm] = useState({
    winner: "", winner_details: "",
    runner_up: "", runner_up_details: "",
    second_runner_up: "", second_runner_up_details: "",
    announcement_date: "",
  });

  useEffect(() => {
    fetchAdminEvents().then(data => {
      const list = Array.isArray(data) ? data : (data.items || []);
      setEvents(list);
      if (list.length > 0) setSelectedEventId(String(list[0].id));
    });
  }, []);

  useEffect(() => {
    if (!selectedEventId) return;
    setLoading(true);
    setError("");
    fetchEventResult(selectedEventId)
      .then(res => {
        if (res) {
          setResult(res);
          setForm({
            winner: res.winner || "", winner_details: res.winner_details || "",
            runner_up: res.runner_up || "", runner_up_details: res.runner_up_details || "",
            second_runner_up: res.second_runner_up || "", second_runner_up_details: res.second_runner_up_details || "",
            announcement_date: res.announcement_date || "",
          });
        } else {
          setResult(null);
          setForm({ winner: "", winner_details: "", runner_up: "", runner_up_details: "", second_runner_up: "", second_runner_up_details: "", announcement_date: "" });
        }
      })
      .catch(() => setResult(null))
      .finally(() => setLoading(false));
  }, [selectedEventId]);

  const selectedEvent = events.find(e => String(e.id) === selectedEventId);

  async function handleSave() {
    if (!selectedEventId) return;
    setSaving(true);
    setError("");
    try {
      await saveEventResult(selectedEventId, form);
      setSaved(true);
      setTimeout(() => setSaved(false), 3000);
    } catch (e) {
      setError(e.message);
    } finally {
      setSaving(false);
    }
  }

  async function handleAnnounce(status) {
    if (!selectedEventId) return;
    try {
      await updateResultStatus(selectedEventId, status);
      setEvents(prev => prev.map(e => String(e.id) === selectedEventId ? { ...e, result_status: status } : e));
    } catch (e) {
      setError(e.message);
    }
  }

  return (
    <AdminLayout>
      <div className="space-y-6 max-w-3xl">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-white flex items-center gap-3"><Trophy className="w-6 h-6 text-amber-400" /> Result Management</h1>
            <p className="text-white/40 text-sm mt-1">Enter winners and control result announcements</p>
          </div>
        </div>

        {/* Event Selector */}
        <div className="bg-[#0d1426] border border-white/10 rounded-2xl p-5">
          <label className="block text-sm font-medium text-white/70 mb-2">Select Event</label>
          <div className="relative">
            <select
              value={selectedEventId} onChange={e => setSelectedEventId(e.target.value)}
              className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white text-sm focus:outline-none focus:border-blue-500 appearance-none"
            >
              {events.map(ev => <option key={ev.id} value={ev.id} className="bg-[#0d1426]">{ev.title}</option>)}
            </select>
            <ChevronDown className="absolute right-4 top-1/2 -translate-y-1/2 w-4 h-4 text-white/40 pointer-events-none" />
          </div>

          {selectedEvent && (
            <div className="mt-3 flex items-center gap-3">
              <span className={`text-xs px-2.5 py-1 rounded-full font-medium ${selectedEvent.result_status === "announced" ? "bg-green-500/20 text-green-400" : "bg-yellow-500/20 text-yellow-400"}`}>
                {selectedEvent.result_status === "announced" ? "✅ Result Announced" : "⏳ Result Pending"}
              </span>
              {selectedEvent.result_status !== "announced" ? (
                <button onClick={() => handleAnnounce("announced")} className="text-xs px-3 py-1 bg-green-600/20 hover:bg-green-600/40 text-green-400 rounded-lg transition-colors">
                  Mark as Announced
                </button>
              ) : (
                <button onClick={() => handleAnnounce("pending")} className="text-xs px-3 py-1 bg-yellow-600/20 hover:bg-yellow-600/40 text-yellow-400 rounded-lg transition-colors">
                  Revert to Pending
                </button>
              )}
            </div>
          )}
        </div>

        {error && (
          <div className="flex items-center gap-3 bg-red-500/10 border border-red-500/20 text-red-400 text-sm px-5 py-4 rounded-xl">
            <AlertCircle className="w-4 h-4 shrink-0" /> {error}
          </div>
        )}

        {loading ? (
          <div className="flex items-center justify-center py-12"><Loader2 className="w-6 h-6 animate-spin text-white/40" /></div>
        ) : (
          <div className="bg-[#0d1426] border border-white/10 rounded-2xl p-5 space-y-6">
            <h3 className="text-white font-semibold flex items-center gap-2"><Trophy className="w-4 h-4 text-amber-400" /> Winners</h3>

            {/* Winner */}
            <div className="p-4 rounded-xl border border-amber-500/20 bg-amber-500/5 space-y-3">
              <p className="text-amber-400 text-sm font-semibold">🥇 Winner</p>
              <InputField label="Team / Person Name" value={form.winner} onChange={v => setForm(f => ({ ...f, winner: v }))} placeholder="e.g. Team Alpha" />
              <InputField label="Details" value={form.winner_details} onChange={v => setForm(f => ({ ...f, winner_details: v }))} placeholder="Member names, prize details..." textarea />
            </div>

            {/* Runner Up */}
            <div className="p-4 rounded-xl border border-slate-500/20 bg-slate-500/5 space-y-3">
              <p className="text-slate-300 text-sm font-semibold">🥈 Runner Up</p>
              <InputField label="Team / Person Name" value={form.runner_up} onChange={v => setForm(f => ({ ...f, runner_up: v }))} placeholder="e.g. Team Beta" />
              <InputField label="Details" value={form.runner_up_details} onChange={v => setForm(f => ({ ...f, runner_up_details: v }))} placeholder="Details..." textarea />
            </div>

            {/* 2nd Runner Up */}
            <div className="p-4 rounded-xl border border-orange-500/20 bg-orange-500/5 space-y-3">
              <p className="text-orange-400 text-sm font-semibold">🥉 Second Runner Up</p>
              <InputField label="Team / Person Name" value={form.second_runner_up} onChange={v => setForm(f => ({ ...f, second_runner_up: v }))} placeholder="e.g. Team Gamma" />
              <InputField label="Details" value={form.second_runner_up_details} onChange={v => setForm(f => ({ ...f, second_runner_up_details: v }))} placeholder="Details..." textarea />
            </div>

            <InputField type="datetime-local" label="Announcement Date & Time" value={form.announcement_date} onChange={v => setForm(f => ({ ...f, announcement_date: v }))} />

            <button onClick={handleSave} disabled={saving} className="w-full flex items-center justify-center gap-2 py-3 rounded-xl bg-blue-600 hover:bg-blue-500 disabled:opacity-50 text-white font-semibold transition-colors shadow-lg shadow-blue-600/20">
              {saving ? <><Loader2 className="w-4 h-4 animate-spin" /> Saving…</> : saved ? <><CheckCircle className="w-4 h-4" /> Saved!</> : <><Save className="w-4 h-4" /> Save Results</>}
            </button>
          </div>
        )}
      </div>
    </AdminLayout>
  );
}
