"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { GraduationCap, LayoutDashboard, Search, Home, UserPlus } from "lucide-react";

export default function Navbar() {
  const pathname = usePathname();

  const navLinks = [
    { href: "/", label: "Register", icon: UserPlus },
    { href: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
    { href: "/student-lookup", label: "Student Lookup", icon: Search },
    { href: "/login", label: "Login", icon: Home },
  ];

  return (
    <nav className="bg-slate-900/95 backdrop-blur-md text-white p-4 shadow-lg sticky top-0 z-50 border-b border-slate-800">
      <div className="max-w-7xl mx-auto flex justify-between items-center">
        {/* Logo Area */}
        <Link href="/" className="flex items-center gap-3 group">
          <div className="p-2 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-xl shadow-lg group-hover:shadow-blue-500/25 transition-all duration-300">
            <GraduationCap className="w-6 h-6 text-white" />
          </div>
          <div>
            <span className="text-xl font-bold tracking-tight">EduGuard</span>
            <span className="text-blue-400 font-bold ml-1">AI</span>
            <div className="text-[10px] text-slate-400 font-medium tracking-widest uppercase -mt-1">Early Warning System</div>
          </div>
        </Link>

        {/* Navigation Links */}
        <div className="flex gap-1 text-sm font-medium">
          {navLinks.map((link) => {
            const isActive = pathname === link.href;
            const Icon = link.icon;
            return (
              <Link
                key={link.href}
                href={link.href}
                className={`nav-link flex items-center gap-2 px-4 py-2 rounded-lg transition-all duration-200 ${
                  isActive
                    ? "nav-link-active bg-slate-800 text-blue-400"
                    : "text-slate-300 hover:text-white hover:bg-slate-800/50"
                }`}
              >
                <Icon size={16} />
                {link.label}
              </Link>
            );
          })}
        </div>
      </div>
    </nav>
  );
}
