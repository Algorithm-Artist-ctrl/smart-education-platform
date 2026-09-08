// components/ui/EmptyState.tsx
import React from 'react';
import { Inbox } from 'lucide-react';

interface EmptyStateProps {
  title?: string;
  description?: string;
  icon?: React.ReactNode;
  action?: React.ReactNode;
}

export default function EmptyState({
  title = 'No Data Found',
  description = 'There is currently no information to display here.',
  icon,
  action,
}: EmptyStateProps) {
  return (
    <div className="flex flex-col items-center justify-center p-8 text-center rounded-xl border border-dashed border-slate-300 bg-white/50 my-3">
      <div className="p-3 bg-slate-100 rounded-full text-slate-400 mb-3">
        {icon || <Inbox className="w-8 h-8 stroke-[1.5]" />}
      </div>
      <h4 className="text-base font-semibold text-slate-800 mb-1">{title}</h4>
      <p className="text-sm text-slate-500 max-w-sm mb-4">{description}</p>
      {action && <div>{action}</div>}
    </div>
  );
}
