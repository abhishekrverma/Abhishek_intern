"use client";

import { useEffect, useState } from "react";
import axios from "axios";
import Link from "next/link";
import { 
  PieChart, Pie, Cell, Tooltip, ResponsiveContainer, 
  BarChart, Bar, XAxis, YAxis 
} from "recharts";
import { 
  AlertTriangle, Users, TrendingDown, Search, 
  Download, Trash2, Filter, ArrowRight, Activity, 
  Edit, Save, X, Mail 
} from "lucide-react";

export default function Dashboard() {
  const [stats, setStats] = useState<any>(null);
  const [students, setStudents] = useState<any[]>([]); 
  const [filteredStudents, setFilteredStudents] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  // Filters
  const [searchQuery, setSearchQuery] = useState("");
  const [riskFilter, setRiskFilter] = useState("All"); 

  // EDIT MODE STATE
  const [editingStudent, setEditingStudent] = useState<any>(null); // The student currently being edited
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);

  useEffect(() => {
    fetchData();
  }, []);

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
  }, [searchQuery, riskFilter, students]);

  async function fetchData() {
    setLoading(true);
    try {
      const statsRes = await axios.get("http://127.0.0.1:8001/dashboard/stats");
      const listRes = await axios.get("http://127.0.0.1:8001/dashboard/all_students");
      setStats(statsRes.data);
      setStudents(listRes.data);
      setFilteredStudents(listRes.data);
    } catch (err) {
      console.error("Fetch error", err);
    } finally {
      setLoading(false);
    }
  }

  // --- ACTIONS ---

  const handleDelete = async (id: string) => {
    if (!confirm(`Are you sure you want to delete ${id}?`)) return;
    try {
      await axios.delete(`http://127.0.0.1:8001/student/${id}`);
      fetchData();
    } catch (err) { alert("Delete failed"); }
  };

 const handleBulkAlert = async () => {
  if (!confirm(`Send automated warnings to ALL High-Risk guardians?`)) return;
  try {
    // CHANGED PORT TO 8001
    const res = await axios.post("http://127.0.0.1:8001/alert/bulk_risk");
    alert(res.data.message);
  } catch (err) { 
    console.error(err); // Added log to see the real error
    alert("Failed to send alerts"); 
  }
};
  // --- EDIT MODAL FUNCTIONS ---

  const openEditModal = (student: any) => {
    setEditingStudent({ ...student }); // Copy data
    setIsEditModalOpen(true);
  };

  const saveEdit = async () => {
    try {
      await axios.put(`http://127.0.0.1:8001/student/${editingStudent.student_id}`, {
        math_score: Number(editingStudent.math_score),
        reading_score: Number(editingStudent.reading_score),
        writing_score: Number(editingStudent.writing_score),
        feedback_text: editingStudent.feedback_text,
        guardian_email: editingStudent.guardian_email
      });
      setIsEditModalOpen(false);
      fetchData(); // Refresh list to see changes and NEW RISK SCORE
      alert("Student updated successfully!");
    } catch (err) {
      alert("Update failed. Check console.");
    }
  };

  const handleExportCSV = () => {
    const headers = ["Student ID,Email,Math,Reading,Writing,Risk Level\n"];
    const rows = filteredStudents.map(s => 
      `${s.student_id},${s.guardian_email},${s.math_score},${s.reading_score},${s.writing_score},${["Low","Moderate","High"][s.risk_level]}`
    );
    const csvContent = "data:text/csv;charset=utf-8," + headers.join("") + rows.join("\n");
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", "class_report.csv");
    document.body.appendChild(link);
    link.click();
  };

  if (loading) return <div className="p-10 text-center text-slate-500">Loading Dashboard...</div>;
  if (!stats) return <div className="p-10 text-center text-red-500">Error loading data.</div>;

  const pieData = [
    { name: "Safe", value: stats.low_risk, color: "#22c55e" },
    { name: "Moderate", value: stats.moderate_risk, color: "#eab308" },
    { name: "Critical", value: stats.high_risk, color: "#ef4444" }
  ];

  const avgScores = [
    { name: 'Math', score: students.reduce((acc, s) => acc + s.math_score, 0) / (students.length || 1) },
    { name: 'Reading', score: students.reduce((acc, s) => acc + s.reading_score, 0) / (students.length || 1) },
    { name: 'Writing', score: students.reduce((acc, s) => acc + s.writing_score, 0) / (students.length || 1) },
  ];

  return (
    <main className="min-h-screen bg-slate-50 p-8 font-sans relative">
      <header className="max-w-7xl mx-auto mb-8 flex justify-between items-end">
        <div>
          <h1 className="text-3xl font-bold text-slate-800">Faculty Command Center</h1>
          <p className="text-slate-500">Academic surveillance and class management system</p>
        </div>
        <div className="flex gap-3">
          <button 
            onClick={handleBulkAlert}
            className="bg-red-600 text-white px-4 py-2 rounded-lg flex items-center gap-2 hover:bg-red-700 font-medium shadow-sm transition-colors"
          >
            <Mail size={16} /> Notify At-Risk
          </button>
          <button 
            onClick={handleExportCSV}
            className="bg-white border border-slate-300 text-slate-700 px-4 py-2 rounded-lg flex items-center gap-2 hover:bg-slate-50 font-medium transition-colors"
          >
            <Download size={16} /> Export
          </button>
        </div>
      </header>

      {/* FILTER CARDS */}
      <div className="max-w-7xl mx-auto grid grid-cols-1 lg:grid-cols-4 gap-6 mb-8">
        <div onClick={() => setRiskFilter("All")} className={`p-6 rounded-xl shadow-sm border cursor-pointer transition-all hover:scale-105 ${riskFilter === "All" ? "bg-blue-50 border-blue-500 ring-2 ring-blue-200" : "bg-white border-slate-200"}`}>
          <div className="flex justify-between items-center mb-2"><h3 className="text-slate-500 text-sm font-medium">Total Students</h3><Users className="w-5 h-5 text-blue-600" /></div>
          <p className="text-3xl font-bold text-slate-800">{stats.total_students}</p>
        </div>
        <div onClick={() => setRiskFilter("High")} className={`p-6 rounded-xl shadow-sm border cursor-pointer transition-all hover:scale-105 ${riskFilter === "High" ? "bg-red-50 border-red-500 ring-2 ring-red-200" : "bg-white border-slate-200"}`}>
          <div className="flex justify-between items-center mb-2"><h3 className="text-red-700 text-sm font-bold flex gap-2"><AlertTriangle size={16}/> Critical Risk</h3></div>
          <p className="text-3xl font-bold text-red-600">{stats.high_risk}</p>
        </div>
        <div onClick={() => setRiskFilter("Moderate")} className={`p-6 rounded-xl shadow-sm border cursor-pointer transition-all hover:scale-105 ${riskFilter === "Moderate" ? "bg-yellow-50 border-yellow-500 ring-2 ring-yellow-200" : "bg-white border-slate-200"}`}>
          <div className="flex justify-between items-center mb-2"><h3 className="text-slate-500 text-sm font-medium">Moderate Risk</h3><Activity className="w-5 h-5 text-yellow-500" /></div>
          <p className="text-3xl font-bold text-slate-800">{stats.moderate_risk}</p>
        </div>
         <div onClick={() => setRiskFilter("Low")} className={`p-6 rounded-xl shadow-sm border cursor-pointer transition-all hover:scale-105 ${riskFilter === "Low" ? "bg-green-50 border-green-500 ring-2 ring-green-200" : "bg-white border-slate-200"}`}>
          <div className="flex justify-between items-center mb-2"><h3 className="text-slate-500 text-sm font-medium">Safe Zone</h3><TrendingDown className="w-5 h-5 text-green-500" /></div>
          <p className="text-3xl font-bold text-slate-800">{stats.low_risk}</p>
        </div>
      </div>

      {/* CHARTS */}
      <div className="max-w-7xl mx-auto grid grid-cols-1 lg:grid-cols-3 gap-8 mb-8">
         <div className="lg:col-span-1 bg-white p-6 rounded-xl shadow-sm border border-slate-200 flex flex-col items-center justify-center">
             <h3 className="text-sm font-bold text-slate-500 mb-4 w-full text-left">Risk Distribution</h3>
             <div className="h-48 w-full"><ResponsiveContainer width="100%" height="100%"><PieChart><Pie data={pieData} innerRadius={40} outerRadius={60} paddingAngle={5} dataKey="value">{pieData.map((entry, index) => <Cell key={`cell-${index}`} fill={entry.color} />)}</Pie><Tooltip /></PieChart></ResponsiveContainer></div>
             <div className="h-32 w-full mt-4 border-t pt-4"><p className="text-xs font-bold text-slate-400 mb-2">Class Averages</p><ResponsiveContainer width="100%" height="100%"><BarChart data={avgScores}><XAxis dataKey="name" tick={{fontSize: 10}} /><Tooltip /><Bar dataKey="score" fill="#3b82f6" radius={[4, 4, 0, 0]} /></BarChart></ResponsiveContainer></div>
         </div>

        {/* TABLE */}
        <div className="lg:col-span-2 bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden flex flex-col">
          <div className="p-4 border-b border-slate-100 flex flex-col md:flex-row gap-4 justify-between bg-slate-50/50 items-center">
            <div className="relative w-full md:w-80">
              <Search className="absolute left-3 top-3 text-slate-400 w-4 h-4" />
              <input type="text" placeholder="Search by ID or Email..." value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} className="w-full pl-10 p-2.5 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none text-sm"/>
            </div>
            <div className="flex items-center gap-2">
              <Filter className="text-slate-400 w-4 h-4" />
              <select value={riskFilter} onChange={(e) => setRiskFilter(e.target.value)} className="p-2.5 border border-slate-300 rounded-lg outline-none bg-white text-sm font-medium text-slate-700">
                <option value="All">All Students</option><option value="High">High Risk Only</option><option value="Moderate">Moderate Risk</option><option value="Low">Safe Zone</option>
              </select>
            </div>
          </div>

          <div className="overflow-x-auto flex-1">
            <table className="w-full text-left text-sm">
              <thead className="bg-slate-50 text-slate-600 font-semibold uppercase tracking-wider text-xs sticky top-0">
                <tr><th className="p-4">ID</th><th className="p-4">Scores</th><th className="p-4">Status</th><th className="p-4">Email</th><th className="p-4 text-right">Actions</th></tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filteredStudents.length === 0 ? (<tr><td colSpan={5} className="p-10 text-center text-slate-400">No students found.</td></tr>) : (
                  filteredStudents.map((s) => (
                    <tr key={s.student_id} className="hover:bg-blue-50/30 transition-colors group">
                      <td className="p-4 font-medium text-slate-700">{s.student_id}</td>
                      <td className="p-4 font-mono text-xs text-slate-500">M:{s.math_score} R:{s.reading_score} W:{s.writing_score}</td>
                      <td className="p-4"><span className={`px-2 py-1 rounded text-[10px] font-bold uppercase tracking-wide border ${s.risk_level === 2 ? "bg-red-50 text-red-700 border-red-200" : s.risk_level === 1 ? "bg-yellow-50 text-yellow-700 border-yellow-200" : "bg-green-50 text-green-700 border-green-200"}`}>{["Low", "Moderate", "High"][s.risk_level]}</span></td>
                      <td className="p-4 text-slate-500 truncate max-w-[150px]">{s.guardian_email || "-"}</td>
                      <td className="p-4 flex justify-end gap-2">
                        <button onClick={() => openEditModal(s)} className="p-1.5 text-blue-600 hover:bg-blue-100 rounded-md" title="Edit Student"><Edit size={16} /></button>
                        <Link href={`/student-lookup?id=${s.student_id}`} className="p-1.5 text-slate-500 hover:bg-slate-100 rounded-md" title="View Profile"><ArrowRight size={16} /></Link>
                        <button onClick={() => handleDelete(s.student_id)} className="p-1.5 text-red-400 hover:bg-red-50 rounded-md" title="Delete"><Trash2 size={16} /></button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* --- EDIT MODAL --- */}
      {isEditModalOpen && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50">
          <div className="bg-white rounded-xl shadow-2xl p-6 w-full max-w-lg border border-slate-200 animate-in fade-in zoom-in-95 duration-200">
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-xl font-bold text-slate-800 flex items-center gap-2"><Edit className="text-blue-600"/> Edit Student: {editingStudent.student_id}</h2>
              <button onClick={() => setIsEditModalOpen(false)} className="text-slate-400 hover:text-slate-600"><X size={24}/></button>
            </div>
            
            <div className="space-y-4">
               <div>
                  <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Guardian Email</label>
                  <input type="email" value={editingStudent.guardian_email} onChange={(e) => setEditingStudent({...editingStudent, guardian_email: e.target.value})} className="w-full p-2 border rounded-lg"/>
               </div>
               <div className="grid grid-cols-3 gap-4">
                  <div><label className="block text-xs font-bold text-slate-500 uppercase mb-1">Math</label><input type="number" value={editingStudent.math_score} onChange={(e) => setEditingStudent({...editingStudent, math_score: e.target.value})} className="w-full p-2 border rounded-lg text-center"/></div>
                  <div><label className="block text-xs font-bold text-slate-500 uppercase mb-1">Reading</label><input type="number" value={editingStudent.reading_score} onChange={(e) => setEditingStudent({...editingStudent, reading_score: e.target.value})} className="w-full p-2 border rounded-lg text-center"/></div>
                  <div><label className="block text-xs font-bold text-slate-500 uppercase mb-1">Writing</label><input type="number" value={editingStudent.writing_score} onChange={(e) => setEditingStudent({...editingStudent, writing_score: e.target.value})} className="w-full p-2 border rounded-lg text-center"/></div>
               </div>
               <div>
                  <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Feedback Notes</label>
                  <textarea rows={3} value={editingStudent.feedback_text} onChange={(e) => setEditingStudent({...editingStudent, feedback_text: e.target.value})} className="w-full p-2 border rounded-lg text-sm"></textarea>
               </div>
            </div>

            <div className="mt-6 flex gap-3 justify-end">
              <button onClick={() => setIsEditModalOpen(false)} className="px-4 py-2 text-slate-600 hover:bg-slate-100 rounded-lg">Cancel</button>
              <button onClick={saveEdit} className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 font-medium flex items-center gap-2"><Save size={18}/> Save Changes</button>
            </div>
          </div>
        </div>
      )}

    </main>
  );
}