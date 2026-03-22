"use client";
import { useState, useEffect, Suspense } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import axios from "axios";
import { Search, Mail, BookOpen, Brain, Target, ArrowLeft, CheckCircle, AlertTriangle, Activity } from "lucide-react";
import {
  RadarChart, Radar, PolarGrid, PolarAngleAxis, PolarRadiusAxis,
  ResponsiveContainer, BarChart, Bar, XAxis, YAxis, Tooltip, CartesianGrid
} from "recharts";

const API_BASE = "http://127.0.0.1:8000";

export default function StudentLookupPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50/30 to-indigo-50/20 p-8 flex items-center justify-center">
        <div className="w-10 h-10 border-4 border-blue-200 border-t-blue-600 rounded-full animate-spin"></div>
      </div>
    }>
      <StudentLookup />
    </Suspense>
  );
}

function StudentLookup() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [searchId, setSearchId] = useState("");
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [emailStatus, setEmailStatus] = useState("");
  const [classAverages, setClassAverages] = useState<any>(null);

  // Auto-search if ID is in URL params
  useEffect(() => {
    if (localStorage.getItem("isLoggedIn") !== "true") {
      router.push("/login");
      return;
    }

    const idParam = searchParams.get("id");
    if (idParam) {
      setSearchId(idParam);
      performSearch(idParam);
    }
    // Fetch class averages for comparison
    axios.get(`${API_BASE}/analytics/class_averages`).then(r => setClassAverages(r.data)).catch(() => {});
  }, [searchParams, router]);

  const performSearch = async (id: string) => {
    setLoading(true);
    setEmailStatus("");
    setData(null);
    try {
      const res = await axios.get(`${API_BASE}/student/${id}`);
      setData(res.data);
    } catch (err) {
      alert("Student ID not found in Database");
    } finally {
      setLoading(false);
    }
  };

  const handleSearch = async (e: any) => {
    e.preventDefault();
    performSearch(searchId);
  };

  const handleSendEmail = async () => {
    try {
      await axios.post(`${API_BASE}/alert/${data.profile.id}`);
      setEmailStatus("Alert sent successfully to guardian!");
    } catch (err) {
      setEmailStatus("Failed to send alert.");
    }
  };

  // Radar chart data
  const radarData = data ? [
    { subject: "Math", student: data.profile.scores.math, classAvg: classAverages?.averages?.math || 0, fullMark: 100 },
    { subject: "Reading", student: data.profile.scores.reading, classAvg: classAverages?.averages?.reading || 0, fullMark: 100 },
    { subject: "Writing", student: data.profile.scores.writing, classAvg: classAverages?.averages?.writing || 0, fullMark: 100 },
  ] : [];

  const riskColorMap: any = {
    0: { bg: "from-emerald-500 to-green-600", text: "text-emerald-600", badge: "bg-emerald-50 border-emerald-200 text-emerald-700", icon: CheckCircle },
    1: { bg: "from-amber-400 to-yellow-500", text: "text-amber-600", badge: "bg-amber-50 border-amber-200 text-amber-700", icon: Activity },
    2: { bg: "from-red-500 to-rose-600", text: "text-red-600", badge: "bg-red-50 border-red-200 text-red-700", icon: AlertTriangle },
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50/30 to-indigo-50/20 p-8 font-sans">
      <div className="max-w-5xl mx-auto">

        {/* Search Bar */}
        <div className="bg-white/80 backdrop-blur-sm p-6 rounded-2xl shadow-sm mb-6 border border-slate-100 animate-fade-in-up">
          <h1 className="text-2xl font-bold mb-1 text-slate-800 tracking-tight">Student Database Search</h1>
          <p className="text-sm text-slate-500 mb-4">Search by student ID to view their full AI-generated risk profile</p>
          <form onSubmit={handleSearch} className="flex gap-4">
            <div className="flex-1 relative">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
              <input
                type="text"
                value={searchId}
                onChange={(e) => setSearchId(e.target.value)}
                className="w-full pl-12 p-3.5 border border-slate-200 rounded-xl text-lg text-slate-700 outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all"
                placeholder="Enter Student ID (e.g. STU10045)"
              />
            </div>
            <button type="submit" disabled={loading} className="bg-gradient-to-r from-blue-600 to-indigo-600 text-white px-8 rounded-xl font-semibold hover:from-blue-700 hover:to-indigo-700 flex items-center gap-2 shadow-md shadow-blue-200 transition-all disabled:opacity-50">
              {loading ? (
                <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
              ) : (
                <><Search className="w-5 h-5" /> Search</>
              )}
            </button>
          </form>
        </div>

        {/* Detailed Report Card */}
        {data && (
          <div className="animate-fade-in-up space-y-6">
            {/* Risk Header Banner */}
            <div className={`bg-gradient-to-r ${riskColorMap[data.prediction.risk_level_id].bg} rounded-2xl shadow-lg overflow-hidden`}>
              <div className="p-8 text-white flex justify-between items-center">
                <div>
                  <p className="text-white/70 text-sm font-medium uppercase tracking-wider mb-1">Student Profile</p>
                  <h2 className="text-4xl font-bold tracking-tight">{data.profile.id}</h2>
                  <p className="text-white/90 mt-1 text-lg">Risk Assessment: <span className="font-bold">{data.prediction.risk_label}</span></p>
                </div>
                <div className="text-center">
                  <div className="bg-white/20 backdrop-blur-sm p-5 rounded-2xl">
                    <div className="text-3xl font-bold">{data.prediction.confidence}%</div>
                    <div className="text-xs uppercase tracking-wider text-white/80 mt-1">Confidence</div>
                  </div>
                </div>
              </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* LEFT: Scores + Radar Chart */}
              <div className="bg-white/80 backdrop-blur-sm rounded-2xl shadow-sm border border-slate-100 overflow-hidden">
                <div className="p-6">
                  <h3 className="text-sm font-bold text-slate-500 uppercase tracking-wider mb-4 flex items-center gap-2">
                    <BookOpen className="w-4 h-4 text-blue-600" /> Academic Profile
                  </h3>

                  {/* Score Cards */}
                  <div className="grid grid-cols-3 gap-3 mb-6">
                    {[
                      { label: "Math", score: data.profile.scores.math, emoji: "📐", color: "blue" },
                      { label: "Reading", score: data.profile.scores.reading, emoji: "📖", color: "green" },
                      { label: "Writing", score: data.profile.scores.writing, emoji: "✍️", color: "amber" }
                    ].map(s => (
                      <div key={s.label} className="text-center p-4 bg-slate-50 rounded-xl">
                        <div className="text-lg mb-1">{s.emoji}</div>
                        <div className="text-2xl font-bold text-slate-800">{s.score}</div>
                        <div className="text-xs text-slate-500">{s.label}</div>
                        {classAverages?.averages && (
                          <div className={`text-[10px] mt-1 font-medium ${
                            s.score >= (classAverages.averages[s.label.toLowerCase()] || 0)
                              ? "text-green-600" : "text-red-500"
                          }`}>
                            {s.score >= (classAverages.averages[s.label.toLowerCase()] || 0) ? "↑" : "↓"} vs avg {Math.round(classAverages.averages[s.label.toLowerCase()] || 0)}
                          </div>
                        )}
                      </div>
                    ))}
                  </div>

                  {/* Radar Chart */}
                  <div className="h-56 w-full">
                    <ResponsiveContainer width="100%" height="100%">
                      <RadarChart outerRadius="70%" data={radarData}>
                        <PolarGrid stroke="#e2e8f0" />
                        <PolarAngleAxis dataKey="subject" tick={{ fontSize: 12 }} />
                        <PolarRadiusAxis domain={[0, 100]} tick={{ fontSize: 10 }} />
                        <Radar name="Student" dataKey="student" stroke="#3b82f6" fill="#3b82f6" fillOpacity={0.3} strokeWidth={2} />
                        <Radar name="Class Avg" dataKey="classAvg" stroke="#94a3b8" fill="#94a3b8" fillOpacity={0.1} strokeWidth={1} strokeDasharray="4 4" />
                        <Tooltip />
                      </RadarChart>
                    </ResponsiveContainer>
                  </div>
                  <div className="flex justify-center gap-4 mt-1">
                    <div className="flex items-center gap-1.5 text-xs text-slate-500">
                      <div className="w-3 h-3 rounded bg-blue-500"></div> Student
                    </div>
                    <div className="flex items-center gap-1.5 text-xs text-slate-500">
                      <div className="w-3 h-3 rounded bg-slate-400"></div> Class Average
                    </div>
                  </div>
                </div>
              </div>

              {/* RIGHT: AI Analysis */}
              <div className="space-y-6">
                {/* Narrative Report */}
                <div className="bg-white/80 backdrop-blur-sm rounded-2xl shadow-sm border border-slate-100 p-6">
                  <h3 className="text-sm font-bold text-slate-500 uppercase tracking-wider mb-4 flex items-center gap-2">
                    <Brain className="w-4 h-4 text-indigo-600" /> AI Analysis Report
                  </h3>

                  <div className={`p-6 rounded-xl border-l-4 mb-5 ${
                    data.prediction.risk_level_id === 2
                      ? "bg-red-50/50 border-red-500"
                      : data.prediction.risk_level_id === 1
                      ? "bg-amber-50/50 border-amber-500"
                      : "bg-emerald-50/50 border-emerald-500"
                  }`}>
                    <h4 className="font-bold text-slate-800 mb-2 text-xs uppercase tracking-wider">
                      System Generated Narrative
                    </h4>
                    <p className="text-slate-700 leading-relaxed">
                      {data.prediction.narrative}
                    </p>
                  </div>

                  {/* Sentiment Analysis */}
                  <div className="bg-slate-50 p-5 rounded-xl">
                    <span className="text-xs font-bold text-slate-400 uppercase">Sentiment Analysis</span>
                    <div className="mt-3 flex items-center gap-3">
                      <span className="text-3xl">
                        {data.prediction.sentiment_score < -0.3 ? "😟" :
                         data.prediction.sentiment_score < 0 ? "😕" :
                         data.prediction.sentiment_score < 0.3 ? "😐" : "🙂"}
                      </span>
                      <div className="flex-1">
                        <div className="w-full h-3 bg-slate-200 rounded-full overflow-hidden">
                          <div
                            className={`h-full rounded-full transition-all duration-1000 ${
                              data.prediction.sentiment_score < 0
                                ? "bg-gradient-to-r from-red-400 to-red-500"
                                : "bg-gradient-to-r from-green-400 to-emerald-500"
                            }`}
                            style={{ width: `${Math.min(Math.abs(data.prediction.sentiment_score * 100), 100)}%` }}
                          ></div>
                        </div>
                      </div>
                      <span className={`font-mono font-bold text-lg ${
                        data.prediction.sentiment_score < 0 ? "text-red-500" : "text-green-600"
                      }`}>
                        {data.prediction.sentiment_score}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Raw Feedback */}
                <div className="bg-white/80 backdrop-blur-sm rounded-2xl shadow-sm border border-slate-100 p-6">
                  <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-3">Raw Feedback</h3>
                  <blockquote className="text-slate-600 italic border-l-2 border-slate-200 pl-4 text-sm leading-relaxed">
                    "{data.profile.feedback_raw}"
                  </blockquote>
                </div>

                {/* Actions */}
                <div className="bg-white/80 backdrop-blur-sm rounded-2xl shadow-sm border border-slate-100 p-6 flex justify-between items-center">
                  <div>
                    <p className="text-xs text-slate-400 font-medium">Guardian Contact</p>
                    <p className="text-sm text-slate-700 font-medium">{data.profile.email}</p>
                  </div>
                  {data.prediction.risk_level_id > 0 && (
                    <button
                      onClick={handleSendEmail}
                      className="bg-gradient-to-r from-red-500 to-rose-600 text-white px-5 py-2.5 rounded-xl hover:from-red-600 hover:to-rose-700 flex items-center gap-2 font-medium shadow-md shadow-red-200 transition-all"
                    >
                      <Mail className="w-4 h-4" /> Send Warning
                    </button>
                  )}
                </div>

                {emailStatus && (
                  <div className={`p-3 rounded-xl text-center text-sm font-semibold ${
                    emailStatus.includes("success")
                      ? "bg-emerald-50 text-emerald-700 border border-emerald-200"
                      : "bg-red-50 text-red-700 border border-red-200"
                  }`}>
                    {emailStatus}
                  </div>
                )}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}