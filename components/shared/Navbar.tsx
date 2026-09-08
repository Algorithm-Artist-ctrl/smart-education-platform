'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';
import { useI18n } from '@/lib/i18n/context';
import NotificationBell from './NotificationBell';
import { GraduationCap, LogOut, Globe, User, BookOpen, CheckSquare, Sparkles } from 'lucide-react';
import { Profile } from '@/types/database.types';

interface NavbarProps {
  profile?: Profile | null;
}

export default function Navbar({ profile }: NavbarProps) {
  const router = useRouter();
  const { language, setLanguage, t } = useI18n();
  const supabase = createClient();

  const handleLogout = async () => {
    await supabase.auth.signOut();
    router.push('/login');
    router.refresh();
  };

  const getDashboardHref = () => {
    if (!profile) return '/';
    if (profile.role === 'teacher') return '/teacher';
    if (profile.role === 'parent') return '/parent';
    if (profile.role === 'admin') return '/admin';
    if (profile.role === 'super_admin') return '/super-admin';
    return '/student';
  };

  return (
    <header className="sticky top-0 z-40 w-full border-b border-slate-200 bg-white/95 backdrop-blur">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
        {/* Brand */}
        <div className="flex items-center gap-3">
          <Link href={getDashboardHref()} className="flex items-center gap-2.5 font-bold text-lg text-indigo-600">
            <div className="p-2 bg-indigo-50 rounded-lg text-indigo-600">
              <GraduationCap className="w-5 h-5" />
            </div>
            <span className="tracking-tight text-slate-900">{t('appName')}</span>
          </Link>

          {profile && (
            <span className="hidden sm:inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold bg-indigo-50 text-indigo-700 capitalize">
              {profile.role.replace('_', ' ')}
            </span>
          )}
        </div>

        {/* Center navigation for students */}
        {profile?.role === 'student' && (
          <nav className="hidden md:flex items-center gap-1 text-sm font-medium text-slate-600">
            <Link href="/student" className="px-3 py-1.5 rounded-lg hover:bg-slate-100 hover:text-slate-900 transition flex items-center gap-1.5">
              <BookOpen className="w-4 h-4 text-slate-400" />
              <span>Overview</span>
            </Link>
            <Link href="/student/study-plan" className="px-3 py-1.5 rounded-lg hover:bg-slate-100 hover:text-slate-900 transition flex items-center gap-1.5">
              <CheckSquare className="w-4 h-4 text-slate-400" />
              <span>Study Planner</span>
            </Link>
            <Link href="/student/career" className="px-3 py-1.5 rounded-lg hover:bg-slate-100 hover:text-slate-900 transition flex items-center gap-1.5">
              <Sparkles className="w-4 h-4 text-slate-400" />
              <span>Career Guide</span>
            </Link>
          </nav>
        )}

        {/* Right actions */}
        <div className="flex items-center gap-3">
          {/* Language Switcher */}
          <button
            onClick={() => setLanguage(language === 'en' ? 'hi' : 'en')}
            className="flex items-center gap-1.5 px-2.5 py-1 text-xs font-medium text-slate-600 hover:text-slate-900 rounded-md border border-slate-200 hover:bg-slate-50 transition"
            title="Switch Language"
          >
            <Globe className="w-3.5 h-3.5" />
            <span>{language === 'en' ? 'हिंदी' : 'English'}</span>
          </button>

          {profile ? (
            <>
              <NotificationBell userId={profile.id} />

              <div className="flex items-center gap-2 pl-2 border-l border-slate-200">
                <div className="hidden sm:flex flex-col text-right">
                  <span className="text-xs font-medium text-slate-800 leading-tight">
                    {profile.full_name}
                  </span>
                  <span className="text-[10px] text-slate-400 truncate max-w-[120px]">
                    {profile.email}
                  </span>
                </div>

                <div className="w-8 h-8 rounded-full bg-indigo-600 text-white flex items-center justify-center font-bold text-xs uppercase shadow-sm">
                  {profile.full_name ? profile.full_name.charAt(0) : <User className="w-4 h-4" />}
                </div>

                <button
                  onClick={handleLogout}
                  className="p-1.5 text-slate-500 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition"
                  title={t('logout')}
                >
                  <LogOut className="w-4 h-4" />
                </button>
              </div>
            </>
          ) : (
            <div className="flex items-center gap-2">
              <Link
                href="/login"
                className="text-xs font-semibold px-3 py-1.5 text-slate-700 hover:text-slate-900 hover:bg-slate-100 rounded-lg transition"
              >
                {t('login')}
              </Link>
              <Link
                href="/register"
                className="text-xs font-semibold px-3.5 py-1.5 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 shadow-sm transition"
              >
                {t('register')}
              </Link>
            </div>
          )}
        </div>
      </div>
    </header>
  );
}
