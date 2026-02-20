"use client";

import { useState } from "react";
import axios from "axios";
import { 
  UserPlus, 
  Save, 
  CheckCircle, 
  AlertTriangle, 
  Activity 
} from "lucide-react";

export default function Home() {
  const [formData, setFormData] = useState({
    student_id: "",
    math_score: "",
    reading_score: "",
    writing_score: "",
    feedback_text: "",
    guardian_email: ""
  });

  const [result, setResult] = useState<any>(null);
  const [loading, setLoading] = useState(false);

  const handleChange = (e: any) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e: any) => {
    e.preventDefault();
    setLoading(true);
    setResult(null);

    try {
      // Calls the new 'Register' endpoint that saves to DB
      const response = await axios.post("http://127.0.0.1:8001/register_student", {
        student_id: formData.student_id,
        math_score: Number(formData.math_score),
        reading_score: Number(formData.reading_score),
        writing_score: Number(formData.writing_score),
        feedback_text: formData.feedback_text,
        guardian_email: formData.guardian_email
      });

      setResult(response.data);
    } catch (error) {
      console.error("API Error:", error);
      alert("Error saving student. Check console for details.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className="min-h-screen bg-slate-50 p-8 font-sans">
      <header className="max-w-5xl mx-auto mb-10 flex items-center gap-4">
        <div className="p-4 bg-blue-600 rounded-2xl shadow-lg shadow-blue-200">
          <UserPlus className="w-8 h-8 text-white" />
        </div>
        <div>
          <h1 className="text-3xl font-bold text-slate-800">
            Student Registration Portal
          </h1>
          <p className="text-slate-500">
            Add new student records to the central database & perform instant AI triage.
          </p>
        </div>
      </header>

      <div className="max-w-5xl mx-auto grid grid-cols-1 lg:grid-cols-3 gap-8">
        
        {/* LEFT: Registration Form */}
        <section className="lg:col-span-2 bg-white p-8 rounded-2xl shadow-sm border border-slate-200">
          <form onSubmit={handleSubmit} className="space-y-6">
            
            {/* Identity Section */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-bold text-slate-700 mb-2">Student ID</label>
                <input
                  type="text"
                  name="student_id"
                  required
                  className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none transition-all font-mono text-slate-700"
                  placeholder="e.g. STU_2024_001"
                  onChange={handleChange}
                />
              </div>
              <div>
                <label className="block text-sm font-bold text-slate-700 mb-2">Guardian Email</label>
                <input
                  type="email"
                  name="guardian_email"
                  required
                  className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none transition-all text-slate-700"
                  placeholder="parent@example.com"
                  onChange={handleChange}
                />
              </div>
            </div>

            <hr className="border-slate-100" />

            {/* Academic Section */}
            <div>
              <label className="block text-sm font-bold text-slate-700 mb-3">Academic Scores (0-100)</label>
              <div className="grid grid-cols-3 gap-4">
                <input
                  type="number"
                  name="math_score"
                  required
                  className="p-3 border border-slate-200 rounded-xl text-center focus:ring-2 focus:ring-blue-500 outline-none text-slate-700"
                  placeholder="Math"
                  onChange={handleChange}
                />
                <input
                  type="number"
                  name="reading_score"
                  required
                  className="p-3 border border-slate-200 rounded-xl text-center focus:ring-2 focus:ring-blue-500 outline-none text-slate-700"
                  placeholder="Reading"
                  onChange={handleChange}
                />
                <input
                  type="number"
                  name="writing_score"
                  required
                  className="p-3 border border-slate-200 rounded-xl text-center focus:ring-2 focus:ring-blue-500 outline-none text-slate-700"
                  placeholder="Writing"
                  onChange={handleChange}
                />
              </div>
            </div>

            {/* Feedback Section */}
            <div>
              <label className="block text-sm font-bold text-slate-700 mb-2">
                Qualitative Feedback / Notes
              </label>
              <textarea
                name="feedback_text"
                required
                rows={4}
                className="w-full p-4 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none resize-none text-slate-700"
                placeholder="Enter teacher observations, student emails, or counselor notes here..."
                onChange={handleChange}
              ></textarea>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-slate-900 hover:bg-slate-800 text-white font-bold py-4 rounded-xl transition-all flex justify-center items-center gap-2 shadow-lg hover:shadow-xl"
            >
              {loading ? (
                "Processing..."
              ) : (
                <>
                  <Save size={20} /> Register & Analyze Student
                </>
              )}
            </button>
          </form>
        </section>

        {/* RIGHT: Live Result Card */}
        <section className="lg:col-span-1">
          {!result ? (
            <div className="h-full min-h-[300px] flex flex-col items-center justify-center text-slate-400 border-2 border-dashed border-slate-200 rounded-2xl bg-slate-50/50 p-8 text-center">
              <Activity className="w-12 h-12 mb-4 opacity-20" />
              <p className="font-medium">Ready to Process</p>
              <p className="text-sm mt-2">Enter student details to save to database and generate AI risk profile.</p>
            </div>
          ) : (
            <div className="bg-white rounded-2xl shadow-xl overflow-hidden border border-slate-100 animate-in fade-in slide-in-from-bottom-4 duration-500">
              {/* Status Banner */}
              <div className="bg-green-100 p-3 text-center text-green-800 text-xs font-bold border-b border-green-200 flex items-center justify-center gap-2">
                <CheckCircle size={14} /> SAVED TO DATABASE
              </div>

              {/* Risk Header */}
              <div
                className={`p-8 text-white text-center ${
                  result.risk_level_id === 0 ? "bg-green-500" : 
                  result.risk_level_id === 1 ? "bg-yellow-500" : "bg-red-500"
                }`}
              >
                <div className="inline-block p-3 bg-white/20 rounded-full mb-3 backdrop-blur-sm">
                  {result.risk_level_id === 0 ? <CheckCircle className="w-8 h-8" /> : <AlertTriangle className="w-8 h-8" />}
                </div>
                <h2 className="text-2xl font-bold uppercase tracking-wide mb-1">{result.risk_label}</h2>
                <p className="opacity-90 font-medium">AI Confidence: {result.confidence}%</p>
              </div>

              {/* Metrics */}
              <div className="p-6 space-y-4">
                <div className="flex justify-between items-center p-3 bg-slate-50 rounded-lg">
                  <span className="text-slate-500 font-medium text-sm">Sentiment Score</span>
                  <span className={`font-mono font-bold ${result.sentiment_score < 0 ? "text-red-500" : "text-green-600"}`}>
                    {result.sentiment_score}
                  </span>
                </div>
                
                <p className="text-sm text-slate-500 text-center leading-relaxed">
                  Student record has been created. You can now view their full descriptive report in the <span className="font-bold text-slate-700">Faculty Dashboard</span>.
                </p>
              </div>
            </div>
          )}
        </section>
      </div>
    </main>
  );
}