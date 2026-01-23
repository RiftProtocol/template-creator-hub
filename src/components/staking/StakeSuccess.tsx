import { Check, ExternalLink, ArrowRight } from "lucide-react";
import { formatSOL, STAKING_CONFIG } from "@/lib/staking";

interface StakeSuccessProps {
  amount: number;
  signature: string;
  onViewPositions: () => void;
  onNewStake: () => void;
}

export function StakeSuccess({ amount, signature, onViewPositions, onNewStake }: StakeSuccessProps) {
  const dailyReward = amount * STAKING_CONFIG.DAILY_REWARD_RATE;
  const monthlyReward = dailyReward * 30;
  
  const shortSignature = `${signature.slice(0, 8)}...${signature.slice(-8)}`;
  const solscanUrl = `https://solscan.io/tx/${signature}`;

  return (
    <div className="space-y-6 text-center">
      {/* Success Icon */}
      <div className="flex justify-center">
        <div className="w-20 h-20 rounded-full bg-green-500/20 flex items-center justify-center">
          <Check className="h-10 w-10 text-green-400" strokeWidth={3} />
        </div>
      </div>

      {/* Success Message */}
      <div>
        <h3 className="text-white font-inter font-semibold text-[24px] mb-2">
          Stake Activated!
        </h3>
        <p className="text-white/60 text-[14px] font-inter">
          Your SOL is now earning 1.45% daily rewards
        </p>
      </div>

      {/* Stake Details */}
      <div className="bg-gradient-to-r from-[#FFCC00]/10 to-green-500/10 border border-[#FFCC00]/20 rounded-2xl p-6 space-y-4">
        <div className="flex justify-between text-[14px] font-inter">
          <span className="text-white/60">Staked Amount</span>
          <span className="text-white font-semibold">{formatSOL(amount)} SOL</span>
        </div>
        <div className="flex justify-between text-[14px] font-inter">
          <span className="text-white/60">Daily Rewards</span>
          <span className="text-green-400 font-semibold">+{formatSOL(dailyReward)} SOL</span>
        </div>
        <div className="flex justify-between text-[14px] font-inter">
          <span className="text-white/60">Monthly Rewards</span>
          <span className="text-green-400 font-semibold">+{formatSOL(monthlyReward)} SOL</span>
        </div>
        <div className="flex justify-between text-[14px] font-inter">
          <span className="text-white/60">Lockup Period</span>
          <span className="text-[#FFCC00] font-semibold">{STAKING_CONFIG.LOCKUP_DAYS} days</span>
        </div>
      </div>

      {/* Transaction Link */}
      <a
        href={solscanUrl}
        target="_blank"
        rel="noopener noreferrer"
        className="flex items-center justify-center gap-2 text-[#FFCC00] hover:text-[#FFD735] text-[14px] font-inter transition-colors"
      >
        <span>View on Solscan: {shortSignature}</span>
        <ExternalLink className="h-4 w-4" />
      </a>

      {/* Action Buttons */}
      <div className="grid grid-cols-2 gap-4">
        <button
          onClick={onNewStake}
          className="py-4 rounded-xl border border-white/20 text-white font-inter text-[14px] font-medium hover:bg-white/5 transition-all"
        >
          Stake More
        </button>
        <button
          onClick={onViewPositions}
          className="py-4 rounded-xl bg-[#FFCC00] text-black font-inter text-[14px] font-semibold hover:bg-[#FFD735] transition-all flex items-center justify-center gap-2"
        >
          View Positions
          <ArrowRight className="h-4 w-4" />
        </button>
      </div>
    </div>
  );
}
