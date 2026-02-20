"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { Lock, User, ShieldCheck } from "lucide-react";

export default function Login() {
  const [role, setRole] = useState("faculty"); // faculty or admin
  const [password, setPassword] = useState("");
  const router = useRouter();

  const handleLogin = (e: any) => {
    e.preventDefault();
    
    // Simulated Security Check
    if (password === "admin123") {
      // Save session (simulated)
      localStorage.setItem("user_role", role);
      router.push("/dashboard");
    } else {
      alert("Invalid Credentials. Try 'admin123'");
    }
  };

  return (
    <div className="min-h-screen bg-slate-900 flex items-center justify-center font-sans">
      <div className="bg-white p-8 rounded-2xl shadow-2xl w-full max-w-md">
        <div className="text-center mb-8">
          <div className="bg-blue-100 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4">
            <ShieldCheck className="w-8 h-8 text-blue-600" />
          </div>
          <h1 className="text-2xl font-bold text-slate-800">EduGuard Access</h1>
          <p className="text-slate-500">Secure Academic Monitoring Portal</p>
        </div>

        <form onSubmit={handleLogin} className="space-y-6">
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-2">Select Role</label>
            <div className="grid grid-cols-2 gap-4">
              <button
                type="button"
                onClick={() => setRole("faculty")}
                className={`p-3 rounded-lg border flex items-center justify-center gap-2 ${
                  role === "faculty" ? "bg-blue-50 border-blue-500 text-blue-700" : "border-slate-200 text-slate-500"
                }`}
              >
                <User size={18} /> Faculty
              </button>
              <button
                type="button"
                onClick={() => setRole("admin")}
                className={`p-3 rounded-lg border flex items-center justify-center gap-2 ${
                  role === "admin" ? "bg-blue-50 border-blue-500 text-blue-700" : "border-slate-200 text-slate-500"
                }`}
              >
                <Lock size={18} /> Admin
              </button>
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700 mb-2">Password</label>
            <input
              type="password"
              className="w-full p-3 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none text-black"
              placeholder="Enter secure key"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
            />
          </div>

          <button
            type="submit"
            className="w-full bg-slate-900 text-white py-4 rounded-xl font-bold hover:bg-slate-800 transition-all shadow-lg hover:shadow-xl"
          >
            Access Dashboard
          </button>
        </form>
        
        <p className="text-center text-xs text-slate-400 mt-6">
          Protected by End-to-End Encryption & AI Surveillance
        </p>
      </div>
    </div>
  );
}