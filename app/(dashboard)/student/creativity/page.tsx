// app/(dashboard)/student/creativity/page.tsx
'use client';

import React, { useState, useRef, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';
import Navbar from '@/components/shared/Navbar';
import GamificationBar from '@/components/gamification/GamificationBar';
import NovaAICompanion from '@/components/gamification/NovaAICompanion';
import SidebarRail from '@/components/design-system/SidebarRail';
import MobileBottomNav from '@/components/shared/MobileBottomNav';
import { 
  Sparkles, 
  PenTool, 
  Eraser, 
  RotateCcw, 
  Save, 
  Send, 
  Palette, 
  Award, 
  CheckCircle2, 
  Eye, 
  Lightbulb, 
  Layers, 
  Loader2,
  Calendar,
  Zap
} from 'lucide-react';
import { Profile, StudentProfile, CreativitySubmission } from '@/types/database.types';

const CREATIVE_PROMPTS = [
  {
    id: 'prism',
    subject: 'Physics • Optics',
    title: 'Prism & Light Dispersion',
    prompt: 'Draw a white beam of light entering a triangular glass prism and bending into a rainbow of colors. Label where refraction happens.',
    hint: 'Light bends twice: once when entering the denser glass, and again when exiting back into air.',
  },
  {
    id: 'photosynthesis',
    subject: 'Biology • Plant Energy',
    title: 'Photosynthesis in Action',
    prompt: 'Illustrate how sunlight, water from the roots, and carbon dioxide from the air transform inside a plant leaf into glucose and oxygen.',
    hint: 'Chlorophyll acts like tiny solar panels inside chloroplast organelles.',
  },
  {
    id: 'pythagoras',
    subject: 'Mathematics • Geometry',
    title: 'Visual Pythagoras Proof',
    prompt: 'Draw a right-angled triangle with squares built on each of its three sides to visualize a² + b² = c².',
    hint: 'The combined area of the two smaller squares equals the area of the large square on the hypotenuse.',
  },
  {
    id: 'gravity',
    subject: 'Physics • Mechanics',
    title: 'Gravitational Orbit',
    prompt: 'Draw a planet orbiting a massive star. Show the direction of forward velocity and the inward pull of gravity that creates an orbit.',
    hint: 'An orbit is essentially freefall where the object keeps missing the ground because it moves sideways so fast.',
  },
];

const COLORS = [
  { name: 'Cyan', hex: '#06b6d4' },
  { name: 'Indigo', hex: '#6366f1' },
  { name: 'Purple', hex: '#a855f7' },
  { name: 'Amber', hex: '#f59e0b' },
  { name: 'Emerald', hex: '#10b981' },
  { name: 'Rose', hex: '#f43f5e' },
  { name: 'White', hex: '#ffffff' },
  { name: 'Neon Green', hex: '#22c55e' },
];

export default function CreativityLabPage() {
  const router = useRouter();
  const supabase = createClient();

  const [profile, setProfile] = useState<Profile | null>(null);
  const [studentProfile, setStudentProfile] = useState<StudentProfile | null>(null);
  const [pastSubmissions, setPastSubmissions] = useState<CreativitySubmission[]>([]);
  const [loading, setLoading] = useState(true);

  // Active prompt selection
  const [selectedPrompt, setSelectedPrompt] = useState(CREATIVE_PROMPTS[0]);
  const [explanation, setExplanation] = useState('');

  // Canvas Drawing State
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const [isDrawing, setIsDrawing] = useState(false);
  const [brushColor, setBrushColor] = useState('#06b6d4');
  const [brushSize, setBrushSize] = useState(4);
  const [isEraser, setIsEraser] = useState(false);
  const [hasDrawn, setHasDrawn] = useState(false);

  // Submission state
  const [submitting, setSubmitting] = useState(false);
  const [successCelebration, setSuccessCelebration] = useState<{ xp: number; coins: number } | null>(null);

  useEffect(() => {
    async function loadData() {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        router.push('/login?redirectTo=/student/creativity');
        return;
      }

      const [pRes, spRes, subsRes] = await Promise.all([
        supabase.from('profiles').select('*').eq('id', user.id).single(),
        supabase.from('student_profiles').select('*').eq('id', user.id).single(),
        supabase
          .from('creativity_submissions')
          .select('*')
          .eq('student_id', user.id)
          .order('created_at', { ascending: false }),
      ]);

      if (pRes.data) setProfile(pRes.data as Profile);
      if (spRes.data) setStudentProfile(spRes.data as StudentProfile);
      if (subsRes.data) setPastSubmissions(subsRes.data as CreativitySubmission[]);
      setLoading(false);
    }

    loadData();
  }, [router, supabase]);

  // Canvas Setup
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Fill dark background once
    ctx.fillStyle = '#090d1a';
    ctx.fillRect(0, 0, canvas.width, canvas.height);
  }, []);

  const startDrawing = (e: React.MouseEvent<HTMLCanvasElement> | React.TouchEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const rect = canvas.getBoundingClientRect();
    const x = ('touches' in e ? e.touches[0].clientX : e.clientX) - rect.left;
    const y = ('touches' in e ? e.touches[0].clientY : e.clientY) - rect.top;

    ctx.beginPath();
    ctx.moveTo(x, y);
    setIsDrawing(true);
    setHasDrawn(true);
  };

  const draw = (e: React.MouseEvent<HTMLCanvasElement> | React.TouchEvent<HTMLCanvasElement>) => {
    if (!isDrawing) return;
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const rect = canvas.getBoundingClientRect();
    const x = ('touches' in e ? e.touches[0].clientX : e.clientX) - rect.left;
    const y = ('touches' in e ? e.touches[0].clientY : e.clientY) - rect.top;

    ctx.strokeStyle = isEraser ? '#090d1a' : brushColor;
    ctx.lineWidth = brushSize;
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';
    ctx.lineTo(x, y);
    ctx.stroke();
  };

  const stopDrawing = () => {
    if (!isDrawing) return;
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (ctx) ctx.closePath();
    setIsDrawing(false);
  };

  const clearCanvas = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    ctx.fillStyle = '#090d1a';
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    setHasDrawn(false);
  };

  const handleSubmit = async () => {
    if (!hasDrawn || !explanation.trim() || submitting) return;

    const canvas = canvasRef.current;
    if (!canvas) return;
    const canvasData = canvas.toDataURL('image/png');

    setSubmitting(true);
    try {
      const res = await fetch('/api/student/creativity', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          prompt: selectedPrompt.prompt,
          canvas_data: canvasData,
          explanation_text: explanation,
        }),
      });

      const data = await res.json();
      if (res.ok && data.success) {
        setSuccessCelebration({ xp: data.xpEarned, coins: data.coinsEarned });
        setPastSubmissions((prev) => [data.submission, ...prev]);
        setExplanation('');
        clearCanvas();
        if (studentProfile) {
          setStudentProfile({
            ...studentProfile,
            xp: (studentProfile.xp || 0) + data.xpEarned,
            total_points: (studentProfile.total_points || 0) + data.xpEarned,
            coins: (studentProfile.coins || 0) + data.coinsEarned,
          });
        }
      } else {
        alert(data.error || 'Failed to submit creation.');
      }
    } catch (err) {
      console.error(err);
      alert('Network error while saving creation.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen flex flex-col bg-[#060913] text-white selection:bg-indigo-500 selection:text-white relative overflow-x-hidden">
      {/* Cosmic background glow */}
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[1100px] h-[500px] bg-gradient-to-b from-purple-950/30 via-indigo-900/10 to-transparent blur-3xl pointer-events-none -z-10" />

      <Navbar profile={profile} />

      <div className="flex-1 max-w-7xl w-full mx-auto px-3 sm:px-6 lg:px-8 py-4 sm:py-6 flex gap-6 pb-28 md:pb-12">
        <SidebarRail />

        <main className="flex-1 min-w-0 space-y-6">
          {/* Gamification Bar */}
          <GamificationBar
            level={studentProfile?.level || 1}
            currentXp={studentProfile?.xp || 0}
            streakDays={studentProfile?.streak_days || studentProfile?.current_streak || 0}
            coins={studentProfile?.coins || 0}
            totalPoints={studentProfile?.total_points || 0}
          />

          {/* Header Banner */}
          <div className="cosmic-card p-6 sm:p-8 rounded-3xl border border-purple-500/30 bg-gradient-to-br from-slate-900 via-purple-950/40 to-slate-900 shadow-2xl relative overflow-hidden">
            <div className="absolute top-0 right-0 w-80 h-80 bg-purple-500/10 rounded-full blur-3xl pointer-events-none" />
            <div className="relative z-10 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div>
                <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-purple-500/20 border border-purple-500/30 text-purple-300 text-xs font-bold uppercase tracking-wider mb-2">
                  <Sparkles className="w-3.5 h-3.5 text-purple-400" />
                  <span>Visual Demonstration Lab</span>
                </div>
                <h1 className="text-2xl sm:text-3xl font-black text-white tracking-tight">
                  Creativity Lab
                </h1>
                <p className="text-sm text-slate-300 mt-1 max-w-xl">
                  True mastery is being able to explain a concept in your own visual sketch and words. Draw, explain, and earn +50 XP and +15 Coins!
                </p>
              </div>

              <div className="flex items-center gap-3 self-start sm:self-auto">
                <div className="p-3 rounded-2xl bg-slate-950/80 border border-purple-500/30 text-center min-w-[100px]">
                  <span className="text-[10px] uppercase font-bold text-purple-400 tracking-wider block">Reward</span>
                  <span className="text-base font-black text-white">+50 XP</span>
                </div>
                <div className="p-3 rounded-2xl bg-slate-950/80 border border-amber-500/30 text-center min-w-[100px]">
                  <span className="text-[10px] uppercase font-bold text-amber-400 tracking-wider block">Coins</span>
                  <span className="text-base font-black text-amber-300">+15 🪙</span>
                </div>
              </div>
            </div>
          </div>

          {/* Success Banner if just submitted */}
          {successCelebration && (
            <div className="p-4 rounded-2xl bg-emerald-500/20 border border-emerald-500/40 text-emerald-200 flex items-center justify-between gap-4 animate-bounce-short">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-emerald-500 text-slate-950 flex items-center justify-center font-bold">
                  <Award className="w-6 h-6" />
                </div>
                <div>
                  <h4 className="text-sm font-bold text-white">Visual Proof Submitted!</h4>
                  <p className="text-xs text-emerald-300">
                    Earned +{successCelebration.xp} XP and +{successCelebration.coins} Coins! Added to your Learning Portfolio.
                  </p>
                </div>
              </div>
              <button
                onClick={() => setSuccessCelebration(null)}
                className="text-xs font-bold text-slate-400 hover:text-white px-3 py-1 rounded-lg bg-slate-900"
              >
                Dismiss
              </button>
            </div>
          )}

          {/* Prompt Selector Pills */}
          <div className="space-y-2">
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400 flex items-center gap-2">
              <Lightbulb className="w-4 h-4 text-amber-400" />
              Choose a Concept Challenge
            </h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
              {CREATIVE_PROMPTS.map((p) => {
                const isCurrent = selectedPrompt.id === p.id;
                return (
                  <button
                    key={p.id}
                    onClick={() => {
                      setSelectedPrompt(p);
                      clearCanvas();
                    }}
                    className={`p-3.5 rounded-2xl border text-left transition flex flex-col justify-between gap-2 ${
                      isCurrent
                        ? 'bg-purple-950/40 border-purple-500 text-white shadow-lg shadow-purple-950/40'
                        : 'bg-slate-900/60 border-white/5 text-slate-300 hover:bg-slate-850 hover:border-white/20'
                    }`}
                  >
                    <div>
                      <span className="text-[10px] font-mono font-bold text-indigo-400 uppercase tracking-wider">
                        {p.subject}
                      </span>
                      <h4 className="text-xs font-bold text-white mt-0.5">{p.title}</h4>
                    </div>
                    <span className="text-[11px] text-slate-400 line-clamp-2">{p.prompt}</span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Drawing Canvas + Explanation Workspace */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
            {/* Left 8 Cols: Interactive Drawing Canvas */}
            <div className="lg:col-span-8 space-y-3">
              {/* Canvas Toolbar */}
              <div className="p-3 rounded-2xl bg-slate-900/90 border border-white/10 flex flex-wrap items-center justify-between gap-3 shadow-lg">
                {/* Palette */}
                <div className="flex items-center gap-1.5 flex-wrap">
                  {COLORS.map((c) => (
                    <button
                      key={c.name}
                      onClick={() => {
                        setBrushColor(c.hex);
                        setIsEraser(false);
                      }}
                      title={c.name}
                      style={{ backgroundColor: c.hex }}
                      className={`w-6 h-6 rounded-full transition-transform ${
                        !isEraser && brushColor === c.hex ? 'scale-125 ring-2 ring-white ring-offset-2 ring-offset-slate-900' : 'hover:scale-110'
                      }`}
                    />
                  ))}
                </div>

                {/* Brush Size & Eraser / Clear */}
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => setIsEraser(!isEraser)}
                    className={`p-2 rounded-xl text-xs font-bold flex items-center gap-1.5 transition ${
                      isEraser
                        ? 'bg-purple-600 text-white shadow-md shadow-purple-600/30'
                        : 'bg-slate-800 text-slate-300 hover:text-white'
                    }`}
                  >
                    <Eraser className="w-3.5 h-3.5" />
                    <span>Eraser</span>
                  </button>

                  {/* Brush Sizes */}
                  <div className="inline-flex p-1 bg-slate-800 rounded-xl gap-1">
                    {[2, 4, 8].map((size) => (
                      <button
                        key={size}
                        onClick={() => {
                          setBrushSize(size);
                          setIsEraser(false);
                        }}
                        className={`w-6 h-6 rounded-lg text-[10px] font-bold flex items-center justify-center transition ${
                          !isEraser && brushSize === size ? 'bg-indigo-600 text-white' : 'text-slate-400 hover:text-white'
                        }`}
                      >
                        {size}px
                      </button>
                    ))}
                  </div>

                  <button
                    type="button"
                    onClick={clearCanvas}
                    className="p-2 rounded-xl bg-slate-800 hover:bg-rose-500/20 text-slate-300 hover:text-rose-400 text-xs font-bold transition flex items-center gap-1"
                  >
                    <RotateCcw className="w-3.5 h-3.5" />
                    <span>Clear</span>
                  </button>
                </div>
              </div>

              {/* Canvas Viewport */}
              <div className="relative rounded-3xl border border-white/10 bg-slate-950 overflow-hidden shadow-2xl">
                <canvas
                  ref={canvasRef}
                  width={750}
                  height={450}
                  onMouseDown={startDrawing}
                  onMouseMove={draw}
                  onMouseUp={stopDrawing}
                  onMouseLeave={stopDrawing}
                  onTouchStart={startDrawing}
                  onTouchMove={draw}
                  onTouchEnd={stopDrawing}
                  className="w-full h-[360px] sm:h-[450px] cursor-crosshair touch-none"
                />

                {!hasDrawn && (
                  <div className="absolute inset-0 pointer-events-none flex flex-col items-center justify-center text-center p-6 bg-slate-950/60 backdrop-blur-[2px]">
                    <div className="w-12 h-12 rounded-2xl bg-indigo-500/20 border border-indigo-500/30 text-indigo-400 flex items-center justify-center mb-3">
                      <PenTool className="w-6 h-6" />
                    </div>
                    <h4 className="text-sm font-bold text-white">Interactive Visual Canvas</h4>
                    <p className="text-xs text-slate-400 max-w-sm mt-1">
                      Click and drag or touch to sketch your conceptual model for: <br />
                      <strong className="text-cyan-300">"{selectedPrompt.title}"</strong>
                    </p>
                  </div>
                )}
              </div>
            </div>

            {/* Right 4 Cols: Active Prompt Details & Explanation Textarea */}
            <div className="lg:col-span-4 space-y-4">
              <div className="cosmic-card p-5 rounded-3xl border border-white/10 bg-slate-900/80 shadow-2xl space-y-4">
                <div>
                  <span className="text-[10px] font-mono font-bold uppercase tracking-wider text-indigo-400">
                    Challenge Instructions
                  </span>
                  <h3 className="text-base font-black text-white mt-1">
                    {selectedPrompt.title}
                  </h3>
                  <p className="text-xs text-slate-300 mt-2 leading-relaxed bg-slate-950/60 p-3 rounded-2xl border border-white/5">
                    {selectedPrompt.prompt}
                  </p>
                </div>

                <div className="p-3 rounded-2xl bg-amber-500/10 border border-amber-500/20 text-amber-200 text-xs space-y-1">
                  <div className="font-bold flex items-center gap-1.5 text-amber-300">
                    <Lightbulb className="w-3.5 h-3.5" /> Concept Hint
                  </div>
                  <p className="text-[11px] text-amber-200/90 leading-relaxed">
                    {selectedPrompt.hint}
                  </p>
                </div>

                {/* Explanation Textarea */}
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-white flex items-center justify-between">
                    <span>Explain Your Sketch</span>
                    <span className="text-[10px] text-slate-400 font-normal">In your own words</span>
                  </label>
                  <textarea
                    value={explanation}
                    onChange={(e) => setExplanation(e.target.value)}
                    placeholder="Describe what your drawing shows, why it happens, and what each part represents..."
                    rows={5}
                    className="w-full p-3 rounded-2xl bg-slate-950 border border-white/10 text-white text-xs placeholder:text-slate-500 focus:outline-none focus:border-indigo-500 transition resize-none"
                  />
                </div>

                {/* Submit Action */}
                <button
                  type="button"
                  onClick={handleSubmit}
                  disabled={!hasDrawn || !explanation.trim() || submitting}
                  className={`w-full py-3 px-4 rounded-2xl font-black text-xs shadow-xl flex items-center justify-center gap-2 transition-all ${
                    !hasDrawn || !explanation.trim() || submitting
                      ? 'opacity-50 bg-slate-800 text-slate-400 cursor-not-allowed'
                      : 'bg-gradient-to-r from-purple-600 via-indigo-600 to-blue-600 hover:from-purple-500 hover:to-blue-500 text-white shadow-indigo-600/30'
                  }`}
                >
                  {submitting ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      <span>Saving to Portfolio...</span>
                    </>
                  ) : (
                    <>
                      <Send className="w-4 h-4" />
                      <span>Submit & Earn +50 XP</span>
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>

          {/* Past Visual Submissions Gallery */}
          <div className="space-y-3 pt-6 border-t border-white/10">
            <h3 className="text-base font-bold text-white flex items-center gap-2">
              <Layers className="w-4 h-4 text-purple-400" />
              My Creative Portfolio Submissions ({pastSubmissions.length})
            </h3>

            {pastSubmissions.length === 0 ? (
              <div className="p-8 rounded-2xl bg-slate-900/40 border border-white/5 text-center text-slate-400 text-xs">
                No visual creations submitted yet. Draw your first concept above to build your authentic portfolio!
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                {pastSubmissions.map((sub) => (
                  <div
                    key={sub.id}
                    className="p-4 rounded-2xl bg-slate-900/80 border border-white/10 hover:border-purple-500/40 transition flex flex-col justify-between gap-3 shadow-xl"
                  >
                    <div className="aspect-video w-full rounded-xl bg-slate-950 border border-white/5 overflow-hidden flex items-center justify-center">
                      {sub.canvas_data ? (
                        <img
                          src={sub.canvas_data}
                          alt="Student visual sketch"
                          className="w-full h-full object-contain"
                        />
                      ) : (
                        <span className="text-slate-500 text-xs">No image data</span>
                      )}
                    </div>

                    <div>
                      <div className="flex items-center justify-between text-[10px] text-slate-400 mb-1">
                        <span className="font-mono text-purple-400 font-bold">
                          +{sub.xp_awarded || 50} XP
                        </span>
                        <span>{new Date(sub.created_at).toLocaleDateString()}</span>
                      </div>
                      <h4 className="text-xs font-bold text-white line-clamp-1">{sub.prompt}</h4>
                      <p className="text-[11px] text-slate-300 mt-1 line-clamp-2 italic">
                        "{sub.explanation_text}"
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </main>
      </div>

      <NovaAICompanion
        studentName={profile?.full_name?.split(' ')[0] || 'Explorer'}
        level={studentProfile?.level || 1}
      />

      <MobileBottomNav />
    </div>
  );
}
