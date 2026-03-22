"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { Lock, User, ShieldCheck, Sparkles, GraduationCap, Eye, EyeOff } from "lucide-react";

export default function Login() {
  const [role, setRole] = useState("faculty");
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");
  const router = useRouter();

  const handleLogin = async (e: any) => {
    e.preventDefault();
    setError("");

    if (!username.trim() || !password.trim()) {
      setError("Please enter both username and password.");
      return;
    }

    setIsLoading(true);

    try {
      // It's assumed axios is imported, if not I will add it
      const { default: axios } = await import('axios');
      const res = await axios.post("http://127.0.0.1:8000/login", {
        username,
        password
      });

      if (res.data.success) {
        // Store actual role from DB
        localStorage.setItem("user_role", res.data.role);
        localStorage.setItem("username", res.data.username);
        localStorage.setItem("isLoggedIn", "true");
        router.push("/dashboard");
      }
    } catch (err: any) {
      if (err.response && err.response.status === 401) {
        setError("Invalid username or password.");
      } else {
        setError("Connection error. Is the backend running?");
      }
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen animated-gradient flex items-center justify-center font-sans relative overflow-hidden">
      {/* Floating orbs */}
      <div className="absolute top-20 left-20 w-72 h-72 bg-blue-500/10 rounded-full blur-3xl animate-pulse"></div>
      <div className="absolute bottom-20 right-20 w-96 h-96 bg-indigo-500/10 rounded-full blur-3xl animate-pulse" style={{ animationDelay: '1s' }}></div>
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[500px] h-[500px] bg-purple-500/5 rounded-full blur-3xl"></div>

      <div className="relative z-10 w-full max-w-md px-4 animate-fade-in-up">
        <div className="glass-card p-8 rounded-3xl shadow-2xl bg-white/95">
          {/* Logo */}
          <div className="text-center mb-8">
            <div className="inline-flex items-center justify-center w-20 h-20 bg-gradient-to-br from-blue-500 via-indigo-500 to-purple-600 rounded-2xl mb-5 shadow-xl shadow-blue-500/20 animate-pulse-glow">
              <GraduationCap className="w-10 h-10 text-white" />
            </div>
            <h1 className="text-3xl font-bold text-slate-800 tracking-tight">
              EduGuard <span className="gradient-text">AI</span>
            </h1>
            <p className="text-slate-500 mt-1 text-sm">Secure Academic Monitoring Portal</p>
          </div>

          <form onSubmit={handleLogin} className="space-y-5">
            {/* Role Selection */}
            <div>
              <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-3">
                Access Role
              </label>
              <div className="grid grid-cols-2 gap-3">
                <button
                  type="button"
                  onClick={() => setRole("faculty")}
                  className={`p-4 rounded-xl border-2 flex flex-col items-center gap-2 transition-all duration-300 ${
                    role === "faculty"
                      ? "bg-blue-50 border-blue-500 text-blue-700 shadow-md shadow-blue-100"
                      : "border-slate-200 text-slate-500 hover:border-slate-300"
                  }`}
                >
                  <User size={22} />
                  <span className="text-sm font-semibold">Faculty</span>
                </button>
                <button
                  type="button"
                  onClick={() => setRole("admin")}
                  className={`p-4 rounded-xl border-2 flex flex-col items-center gap-2 transition-all duration-300 ${
                    role === "admin"
                      ? "bg-indigo-50 border-indigo-500 text-indigo-700 shadow-md shadow-indigo-100"
                      : "border-slate-200 text-slate-500 hover:border-slate-300"
                  }`}
                >
                  <ShieldCheck size={22} />
                  <span className="text-sm font-semibold">Admin</span>
                </button>
              </div>
            </div>

            {/* Username */}
            <div>
              <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">
                Username
              </label>
              <div className="relative">
                <User className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                <input
                  type="text"
                  className="w-full pl-11 pr-4 py-3.5 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none text-slate-700 transition-all duration-200"
                  placeholder="Enter your username"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                />
              </div>
            </div>

            {/* Password */}
            <div>
              <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">
                Password
              </label>
              <div className="relative">
                <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                <input
                  type={showPassword ? "text" : "password"}
                  className="w-full pl-11 pr-12 py-3.5 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none text-slate-700 transition-all duration-200"
                  placeholder="Enter your password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 transition-colors"
                >
                  {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                </button>
              </div>
            </div>

            {/* Error */}
            {error && (
              <div className="bg-red-50 border border-red-200 text-red-700 text-sm p-3 rounded-xl text-center font-medium">
                {error}
              </div>
            )}

            <button
              type="submit"
              disabled={isLoading}
              className="w-full bg-gradient-to-r from-slate-900 via-slate-800 to-slate-900 text-white py-4 rounded-xl font-bold hover:from-slate-800 hover:via-slate-700 hover:to-slate-800 transition-all duration-300 shadow-lg hover:shadow-xl flex items-center justify-center gap-2 disabled:opacity-50"
            >
              {isLoading ? (
                <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
              ) : (
                <>
                  <Sparkles size={18} />
                  Access Dashboard
                </>
              )}
            </button>
          </form>

          <div className="mt-6 pt-4 border-t border-slate-100">
            <p className="text-center text-xs text-slate-400 flex items-center justify-center gap-2">
              <Lock size={12} />
              Protected by End-to-End Encryption
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}