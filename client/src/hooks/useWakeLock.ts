import { useState, useEffect, useRef } from "react";

type WakeLockSentinel = any; // WakeLockSentinel type not widely available yet

export function useWakeLock() {
  const [isSupported, setIsSupported] = useState(false);
  const [isActive, setIsActive] = useState(false);
  const wakeLockRef = useRef<WakeLockSentinel | null>(null);

  useEffect(() => {
    // Check if Wake Lock API is supported
    if ('wakeLock' in navigator) {
      setIsSupported(true);
    }
  }, []);

  const requestWakeLock = async () => {
    if (!isSupported) return false;

    try {
      // Request a screen wake lock
      wakeLockRef.current = await (navigator as any).wakeLock.request('screen');
      setIsActive(true);

      // Listen for wake lock release
      wakeLockRef.current.addEventListener('release', () => {
        setIsActive(false);
        console.log('Wake lock released');
      });

      console.log('Wake lock acquired');
      return true;
    } catch (error) {
      console.warn('Failed to acquire wake lock:', error);
      return false;
    }
  };

  const releaseWakeLock = async () => {
    if (wakeLockRef.current) {
      try {
        await wakeLockRef.current.release();
        wakeLockRef.current = null;
        setIsActive(false);
        console.log('Wake lock released manually');
      } catch (error) {
        console.warn('Failed to release wake lock:', error);
      }
    }
  };

  // Auto re-acquire wake lock when page becomes visible (mobile browser behavior)
  useEffect(() => {
    const handleVisibilityChange = async () => {
      if (document.visibilityState === 'visible' && !wakeLockRef.current && isSupported) {
        // Only re-acquire if we had it before
        if (isActive) {
          await requestWakeLock();
        }
      }
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);
    return () => document.removeEventListener('visibilitychange', handleVisibilityChange);
  }, [isSupported, isActive]);

  return {
    isSupported,
    isActive,
    requestWakeLock,
    releaseWakeLock,
  };
}