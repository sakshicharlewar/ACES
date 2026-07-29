import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { adminLogin } from "./adminApi";
import { Shield, Eye, EyeOff, Loader2 } from "lucide-react";

export function AdminLogin() {
  const navigate = useNavigate();
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [showPw,   setShowPw]   = useState(false);
  const [loading,  setLoading]  = useState(false);
  const [error,    setError]    = useState("");

  async function handleSubmit(e) {
    e.preventDefault();
    setError("");
    if (!username.trim() || !password.trim()) {
      setError("Please enter username and password.");
      return;
    }
    setLoading(true);
    try {
      await adminLogin(username.trim(), password.trim());
      navigate("/admin/dashboard", { replace: true });
    } catch (err) {
      setError(err.message || "Invalid Username or Password");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen bg-[#0a0f1e] flex items-center justify-center px-4"
         style={{ fontFamily: "'Inter', 'Arial', sans-serif" }}>

      {/* Background glow */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-1/3 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[400px] bg-blue-600/10 rounded-full blur-3xl" />
      </div>

      <div className="relative w-full max-w-md">
        {/* Card */}
        <div className="bg-[#0d1426] border border-white/10 rounded-2xl shadow-2xl shadow-black/50 overflow-hidden">

          {/* Header */}
          <div className="bg-gradient-to-r from-blue-700 to-blue-600 px-8 py-8 text-center">
            <div className="w-14 h-14 bg-white/15 rounded-2xl flex items-center justify-center mx-auto mb-4 backdrop-blur">
              <Shield className="w-7 h-7 text-white" />
            </div>
            <h1 className="text-white text-2xl font-bold tracking-tight">Admin Login</h1>
            <p className="text-blue-200 text-sm mt-1">ACES Control Panel</p>
          </div>

          {/* Form */}
          <form onSubmit={handleSubmit} className="px-8 py-8 space-y-5">
            {/* Error */}
            {error && (
              <div className="bg-red-500/10 border border-red-500/30 text-red-400 text-sm px-4 py-3 rounded-xl text-center">
                {error}
              </div>
            )}

            {/* Username */}
            <div className="space-y-2">
              <label className="text-white/60 text-xs font-medium uppercase tracking-wider">
                Username
              </label>
              <input
                id="admin-username"
                type="text"
                autoComplete="username"
                value={username}
                onChange={e => setUsername(e.target.value)}
                placeholder="Enter username"
                className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white placeholder-white/25 text-sm
                           focus:outline-none focus:border-blue-500 focus:bg-white/8 transition-all duration-200"
              />
            </div>

            {/* Password */}
            <div className="space-y-2">
              <label className="text-white/60 text-xs font-medium uppercase tracking-wider">
                Password
              </label>
              <div className="relative">
                <input
                  id="admin-password"
                  type={showPw ? "text" : "password"}
                  autoComplete="current-password"
                  value={password}
                  onChange={e => setPassword(e.target.value)}
                  placeholder="Enter password"
                  className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 pr-12 text-white placeholder-white/25 text-sm
                             focus:outline-none focus:border-blue-500 focus:bg-white/8 transition-all duration-200"
                />
                <button
                  type="button"
                  onClick={() => setShowPw(p => !p)}
                  className="absolute right-4 top-1/2 -translate-y-1/2 text-white/30 hover:text-white/70 transition-colors"
                >
                  {showPw ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            {/* Submit */}
            <button
              id="admin-login-btn"
              type="submit"
              disabled={loading}
              className="w-full bg-blue-600 hover:bg-blue-500 disabled:bg-blue-800 disabled:cursor-not-allowed
                         text-white font-semibold py-3 rounded-xl text-sm transition-all duration-200
                         flex items-center justify-center gap-2 shadow-lg shadow-blue-600/20 mt-2"
            >
              {loading ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  Verifying…
                </>
              ) : (
                "Login to Admin Panel"
              )}
            </button>
          </form>
        </div>

        <p className="text-center text-white/20 text-xs mt-6">
          ACES SCET — Restricted Access
        </p>
      </div>
    </div>
  );
}
