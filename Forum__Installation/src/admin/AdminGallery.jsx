import { useState, useEffect, useRef } from "react";
import { AdminLayout } from "./AdminLayout";
import { fetchGalleryAlbums, createGalleryAlbum, updateGalleryAlbum, deleteGalleryAlbum, fetchAdminEvents } from "./adminApi";
import { ImageIcon, Plus, Trash2, Edit, X, Upload, Loader2, ChevronDown } from "lucide-react";

export default function AdminGallery() {
  const [albums, setAlbums] = useState([]);
  const [events, setEvents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);
  const [editAlbum, setEditAlbum] = useState(null);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [form, setForm] = useState({ album_name: "", description: "", event_id: "", is_public: true, images: [], cover_image: "" });
  const fileRef = useRef();

  useEffect(() => { loadAll(); }, []);

  async function loadAll() {
    setLoading(true);
    const [albs, evs] = await Promise.all([
      fetchGalleryAlbums().catch(() => []),
      fetchAdminEvents().catch(() => []),
    ]);
    setAlbums(Array.isArray(albs) ? albs : []);
    setEvents(Array.isArray(evs) ? evs : (evs.items || []));
    setLoading(false);
  }

  function openCreate() {
    setEditAlbum(null);
    setForm({ album_name: "", description: "", event_id: "", is_public: true, images: [], cover_image: "" });
    setError("");
    setModalOpen(true);
  }

  function openEdit(album) {
    setEditAlbum(album);
    setForm({
      album_name: album.album_name || "",
      description: album.description || "",
      event_id: album.event_id ? String(album.event_id) : "",
      is_public: album.is_public ?? true,
      images: album.images || [],
      cover_image: album.cover_image || "",
    });
    setError("");
    setModalOpen(true);
  }

  async function handleSave() {
    if (!form.album_name.trim()) { setError("Album name is required"); return; }
    setSaving(true);
    setError("");
    try {
      const payload = { ...form, event_id: form.event_id ? Number(form.event_id) : null };
      if (editAlbum) {
        await updateGalleryAlbum(editAlbum.id, payload);
      } else {
        await createGalleryAlbum(payload);
      }
      setModalOpen(false);
      loadAll();
    } catch (e) {
      setError(e.message);
    } finally {
      setSaving(false);
    }
  }

  async function handleDelete(id) {
    if (!window.confirm("Delete this album?")) return;
    await deleteGalleryAlbum(id);
    loadAll();
  }

  function handleImageUpload(e) {
    const files = Array.from(e.target.files);
    files.forEach(file => {
      const reader = new FileReader();
      reader.onloadend = () => {
        setForm(f => ({ ...f, images: [...f.images, reader.result], cover_image: f.cover_image || reader.result }));
      };
      reader.readAsDataURL(file);
    });
  }

  function removeImage(idx) {
    setForm(f => {
      const imgs = f.images.filter((_, i) => i !== idx);
      return { ...f, images: imgs, cover_image: imgs[0] || "" };
    });
  }

  return (
    <AdminLayout>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-white flex items-center gap-3"><ImageIcon className="w-6 h-6 text-purple-400" /> Gallery</h1>
            <p className="text-white/40 text-sm mt-1">Manage photo albums and event galleries</p>
          </div>
          <button onClick={openCreate} className="flex items-center gap-2 px-4 py-2.5 bg-blue-600 hover:bg-blue-500 text-white text-sm font-medium rounded-xl transition-colors shadow-lg shadow-blue-600/20">
            <Plus className="w-4 h-4" /> New Album
          </button>
        </div>

        {loading ? (
          <div className="flex items-center justify-center py-20"><Loader2 className="w-6 h-6 animate-spin text-white/40" /></div>
        ) : albums.length === 0 ? (
          <div className="text-center py-20 text-white/30">
            <ImageIcon className="w-12 h-12 mx-auto mb-4 opacity-30" />
            <p>No albums yet. Create your first gallery album.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-5">
            {albums.map(album => (
              <div key={album.id} className="bg-[#0d1426] border border-white/10 rounded-2xl overflow-hidden group hover:border-white/20 transition-all">
                <div className="aspect-video bg-white/5 relative overflow-hidden">
                  {album.cover_image ? (
                    <img src={album.cover_image} alt={album.album_name} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center text-white/20">
                      <ImageIcon className="w-10 h-10" />
                    </div>
                  )}
                  <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent" />
                  <div className="absolute bottom-3 left-3 right-3 flex items-end justify-between">
                    <div>
                      <p className="text-white font-semibold text-sm truncate">{album.album_name}</p>
                      <p className="text-white/60 text-xs">{(album.images || []).length} photos</p>
                    </div>
                    <span className={`text-[10px] px-2 py-0.5 rounded-full ${album.is_public ? "bg-green-500/30 text-green-300" : "bg-gray-500/30 text-gray-300"}`}>
                      {album.is_public ? "Public" : "Private"}
                    </span>
                  </div>
                </div>
                <div className="p-3 flex gap-2">
                  <button onClick={() => openEdit(album)} className="flex-1 flex items-center justify-center gap-1.5 py-2 text-xs font-medium text-white/60 hover:text-white bg-white/5 hover:bg-white/10 rounded-lg transition-colors">
                    <Edit className="w-3.5 h-3.5" /> Edit
                  </button>
                  <button onClick={() => handleDelete(album.id)} className="flex-1 flex items-center justify-center gap-1.5 py-2 text-xs font-medium text-red-400/70 hover:text-red-400 bg-red-500/5 hover:bg-red-500/10 rounded-lg transition-colors">
                    <Trash2 className="w-3.5 h-3.5" /> Delete
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Modal */}
      {modalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm px-4 py-8">
          <div className="bg-[#0d1426] border border-white/10 rounded-2xl shadow-2xl w-full max-w-lg overflow-hidden">
            <div className="flex items-center justify-between px-6 py-4 border-b border-white/10">
              <h2 className="text-white font-bold">{editAlbum ? "Edit Album" : "Create Album"}</h2>
              <button onClick={() => setModalOpen(false)} className="text-white/40 hover:text-white"><X className="w-5 h-5" /></button>
            </div>
            <div className="p-6 space-y-4 max-h-[70vh] overflow-y-auto">
              {error && <div className="text-red-400 text-sm bg-red-500/10 border border-red-500/20 rounded-xl px-4 py-3">{error}</div>}
              <div>
                <label className="block text-sm font-medium text-white/70 mb-1">Album Name *</label>
                <input type="text" value={form.album_name} onChange={e => setForm(f => ({ ...f, album_name: e.target.value }))} className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-2.5 text-white text-sm focus:border-blue-500 focus:outline-none" />
              </div>
              <div>
                <label className="block text-sm font-medium text-white/70 mb-1">Link to Event (optional)</label>
                <div className="relative">
                  <select value={form.event_id} onChange={e => setForm(f => ({ ...f, event_id: e.target.value }))} className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-2.5 text-white text-sm focus:outline-none focus:border-blue-500 appearance-none">
                    <option value="" className="bg-[#0d1426]">No event</option>
                    {events.map(ev => <option key={ev.id} value={ev.id} className="bg-[#0d1426]">{ev.title}</option>)}
                  </select>
                  <ChevronDown className="absolute right-4 top-1/2 -translate-y-1/2 w-4 h-4 text-white/40 pointer-events-none" />
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-white/70 mb-1">Description</label>
                <textarea value={form.description} onChange={e => setForm(f => ({ ...f, description: e.target.value }))} className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-2.5 text-white text-sm focus:border-blue-500 focus:outline-none resize-none h-20" />
              </div>
              <div>
                <label className="block text-sm font-medium text-white/70 mb-2">Upload Photos</label>
                <input ref={fileRef} type="file" accept="image/*" multiple onChange={handleImageUpload} className="hidden" />
                <button onClick={() => fileRef.current?.click()} className="w-full border-2 border-dashed border-white/20 rounded-xl p-6 text-white/40 hover:text-white/70 hover:border-white/40 transition-colors flex flex-col items-center gap-2">
                  <Upload className="w-6 h-6" />
                  <span className="text-sm">Click to upload images (multiple allowed)</span>
                </button>
                {form.images.length > 0 && (
                  <div className="grid grid-cols-4 gap-2 mt-3">
                    {form.images.map((img, idx) => (
                      <div key={idx} className="relative aspect-square rounded-lg overflow-hidden bg-white/5 group">
                        <img src={img} alt="" className="w-full h-full object-cover" />
                        <button onClick={() => removeImage(idx)} className="absolute top-1 right-1 w-5 h-5 bg-red-500 rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                          <X className="w-3 h-3 text-white" />
                        </button>
                        {idx === 0 && <span className="absolute bottom-1 left-1 text-[9px] bg-blue-500 text-white px-1 rounded">Cover</span>}
                      </div>
                    ))}
                  </div>
                )}
              </div>
              <label className="flex items-center gap-3 cursor-pointer">
                <input type="checkbox" checked={form.is_public} onChange={e => setForm(f => ({ ...f, is_public: e.target.checked }))} className="w-4 h-4 rounded border-white/20 bg-white/5 text-blue-600" />
                <span className="text-sm text-white/70">Public (visible on website)</span>
              </label>
            </div>
            <div className="px-6 py-4 border-t border-white/10 flex justify-end gap-3">
              <button onClick={() => setModalOpen(false)} className="px-4 py-2 text-sm text-white/60 hover:text-white bg-white/5 hover:bg-white/10 rounded-xl transition-colors">Cancel</button>
              <button onClick={handleSave} disabled={saving} className="px-4 py-2 text-sm text-white bg-blue-600 hover:bg-blue-500 disabled:opacity-50 rounded-xl transition-colors flex items-center gap-2">
                {saving ? <><Loader2 className="w-4 h-4 animate-spin" /> Saving…</> : "Save Album"}
              </button>
            </div>
          </div>
        </div>
      )}
    </AdminLayout>
  );
}
