import { useRef, useState, useEffect, useCallback } from 'react';
import { Animated, Easing } from 'react-native';

type SpringConfig = {
  damping?: number;
  stiffness?: number;
  mass?: number;
};

type AnimationDirection = 'up' | 'down' | 'left' | 'right' | 'scale' | 'opacity';

export function useSpringAnimation(
  initialVisible: boolean = false,
  config?: SpringConfig
) {
  const [visible, setVisible] = useState(initialVisible);
  const translateY = useRef(new Animated.Value(0)).current;
  const scale = useRef(new Animated.Value(1)).current;
  const opacity = useRef(new Animated.Value(initialVisible ? 1 : 0)).current;

  const springConfig = {
    damping: config?.damping ?? 20,
    stiffness: config?.stiffness ?? 150,
    mass: config?.mass ?? 1,
  };

  const open = useCallback(() => {
    setVisible(true);
    Animated.parallel([
      Animated.timing(opacity, {
        toValue: 1,
        duration: 300,
        useNativeDriver: true,
        easing: Easing.out(Easing.cubic),
      }),
      Animated.spring(translateY, {
        toValue: 0,
        ...springConfig,
        useNativeDriver: true,
      }),
      Animated.spring(scale, {
        toValue: 1,
        useNativeDriver: true,
      }),
    ]).start();
  }, [opacity, translateY, scale, springConfig]);

  const close = useCallback(() => {
    Animated.parallel([
      Animated.timing(opacity, {
        toValue: 0,
        duration: 200,
        useNativeDriver: true,
        easing: Easing.out(Easing.quad),
      }),
      Animated.timing(translateY, {
        toValue: -20,
        duration: 200,
        useNativeDriver: true,
        easing: Easing.out(Easing.quad),
      }),
      Animated.spring(scale, {
        toValue: 0.95,
        ...springConfig,
        useNativeDriver: true,
      }),
    ]).start(() => {
      setVisible(false);
    });
  }, [opacity, translateY, scale, springConfig]);

  const toggle = useCallback(() => {
    if (visible) {
      close();
    } else {
      open();
    }
  }, [visible, open, close]);

  // Calculate interpolated values
  const animatedStyle = {
    transform: [
      { translateY },
      { scale },
    ],
    opacity,
  };

  const isClamped = useRef(false);

  return {
    visible,
    isOpen: visible,
    open,
    close,
    toggle,
    animatedStyle,
    isClamped: isClamped.current,
  };
}

type SwipeableConfig = {
  threshold?: number;
  velocityThreshold?: number;
};

export function useSwipeable(
  onSwipeUp: () => void,
  onSwipeDown: () => void,
  config?: SwipeableConfig
) {
  const [dragging, setDragging] = useState(false);
  const startY = useRef(0);
  const currentY = useRef(0);
  const velocityY = useRef(0);

  const threshold = config?.threshold ?? 50;
  const velocityThreshold = config?.velocityThreshold ?? 1000;

  const handleStart = useCallback((y: number) => {
    setDragging(true);
    startY.current = y;
    currentY.current = y;
    velocityY.current = 0;
  }, []);

  const handleMove = useCallback((y: number) => {
    if (dragging) {
      velocityY.current = y - currentY.current;
      currentY.current = y;
    }
  }, [dragging]);

  const handleEnd = useCallback(() => {
    if (!dragging) return;

    const deltaY = currentY.current - startY.current;
    const absDelta = Math.abs(deltaY);

    if (absDelta > threshold || Math.abs(velocityY.current) > velocityThreshold) {
      if (deltaY < 0) {
        onSwipeUp();
      } else {
        onSwipeDown();
      }
    }

    setDragging(false);
  }, [dragging, threshold, velocityThreshold, onSwipeUp, onSwipeDown]);

  return {
    dragging,
    handleStart,
    handleMove,
    handleEnd,
  };
}