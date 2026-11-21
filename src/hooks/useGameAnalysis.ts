import { useState, useEffect, useRef } from 'react';
import { AppState, AppStateStatus } from 'react-native';

type GameSession = {
  startTime: number;
  endTime: number | null;
  games: string[];
  active: boolean;
};

type GameHistory = {
  id: string;
  gameName: string;
  startTime: number;
  endTime: number;
  duration: number;
  quality: '720p' | '1080p' | 'auto';
};

export function useGameAnalysis() {
  const [session, setSession] = useState<GameSession>({
    startTime: 0,
    endTime: null,
    games: [],
    active: false,
  });
  const [history, setHistory] = useState<GameHistory[]>([]);
  const appState = useRef<AppStateStatus | null>(
    (AppState.currentState as AppStateStatus | undefined) ?? null
  );

  useEffect(() => {
    const handleAppState = (nextAppState: AppStateStatus) => {
      if (appState.current?.match(/inactive|background/) && nextAppState === 'active') {
        // App returned to foreground
        setSession((prev) => ({
          ...prev,
          active: true,
          endTime: null,
        }));
      } else if (nextAppState === 'background' || nextAppState === 'inactive') {
        // App went to background
        setSession((prev) => {
          const newSession = {
            ...prev,
            active: false,
            endTime: Date.now(),
          };

          // Add to history if session was active long enough (> 5 minutes)
          const endTime = newSession.endTime ?? Date.now();
          if (newSession.startTime > 0 && endTime - newSession.startTime > 300000) {
            const entry: GameHistory = {
              id: String(newSession.startTime),
              gameName: newSession.games.join(', '),
              startTime: newSession.startTime,
              endTime,
              duration: endTime - newSession.startTime,
              quality: 'auto',
            };
            setHistory((h) => [entry, ...h].slice(0, 50));
          }

          return {
            startTime: Date.now(),
            endTime: null,
            games: [],
            active: false,
          };
        });
      }
      appState.current = nextAppState;
    };

    const subscription = AppState.addEventListener('change', handleAppState);

    // Start a session when the hook mounts
    if (session.startTime === 0) {
      setSession((prev) => ({ ...prev, startTime: Date.now(), active: true }));
    }

    return () => subscription.remove();
  }, [session.startTime]);

  const addGame = (gameName: string) => {
    setSession((prev) => ({
      ...prev,
      games: [...new Set([...prev.games, gameName])],
    }));
  };

  const resetSession = () => {
    setSession({
      startTime: Date.now(),
      endTime: null,
      games: [],
      active: true,
    });
  };

  return {
    session,
    history,
    addGame,
    resetSession,
  };
}