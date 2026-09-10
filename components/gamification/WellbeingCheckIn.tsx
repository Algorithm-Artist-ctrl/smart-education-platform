// components/gamification/WellbeingCheckIn.tsx
'use client';

import React, { useState } from 'react';
import { Sparkles, Smile, Meh, AlertCircle, Coffee, Check, Heart } from 'lucide-react';
import { useI18n } from '@/lib/i18n/context';

interface WellbeingCheckInProps {
  initialFeeling?: string | null;
}

export default function WellbeingCheckIn({ initialFeeling }: WellbeingCheckInProps) {
  const { language } = useI18n();
  const [selectedFeeling, setSelectedFeeling] = useState<string | null>(initialFeeling || null);
  const [isSaved, setIsSaved] = useState<boolean>(Boolean(initialFeeling));
  const [saving, setSaving] = useState(false);

  const feelings = [
    {
      id: 'good',
      label: 'Great & Energetic',
      hi: 'बहुत बढ़िया',
      icon: Smile,
      color: 'text-emerald-400',
      bg: 'hover:bg-emerald-500/10 border-emerald-500/30',
      activeBg: 'bg-emerald-500/20 border-emerald-400 text-emerald-300',
    },
    {
      id: 'okay',
      label: 'Steady & Focused',
      hi: 'स्थिर और केंद्रित',
      icon: Meh,
      color: 'text-cyan-400',
      bg: 'hover:bg-cyan-500/10 border-cyan-500/30',
      activeBg: 'bg-cyan-500/20 border-cyan-400 text-cyan-300',
    },
    {
      id: 'difficult',
      label: 'A Bit Challenging',
      hi: 'थोड़ा कठिन',
      icon: AlertCircle,
      color: 'text-amber-400',
      bg: 'hover:bg-amber-500/10 border-amber-500/30',
      activeBg: 'bg-amber-500/20 border-amber-400 text-amber-300',
    },
    {
      id: 'overwhelmed',
      label: 'Need a Light Session',
      hi: 'हल्की पढ़ाई चाहिए',
      icon: Coffee,
      color: 'text-rose-400',
      bg: 'hover:bg-rose-500/10 border-rose-500/30',
      activeBg: 'bg-rose-500/20 border-rose-400 text-rose-300',
    },
  ];

  const handleSelect = async (feelingId: string) => {
    setSelectedFeeling(feelingId);
    setSaving(true);

    try {
      await fetch('/api/student/wellbeing', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ feeling: feelingId }),
      });
      setIsSaved(true);
    } catch (err) {
      console.warn('Failed to save wellbeing signal:', err);
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="cosmic-card p-4 sm:p-5 rounded-2xl border border-white/10 bg-slate-900/70 backdrop-blur-md shadow-xl relative overflow-hidden">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-3">
        <div className="flex items-center gap-2">
          <div className="p-1.5 rounded-lg bg-pink-500/20 border border-pink-500/30 text-pink-400">
            <Heart className="w-4 h-4 fill-pink-400" />
          </div>
          <div>
            <h4 className="text-xs font-bold text-white flex items-center gap-1.5">
              {language === 'hi' ? 'दैनिक शिक्षण अनुभव' : 'Daily Learning Check-In'}
              <span className="text-[10px] text-slate-400 font-normal">
                ({language === 'hi' ? 'स्वैच्छिक सिग्नल' : 'Adaptive Signal'})
              </span>
            </h4>
            <p className="text-[11px] text-slate-400">
              {language === 'hi'
                ? 'आज की पढ़ाई कैसी लग रही है? नोवा आपकी गति को उसी अनुसार ढालेगा।'
                : 'How are you feeling about today’s learning? Nova tunes practice intensity accordingly.'}
            </p>
          </div>
        </div>

        {isSaved && (
          <span className="text-[10px] text-emerald-400 font-bold flex items-center gap-1 self-start sm:self-auto bg-emerald-500/10 px-2 py-0.5 rounded-full border border-emerald-500/20">
            <Check className="w-3 h-3" />
            {language === 'hi' ? 'सिग्नल दर्ज हुआ' : 'Calibrated'}
          </span>
        )}
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
        {feelings.map((f) => {
          const Icon = f.icon;
          const isSelected = selectedFeeling === f.id;
          return (
            <button
              key={f.id}
              type="button"
              onClick={() => handleSelect(f.id)}
              disabled={saving}
              className={`p-2.5 rounded-xl border text-left transition flex items-center gap-2 cursor-pointer ${
                isSelected
                  ? f.activeBg
                  : `bg-slate-800/40 border-white/5 text-slate-300 ${f.bg}`
              }`}
            >
              <Icon className={`w-4 h-4 ${f.color} shrink-0`} />
              <div className="min-w-0">
                <div className="text-[11px] font-bold truncate">
                  {language === 'hi' ? f.hi : f.label}
                </div>
              </div>
            </button>
          );
        })}
      </div>
    </div>
  );
}
