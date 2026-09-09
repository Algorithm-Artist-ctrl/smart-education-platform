'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { BookOpen, Calendar, RefreshCw, Compass } from 'lucide-react';

export default function MobileBottomNav() {
  const pathname = usePathname();

  // Only render for student routes
  if (!pathname.startsWith('/student')) {
    return null;
  }

  const navItems = [
    {
      label: 'Overview',
      href: '/student',
      icon: BookOpen,
      isActive: pathname === '/student',
    },
    {
      label: 'Planner',
      href: '/student/study-plan',
      icon: Calendar,
      isActive: pathname.startsWith('/student/study-plan'),
    },
    {
      label: 'Revision',
      href: '/student/revision',
      icon: RefreshCw,
      isActive: pathname.startsWith('/student/revision'),
    },
    {
      label: 'Career',
      href: '/student/career',
      icon: Compass,
      isActive: pathname.startsWith('/student/career'),
    },
  ];

  return (
    <nav 
      aria-label="Mobile Bottom Navigation"
      className="fixed bottom-0 left-0 right-0 z-40 bg-white/95 backdrop-blur-md border-t border-slate-200 md:hidden pb-safe shadow-[0_-2px_10px_rgba(0,0,0,0.04)]"
    >
      <div className="grid grid-cols-4 h-14 max-w-lg mx-auto">
        {navItems.map((item) => {
          const Icon = item.icon;
          return (
            <Link
              key={item.href}
              href={item.href}
              className={`flex flex-col items-center justify-center min-h-[48px] py-1 transition-colors relative ${
                item.isActive
                  ? 'text-indigo-600 font-semibold'
                  : 'text-slate-500 hover:text-slate-900 font-medium'
              }`}
            >
              {item.isActive && (
                <span className="absolute top-0 w-8 h-0.5 bg-indigo-600 rounded-full" />
              )}
              <Icon className={`w-5 h-5 transition-transform ${item.isActive ? 'scale-110 stroke-[2.2]' : 'stroke-[1.8]'}`} />
              <span className="text-[10px] mt-0.5 tracking-tight">{item.label}</span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
