// components/shared/MobileBottomNav.tsx
'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useI18n } from '@/lib/i18n/context';
import { Home, Map, Zap, Sparkles, User } from 'lucide-react';

export default function MobileBottomNav() {
  const pathname = usePathname();
  const { t } = useI18n();

  const handleNavClick = (e: React.MouseEvent, isNova?: boolean) => {
    if (isNova) {
      e.preventDefault();
      if (typeof window !== 'undefined') {
        window.dispatchEvent(new CustomEvent('open-nova-mentor'));
      }
    }
  };

  // Only render for student routes
  if (!pathname.startsWith('/student')) {
    return null;
  }

  const navItems = [
    {
      label: t.navHome || 'Home',
      href: '/student',
      icon: Home,
      isActive: pathname === '/student',
    },
    {
      label: t.navLearningMap || 'Map',
      href: '/student/map',
      icon: Map,
      isActive: pathname.startsWith('/student/map'),
    },
    {
      label: t.navQuests || 'Quests',
      href: '/student/quests',
      icon: Zap,
      isActive: pathname.startsWith('/student/quests'),
    },
    {
      label: 'NOVA',
      href: '#nova',
      icon: Sparkles,
      isActive: false,
      isNova: true,
    },
    {
      label: t.navProfile || 'Profile',
      href: '/student/achievements',
      icon: User,
      isActive: pathname.startsWith('/student/achievements'),
    },
  ];

  return (
    <nav 
      aria-label="Mobile Bottom Navigation"
      className="fixed bottom-0 left-0 right-0 z-40 bg-slate-950/95 backdrop-blur-xl border-t border-white/10 md:hidden pb-safe shadow-[0_-4px_20px_rgba(0,0,0,0.5)]"
    >
      <div className="grid grid-cols-5 h-14 max-w-lg mx-auto">
        {navItems.map((item) => {
          const Icon = item.icon;
          return (
            <Link
              key={item.href}
              href={item.href}
              onClick={(e) => handleNavClick(e, item.isNova)}
              className={`flex flex-col items-center justify-center min-h-[48px] py-1 transition-colors relative ${
                item.isActive
                  ? 'text-cyan-400 font-bold'
                  : 'text-slate-400 hover:text-white font-medium'
              }`}
            >
              {item.isActive && (
                <span className="absolute top-0 w-8 h-0.5 bg-gradient-to-r from-cyan-400 to-indigo-500 rounded-full shadow-sm shadow-cyan-400" />
              )}
              <Icon className={`w-5 h-5 transition-transform ${item.isActive ? 'scale-110 text-cyan-300' : ''}`} />
              <span className="text-[10px] mt-0.5 tracking-tight">{item.label}</span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
