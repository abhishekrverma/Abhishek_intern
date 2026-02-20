import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import Link from "next/link";
import { GraduationCap, LayoutDashboard, Search, Home, Lock } from "lucide-react";

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "Student Early Warning System",
  description: "AI-Powered Academic Risk Prediction",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className={inter.className}>
        <nav className="bg-slate-900 text-white p-4 shadow-md sticky top-0 z-50">
          <div className="max-w-6xl mx-auto flex justify-between items-center">
            {/* Logo Area */}
            <div className="flex items-center gap-2 text-xl font-bold">
              <GraduationCap className="text-blue-400" />
              <span>EduGuard AI</span>
            </div>

            {/* Navigation Links */}
            <div className="flex gap-6 text-sm font-medium">
               {/* Link to Home (Login or Manual Entry) */}
              <Link href="/" className="flex items-center gap-2 hover:text-blue-400 transition">
                <Home size={16} /> Home
              </Link>
              
              {/* Link to Dashboard */}
              <Link href="/dashboard" className="flex items-center gap-2 hover:text-blue-400 transition">
                <LayoutDashboard size={16} /> Faculty Dashboard
              </Link>
              
              {/* Link to Search */}
              <Link href="/student-lookup" className="flex items-center gap-2 hover:text-blue-400 transition">
                <Search size={16} /> Student Lookup
              </Link>
            </div>
          </div>
        </nav>
        {children}
      </body>
    </html>
  );
}