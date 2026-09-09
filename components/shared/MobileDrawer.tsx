'use client';

import { useEffect } from 'react';
import Link from 'next/link';
import { useRouter, usePathname } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';
import { useI18n } from '@/lib/i18n/context';
import { Profile } from '@/types/database.types';
import { 
  X, 
  BookOpen, 
  Calendar, 
  RefreshCw, 
  Compass, 
  GraduationCap, 
  Users, 
  FileCheck, 
  ShieldCheck, 
  LogOut, 
  Globe,
  Building2,
  Heart
} from 'lucide-react';

interface MobileDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  profile?: Profile | null;
}

export default function MobileDrawer({ isOpen, onClose, profile }: MobileDrawerProps) {
  const pathname = usePathname();
  const router = useRouter();
  const { language, setLanguage, t } = useI18n();
  const supabase = createClient();

  // Prevent background scrolling when drawer is open
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
    await supabase.auth.signOut();
    router.push('/login');
    router.refresh();
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
    // Default Student
    return [
      { label: 'Overview', href: '/student', icon: BookOpen },
      { label: 'Daily Planner', href: '/student/study-plan', icon: Calendar },
      { label: 'Revision Center', href: '/student/revision', icon: RefreshCw },
      { label: 'Career Guidance', href: '/student/career', icon: Compass },
    ];
  };

  const navLinks = getRoleLinks();

  return (
    <div className="fixed inset-0 z-50 md:hidden flex">
      {/* Backdrop */}
      <div 
        onClick={onClose}
        className="fixed inset-0 bg-slate-900/40 backdrop-blur-xs transition-opacity duration-300" 
        aria-hidden="true"
      />

      {/* Slide-out Menu */}
      <div className="relative w-4/5 max-w-xs bg-white h-full shadow-2xl flex flex-col justify-between z-10 animate-in slide-in-from-left duration-200">
        {/* Drawer Header */}
        <div className="p-5 border-b border-slate-100 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="p-2 bg-indigo-50 text-indigo-600 rounded-xl">
              <GraduationCap className="w-5 h-5" />
            </div>
            <span className="font-bold text-base text-slate-900 tracking-tight">Smart Edu</span>
          </div>

          <button
            onClick={onClose}
            aria-label="Close navigation menu"
            className="p-2 text-slate-400 hover:text-slate-700 hover:bg-slate-100 rounded-xl transition min-h-[44px] min-w-[44px] flex items-center justify-center"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* User Card */}
        {profile && (
          <div className="px-5 py-4 bg-slate-50 border-b border-slate-100">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-indigo-600 text-white flex items-center justify-center font-bold text-sm uppercase flex-shrink-0">
                {profile.full_name ? profile.full_name.charAt(0) : 'U'}
              </div>
              <div className="overflow-hidden">
                <div className="text-sm font-bold text-slate-900 truncate">
                  {profile.full_name}
                </div>
                <div className="text-xs text-slate-500 truncate">
                  {profile.email}
                </div>
                <span className="inline-block mt-1 px-2 py-0.5 rounded-full text-[10px] font-bold uppercase bg-indigo-100 text-indigo-800">
                  {profile.role.replace('_', ' ')}
                </span>
              </div>
            </div>
          </div>
        )}

        {/* Navigation Items */}
        <div className="flex-1 overflow-y-auto py-4 px-3 space-y-1">
          {navLinks.map((link) => {
            const Icon = link.icon;
            const isActive = pathname === link.href;
            return (
              <Link
                key={link.href}
                href={link.href}
                onClick={onClose}
                className={`flex items-center gap-3 px-3.5 py-3 rounded-xl text-sm font-semibold transition min-h-[48px] ${
                  isActive
                    ? 'bg-indigo-50 text-indigo-700'
                    : 'text-slate-700 hover:bg-slate-50 hover:text-slate-900'
                }`}
              >
                <Icon className={`w-5 h-5 ${isActive ? 'text-indigo-600' : 'text-slate-400'}`} />
                <span>{link.label}</span>
              </Link>
            );
          })}
        </div>

        {/* Footer Actions */}
        <div className="p-4 border-t border-slate-100 space-y-2.5 pb-safe">
          {/* Language Switcher */}
          <button
            onClick={() => setLanguage(language === 'en' ? 'hi' : 'en')}
            className="w-full flex items-center justify-between px-3.5 py-2.5 rounded-xl border border-slate-200 text-xs font-semibold text-slate-700 hover:bg-slate-50 transition min-h-[44px]"
          >
            <span className="flex items-center gap-2">
              <Globe className="w-4 h-4 text-slate-500" />
              <span>Language / भाषा</span>
            </span>
            <span className="px-2 py-0.5 bg-slate-100 rounded text-indigo-600 font-bold">
              {language === 'en' ? 'English' : 'हिंदी'}
            </span>
          </button>

          {profile && (
            <button
              onClick={handleLogout}
              className="w-full flex items-center justify-center gap-2 px-4 py-2.5 text-xs font-semibold text-rose-600 bg-rose-50 hover:bg-rose-100 rounded-xl transition min-h-[44px]"
            >
              <LogOut className="w-4 h-4" />
              <span>{t('logout')}</span>
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
