"use client";

import { useEffect, useState } from "react";

interface AnimatedNumberProps {
  value: number;
  duration?: number;
  isCurrency?: boolean;
}

export function AnimatedNumber({ value, duration = 1500, isCurrency = false }: AnimatedNumberProps) {
  const [current, setCurrent] = useState(0);

  useEffect(() => {
    let startTimestamp: number;
    let frameId: number;
    
    // Animate from current to new value
    const startValue = current;
    const endValue = value;
    
    if (startValue === endValue) return;

    const step = (timestamp: number) => {
      if (!startTimestamp) startTimestamp = timestamp;
      const progress = Math.min((timestamp - startTimestamp) / duration, 1);
      
      // easeOutQuart
      const easeProgress = 1 - Math.pow(1 - progress, 4);
      
      setCurrent(Math.floor(startValue + easeProgress * (endValue - startValue)));
      
      if (progress < 1) {
        frameId = window.requestAnimationFrame(step);
      } else {
        setCurrent(endValue);
      }
    };
    
    frameId = window.requestAnimationFrame(step);
    return () => window.cancelAnimationFrame(frameId);
  }, [value, duration]); // Intentionally omitting current from deps to avoid resetting startValue during animation

  if (isCurrency) {
    return <>{current.toLocaleString("vi-VN")}</>;
  }
  return <>{current}</>;
}
