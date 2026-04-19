"use client";

import { useEffect, useState } from "react";
import axios from "axios";
import Link from "next/link";
import {
  PieChart, Pie, Cell, Tooltip, ResponsiveContainer,
  BarChart, Bar, XAxis, YAxis, RadarChart, Radar, PolarGrid,
  PolarAngleAxis, PolarRadiusAxis, CartesianGrid
} from "recharts";
import {
  AlertTriangle, Users, TrendingDown, Search,
  Download, Trash2, Filter, ArrowRight, Activity,
  Edit, Save, X, Mail, Brain, Zap, Target, BarChart3, Clock, Database
} from "lucide-react";

const API_BASE = "http://127.0.0.1:8000";

import { useRouter } from "next/navigation";

export default function Dashboard() {
  const router = useRouter();
  const [stats, setStats] = useState<any>(null);
  const [students, setStudents] = useState<any[]>([]);
  const [filteredStudents, setFilteredStudents] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [connectionError, setConnectionError] = useState(false);
  const [modelMetrics, setModelMetrics] = useState<any>(null);
  const [featureImportance, setFeatureImportance] = useState<any[]>([]);
  const [scoreDistribution, setScoreDistribution] = useState<any>(null);
  const [recentActivity, setRecentActivity] = useState<any[]>([]);

  // Filters
  const [searchQuery, setSearchQuery] = useState("");
  const [riskFilter, setRiskFilter] = useState("All");

  // EDIT MODE
  const [editingStudent, setEditingStudent] = useState<any>(null);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);

  // Pagination
  const [currentPage, setCurrentPage] = useState(1);
  const studentsPerPage = 10;

  // Animated counters
  const [animatedStats, setAnimatedStats] = useState({ total: 0, low: 0, mod: 0, high: 0 });

  useEffect(() => {
    if (localStorage.getItem("isLoggedIn") !== "true") {
      router.push("/login");
      return;
    }
    fetchData();
  }, [router]);

  useEffect(() => {
    if (!students.length) return;
    let result = students;
    if (searchQuery) {
      const q = searchQuery.toLowerCase();
      result = result.filter(s =>
        s.student_id.toLowerCase().includes(q) ||
        s.guardian_email?.toLowerCase().includes(q)
      );
    }
    if (riskFilter !== "All") {
      const riskMap: any = { "High": 2, "Moderate": 1, "Low": 0 };
      result = result.filter(s => s.risk_level === riskMap[riskFilter]);
    }
    setFilteredStudents(result);
    setCurrentPage(1);
  }, [searchQuery, riskFilter, students]);

  // Animate counters
  useEffect(() => {
    if (!stats) return;
    const duration = 1000;
    const steps = 30;
    const interval = duration / steps;
    let step = 0;
    const timer = setInterval(() => {
      step++;
      const progress = step / steps;
      setAnimatedStats({
        total: Math.round(stats.total_students * progress),
        low: Math.round(stats.low_risk * progress),
        mod: Math.round(stats.moderate_risk * progress),
        high: Math.round(stats.high_risk * progress)
      });
      if (step >= steps) clearInterval(timer);
    }, interval);
    return () => clearInterval(timer);
  }, [stats]);

  async function fetchData() {
    setLoading(true);
    setConnectionError(false);
    try {
      const [statsRes, listRes, metricsRes, fiRes, sdRes, raRes] = await Promise.all([
        axios.get(`${API_BASE}/dashboard/stats`).catch(() => null),
        axios.get(`${API_BASE}/dashboard/all_students`).catch(() => null),
        axios.get(`${API_BASE}/model/metrics`).catch(() => null),
        axios.get(`${API_BASE}/model/feature_importance`).catch(() => null),
        axios.get(`${API_BASE}/analytics/score_distribution`).catch(() => null),
        axios.get(`${API_BASE}/analytics/recent_activity`).catch(() => null)
      ]);

      if (!statsRes || !listRes) {
        setConnectionError(true);
        setLoading(false);
        return;
      }

      setStats(statsRes.data);
      setStudents(listRes.data);
      setFilteredStudents(listRes.data);
      if (metricsRes) setModelMetrics(metricsRes.data);
      if (fiRes) setFeatureImportance(fiRes.data.features || []);
      if (sdRes) setScoreDistribution(sdRes.data);
      if (raRes && raRes.data) setRecentActivity(raRes.data);
    } catch (err) {
      console.error("Fetch error", err);
      setConnectionError(true);
    } finally {
      setLoading(false);
    }
  }

  // --- ACTIONS ---
  const handleDelete = async (id: string) => {
    if (!confirm(`Are you sure you want to delete ${id}?`)) return;
    try {
      await axios.delete(`${API_BASE}/student/${id}`);
      fetchData();
    } catch (err) { alert("Delete failed"); }
  };

  const handleBulkAlert = async () => {
    if (!confirm(`Send automated warnings to ALL High-Risk guardians?`)) return;
    try {
      const res = await axios.post(`${API_BASE}/alert/bulk_risk`);
      alert(res.data.message);
    } catch (err) {
      console.error(err);
      alert("Failed to send alerts");
    }
  };

  const handleRegenerateAll = async () => {
    if (!confirm(`Are you sure you want to recalculate AI insights and grades for ALL students? This may take a moment.`)) return;
    try {
      setLoading(true);
      const res = await axios.post(`${API_BASE}/analytics/regenerate_all`);
      alert(res.data.message);
      fetchData(); // Refresh table with new data
    } catch (err) {
      console.error(err);
      alert("Failed to regenerate reports");
      setLoading(false);
    }
  };

  const openEditModal = (student: any) => {
    setEditingStudent({ ...student });
    setIsEditModalOpen(true);
  };

  const saveEdit = async () => {
    try {
      await axios.put(`${API_BASE}/student/${editingStudent.student_id}`, {
        math_score: Number(editingStudent.math_score),
        reading_score: Number(editingStudent.reading_score),
        writing_score: Number(editingStudent.writing_score),
        feedback_text: editingStudent.feedback_text,
        guardian_email: editingStudent.guardian_email
      });
      setIsEditModalOpen(false);
      fetchData();
      alert("Student updated successfully!");
    } catch (err) {
      alert("Update failed. Check console.");
    }
  };

  const handleExportCSV = () => {
    const headers = ["Student ID,Email,Math,Reading,Writing,Risk Level\n"];
    const rows = filteredStudents.map(s =>
      `${s.student_id},${s.guardian_email},${s.math_score},${s.reading_score},${s.writing_score},${["Low", "Moderate", "High"][s.risk_level]}`
    );
    const csvContent = "data:text/csv;charset=utf-8," + headers.join("") + rows.join("\n");
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", "class_report.csv");
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // Pagination
  const totalPages = Math.ceil(filteredStudents.length / studentsPerPage);
  const paginatedStudents = filteredStudents.slice(
    (currentPage - 1) * studentsPerPage,
    currentPage * studentsPerPage
  );

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50/30 to-indigo-50/20 p-8 flex items-center justify-center">
        <div className="text-center">
          <div className="w-12 h-12 border-4 border-blue-200 border-t-blue-600 rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-slate-500 font-medium">Loading Dashboard...</p>
        </div>
      </div>
    );
  }

  if (!stats || connectionError) return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50/30 to-indigo-50/20 p-8 flex items-center justify-center">
      <div className="text-center bg-white p-10 rounded-2xl shadow-sm border border-slate-100 max-w-md">
        <div className="w-16 h-16 bg-red-50 rounded-2xl flex items-center justify-center mx-auto mb-4">
          <AlertTriangle className="w-8 h-8 text-red-500" />
        </div>
        <h2 className="text-xl font-bold text-slate-800 mb-2">Backend Unavailable</h2>
        <p className="text-slate-500 text-sm mb-6">
          Cannot connect to the API server at <code className="bg-slate-100 px-2 py-0.5 rounded text-xs">{API_BASE}</code>. 
          Please ensure the backend is running.
        </p>
        <div className="bg-slate-50 p-4 rounded-xl text-left mb-6">
          <p className="text-xs font-mono text-slate-600">
            cd backend<br/>
            python -m uvicorn main:app --port 8000
          </p>
        </div>
        <button onClick={fetchData} className="bg-blue-600 text-white px-6 py-2.5 rounded-xl font-medium hover:bg-blue-700 transition-colors">
          Retry Connection
        </button>
      </div>
    </div>
  );

  const pieData = [
    { name: "Safe", value: stats.low_risk, color: "#22c55e" },
    { name: "Moderate", value: stats.moderate_risk, color: "#eab308" },
    { name: "Critical", value: stats.high_risk, color: "#ef4444" }
  ];

  const avgScores = [
    { name: 'Math', score: Math.round(students.reduce((acc, s) => acc + s.math_score, 0) / (students.length || 1)) },
    { name: 'Reading', score: Math.round(students.reduce((acc, s) => acc + s.reading_score, 0) / (students.length || 1)) },
    { name: 'Writing', score: Math.round(students.reduce((acc, s) => acc + s.writing_score, 0) / (students.length || 1)) },
  ];

  // Score distribution chart data
  const distChartData = scoreDistribution?.bins?.map((bin: string, i: number) => ({
    range: bin,
    Math: scoreDistribution.math[i],
    Reading: scoreDistribution.reading[i],
    Writing: scoreDistribution.writing[i]
  })) || [];

  return (
    <main className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50/30 to-indigo-50/20 p-8 font-sans relative">
      {/* Header */}
      <header className="max-w-7xl mx-auto mb-8 flex justify-between items-end animate-fade-in-up">
        <div>
          <h1 className="text-3xl font-bold text-slate-800 tracking-tight">Faculty Command Center</h1>
          <p className="text-slate-500">Academic surveillance and class management system</p>
        </div>
        <div className="flex gap-3">
          <button
            onClick={handleRegenerateAll}
            className="bg-purple-100/50 text-purple-700 border border-purple-200 px-5 py-2.5 rounded-xl flex items-center gap-2 hover:bg-purple-100 font-medium shadow-sm transition-all duration-200"
          >
            <Database size={16} /> Regenerate Reports
          </button>
          <button
            onClick={handleBulkAlert}
            className="bg-gradient-to-r from-red-500 to-rose-600 text-white px-5 py-2.5 rounded-xl flex items-center gap-2 hover:from-red-600 hover:to-rose-700 font-medium shadow-md shadow-red-200 transition-all duration-200"
          >
            <Mail size={16} /> Notify At-Risk
          </button>
          <button
            onClick={handleExportCSV}
            className="bg-white border border-slate-200 text-slate-700 px-5 py-2.5 rounded-xl flex items-center gap-2 hover:bg-slate-50 font-medium shadow-sm transition-all duration-200"
          >
            <Download size={16} /> Export CSV
          </button>
        </div>
      </header>

      {/* STAT CARDS */}
      <div className="max-w-7xl mx-auto grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5 mb-8">
        {[
          { label: "Total Students", value: animatedStats.total, icon: Users, color: "blue", filter: "All", gradient: "from-blue-500 to-indigo-600", shadow: "shadow-blue-200" },
          { label: "Critical Risk", value: animatedStats.high, icon: AlertTriangle, color: "red", filter: "High", gradient: "from-red-500 to-rose-600", shadow: "shadow-red-200" },
          { label: "Moderate Risk", value: animatedStats.mod, icon: Activity, color: "yellow", filter: "Moderate", gradient: "from-amber-400 to-yellow-500", shadow: "shadow-yellow-200" },
          { label: "Safe Zone", value: animatedStats.low, icon: TrendingDown, color: "green", filter: "Low", gradient: "from-emerald-500 to-green-600", shadow: "shadow-green-200" }
        ].map((card, idx) => {
          const Icon = card.icon;
          const isActive = riskFilter === card.filter;
          return (
            <div
              key={card.label}
              onClick={() => setRiskFilter(card.filter)}
              className={`stat-card p-6 rounded-2xl cursor-pointer border-2 transition-all duration-300 animate-fade-in-up ${
                isActive
                  ? `bg-gradient-to-br ${card.gradient} text-white border-transparent shadow-lg ${card.shadow}`
                  : "bg-white border-slate-100 hover:border-slate-200"
              }`}
              style={{ animationDelay: `${idx * 0.1}s`, opacity: 0 }}
            >
              <div className="flex justify-between items-center mb-3">
                <h3 className={`text-sm font-semibold ${isActive ? "text-white/80" : "text-slate-500"}`}>
                  {card.label}
                </h3>
                <div className={`p-2 rounded-xl ${isActive ? "bg-white/20" : "bg-slate-50"}`}>
                  <Icon className={`w-5 h-5 ${isActive ? "text-white" : `text-${card.color}-500`}`} />
                </div>
              </div>
              <p className={`text-4xl font-bold tracking-tight ${isActive ? "text-white" : "text-slate-800"}`}>
                {card.value}
              </p>
            </div>
          );
        })}
      </div>

      {/* CHARTS ROW */}
      <div className="max-w-7xl mx-auto grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
        {/* Risk Distribution Pie */}
        <div className="bg-white/80 backdrop-blur-sm p-6 rounded-2xl shadow-sm border border-slate-100 animate-fade-in-up delay-200">
          <h3 className="text-sm font-bold text-slate-500 uppercase tracking-wider mb-4 flex items-center gap-2">
            <Target size={14} /> Risk Distribution
          </h3>
          <div className="h-48 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie data={pieData} innerRadius={45} outerRadius={70} paddingAngle={5} dataKey="value" strokeWidth={0}>
                  {pieData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          </div>
          {/* Legend */}
          <div className="flex justify-center gap-4 mt-2">
            {pieData.map(d => (
              <div key={d.name} className="flex items-center gap-1.5 text-xs text-slate-500">
                <div className="w-3 h-3 rounded-full" style={{ backgroundColor: d.color }}></div>
                {d.name}: {d.value}
              </div>
            ))}
          </div>
        </div>

        {/* Class Averages Bar */}
        <div className="bg-white/80 backdrop-blur-sm p-6 rounded-2xl shadow-sm border border-slate-100 animate-fade-in-up delay-300">
          <h3 className="text-sm font-bold text-slate-500 uppercase tracking-wider mb-4 flex items-center gap-2">
            <BarChart3 size={14} /> Class Averages
          </h3>
          <div className="h-52 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={avgScores}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                <XAxis dataKey="name" tick={{ fontSize: 12 }} />
                <YAxis domain={[0, 100]} tick={{ fontSize: 11 }} />
                <Tooltip />
                <Bar dataKey="score" fill="url(#blueGradient)" radius={[6, 6, 0, 0]} />
                <defs>
                  <linearGradient id="blueGradient" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#3b82f6" />
                    <stop offset="100%" stopColor="#6366f1" />
                  </linearGradient>
                </defs>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* AI Insights Panel */}
        <div className="bg-white/80 backdrop-blur-sm p-6 rounded-2xl shadow-sm border border-slate-100 animate-fade-in-up delay-400">
          <h3 className="text-sm font-bold text-slate-500 uppercase tracking-wider mb-4 flex items-center gap-2">
            <Brain size={14} className="text-indigo-500" /> AI Model Insights
          </h3>
          {modelMetrics ? (
            <div className="space-y-4">
              {/* Accuracy Badge */}
              <div className="bg-gradient-to-r from-indigo-50 to-purple-50 p-4 rounded-xl border border-indigo-100">
                <div className="flex justify-between items-center">
                  <span className="text-xs font-bold text-indigo-600 uppercase">Test Accuracy</span>
                  <span className="text-2xl font-bold text-indigo-700">{modelMetrics.test_accuracy}%</span>
                </div>
                <div className="mt-2 w-full h-2 bg-indigo-100 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-gradient-to-r from-indigo-500 to-purple-500 rounded-full transition-all duration-1000"
                    style={{ width: `${modelMetrics.test_accuracy}%` }}
                  ></div>
                </div>
                <p className="text-xs text-indigo-500 mt-1">
                  CV: {modelMetrics.cross_validation?.mean_accuracy}% ± {modelMetrics.cross_validation?.std_accuracy}%
                </p>
              </div>

              {/* Feature Importance */}
              {featureImportance.length > 0 && (
                <div>
                  <p className="text-xs font-bold text-slate-400 uppercase mb-2">Feature Importance</p>
                  <div className="space-y-2">
                    {featureImportance.map((f: any) => (
                      <div key={f.name} className="flex items-center gap-2">
                        <span className="text-[10px] font-medium text-slate-500 w-20 truncate">{f.name}</span>
                        <div className="flex-1 h-3 bg-slate-100 rounded-full overflow-hidden">
                          <div
                            className="h-full bg-gradient-to-r from-blue-400 to-indigo-500 rounded-full transition-all duration-700"
                            style={{ width: `${f.importance}%` }}
                          ></div>
                        </div>
                        <span className="text-[10px] font-mono font-bold text-slate-600 w-10 text-right">{f.importance}%</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          ) : (
            <div className="h-40 flex items-center justify-center text-slate-400 text-sm">
              <p>Train model to see metrics</p>
            </div>
          )}
        </div>
      </div>

      {/* SCORE DISTRIBUTION CHART */}
      {distChartData.length > 0 && (
        <div className="max-w-7xl mx-auto mb-8 bg-white/80 backdrop-blur-sm p-6 rounded-2xl shadow-sm border border-slate-100 animate-fade-in-up delay-500">
          <h3 className="text-sm font-bold text-slate-500 uppercase tracking-wider mb-4 flex items-center gap-2">
            <Zap size={14} className="text-amber-500" /> Score Distribution Analysis
          </h3>
          <div className="h-64 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={distChartData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                <XAxis dataKey="range" tick={{ fontSize: 10 }} />
                <YAxis tick={{ fontSize: 11 }} />
                <Tooltip />
                <Bar dataKey="Math" fill="#3b82f6" radius={[4, 4, 0, 0]} />
                <Bar dataKey="Reading" fill="#22c55e" radius={[4, 4, 0, 0]} />
                <Bar dataKey="Writing" fill="#eab308" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
          <div className="flex justify-center gap-6 mt-2">
            <div className="flex items-center gap-1.5 text-xs text-slate-500"><div className="w-3 h-3 rounded bg-blue-500"></div>Math</div>
            <div className="flex items-center gap-1.5 text-xs text-slate-500"><div className="w-3 h-3 rounded bg-green-500"></div>Reading</div>
            <div className="flex items-center gap-1.5 text-xs text-slate-500"><div className="w-3 h-3 rounded bg-yellow-500"></div>Writing</div>
          </div>
        </div>
      )}

      {/* RECENT ACTIVITY */}
      {recentActivity.length > 0 && (
        <div className="max-w-7xl mx-auto mb-8 bg-white/80 backdrop-blur-sm p-6 rounded-2xl shadow-sm border border-slate-100 animate-fade-in-up delay-[600ms]">
          <h3 className="text-sm font-bold text-slate-500 uppercase tracking-wider mb-4 flex items-center gap-2">
            <Clock size={14} className="text-blue-500" /> Recent Registrations
          </h3>
          <div className="divide-y divide-slate-100">
            {recentActivity.map((activity: any, i: number) => {
              const date = new Date(activity.created_at);
              const formattedDate = date.toLocaleDateString() + ' ' + date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
              return (
                <div key={i} className="py-3 flex items-center justify-between group">
                  <div className="flex items-center gap-4">
                    <div className="w-10 h-10 rounded-full bg-blue-50 text-blue-600 flex items-center justify-center font-bold text-xs ring-4 ring-white shadow-sm">
                      {activity.student_id.substring(0, 2)}
                    </div>
                    <div>
                      <p className="text-sm font-bold text-slate-700">{activity.student_id}</p>
                      <p className="text-xs text-slate-400 font-medium">Registered on {formattedDate}</p>
                    </div>
                  </div>
                  <div className="flex gap-2 opacity-80 group-hover:opacity-100 transition-opacity">
                    <span className="px-2 py-1 bg-slate-50 text-slate-600 rounded-md text-[10px] font-bold border border-slate-100">Math: {activity.math_score}</span>
                    <span className="px-2 py-1 bg-slate-50 text-slate-600 rounded-md text-[10px] font-bold border border-slate-100">Reading: {activity.reading_score}</span>
                    <span className="px-2 py-1 bg-slate-50 text-slate-600 rounded-md text-[10px] font-bold border border-slate-100">Writing: {activity.writing_score}</span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* STUDENT TABLE */}
      <div className="max-w-7xl mx-auto bg-white/80 backdrop-blur-sm rounded-2xl shadow-sm border border-slate-100 overflow-hidden animate-fade-in-up delay-300">
        {/* Table Header */}
        <div className="p-4 border-b border-slate-100 flex flex-col md:flex-row gap-4 justify-between bg-slate-50/50 items-center">
          <div className="relative w-full md:w-80">
            <Search className="absolute left-3.5 top-3.5 text-slate-400 w-4 h-4" />
            <input
              type="text"
              placeholder="Search by ID or Email..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 p-3 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none text-sm bg-white"
            />
          </div>
          <div className="flex items-center gap-3">
            <span className="text-xs text-slate-400 font-medium">
              {filteredStudents.length} students
            </span>
            <div className="flex items-center gap-2">
              <Filter className="text-slate-400 w-4 h-4" />
              <select
                value={riskFilter}
                onChange={(e) => setRiskFilter(e.target.value)}
                className="p-2.5 border border-slate-200 rounded-xl outline-none bg-white text-sm font-medium text-slate-700"
              >
                <option value="All">All Students</option>
                <option value="High">High Risk Only</option>
                <option value="Moderate">Moderate Risk</option>
                <option value="Low">Safe Zone</option>
              </select>
            </div>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead className="bg-slate-50 text-slate-600 font-semibold uppercase tracking-wider text-xs sticky top-0">
              <tr>
                <th className="p-4">ID</th>
                <th className="p-4">Academic & Behavior</th>
                <th className="p-4">AI Essay</th>
                <th className="p-4">Status</th>
                <th className="p-4">Confidence</th>
                <th className="p-4">Email</th>
                <th className="p-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50">
              {paginatedStudents.length === 0 ? (
                <tr>
                  <td colSpan={7} className="p-10 text-center text-slate-400">No students found.</td>
                </tr>
              ) : (
                paginatedStudents.map((s) => (
                  <tr key={s.student_id} className="table-row-hover group">
                    <td className="p-4 font-medium text-slate-700 font-mono text-xs">{s.student_id}</td>
                    <td className="p-4">
                      <div className="flex flex-wrap gap-2 max-w-[200px]">
                        <span className="px-2 py-0.5 bg-slate-100 text-slate-600 rounded text-[10px] font-bold border border-slate-200">GPA: {s.gpa}</span>
                        <span className="px-2 py-0.5 bg-slate-100 text-slate-600 rounded text-[10px] font-bold border border-slate-200">Attn: {s.attendance_rate}%</span>
                        <span className="px-2 py-0.5 bg-blue-50 text-blue-700 rounded text-[10px] font-bold">M:{s.math_score}</span>
                        <span className="px-2 py-0.5 bg-green-50 text-green-700 rounded text-[10px] font-bold">R:{s.reading_score}</span>
                        <span className="px-2 py-0.5 bg-amber-50 text-amber-700 rounded text-[10px] font-bold">W:{s.writing_score}</span>
                      </div>
                    </td>
                    <td className="p-4 font-mono font-bold text-xs text-purple-600">
                      {s.ai_essay_score || "—"} / 100
                    </td>
                    <td className="p-4">
                      <span className={`px-2.5 py-1 rounded-lg text-[10px] font-bold uppercase tracking-wide ${
                        s.risk_level === 2 ? "risk-badge-high" :
                        s.risk_level === 1 ? "risk-badge-moderate" :
                        "risk-badge-low"
                      }`}>
                        {["Low", "Moderate", "High"][s.risk_level]}
                      </span>
                    </td>
                    <td className="p-4">
                      <span className="text-xs font-mono text-slate-500">{s.confidence || "—"}%</span>
                    </td>
                    <td className="p-4 text-slate-500 truncate max-w-[150px] text-xs">{s.guardian_email || "—"}</td>
                    <td className="p-4 flex justify-end gap-1.5">
                      <button onClick={() => openEditModal(s)} className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors" title="Edit Student">
                        <Edit size={15} />
                      </button>
                      <Link href={`/student-lookup?id=${s.student_id}`} className="p-2 text-slate-500 hover:bg-slate-50 rounded-lg transition-colors" title="View Profile">
                        <ArrowRight size={15} />
                      </Link>
                      <button onClick={() => handleDelete(s.student_id)} className="p-2 text-red-400 hover:bg-red-50 rounded-lg transition-colors" title="Delete">
                        <Trash2 size={15} />
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="flex items-center justify-between p-4 border-t border-slate-100 bg-slate-50/50">
            <span className="text-xs text-slate-500">
              Page {currentPage} of {totalPages} ({filteredStudents.length} total)
            </span>
            <div className="flex gap-1">
              <button
                onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                disabled={currentPage === 1}
                className="px-3 py-1.5 text-xs font-medium border rounded-lg hover:bg-white disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
              >
                Prev
              </button>
              {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                const start = Math.max(1, currentPage - 2);
                const page = start + i;
                if (page > totalPages) return null;
                return (
                  <button
                    key={page}
                    onClick={() => setCurrentPage(page)}
                    className={`px-3 py-1.5 text-xs font-medium rounded-lg transition-colors ${
                      page === currentPage
                        ? "bg-blue-600 text-white shadow-sm"
                        : "border hover:bg-white text-slate-600"
                    }`}
                  >
                    {page}
                  </button>
                );
              })}
              <button
                onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                disabled={currentPage === totalPages}
                className="px-3 py-1.5 text-xs font-medium border rounded-lg hover:bg-white disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
              >
                Next
              </button>
            </div>
          </div>
        )}
      </div>

      {/* --- EDIT MODAL --- */}
      {isEditModalOpen && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 animate-fade-in">
          <div className="bg-white rounded-2xl shadow-2xl p-6 w-full max-w-lg border border-slate-200 animate-fade-in-up">
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-xl font-bold text-slate-800 flex items-center gap-2">
                <Edit className="text-blue-600" /> Edit Student: {editingStudent.student_id}
              </h2>
              <button onClick={() => setIsEditModalOpen(false)} className="text-slate-400 hover:text-slate-600 p-1 hover:bg-slate-100 rounded-lg transition-colors">
                <X size={22} />
              </button>
            </div>

            <div className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Guardian Email</label>
                <input type="email" value={editingStudent.guardian_email} onChange={(e) => setEditingStudent({ ...editingStudent, guardian_email: e.target.value })} className="w-full p-3 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none" />
              </div>
              <div className="grid grid-cols-3 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Math</label>
                  <input type="number" min={0} max={100} value={editingStudent.math_score} onChange={(e) => setEditingStudent({ ...editingStudent, math_score: e.target.value })} className="w-full p-3 border border-slate-200 rounded-xl text-center font-bold focus:ring-2 focus:ring-blue-500 outline-none" />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Reading</label>
                  <input type="number" min={0} max={100} value={editingStudent.reading_score} onChange={(e) => setEditingStudent({ ...editingStudent, reading_score: e.target.value })} className="w-full p-3 border border-slate-200 rounded-xl text-center font-bold focus:ring-2 focus:ring-blue-500 outline-none" />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Writing</label>
                  <input type="number" min={0} max={100} value={editingStudent.writing_score} onChange={(e) => setEditingStudent({ ...editingStudent, writing_score: e.target.value })} className="w-full p-3 border border-slate-200 rounded-xl text-center font-bold focus:ring-2 focus:ring-blue-500 outline-none" />
                </div>
              </div>
              <div>
                <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Feedback Notes</label>
                <textarea rows={3} value={editingStudent.feedback_text} onChange={(e) => setEditingStudent({ ...editingStudent, feedback_text: e.target.value })} className="w-full p-3 border border-slate-200 rounded-xl text-sm focus:ring-2 focus:ring-blue-500 outline-none"></textarea>
              </div>
            </div>

            <div className="mt-6 flex gap-3 justify-end">
              <button onClick={() => setIsEditModalOpen(false)} className="px-5 py-2.5 text-slate-600 hover:bg-slate-100 rounded-xl font-medium transition-colors">
                Cancel
              </button>
              <button onClick={saveEdit} className="px-6 py-2.5 bg-gradient-to-r from-blue-600 to-indigo-600 text-white rounded-xl hover:from-blue-700 hover:to-indigo-700 font-medium flex items-center gap-2 shadow-md shadow-blue-200 transition-all">
                <Save size={18} /> Save Changes
              </button>
            </div>
          </div>
        </div>
      )}
    </main>
  );
}