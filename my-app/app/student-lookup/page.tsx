"use client";
import { useState } from "react";
import axios from "axios";
import { Search, Mail, BookOpen, Brain } from "lucide-react";

export default function StudentLookup() {
  const [searchId, setSearchId] = useState("");
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [emailStatus, setEmailStatus] = useState("");

  const handleSearch = async (e: any) => {
    e.preventDefault();
    setLoading(true);
    setEmailStatus("");
    setData(null);
    try {
      const res = await axios.get(`http://127.0.0.1:8001/student/${searchId}`);
      setData(res.data);
    } catch (err) {
      alert("Student ID not found in Database");
    } finally {
      setLoading(false);
    }
  };

  const handleSendEmail = async () => {
    try {
      await axios.post(`http://127.0.0.1:8001/alert/${data.profile.id}`);
      setEmailStatus("Alert sent successfully to guardian!");
    } catch (err) {
      setEmailStatus("Failed to send alert.");
    }
  };

  return (
    <div className="min-h-screen bg-slate-100 p-8 font-sans">
      <div className="max-w-4xl mx-auto">
        
        {/* Search Bar */}
        <div className="bg-white p-6 rounded-xl shadow-sm mb-6">
          <h1 className="text-2xl font-bold mb-4 text-slate-800">Student Database Search</h1>
          <form onSubmit={handleSearch} className="flex gap-4">
            <input 
              type="text" 
              value={searchId}
              onChange={(e) => setSearchId(e.target.value)}
              className="flex-1 p-3 border rounded-lg text-lg text-black outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="Enter Student ID (e.g. STU10045 or DEMO_USER_99)"
            />
            <button type="submit" className="bg-blue-600 text-white px-6 rounded-lg font-semibold hover:bg-blue-700 flex items-center gap-2">
              <Search className="w-5 h-5" /> Search
            </button>
          </form>
        </div>

        {/* Detailed Report Card */}
        {data && (
          <div className="bg-white rounded-xl shadow-lg overflow-hidden border border-slate-200 animate-in fade-in zoom-in-95 duration-300">
            {/* Header */}
            <div className={`p-6 text-white flex justify-between items-center ${
              data.prediction.risk_level_id === 2 ? 'bg-red-600' : 
              data.prediction.risk_level_id === 1 ? 'bg-yellow-500' : 'bg-green-600'
            }`}>
              <div>
                <h2 className="text-3xl font-bold">{data.profile.id}</h2>
                <p className="opacity-90">AI Risk Assessment: {data.prediction.risk_label}</p>
              </div>
              <div className="bg-white/20 p-3 rounded-lg text-center backdrop-blur-sm">
                <div className="text-2xl font-bold">{data.prediction.confidence}%</div>
                <div className="text-xs uppercase">Confidence</div>
              </div>
            </div>

            <div className="p-8 grid grid-cols-1 md:grid-cols-2 gap-8">
              
              {/* Academic Profile */}
              <div>
                <h3 className="text-lg font-semibold text-slate-700 mb-4 flex items-center gap-2">
                  <BookOpen className="w-5 h-5 text-blue-600" /> Academic Profile
                </h3>
                <div className="space-y-3">
                  <div className="flex justify-between p-3 bg-slate-50 rounded">
                    <span className="text-slate-600">Mathematics</span>
                    <span className="font-bold text-slate-800">{data.profile.scores.math}/100</span>
                  </div>
                  <div className="flex justify-between p-3 bg-slate-50 rounded">
                    <span className="text-slate-600">Reading</span>
                    <span className="font-bold text-slate-800">{data.profile.scores.reading}/100</span>
                  </div>
                  <div className="flex justify-between p-3 bg-slate-50 rounded">
                    <span className="text-slate-600">Writing</span>
                    <span className="font-bold text-slate-800">{data.profile.scores.writing}/100</span>
                  </div>
                </div>
              </div>

              {/* AI Narrative Report */}
              <div>
                <h3 className="text-lg font-semibold text-slate-700 mb-4 flex items-center gap-2">
                  <Brain className="w-5 h-5 text-blue-600" /> 
                  Comprehensive AI Analysis
                </h3>
                
                <div className="bg-blue-50 border-l-4 border-blue-500 p-6 rounded-r-lg shadow-sm mb-6">
                  <h4 className="font-bold text-slate-800 mb-2 uppercase text-xs tracking-wider">
                    System Generated Narrative
                  </h4>
                  <p className="text-slate-800 leading-relaxed text-lg">
                    {data.prediction.narrative}
                  </p>
                </div>

                <div className="bg-white p-4 rounded-lg border border-slate-200">
                  <span className="text-xs font-bold text-slate-400 uppercase">Sentiment Analysis</span>
                  <div className="mt-2 flex items-center gap-3">
                    <span className="text-2xl">
                      {data.prediction.sentiment_score < 0 ? "😟" : "🙂"}
                    </span>
                    <div className="w-full h-3 bg-slate-100 rounded-full overflow-hidden">
                       <div 
                         className={`h-full ${data.prediction.sentiment_score < 0 ? 'bg-red-500' : 'bg-green-500'}`}
                         style={{ width: `${Math.abs(data.prediction.sentiment_score * 100)}%` }}
                       ></div>
                    </div>
                    <span className="font-mono font-bold text-slate-600">
                      {data.prediction.sentiment_score}
                    </span>
                  </div>
                </div>
              </div>
            </div>

            {/* Actions Footer */}
            <div className="bg-slate-50 p-6 border-t border-slate-200 flex justify-between items-center">
              <div className="text-sm text-slate-500">
                Guardian Email: {data.profile.email}
              </div>
              
              {data.prediction.risk_level_id > 0 && (
                <button 
                  onClick={handleSendEmail}
                  className="bg-red-100 text-red-700 px-4 py-2 rounded-lg hover:bg-red-200 flex items-center gap-2 font-medium transition-colors"
                >
                  <Mail className="w-4 h-4" /> Send Automated Warning
                </button>
              )}
            </div>
            {emailStatus && (
               <div className="bg-green-100 text-green-800 p-2 text-center text-sm font-semibold">
                 {emailStatus}
               </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}