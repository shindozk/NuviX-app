import { useState, useEffect, useRef } from 'react';
import { Dimensions, Platform } from 'react-native';

type PerformanceStats = {
  fps: number;
  memory: string;
  battery: number;
  temperature: number;
};

type UsePerformanceStatsOptions = {
  enabled: boolean;
  interval?: number;
};

export function usePerformanceStats(options?: UsePerformanceStatsOptions) {
  const { enabled = false, interval = 1000 } = options || {};
  const [stats, setStats] = useState<PerformanceStats>({
    fps: 60,
    memory: 'N/A',
    battery: 100,
    temperature: 0,
  });
  const [visible, setVisible] = useState(false);
  const animationFrame = useRef<number | undefined>(undefined);
  const frameCount = useRef(0);
  const lastTime = useRef<number>(Date.now());
  const intervalRef = useRef<ReturnType<typeof setInterval> | undefined>(undefined);

  useEffect(() => {
    if (!enabled) return;

    const updateStats = () => {
      const now = Date.now();
      const delta = now - lastTime.current;

      if (delta >= 1000) {
        const fps = Math.round((frameCount.current * 1000) / delta);
        setStats((prev) => ({
          ...prev,
          fps,
          memory: 'N/A', // Not available without native module
        }));
        frameCount.current = 0;
        lastTime.current = now;
      }

      frameCount.current += 1;
      animationFrame.current = requestAnimationFrame(updateStats);
    };

    if (visible) {
      updateStats();
    }

    return () => {
      if (animationFrame.current) {
        cancelAnimationFrame(animationFrame.current);
      }
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
    };
  }, [enabled, visible]);

  const toggleStats = () => {
    setVisible((prev) => !prev);
  };

  return {
    stats,
    visible,
    toggleStats,
    setVisible,
  };
}

type UseBatteryStatsOptions = {
  enabled?: boolean;
};

export function useBatteryStats(options?: UseBatteryStatsOptions) {
  const { enabled = true } = options || {};
  const [battery, setBattery] = useState<number>(100);
  const [charging, setCharging] = useState<boolean>(false);

  useEffect(() => {
    if (!enabled) return;

    const getBattery = async () => {
      try {
        // @ts-ignore - Not available on all platforms
        const batteryAPI = navigator?.getBattery ? await navigator.getBattery() : null;
        if (batteryAPI) {
          setBattery(Math.round(batteryAPI.level * 100));
          setCharging(batteryAPI.charging);
        }
      } catch {
        // Fallback
        setBattery(100);
      }
    };

    getBattery();

    // Update every 30 seconds
    const interval = setInterval(getBattery, 30000);

    return () => clearInterval(interval);
  }, [enabled]);

  return { battery, charging };
}