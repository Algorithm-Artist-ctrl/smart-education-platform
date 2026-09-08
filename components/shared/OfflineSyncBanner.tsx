'use client';

import { useEffect, useState } from 'react';
import { flushOfflineQueue } from '@/lib/offline/sync';
import { WifiOff, RefreshCw } from 'lucide-react';

export default function OfflineSyncBanner() {
  const [isOnline, setIsOnline] = useState(true);
  const [isSyncing, setIsSyncing] = useState(false);
  const [syncedCount, setSyncedCount] = useState<number | null>(null);

  useEffect(() => {
    if (typeof window === 'undefined') return;

    setIsOnline(navigator.onLine);

    const handleOnline = async () => {
      setIsOnline(true);
      setIsSyncing(true);
      try {
        const { processed } = await flushOfflineQueue();
        if (processed > 0) {
          setSyncedCount(processed);
          setTimeout(() => setSyncedCount(null), 4000);
        }
      } catch (err) {
        console.error('Offline sync error:', err);
      } finally {
        setIsSyncing(false);
      }
    };

    const handleOffline = () => {
      setIsOnline(false);
    };

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  if (isOnline && !isSyncing && syncedCount === null) {
    return null;
  }

  return (
    <div className="w-full text-xs font-medium py-1.5 px-4 text-center transition-all sticky top-0 z-50 flex items-center justify-center gap-2 shadow-sm bg-amber-500 text-white">
      {!isOnline ? (
        <>
          <WifiOff className="w-3.5 h-3.5" />
          <span>You are offline. Your actions are saved locally and will sync when back online.</span>
        </>
      ) : isSyncing ? (
        <>
          <RefreshCw className="w-3.5 h-3.5 animate-spin" />
          <span>Back online! Synchronizing offline activity with Supabase...</span>
        </>
      ) : syncedCount !== null ? (
        <span>Synced {syncedCount} offline activities with Supabase successfully!</span>
      ) : null}
    </div>
  );
}
