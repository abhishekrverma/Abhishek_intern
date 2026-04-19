"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import {
  UserPlus, Lock, Mail, User, ShieldCheck, Eye, EyeOff,
  Sparkles, GraduationCap, CheckCircle, AlertCircle
} from "lucide-react";

export default function Signup() {
  const [formData, setFormData] = useState({
    username: "",
    email: "",
    password: "",
    confirmPassword: "",
  });
  const [role, setRole] = useState("faculty");
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const router = useRouter();

  const handleChange = (e: any) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
    setError("");
  };

  const handleSignup = async (e: any) => {
    e.preventDefault();
    setError("");
    setSuccess("");

    // Client-side validation
    if (formData.username.trim().length < 3) {
      setError("Username must be at least 3 characters.");
      return;
    }
    if (!formData.email.includes("@")) {
      setError("Please enter a valid email address.");
      return;
    }
    if (formData.password.length < 6) {
      setError("Password must be at least 6 characters.");
      return;
    }
    if (formData.password !== formData.confirmPassword) {
      setError("Passwords do not match.");
      return;
    }

    setIsLoading(true);

    try {
      const { default: axios } = await import("axios");
      const res = await axios.post("http://127.0.0.1:8000/signup", {
        username: formData.username.trim(),
        email: formData.email.trim(),
        password: formData.password,
        role: role,
      });

      if (res.data.success) {
        setSuccess("Account created successfully! Redirecting to login...");
        setTimeout(() => router.push("/login"), 1500);
      }
    } catch (err: any) {
      if (err.response && err.response.data?.detail) {
        setError(err.response.data.detail);
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
      <div className="absolute top-20 left-20 w-72 h-72 bg-purple-500/10 rounded-full blur-3xl animate-pulse"></div>
      <div className="absolute bottom-20 right-20 w-96 h-96 bg-blue-500/10 rounded-full blur-3xl animate-pulse" style={{ animationDelay: "1s" }}></div>
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[500px] h-[500px] bg-indigo-500/5 rounded-full blur-3xl"></div>

      <div className="relative z-10 w-full max-w-md px-4 animate-fade-in-up">
        <div className="glass-card p-8 rounded-3xl shadow-2xl bg-white/95">
          {/* Logo */}
          <div className="text-center mb-6">
            <div className="inline-flex items-center justify-center w-20 h-20 bg-gradient-to-br from-purple-500 via-indigo-500 to-blue-600 rounded-2xl mb-4 shadow-xl shadow-purple-500/20 animate-pulse-glow">
              <UserPlus className="w-10 h-10 text-white" />
            </div>
            <h1 className="text-3xl font-bold text-slate-800 tracking-tight">
              Create <span className="gradient-text">Account</span>
            </h1>
            <p className="text-slate-500 mt-1 text-sm">Join the EduGuard AI Academic Monitoring System</p>
          </div>

          <form onSubmit={handleSignup} className="space-y-4">
            {/* Role Selection */}
            <div>
              <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">
                Your Role
              </label>
              <div className="grid grid-cols-2 gap-3">
                <button
                  type="button"
                  onClick={() => setRole("faculty")}
                  className={`p-3 rounded-xl border-2 flex flex-col items-center gap-1.5 transition-all duration-300 ${
                    role === "faculty"
                      ? "bg-blue-50 border-blue-500 text-blue-700 shadow-md shadow-blue-100"
                      : "border-slate-200 text-slate-500 hover:border-slate-300"
                  }`}
                >
                  <User size={20} />
                  <span className="text-sm font-semibold">Faculty</span>
                </button>
                <button
                  type="button"
                  onClick={() => setRole("admin")}
                  className={`p-3 rounded-xl border-2 flex flex-col items-center gap-1.5 transition-all duration-300 ${
                    role === "admin"
                      ? "bg-indigo-50 border-indigo-500 text-indigo-700 shadow-md shadow-indigo-100"
                      : "border-slate-200 text-slate-500 hover:border-slate-300"
                  }`}
                >
                  <ShieldCheck size={20} />
                  <span className="text-sm font-semibold">Admin</span>
                </button>
              </div>
            </div>

            {/* Username */}
            <div>
              <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1.5">
                Username
              </label>
              <div className="relative">
                <User className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                <input
                  type="text"
                  name="username"
                  className="w-full pl-11 pr-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none text-slate-700 transition-all duration-200"
                  placeholder="Choose a username"
                  value={formData.username}
                  onChange={handleChange}
                  required
                />
              </div>
            </div>

            {/* Email */}
            <div>
              <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1.5">
                Email Address
              </label>
              <div className="relative">
                <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                <input
                  type="email"
                  name="email"
                  className="w-full pl-11 pr-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none text-slate-700 transition-all duration-200"
                  placeholder="you@university.edu"
                  value={formData.email}
                  onChange={handleChange}
                  required
                />
              </div>
            </div>

            {/* Password */}
            <div>
              <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1.5">
                Password
              </label>
              <div className="relative">
                <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                <input
                  type={showPassword ? "text" : "password"}
                  name="password"
                  className="w-full pl-11 pr-12 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none text-slate-700 transition-all duration-200"
                  placeholder="Minimum 6 characters"
                  value={formData.password}
                  onChange={handleChange}
                  required
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

            {/* Confirm Password */}
            <div>
              <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1.5">
                Confirm Password
              </label>
              <div className="relative">
                <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                <input
                  type={showPassword ? "text" : "password"}
                  name="confirmPassword"
                  className="w-full pl-11 pr-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none text-slate-700 transition-all duration-200"
                  placeholder="Re-enter your password"
                  value={formData.confirmPassword}
                  onChange={handleChange}
                  required
                />
              </div>
              {formData.confirmPassword && formData.password !== formData.confirmPassword && (
                <p className="text-red-500 text-xs mt-1 font-medium flex items-center gap-1">
                  <AlertCircle size={12} /> Passwords do not match
                </p>
              )}
              {formData.confirmPassword && formData.password === formData.confirmPassword && formData.password.length >= 6 && (
                <p className="text-emerald-600 text-xs mt-1 font-medium flex items-center gap-1">
                  <CheckCircle size={12} /> Passwords match
                </p>
              )}
            </div>

            {/* Error */}
            {error && (
              <div className="bg-red-50 border border-red-200 text-red-700 text-sm p-3 rounded-xl text-center font-medium flex items-center justify-center gap-2">
                <AlertCircle size={16} /> {error}
              </div>
            )}

            {/* Success */}
            {success && (
              <div className="bg-emerald-50 border border-emerald-200 text-emerald-700 text-sm p-3 rounded-xl text-center font-medium flex items-center justify-center gap-2">
                <CheckCircle size={16} /> {success}
              </div>
            )}

            <button
              type="submit"
              disabled={isLoading || formData.password !== formData.confirmPassword}
              className="w-full bg-gradient-to-r from-purple-600 via-indigo-600 to-blue-600 text-white py-3.5 rounded-xl font-bold hover:from-purple-700 hover:via-indigo-700 hover:to-blue-700 transition-all duration-300 shadow-lg hover:shadow-xl flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isLoading ? (
                <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
              ) : (
                <>
                  <Sparkles size={18} />
                  Create Account
                </>
              )}
            </button>
          </form>

          <div className="mt-5 pt-4 border-t border-slate-100 text-center">
            <p className="text-sm text-slate-500">
              Already have an account?{" "}
              <Link
                href="/login"
                className="font-bold text-blue-600 hover:text-blue-700 transition-colors"
              >
                Sign In →
              </Link>
            </p>
          </div>

          <div className="mt-3">
            <p className="text-center text-xs text-slate-400 flex items-center justify-center gap-2">
              <Lock size={12} />
              Passwords are secured with Bcrypt encryption
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
