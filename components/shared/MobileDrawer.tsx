// components/shared/MobileDrawer.tsx
'use client';

import { useEffect } from 'react';
import Link from 'next/link';
import { useRouter, usePathname } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';
import { useI18n } from '@/lib/i18n/context';
import { Profile } from '@/types/database.types';
import { 
  X, 
  Home, 
  Map, 
  Zap, 
  BookOpen, 
  Calendar, 
  RefreshCw, 
  Compass, 
  GraduationCap, 
  Trophy, 
  Award, 
  LogOut, 
  Globe,
  Building2,
  Heart,
  FileCheck,
  ShieldCheck
} from 'lucide-react';

interface MobileDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  profile?: Profile | null;
  onLogout?: () => void;
}

export default function MobileDrawer({ isOpen, onClose, profile, onLogout }: MobileDrawerProps) {
  const pathname = usePathname();
  const router = useRouter();
  const { language, setLanguage } = useI18n();
  const supabase = createClient();

  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => {
      document.body.style.overflow = '';
    };
  }, [isOpen]);

  if (!isOpen) return null;

  const handleLogout = async () => {
    onClose();
    if (onLogout) {
      onLogout();
      return;
    }
    try {
      await fetch('/api/auth/logout', { method: 'POST' });
    } catch {}
    await supabase.auth.signOut();
    window.location.href = '/login';
  };

  const getRoleLinks = () => {
    if (!profile) return [];

    if (profile.role === 'teacher') {
      return [
        { label: 'Teacher Dashboard', href: '/teacher', icon: FileCheck },
      ];
    }
    if (profile.role === 'parent') {
      return [
        { label: 'Parent Portal', href: '/parent', icon: Heart },
      ];
    }
    if (profile.role === 'admin') {
      return [
        { label: 'Institution Admin', href: '/admin', icon: Building2 },
      ];
    }
    if (profile.role === 'super_admin') {
      return [
        { label: 'Super Admin Center', href: '/super-admin', icon: ShieldCheck },
      ];
    }
    // Default Student: Full Gamified Navigation
    return [
      { label: 'Home Dashboard', href: '/student', icon: Home },
      { label: 'Learning Map', href: '/student/map', icon: Map },
      { label: 'Quests & Missions', href: '/student/quests', icon: Zap },
      { label: 'Subjects & Worlds', href: '/student/subjects', icon: BookOpen },
      { label: 'Revision Arena', href: '/student/revision', icon: RefreshCw },
      { label: 'Achievements & Badges', href: '/student/achievements', icon: Award },
      { label: 'Leaderboard', href: '/student/leaderboard', icon: Trophy },
      { label: 'Mission Planner', href: '/student/study-plan', icon: Calendar },
      { label: 'Career Galaxy', href: '/student/career', icon: Compass },
    ];
  };

  const navLinks = getRoleLinks();

  return (
    <div className="fixed inset-0 z-50 md:hidden flex">
      {/* Backdrop */}
      <div 
        onClick={onClose}
        className="fixed inset-0 bg-slate-950/80 backdrop-blur-sm transition-opacity duration-300" 
        aria-hidden="true"
      />

      {/* Slide-out Menu */}
      <div className="relative w-4/5 max-w-xs bg-slate-950 border-r border-white/10 h-full shadow-2xl flex flex-col justify-between z-10 animate-in slide-in-from-left duration-200">
        <div>
          {/* Drawer Header */}
          <div className="p-5 border-b border-white/10 flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <div className="w-9 h-9 bg-gradient-to-tr from-blue-600 to-indigo-600 text-white rounded-xl flex items-center justify-center shadow-lg shadow-indigo-600/30">
                <GraduationCap className="w-5 h-5" />
              </div>
              <span className="font-extrabold text-base text-white tracking-tight">Smart Edu</span>
            </div>

            <button
              onClick={onClose}
              aria-label="Close navigation menu"
              className="p-2 text-slate-400 hover:text-white hover:bg-white/5 rounded-xl transition min-h-[44px] min-w-[44px] flex items-center justify-center"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* User Card */}
          {profile && (
            <div className="px-5 py-4 bg-slate-900/60 border-b border-white/10">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-gradient-to-tr from-blue-600 to-indigo-600 text-white flex items-center justify-center font-bold text-sm uppercase shrink-0">
                  {profile.full_name ? profile.full_name.charAt(0) : 'U'}
                </div>
                <div className="overflow-hidden">
                  <div className="text-sm font-bold text-white truncate">
                    {profile.full_name}
                  </div>
                  <div className="text-xs text-slate-400 truncate">
                    {profile.email}
                  </div>
                  <span className="inline-block mt-1 px-2 py-0.5 rounded-full text-[10px] font-bold uppercase bg-indigo-500/20 text-indigo-300 border border-indigo-500/30">
                    {profile.role.replace('_', ' ')}
                  </span>
                </div>
              </div>
            </div>
          )}

          {/* Navigation Links */}
          <nav className="p-4 space-y-1.5 overflow-y-auto max-h-[calc(100vh-270px)]">
            {navLinks.map((link) => {
              const Icon = link.icon;
              const isActive = pathname === link.href;

              return (
                <Link
                  key={link.href}
                  href={link.href}
                  onClick={onClose}
                  className={`flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-xs font-bold transition-all min-h-[44px] ${
                    isActive
                      ? 'bg-gradient-to-r from-blue-600/30 to-indigo-600/30 text-cyan-300 border border-indigo-500/40 shadow-sm shadow-indigo-500/20'
                      : 'text-slate-300 hover:text-white hover:bg-white/5'
                  }`}
                >
                  <Icon className={`w-4 h-4 ${isActive ? 'text-cyan-400' : 'text-slate-400'}`} />
                  <span>{link.label}</span>
                </Link>
              );
            })}
          </nav>
        </div>

        {/* Bottom Drawer Actions */}
        <div className="p-4 border-t border-white/10 space-y-2 bg-slate-900/60 pb-safe">
          <button
            onClick={() => setLanguage(language === 'en' ? 'hi' : 'en')}
            className="w-full flex items-center justify-between px-3.5 py-2.5 rounded-xl bg-white/5 text-slate-300 hover:text-white text-xs font-bold transition min-h-[44px]"
          >
            <span className="flex items-center gap-2">
              <Globe className="w-4 h-4 text-cyan-400" />
              Language
            </span>
            <span className="text-[11px] font-bold text-cyan-400 uppercase">
              {language === 'en' ? 'English' : 'हिंदी'}
            </span>
          </button>

          {profile && (
            <button
              onClick={handleLogout}
              className="w-full flex items-center gap-2 px-3.5 py-2.5 rounded-xl text-rose-400 hover:bg-rose-500/10 text-xs font-bold transition min-h-[44px]"
            >
              <LogOut className="w-4 h-4" />
              Sign Out
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
