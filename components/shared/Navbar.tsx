'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';
import { useI18n } from '@/lib/i18n/context';
import NotificationBell from './NotificationBell';
import MobileDrawer from './MobileDrawer';
import MobileBottomNav from './MobileBottomNav';
import { 
  GraduationCap, 
  LogOut, 
  Globe, 
  User, 
  BookOpen, 
  Calendar, 
  RefreshCw, 
  Compass, 
  Menu 
} from 'lucide-react';
import { Profile } from '@/types/database.types';

interface NavbarProps {
  profile?: Profile | null;
}

export default function Navbar({ profile }: NavbarProps) {
  const router = useRouter();
  const { language, setLanguage, t } = useI18n();
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);
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
    <>
      <header className="sticky top-0 z-40 w-full border-b border-slate-200 bg-white/95 backdrop-blur-md">
        <div className="max-w-7xl mx-auto px-3 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          {/* Left: Hamburger (Mobile) + Brand */}
          <div className="flex items-center gap-2 sm:gap-3">
            {profile && (
              <button
                type="button"
                onClick={() => setIsDrawerOpen(true)}
                aria-label="Open navigation menu"
                className="md:hidden p-2 text-slate-600 hover:text-slate-900 hover:bg-slate-100 rounded-xl transition min-h-[44px] min-w-[44px] flex items-center justify-center -ml-1"
              >
                <Menu className="w-5 h-5" />
              </button>
            )}

            <Link 
              href={getDashboardHref()} 
              className="flex items-center gap-2 font-bold text-base sm:text-lg text-indigo-600 min-h-[44px]"
            >
              <div className="p-1.5 sm:p-2 bg-indigo-50 rounded-xl text-indigo-600 flex-shrink-0">
                <GraduationCap className="w-5 h-5" />
              </div>
              <span className="tracking-tight text-slate-900 font-extrabold whitespace-nowrap">
                {t('appName')}
              </span>
            </Link>

            {profile && (
              <span className="hidden lg:inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold bg-indigo-50 text-indigo-700 capitalize">
                {profile.role.replace('_', ' ')}
              </span>
            )}
          </div>

          {/* Center navigation for students on desktop/tablet */}
          {profile?.role === 'student' && (
            <nav className="hidden md:flex items-center gap-1 text-sm font-medium text-slate-600">
              <Link 
                href="/student" 
                className="px-3 py-2 rounded-xl hover:bg-slate-100 hover:text-slate-900 transition flex items-center gap-1.5 min-h-[44px]"
              >
                <BookOpen className="w-4 h-4 text-slate-400" />
                <span>Overview</span>
              </Link>
              <Link 
                href="/student/study-plan" 
                className="px-3 py-2 rounded-xl hover:bg-slate-100 hover:text-slate-900 transition flex items-center gap-1.5 min-h-[44px]"
              >
                <Calendar className="w-4 h-4 text-slate-400" />
                <span>Study Planner</span>
              </Link>
              <Link 
                href="/student/revision" 
                className="px-3 py-2 rounded-xl hover:bg-slate-100 hover:text-slate-900 transition flex items-center gap-1.5 min-h-[44px]"
              >
                <RefreshCw className="w-4 h-4 text-slate-400" />
                <span>Revision</span>
              </Link>
              <Link 
                href="/student/career" 
                className="px-3 py-2 rounded-xl hover:bg-slate-100 hover:text-slate-900 transition flex items-center gap-1.5 min-h-[44px]"
              >
                <Compass className="w-4 h-4 text-slate-400" />
                <span>Career Guide</span>
              </Link>
            </nav>
          )}

          {/* Right actions */}
          <div className="flex items-center gap-1.5 sm:gap-3">
            {/* Language Switcher */}
            <button
              onClick={() => setLanguage(language === 'en' ? 'hi' : 'en')}
              className="flex items-center gap-1 sm:gap-1.5 px-2.5 py-1.5 text-xs font-semibold text-slate-600 hover:text-slate-900 rounded-xl border border-slate-200 hover:bg-slate-50 transition min-h-[40px]"
              title="Switch Language / भाषा बदलें"
            >
              <Globe className="w-3.5 h-3.5" />
              <span>{language === 'en' ? 'हिंदी' : 'EN'}</span>
            </button>

            {profile ? (
              <>
                <NotificationBell userId={profile.id} />

                <div className="flex items-center gap-2 pl-1.5 sm:pl-2 sm:border-l border-slate-200">
                  <div className="hidden sm:flex flex-col text-right">
                    <span className="text-xs font-semibold text-slate-800 leading-tight truncate max-w-[120px]">
                      {profile.full_name}
                    </span>
                    <span className="text-[10px] text-slate-400 truncate max-w-[120px]">
                      {profile.email}
                    </span>
                  </div>

                  <div className="w-8 h-8 rounded-full bg-indigo-600 text-white flex items-center justify-center font-bold text-xs uppercase shadow-xs flex-shrink-0">
                    {profile.full_name ? profile.full_name.charAt(0) : <User className="w-4 h-4" />}
                  </div>

                  <button
                    onClick={handleLogout}
                    className="hidden sm:flex p-2 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-xl transition min-h-[44px] min-w-[44px] items-center justify-center"
                    title={t('logout')}
                    aria-label="Logout"
                  >
                    <LogOut className="w-4 h-4" />
                  </button>
                </div>
              </>
            ) : (
              <div className="flex items-center gap-2">
                <Link
                  href="/login"
                  className="text-xs font-semibold px-3 py-2 text-slate-700 hover:text-slate-900 hover:bg-slate-100 rounded-xl transition min-h-[40px] flex items-center"
                >
                  {t('login')}
                </Link>
                <Link
                  href="/register"
                  className="text-xs font-semibold px-3.5 py-2 bg-indigo-600 text-white rounded-xl hover:bg-indigo-700 shadow-xs transition min-h-[40px] flex items-center whitespace-nowrap"
                >
                  {t('register')}
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
      />

      {/* Mobile Persistent Bottom Tab Bar (Students) */}
      <MobileBottomNav />
    </>
  );
}
