import React, { useEffect, useState } from 'react';

interface RouteProgressBarProps {
  isNavigating: boolean;
}

export const RouteProgressBar: React.FC<RouteProgressBarProps> = ({ isNavigating }) => {
  const [visible, setVisible] = useState(false);
  const [progress, setProgress] = useState(0);

  useEffect(() => {
    let timer1: any;
    let timer2: any;
    let timer3: any;

    if (isNavigating) {
      setVisible(true);
      setProgress(30);

      timer1 = setTimeout(() => {
        setProgress(80);
      }, 70);

      timer2 = setTimeout(() => {
        setProgress(100);
      }, 200);

      timer3 = setTimeout(() => {
        setVisible(false);
        setProgress(0);
      }, 400);
    } else {
      setVisible(false);
      setProgress(0);
    }

    return () => {
      clearTimeout(timer1);
      clearTimeout(timer2);
      clearTimeout(timer3);
    };
  }, [isNavigating]);

  if (!visible) return null;

  return (
    <div className="fixed top-0 left-0 right-0 z-50 h-[3px] bg-transparent pointer-events-none overflow-hidden">
      <div
        className="h-full bg-gradient-to-r from-primary via-emerald-400 to-amber-500 transition-all duration-200 ease-out shadow-[0_0_10px_rgba(45,90,67,0.7)]"
        style={{
          width: `${progress}%`,
          opacity: progress === 100 ? 0 : 1,
          transition: progress === 100 ? 'width 140ms ease-out, opacity 200ms ease-in' : 'width 180ms ease-out',
        }}
      />
    </div>
  );
};
