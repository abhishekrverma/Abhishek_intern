"use client";

import { useState } from "react";
import axios from "axios";
import {
  UserPlus,
  Save,
  CheckCircle,
  AlertTriangle,
  Activity,
  Sparkles,
  BookOpen,
  Mail,
  Hash
} from "lucide-react";

export default function Home() {
  const [formData, setFormData] = useState({
    student_id: "",
    math_score: "",
    reading_score: "",
    writing_score: "",
    feedback_text: "",
    guardian_email: "",
    gpa: "3.0",
    attendance_rate: "100",
    participation_score: "100",
    late_submissions: "0",
    assignment_text: ""
  });

  const [result, setResult] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState<any>({});

  const handleChange = (e: any) => {
    const { name, value } = e.target;
    setFormData({ ...formData, [name]: value });

    // Real-time score validation
    if (['math_score', 'reading_score', 'writing_score', 'attendance_rate', 'participation_score'].includes(name)) {
      const num = Number(value);
      if (value && (num < 0 || num > 100)) {
        setErrors({ ...errors, [name]: "Must be 0-100" });
      } else {
        const newErrors = { ...errors };
        delete newErrors[name];
        setErrors(newErrors);
      }
    }
    if (name === 'gpa') {
      const num = Number(value);
      if (value && (num < 0.0 || num > 4.0)) {
        setErrors({ ...errors, [name]: "Must be 0.0 - 4.0" });
      } else {
        const newErrors = { ...errors };
        delete newErrors[name];
        setErrors(newErrors);
      }
    }
  };

  const handleSubmit = async (e: any) => {
    e.preventDefault();
    setLoading(true);
    setResult(null);

    try {
      const response = await axios.post(`${process.env.NEXT_PUBLIC_API_BASE || "https://abhishek-intern.onrender.com"}/register_student`, {
        student_id: formData.student_id,
        math_score: Number(formData.math_score),
        reading_score: Number(formData.reading_score),
        writing_score: Number(formData.writing_score),
        feedback_text: formData.feedback_text,
        guardian_email: formData.guardian_email,
        gpa: Number(formData.gpa),
        attendance_rate: Number(formData.attendance_rate),
        participation_score: Number(formData.participation_score),
        late_submissions: Number(formData.late_submissions),
        assignment_text: formData.assignment_text
      });

      setResult(response.data);
    } catch (error: any) {
      console.error("API Error:", error);
      if (error.response && error.response.status === 400) {
        alert(error.response.data.detail || "Student ID already exists.");
      } else {
        alert("Error saving student. Check console for details.");
      }
    } finally {
      setLoading(false);
    }
  };

  const getScoreColor = (score: string) => {
    const num = Number(score);
    if (!score) return "border-slate-200";
    if (num >= 70) return "border-green-400 bg-green-50/50";
    if (num >= 50) return "border-yellow-400 bg-yellow-50/50";
    return "border-red-400 bg-red-50/50";
  };

  return (
    <main className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50/30 to-indigo-50/20 p-8 font-sans">
      <header className="max-w-5xl mx-auto mb-10 animate-fade-in-up">
        <div className="flex items-center gap-4">
          <div className="p-4 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-2xl shadow-lg shadow-blue-200">
            <UserPlus className="w-8 h-8 text-white" />
          </div>
          <div>
            <h1 className="text-3xl font-bold text-slate-800 tracking-tight">
              Student Registration Portal
            </h1>
            <p className="text-slate-500">
              Add new student records to the central database & perform instant AI risk triage.
            </p>
          </div>
        </div>
      </header>

      <div className="max-w-5xl mx-auto grid grid-cols-1 lg:grid-cols-3 gap-8">

        {/* LEFT: Registration Form */}
        <section className="lg:col-span-2 bg-white/80 backdrop-blur-sm p-8 rounded-2xl shadow-sm border border-slate-200/80 animate-fade-in-up delay-100">
          <form onSubmit={handleSubmit} className="space-y-6">

            {/* Identity Section */}
            <div>
              <h3 className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-4 flex items-center gap-2">
                <Hash size={14} /> Student Identity
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                <div>
                  <label className="block text-sm font-semibold text-slate-700 mb-2">Student ID</label>
                  <input
                    type="text"
                    name="student_id"
                    required
                    className="w-full p-3.5 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all font-mono text-slate-700"
                    placeholder="e.g. STU_2024_001"
                    onChange={handleChange}
                  />
                </div>
                <div>
                  <label className="block text-sm font-semibold text-slate-700 mb-2 flex items-center gap-2">
                    <Mail size={14} className="text-slate-400" /> Guardian Email
                  </label>
                  <input
                    type="email"
                    name="guardian_email"
                    required
                    className="w-full p-3.5 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all text-slate-700"
                    placeholder="parent@example.com"
                    onChange={handleChange}
                  />
                </div>
              </div>
            </div>

            <hr className="border-slate-100" />

            {/* Academic Section */}
            <div>
              <h3 className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-4 flex items-center gap-2">
                <BookOpen size={14} /> Academic Scores (0-100)
              </h3>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                {[
                  { name: "gpa", label: "GPA (0-4)", emoji: "🎓", max: 4, step: "0.1" },
                  { name: "math_score", label: "Math", emoji: "📐", max: 100 },
                  { name: "reading_score", label: "Reading", emoji: "📖", max: 100 },
                  { name: "writing_score", label: "Writing", emoji: "✍️", max: 100 }
                ].map((field) => (
                  <div key={field.name}>
                    <label className="block text-xs font-semibold text-slate-500 mb-2 text-center whitespace-nowrap">
                      {field.emoji} {field.label}
                    </label>
                    <input
                      type="number"
                      name={field.name}
                      required
                      min={0}
                      max={field.max}
                      step={field.step || "1"}
                      className={`w-full p-3.5 rounded-xl text-center text-lg font-bold focus:ring-2 focus:ring-blue-500 outline-none transition-all duration-300 border-2 ${field.name !== 'gpa' ? getScoreColor((formData as any)[field.name]) : 'border-slate-200'} text-slate-700`}
                      placeholder={field.name === 'gpa' ? "3.0" : "0"}
                      value={(formData as any)[field.name]}
                      onChange={handleChange}
                    />
                    {errors[field.name] && (
                      <p className="text-red-500 text-xs text-center mt-1 font-medium">{errors[field.name]}</p>
                    )}
                  </div>
                ))}
              </div>
            </div>

            <hr className="border-slate-100" />

            {/* Behavioral Section */}
            <div>
              <h3 className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-4 flex items-center gap-2">
                <Activity size={14} /> Behavioral Tracking
              </h3>
              <div className="grid grid-cols-3 gap-4">
                {[
                  { name: "attendance_rate", label: "Attendance %", emoji: "🏫" },
                  { name: "participation_score", label: "Participation %", emoji: "🙋" },
                  { name: "late_submissions", label: "Late Tasks", emoji: "⏰" }
                ].map((field) => (
                  <div key={field.name}>
                    <label className="block text-[11px] font-semibold text-slate-500 mb-2 text-center whitespace-nowrap">
                      {field.emoji} {field.label}
                    </label>
                    <input
                      type="number"
                      name={field.name}
                      required
                      min={0}
                      max={field.name.includes("late") ? 100 : 100}
                      className="w-full p-3.5 rounded-xl text-center text-lg font-bold focus:ring-2 focus:ring-blue-500 outline-none transition-all duration-300 border-2 border-slate-200 text-slate-700"
                      value={(formData as any)[field.name]}
                      onChange={handleChange}
                    />
                  </div>
                ))}
              </div>
            </div>

            <hr className="border-slate-100" />

            {/* Feedback & Grading Section */}
            <div>
              <h3 className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-3 flex items-center gap-2">
                <Sparkles size={14} /> NLP & Auto-Grading
              </h3>
              <div className="space-y-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-500 mb-2">Student Assignment Text (For Auto-Grading)</label>
                  <textarea
                    name="assignment_text"
                    rows={2}
                    className="w-full p-4 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none resize-none text-slate-700 bg-slate-50 transition-all font-serif text-sm"
                    placeholder="Enter an essay or short answer here. Our AI will automatically evaluate length, vocabulary richness, and structure to generate a grade."
                    onChange={handleChange}
                    value={formData.assignment_text}
                  ></textarea>
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-500 mb-2">Teacher Evaluation Notes (For Sentiment Analysis)</label>
                  <textarea
                    name="feedback_text"
                    required
                    rows={2}
                    className="w-full p-4 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none resize-none text-slate-700 bg-slate-50 transition-all text-sm"
                    placeholder="Enter teacher observations, student emails, or counselor notes here..."
                    onChange={handleChange}
                    value={formData.feedback_text}
                  ></textarea>
                </div>
              </div>
            </div>

            <button
              type="submit"
              disabled={loading || Object.keys(errors).length > 0}
              className="w-full bg-gradient-to-r from-slate-900 via-slate-800 to-slate-900 hover:from-slate-800 hover:via-slate-700 hover:to-slate-800 text-white font-bold py-4 rounded-xl transition-all duration-300 flex justify-center items-center gap-2 shadow-lg hover:shadow-xl disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? (
                <div className="flex items-center gap-3">
                  <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  Processing with AI...
                </div>
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
            <div className="h-full min-h-[300px] flex flex-col items-center justify-center text-slate-400 border-2 border-dashed border-slate-200 rounded-2xl bg-slate-50/50 p-8 text-center animate-fade-in-up delay-200">
              <div className="p-4 bg-slate-100 rounded-2xl mb-4">
                <Activity className="w-10 h-10 opacity-30" />
              </div>
              <p className="font-semibold text-slate-500">Ready to Process</p>
              <p className="text-sm mt-2 text-slate-400">Enter student details to save to database and generate AI risk profile.</p>
            </div>
          ) : (
            <div className="bg-white rounded-2xl shadow-xl overflow-hidden border border-slate-100 animate-fade-in-up">
              {/* Saved Badge */}
              <div className="bg-gradient-to-r from-emerald-50 to-green-50 p-3 text-center text-emerald-700 text-xs font-bold border-b border-emerald-100 flex items-center justify-center gap-2">
                <CheckCircle size={14} /> SAVED TO DATABASE
              </div>

              {/* Risk Header */}
              <div
                className={`p-8 text-white text-center ${
                  result.risk_level_id === 0
                    ? "bg-gradient-to-br from-green-500 to-emerald-600"
                    : result.risk_level_id === 1
                    ? "bg-gradient-to-br from-yellow-500 to-amber-600"
                    : "bg-gradient-to-br from-red-500 to-rose-600"
                }`}
              >
                <div className="inline-block p-4 bg-white/20 rounded-2xl mb-3 backdrop-blur-sm animate-count-up">
                  {result.risk_level_id === 0 ? (
                    <CheckCircle className="w-10 h-10" />
                  ) : (
                    <AlertTriangle className="w-10 h-10" />
                  )}
                </div>
                <h2 className="text-2xl font-bold uppercase tracking-wide mb-1">
                  {result.risk_label}
                </h2>
                <p className="opacity-90 font-medium">
                  AI Confidence: {result.confidence}%
                </p>
              </div>

              {/* Metrics */}
              <div className="p-6 space-y-4">
                  {/* AI Essay Grade */}
                  {result.ai_essay_score !== undefined && (
                    <div className="flex justify-between items-center p-4 bg-purple-50 rounded-xl border border-purple-100">
                      <span className="text-purple-700 font-medium text-sm">AI Essay Score</span>
                      <div className="flex items-center gap-2">
                        <span className="text-lg">🤖</span>
                        <span className="font-mono font-bold text-purple-700">
                          {result.ai_essay_score} / 100
                        </span>
                      </div>
                    </div>
                  )}

                  <div className="flex justify-between items-center p-4 bg-slate-50 rounded-xl">
                    <span className="text-slate-500 font-medium text-sm">Sentiment Score</span>
                    <div className="flex items-center gap-2">
                      <span className="text-lg">{result.sentiment_score < 0 ? "😟" : result.sentiment_score > 0.3 ? "😃" : "😐"}</span>
                      <span className={`font-mono font-bold ${result.sentiment_score < 0 ? "text-red-500" : "text-green-600"}`}>
                        {result.sentiment_score}
                      </span>
                    </div>
                  </div>

                {/* Sentiment Bar */}
                <div className="px-4">
                  <div className="w-full h-2 bg-slate-100 rounded-full overflow-hidden">
                    <div
                      className={`h-full rounded-full transition-all duration-1000 ${
                        result.sentiment_score < 0 ? "bg-gradient-to-r from-red-400 to-red-500" : "bg-gradient-to-r from-green-400 to-emerald-500"
                      }`}
                      style={{ width: `${Math.min(Math.abs(result.sentiment_score * 100), 100)}%` }}
                    ></div>
                  </div>
                </div>

                <p className="text-sm text-slate-500 text-center leading-relaxed pt-2">
                  Student record created. View full descriptive report in the{" "}
                  <span className="font-bold text-slate-700">Faculty Dashboard</span>.
                </p>
              </div>
            </div>
          )}
        </section>
      </div>
    </main>
  );
}