// components/design-system/DashboardSkeleton.tsx
import React from 'react';

export function GamificationBarSkeleton() {
  return (
    <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 animate-pulse">
      {[1, 2, 3, 4].map((i) => (
        <div
          key={i}
          className="rounded-2xl p-3.5 border border-white/5 bg-slate-900/60 backdrop-blur-md shadow-lg"
        >
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center gap-2">
              <div className="w-7 h-7 rounded-lg bg-slate-800" />
              <div className="w-16 h-3 bg-slate-800 rounded" />
            </div>
            <div className="w-10 h-3 bg-slate-800 rounded" />
          </div>
          <div className="w-full h-1.5 bg-slate-800 rounded-full" />
        </div>
      ))}
    </div>
  );
}

export function StudentDashboardSkeleton() {
  return (
    <div className="min-h-screen flex flex-col bg-[#060913] text-slate-100 pb-20 md:pb-12">
      {/* Top Navbar Placeholder */}
      <div className="h-16 w-full border-b border-white/10 bg-slate-950/80 sticky top-0 z-40 flex items-center px-4 sm:px-8 justify-between">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-slate-800 animate-pulse" />
          <div className="w-28 h-5 bg-slate-800 rounded animate-pulse" />
        </div>
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-full bg-slate-800 animate-pulse" />
          <div className="w-24 h-8 rounded-xl bg-slate-800 animate-pulse" />
        </div>
      </div>

      <div className="flex-1 max-w-7xl mx-auto w-full px-3 sm:px-6 lg:px-8 pt-4 sm:pt-6 flex gap-6">
        {/* Left Sidebar Rail Placeholder */}
        <div className="hidden lg:flex flex-col items-center py-4 px-2 w-16 shrink-0 rounded-2xl bg-slate-900/70 border border-white/10 gap-3 self-start sticky top-20 animate-pulse">
          {[1, 2, 3, 4, 5, 6, 7, 8].map((i) => (
            <div key={i} className="w-10 h-10 rounded-xl bg-slate-800" />
          ))}
        </div>

        {/* Main Content Area */}
        <main className="flex-1 min-w-0 space-y-6 animate-pulse">
          {/* Top Hero Section */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">
            <div className="lg:col-span-7 rounded-3xl bg-slate-900/70 border border-white/10 p-6 sm:p-8 min-h-[220px] flex flex-col justify-between">
              <div className="space-y-3">
                <div className="w-32 h-6 bg-slate-800 rounded-full" />
                <div className="w-64 h-9 bg-slate-800 rounded-lg" />
                <div className="w-48 h-4 bg-slate-800 rounded" />
              </div>
              <div className="w-40 h-10 bg-slate-800 rounded-xl mt-4" />
            </div>

            <div className="lg:col-span-5 rounded-3xl bg-slate-900/70 border border-white/10 p-6 flex flex-col justify-between">
              <div className="space-y-3">
                <div className="w-28 h-5 bg-slate-800 rounded" />
                <div className="w-full h-12 bg-slate-800 rounded-xl" />
              </div>
              <div className="grid grid-cols-3 gap-2 mt-4">
                <div className="h-14 bg-slate-800 rounded-xl" />
                <div className="h-14 bg-slate-800 rounded-xl" />
                <div className="h-14 bg-slate-800 rounded-xl" />
              </div>
            </div>
          </div>

          {/* Gamification Bar */}
          <GamificationBarSkeleton />

          {/* Feature Grid */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
            <div className="rounded-2xl border border-white/10 bg-slate-900/60 p-6 min-h-[260px] space-y-4">
              <div className="w-36 h-6 bg-slate-800 rounded" />
              <div className="space-y-2">
                <div className="w-full h-14 bg-slate-800 rounded-xl" />
                <div className="w-full h-14 bg-slate-800 rounded-xl" />
              </div>
            </div>
            <div className="rounded-2xl border border-white/10 bg-slate-900/60 p-6 min-h-[260px] space-y-4">
              <div className="w-36 h-6 bg-slate-800 rounded" />
              <div className="space-y-2">
                <div className="w-full h-14 bg-slate-800 rounded-xl" />
                <div className="w-full h-14 bg-slate-800 rounded-xl" />
              </div>
            </div>
            <div className="rounded-2xl border border-white/10 bg-slate-900/60 p-6 min-h-[260px] space-y-4">
              <div className="w-36 h-6 bg-slate-800 rounded" />
              <div className="space-y-2">
                <div className="w-full h-14 bg-slate-800 rounded-xl" />
                <div className="w-full h-14 bg-slate-800 rounded-xl" />
              </div>
            </div>
          </div>
        </main>
      </div>
    </div>
  );
}

export function LearningMapSkeleton() {
  return (
    <div className="min-h-screen flex flex-col bg-[#060913] text-white">
      <div className="flex-1 max-w-7xl w-full mx-auto px-3 sm:px-6 lg:px-8 py-4 sm:py-6 flex gap-6 pb-28 md:pb-12">
        <div className="hidden lg:flex flex-col items-center py-4 px-2 w-16 shrink-0 rounded-2xl bg-slate-900/70 border border-white/10 gap-3 self-start sticky top-20 animate-pulse">
          {[1, 2, 3, 4, 5, 6, 7, 8].map((i) => (
            <div key={i} className="w-10 h-10 rounded-xl bg-slate-800" />
          ))}
        </div>

        <main className="flex-1 min-w-0 space-y-6 animate-pulse">
          <GamificationBarSkeleton />
          <div className="rounded-3xl border border-indigo-500/20 bg-slate-950 p-6 sm:p-10 min-h-[520px] flex flex-col justify-between relative overflow-hidden">
            <div className="flex items-center justify-between">
              <div className="space-y-2">
                <div className="w-48 h-7 bg-slate-800 rounded-lg" />
                <div className="w-64 h-4 bg-slate-800 rounded" />
              </div>
              <div className="w-28 h-9 bg-slate-800 rounded-xl" />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 my-auto pt-6">
              {[1, 2, 3, 4, 5].map((i) => (
                <div key={i} className="rounded-2xl border border-white/10 bg-slate-900/70 p-5 space-y-3">
                  <div className="flex items-center justify-between">
                    <div className="w-10 h-10 rounded-xl bg-slate-800" />
                    <div className="w-16 h-4 bg-slate-800 rounded-full" />
                  </div>
                  <div className="w-32 h-5 bg-slate-800 rounded" />
                  <div className="w-full h-3 bg-slate-800 rounded" />
                  <div className="w-full h-2 bg-slate-800 rounded-full mt-2" />
                </div>
              ))}
            </div>
          </div>
        </main>
      </div>
    </div>
  );
}

export function LearningHubSkeleton() {
  return (
    <div className="min-h-screen flex flex-col bg-[#060913] text-white">
      <div className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-6 gap-6 flex pb-28 md:pb-12">
        <div className="hidden lg:flex flex-col items-center py-4 px-2 w-16 shrink-0 rounded-2xl bg-slate-900/70 border border-white/10 gap-3 self-start sticky top-20 animate-pulse">
          {[1, 2, 3, 4, 5, 6, 7, 8].map((i) => (
            <div key={i} className="w-10 h-10 rounded-xl bg-slate-800" />
          ))}
        </div>

        <main className="flex-1 min-w-0 space-y-6 animate-pulse">
          {/* Hero Continue Card */}
          <div className="rounded-3xl border border-indigo-500/30 bg-slate-900/80 p-6 sm:p-8 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
            <div className="space-y-3">
              <div className="w-36 h-5 bg-indigo-500/20 rounded-full" />
              <div className="w-60 h-8 bg-slate-800 rounded-lg" />
              <div className="w-48 h-4 bg-slate-800 rounded" />
            </div>
            <div className="w-40 h-12 bg-indigo-600/50 rounded-xl" />
          </div>

          {/* Tab Row */}
          <div className="flex gap-2">
            <div className="w-36 h-10 bg-slate-800 rounded-xl" />
            <div className="w-36 h-10 bg-slate-800 rounded-xl" />
            <div className="w-36 h-10 bg-slate-800 rounded-xl" />
          </div>

          {/* Module Cards */}
          <div className="space-y-4">
            {[1, 2, 3].map((i) => (
              <div key={i} className="rounded-2xl border border-white/10 bg-slate-900/60 p-5 space-y-3">
                <div className="flex items-center justify-between">
                  <div className="w-48 h-6 bg-slate-800 rounded" />
                  <div className="w-20 h-6 bg-slate-800 rounded-full" />
                </div>
                <div className="w-full h-4 bg-slate-800 rounded" />
              </div>
            ))}
          </div>
        </main>
      </div>
    </div>
  );
}

export function GenericPageSkeleton({ title = 'Loading...' }: { title?: string }) {
  return (
    <div className="min-h-screen flex flex-col bg-[#060913] text-white">
      <div className="flex-1 max-w-7xl w-full mx-auto px-3 sm:px-6 lg:px-8 py-4 sm:py-6 flex gap-6 pb-28 md:pb-12">
        <div className="hidden lg:flex flex-col items-center py-4 px-2 w-16 shrink-0 rounded-2xl bg-slate-900/70 border border-white/10 gap-3 self-start sticky top-20 animate-pulse">
          {[1, 2, 3, 4, 5, 6, 7, 8].map((i) => (
            <div key={i} className="w-10 h-10 rounded-xl bg-slate-800" />
          ))}
        </div>

        <main className="flex-1 min-w-0 space-y-6 animate-pulse">
          <GamificationBarSkeleton />
          
          {/* Header Banner */}
          <div className="rounded-3xl p-6 sm:p-8 bg-slate-900/80 border border-white/10 flex flex-col justify-between space-y-3">
            <div className="w-32 h-5 bg-cyan-500/20 rounded-full" />
            <div className="w-56 h-8 bg-slate-800 rounded-lg" />
            <div className="w-72 h-4 bg-slate-800 rounded" />
          </div>

          {/* Cards Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            <div className="rounded-2xl border border-white/10 bg-slate-900/60 p-6 min-h-[220px] space-y-3">
              <div className="w-40 h-6 bg-slate-800 rounded" />
              <div className="w-full h-12 bg-slate-800 rounded-xl" />
              <div className="w-full h-12 bg-slate-800 rounded-xl" />
            </div>
            <div className="rounded-2xl border border-white/10 bg-slate-900/60 p-6 min-h-[220px] space-y-3">
              <div className="w-40 h-6 bg-slate-800 rounded" />
              <div className="w-full h-12 bg-slate-800 rounded-xl" />
              <div className="w-full h-12 bg-slate-800 rounded-xl" />
            </div>
          </div>
        </main>
      </div>
    </div>
  );
}
