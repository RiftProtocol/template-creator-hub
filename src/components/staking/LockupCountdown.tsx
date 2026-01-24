import { useState, useEffect } from "react";

interface LockupCountdownProps {
  lockupEndsAt: string;
  className?: string;
}

export function LockupCountdown({ lockupEndsAt, className = "" }: LockupCountdownProps) {
  const [timeRemaining, setTimeRemaining] = useState<{ hours: number; minutes: number; seconds: number } | null>(null);

  useEffect(() => {
    const calculateRemaining = () => {
      const now = Date.now();
      const endTime = new Date(lockupEndsAt).getTime();
      const diff = endTime - now;

      if (diff <= 0) {
        setTimeRemaining(null);
        return;
      }

      const hours = Math.floor(diff / (1000 * 60 * 60));
      const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
      const seconds = Math.floor((diff % (1000 * 60)) / 1000);

      setTimeRemaining({ hours, minutes, seconds });
    };

    calculateRemaining();
    const interval = setInterval(calculateRemaining, 1000);

    return () => clearInterval(interval);
  }, [lockupEndsAt]);

  if (!timeRemaining) {
    return null;
  }

  const formatNumber = (n: number) => n.toString().padStart(2, '0');

  return (
    <span className={className}>
      {formatNumber(timeRemaining.hours)}:{formatNumber(timeRemaining.minutes)}:{formatNumber(timeRemaining.seconds)}
    </span>
  );
}
