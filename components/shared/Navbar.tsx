// components/shared/Navbar.tsx
'use client';

import { useState } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';
import { useI18n } from '@/lib/i18n/context';
import NotificationBell from './NotificationBell';
import MobileDrawer from './MobileDrawer';
import MobileBottomNav from './MobileBottomNav';
import AccessibilityBar from './AccessibilityBar';
import { 
  GraduationCap, 
  LogOut, 
  Globe, 
  User, 
  BookOpen, 
  Calendar, 
  RefreshCw, 
  Compass, 
  Menu,
  Map,
  Sparkles,
  Search,
  Flame,
  Coins,
  Award
} from 'lucide-react';
import { Profile } from '@/types/database.types';

interface NavbarProps {
  profile?: Profile | null;
}

export default function Navbar({ profile }: NavbarProps) {
  const router = useRouter();
  const pathname = usePathname();
  const { language, setLanguage, t } = useI18n();
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);
  const supabase = createClient();

  const handleLogout = async () => {
    try {
      await fetch('/api/auth/logout', { method: 'POST' });
    } catch {}
    await supabase.auth.signOut();
    window.location.href = '/login';
  };

  const getDashboardHref = () => {
    if (!profile) return '/';
    if (profile.role === 'teacher') return '/teacher';
    if (profile.role === 'parent') return '/parent';
    if (profile.role === 'admin') return '/admin';
    if (profile.role === 'super_admin') return '/super-admin';
    return '/student';
  };

  const navLinks = [
    { href: '/student', label: t.navHome || 'Home', prefetch: true },
    { href: '/student/map', label: t.navLearningMap || 'Learning Map', prefetch: true },
    { href: '/student/quests', label: t.navQuests || 'Quests', prefetch: false },
    { href: '/student/learning', label: t.navSubjects || 'Subjects', prefetch: true },
    { href: '/student/revision', label: t.navRevision || 'Revision', prefetch: false },
    { href: '/student/career', label: t.navCareer || 'Career', prefetch: false },
  ];

  return (
    <>
      <header className="sticky top-0 z-40 w-full border-b border-white/10 bg-slate-950/80 backdrop-blur-xl">
        <div className="max-w-7xl mx-auto px-3 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          {/* Left: Hamburger (Mobile) + Brand */}
          <div className="flex items-center gap-2 sm:gap-4">
            {profile && (
              <button
                type="button"
                onClick={() => setIsDrawerOpen(true)}
                aria-label="Open navigation menu"
                className="md:hidden p-2 text-slate-300 hover:text-white hover:bg-white/5 rounded-xl transition min-h-[44px] min-w-[44px] flex items-center justify-center -ml-1"
              >
                <Menu className="w-5 h-5" />
              </button>
            )}

            <Link 
              href={getDashboardHref()} 
              className="flex items-center gap-2.5 font-bold text-base sm:text-lg min-h-[44px] group"
            >
              <div className="w-9 h-9 bg-gradient-to-tr from-blue-600 via-indigo-600 to-purple-600 rounded-xl flex items-center justify-center text-white shadow-lg shadow-indigo-600/30 group-hover:scale-105 transition-transform shrink-0">
                <GraduationCap className="w-5 h-5" />
              </div>
              <div className="flex flex-col">
                <span className="tracking-tight text-white font-black text-base sm:text-lg leading-none">
                  Smart Edu
                </span>
                <span className="text-[10px] text-cyan-400 font-semibold tracking-wider uppercase hidden sm:block">
                  Learn · Play · Grow
                </span>
              </div>
            </Link>

            {profile && (
              <span className="hidden xl:inline-flex items-center px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-indigo-500/15 text-indigo-300 border border-indigo-500/30 capitalize">
                {profile.role.replace('_', ' ')}
              </span>
            )}
          </div>

          {/* Center navigation for students on desktop (Reference Screen 2) */}
          {profile?.role === 'student' && (
            <nav className="hidden md:flex items-center gap-1 text-xs font-bold text-slate-300">
              {navLinks.map((link) => {
                const isActive = pathname === link.href;
                return (
                  <Link
                    key={link.href}
                    href={link.href}
                    prefetch={link.prefetch}
                    className={`px-3 py-2 rounded-xl transition-all active:scale-95 min-h-[40px] flex items-center gap-1.5 ${
                      isActive
                        ? 'bg-gradient-to-r from-blue-600/20 to-indigo-600/20 text-white border border-indigo-500/30 shadow-sm shadow-indigo-500/20'
                        : 'hover:bg-white/5 hover:text-white'
                    }`}
                  >
                    <span>{link.label}</span>
                  </Link>
                );
              })}
            </nav>
          )}

          {/* Right Action Tools matching reference screens 2-12 */}
          <div className="flex items-center gap-2 sm:gap-2.5">
            {/* Quick Search */}
            <button
              type="button"
              aria-label="Search"
              className="p-2 text-slate-400 hover:text-white hover:bg-white/5 rounded-xl transition min-h-[40px] min-w-[40px] flex items-center justify-center"
            >
              <Search className="w-4 h-4" />
            </button>

            {/* Notification Bell */}
            {profile && <NotificationBell userId={profile.id} />}

            {/* Quick Settings / Flame */}
            <Link
              href="/student/achievements"
              aria-label="Achievements & Badges"
              className="p-2 text-slate-400 hover:text-amber-400 hover:bg-white/5 rounded-xl transition min-h-[40px] min-w-[40px] flex items-center justify-center"
            >
              <Flame className="w-4 h-4 text-orange-400" />
            </Link>

            {/* Accessibility Controls */}
            <AccessibilityBar />

            {/* Bilingual Switcher (English + Hindi) */}
            <button
              onClick={async () => {
                const nextLang = language === 'en' ? 'hi' : 'en';
                setLanguage(nextLang);
                if (typeof document !== 'undefined') {
                  document.cookie = `smartedu_lang=${nextLang}; path=/; max-age=31536000; SameSite=Lax`;
                }
                if (profile?.id) {
                  try {
                    await supabase.from('student_profiles').update({ preferred_language: nextLang }).eq('id', profile.id);
                  } catch {}
                }
                router.refresh();
              }}
              aria-label="Toggle language"
              className="hidden sm:flex px-2.5 py-1.5 rounded-xl bg-white/5 hover:bg-white/10 text-slate-300 hover:text-white text-xs font-bold transition border border-white/10 items-center gap-1.5 min-h-[38px] cursor-pointer"
            >
              <Globe className="w-3.5 h-3.5 text-cyan-400" />
              <span>{language === 'en' ? 'EN' : 'HI'}</span>
            </button>

            {/* User Profile with Green Online Indicator Dot / Logout */}
            {profile ? (
              <div className="flex items-center gap-2 pl-1 border-l border-white/10">
                <Link href="/student/profile" className="relative group">
                  <div className="w-8 h-8 rounded-full bg-gradient-to-tr from-blue-600 to-indigo-600 border border-indigo-400/40 flex items-center justify-center text-white text-xs font-bold shrink-0 shadow-md">
                    {profile.full_name?.charAt(0) || 'U'}
                  </div>
                  {/* Green Online Dot */}
                  <span className="absolute bottom-0 right-0 w-2.5 h-2.5 rounded-full bg-emerald-500 border-2 border-slate-950" />
                </Link>
                <div className="hidden lg:flex flex-col text-left">
                  <span className="text-xs font-bold text-white line-clamp-1 max-w-[110px]">
                    {profile.full_name?.split(' ')[0]}
                  </span>
                  <span className="text-[10px] text-slate-400 capitalize">
                    {profile.role.replace('_', ' ')}
                  </span>
                </div>
                <button
                  onClick={handleLogout}
                  aria-label="Log out"
                  className="p-2 text-slate-400 hover:text-rose-400 hover:bg-rose-500/10 rounded-xl transition min-h-[40px] min-w-[40px] flex items-center justify-center"
                  title="Sign Out"
                >
                  <LogOut className="w-4 h-4" />
                </button>
              </div>
            ) : (
              <div className="flex items-center gap-2">
                <Link
                  href="/login"
                  className="px-3.5 py-2 text-xs font-bold text-slate-300 hover:text-white transition min-h-[44px] flex items-center"
                >
                  Log In
                </Link>
                <Link
                  href="/register"
                  className="px-4 py-2 rounded-xl bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white text-xs font-bold shadow-md shadow-indigo-600/30 transition min-h-[44px] flex items-center"
                >
                  Sign Up
                </Link>
              </div>
            )}
          </div>
        </div>
      </header>

      {/* Mobile Off-Canvas Drawer */}
      <MobileDrawer
        isOpen={isDrawerOpen}
        onClose={() => setIsDrawerOpen(false)}
        profile={profile}
        onLogout={handleLogout}
      />

      {/* Mobile Bottom Bar for students */}
      {profile?.role === 'student' && <MobileBottomNav />}
    </>
  );
}
