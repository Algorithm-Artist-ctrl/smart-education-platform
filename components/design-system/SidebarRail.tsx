// components/design-system/SidebarRail.tsx
'use client';

import React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { 
  Home, 
  Map, 
  Target, 
  BookOpen, 
  Trophy, 
  Compass, 
  Calendar, 
  RefreshCw,
  Palette,
  Globe,
  Layers
} from 'lucide-react';

export function SidebarRail({ className = '' }: { className?: string }) {
  const pathname = usePathname();

  const navItems = [
    { href: '/student', label: 'Home', icon: <Home className="w-5 h-5" /> },
    { href: '/student/map', label: 'Learning Map', icon: <Map className="w-5 h-5" /> },
    { href: '/student/creativity', label: 'Creativity Lab', icon: <Palette className="w-5 h-5" /> },
    { href: '/student/missions', label: 'Life Missions', icon: <Globe className="w-5 h-5" /> },
    { href: '/student/portfolio', label: 'Portfolio', icon: <Layers className="w-5 h-5" /> },
    { href: '/student/quests', label: 'Quests', icon: <Target className="w-5 h-5" /> },
    { href: '/student/subjects', label: 'Subjects', icon: <BookOpen className="w-5 h-5" /> },
    { href: '/student/revision', label: 'Revision', icon: <RefreshCw className="w-5 h-5" /> },
    { href: '/student/career', label: 'Career', icon: <Compass className="w-5 h-5" /> },
  ];

  return (
    <aside
      className={`hidden lg:flex flex-col items-center py-4 px-2 w-16 shrink-0 rounded-2xl bg-slate-900/70 border border-white/10 backdrop-blur-xl gap-2 self-start sticky top-20 shadow-xl shadow-black/20 ${className}`}
    >
      {navItems.map((item) => {
        const isActive = pathname === item.href;
        return (
          <Link
            key={item.href}
            href={item.href}
            title={item.label}
            className={`relative flex items-center justify-center w-11 h-11 rounded-xl transition-all duration-200 group ${
              isActive
                ? 'bg-gradient-to-tr from-blue-600 to-indigo-600 text-white shadow-lg shadow-indigo-500/30'
                : 'text-slate-400 hover:text-white hover:bg-white/5'
            }`}
          >
            {item.icon}

            {/* Hover tooltip pill */}
            <span className="absolute left-14 px-2.5 py-1 rounded-lg bg-slate-900 text-white text-xs font-semibold whitespace-nowrap border border-white/10 shadow-xl opacity-0 group-hover:opacity-100 pointer-events-none transition-opacity duration-200 z-50">
              {item.label}
            </span>
          </Link>
        );
      })}
    </aside>
  );
}

export default SidebarRail;
