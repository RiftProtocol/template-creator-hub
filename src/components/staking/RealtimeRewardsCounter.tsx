import { useState, useEffect, useRef } from "react";
import { STAKING_CONFIG, formatSOL, Stake } from "@/lib/staking";

interface RealtimeRewardsCounterProps {
  stakes: Stake[];
  className?: string;
}

export function RealtimeRewardsCounter({ stakes, className = "" }: RealtimeRewardsCounterProps) {
  const [displayValue, setDisplayValue] = useState(0);
  const animationRef = useRef<number | null>(null);

  useEffect(() => {
    if (stakes.length === 0) {
      setDisplayValue(0);
      return;
    }

    // Calculate reward rate per millisecond for all stakes combined
    const msPerDay = 24 * 60 * 60 * 1000;
    const ratePerMs = STAKING_CONFIG.DAILY_REWARD_RATE / msPerDay;

    const calculateCurrentRewards = () => {
      const now = Date.now();
      let total = 0;

      for (const stake of stakes) {
        const stakedAt = new Date(stake.staked_at).getTime();
        const msStaked = Math.max(0, now - stakedAt);
        const earnedTotal = stake.amount_sol * ratePerMs * msStaked;
        const claimable = Math.max(0, earnedTotal - (stake.claimed_rewards_sol || 0));
        total += claimable;
      }

      return total;
    };

    // Update at 60fps for smooth counting
    const tick = () => {
      setDisplayValue(calculateCurrentRewards());
      animationRef.current = requestAnimationFrame(tick);
    };

    animationRef.current = requestAnimationFrame(tick);

    return () => {
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current);
      }
    };
  }, [stakes]);

  return (
    <span className={className}>
      +{formatSOL(displayValue, 8)} SOL
    </span>
  );
}
