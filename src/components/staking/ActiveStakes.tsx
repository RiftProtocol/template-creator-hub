import { useState } from "react";
import { Loader2, Clock, Unlock, Lock } from "lucide-react";
import { useStaking } from "@/hooks/useStaking";
import { formatSOL, StakeWithRewards } from "@/lib/staking";
import { RealtimeRewardsCounter } from "./RealtimeRewardsCounter";
import { LockupCountdown } from "./LockupCountdown";
export function ActiveStakes() {
  const { stakes, rawStakes, totalStaked, isLoading, unstake, claimRewards, isUnstaking, isClaiming } = useStaking();
  const [expandedStake, setExpandedStake] = useState<string | null>(null);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-16">
        <Loader2 className="h-8 w-8 animate-spin text-[#FFCC00]" />
      </div>
    );
  }

  if (stakes.length === 0) {
    return (
      <div className="text-center py-16">
        <svg xmlns="http://www.w3.org/2000/svg" width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" className="mx-auto mb-6 text-white/20">
          <path d="M22 12H18L15 21L9 3L6 12H2"/>
        </svg>
        <p className="text-white/60 text-[18px] mb-2 font-inter">No active stakes</p>
        <p className="text-white/40 text-[14px] font-inter">Stake SOL to start earning 0.7% daily rewards</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Summary */}
      <div className="grid grid-cols-2 gap-4">
        <div className="rounded-2xl bg-white/5 border border-white/10 p-5">
          <div className="text-white/60 text-[12px] font-inter mb-1">Total Staked</div>
          <div className="text-[24px] font-inter font-bold text-white">{formatSOL(totalStaked)} SOL</div>
        </div>
        <div className="rounded-2xl bg-gradient-to-r from-green-500/10 to-green-500/5 border border-green-500/20 p-5">
          <div className="text-green-400/80 text-[12px] font-inter mb-1">Total Earned</div>
          <div className="text-[24px] font-inter font-bold text-green-400">
            <RealtimeRewardsCounter stakes={rawStakes} />
          </div>
        </div>
      </div>

      {/* Stakes List */}
      <div className="space-y-3">
        {stakes.map((stake) => (
          <StakeCard
            key={stake.id}
            stake={stake}
            isExpanded={expandedStake === stake.id}
            onToggle={() => setExpandedStake(expandedStake === stake.id ? null : stake.id)}
            onUnstake={() => unstake(stake.id, stake.amount_sol, stake.claimableRewards)}
            onClaimRewards={() => claimRewards(stake.id, stake.claimableRewards)}
            isUnstaking={isUnstaking}
            isClaiming={isClaiming}
          />
        ))}
      </div>
    </div>
  );
}

interface StakeCardProps {
  stake: StakeWithRewards;
  isExpanded: boolean;
  onToggle: () => void;
  onUnstake: () => void;
  onClaimRewards: () => void;
  isUnstaking: boolean;
  isClaiming: boolean;
}

function StakeCard({ stake, isExpanded, onToggle, onUnstake, onClaimRewards, isUnstaking, isClaiming }: StakeCardProps) {
  const formatDate = (dateStr: string) => {
    return new Date(dateStr).toLocaleDateString(undefined, {
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  return (
    <div className={`rounded-2xl bg-white/5 border transition-all ${isExpanded ? "border-[#FFCC00]/30" : "border-white/10"}`}>
      {/* Header */}
      <button
        onClick={onToggle}
        className="w-full p-5 flex items-center justify-between hover:bg-white/5 transition-colors rounded-t-2xl"
      >
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 rounded-full bg-[#FFCC00]/20 flex items-center justify-center">
            <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#FFCC00" strokeWidth="2">
              <path d="M22 12H18L15 21L9 3L6 12H2"/>
            </svg>
          </div>
          <div className="text-left">
            <div className="text-white font-inter font-semibold text-[16px]">{formatSOL(stake.amount_sol)} SOL</div>
            <div className="text-[12px] font-inter">
              {stake.isLocked ? (
                <div className="flex flex-col gap-0.5">
                  <span className="flex items-center gap-1 text-orange-400">
                    <Lock className="w-3 h-3" />
                    <span>Locked for 72h</span>
                  </span>
                  <span className="flex items-center gap-1 text-orange-400/80">
                    <Clock className="w-3 h-3" />
                    <LockupCountdown lockupEndsAt={stake.lockup_ends_at} />
                    <span className="text-white/40">remaining</span>
                  </span>
                </div>
              ) : (
                <span className="flex items-center gap-1 text-green-400">
                  <Unlock className="w-3 h-3" />
                  Unlocked - Ready to withdraw
                </span>
              )}
            </div>
          </div>
        </div>
        <div className="text-right">
          <div className="text-green-400 font-inter font-semibold">+{formatSOL(stake.claimableRewards)} SOL</div>
          <div className="text-white/40 text-[12px] font-inter">{stake.daysStaked.toFixed(1)} days</div>
        </div>
      </button>

      {/* Claim Button - Always visible outside expanded section */}
      <div className="px-5 pb-4">
        <button
          onClick={(e) => {
            e.stopPropagation();
            onClaimRewards();
          }}
          disabled={isClaiming || stake.claimableRewards < 0.05}
          className="w-full py-3 rounded-xl border border-green-500/30 text-green-400 font-inter font-semibold text-[14px] hover:bg-green-500/10 disabled:opacity-50 disabled:cursor-not-allowed transition-all flex items-center justify-center gap-2"
        >
          {isClaiming ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : (
            <>
              <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M20 12V22H4V12"/>
                <path d="M22 7H2V12H22V7Z"/>
                <path d="M12 22V7"/>
                <path d="M12 7H7.5C6.83696 7 6.20107 6.73661 5.73223 6.26777C5.26339 5.79893 5 5.16304 5 4.5C5 3.83696 5.26339 3.20107 5.73223 2.73223C6.20107 2.26339 6.83696 2 7.5 2C11 2 12 7 12 7Z"/>
                <path d="M12 7H16.5C17.163 7 17.7989 6.73661 18.2678 6.26777C18.7366 5.79893 19 5.16304 19 4.5C19 3.83696 18.7366 3.20107 18.2678 2.73223C17.7989 2.26339 17.163 2 16.5 2C13 2 12 7 12 7Z"/>
              </svg>
              Claim Rewards {stake.claimableRewards < 0.05 && `(min 0.05 SOL)`}
            </>
          )}
        </button>
        {stake.claimableRewards < 0.05 && (
          <p className="text-white/40 text-[11px] text-center mt-1 font-inter">
            {formatSOL(0.05 - stake.claimableRewards)} SOL more to unlock claim
          </p>
        )}
      </div>

      {/* Expanded Content */}
      {isExpanded && (
        <div className="px-5 pb-5 space-y-5 border-t border-white/10 pt-5">
          {/* Details */}
          <div className="grid grid-cols-2 gap-4 text-[14px] font-inter">
            <div>
              <div className="text-white/40 text-[12px]">Staked</div>
              <div className="text-white">{formatDate(stake.staked_at)}</div>
            </div>
            <div>
              <div className="text-white/40 text-[12px]">Unlocks</div>
              <div className="text-white">{formatDate(stake.lockup_ends_at)}</div>
            </div>
            <div>
              <div className="text-white/40 text-[12px]">Total Value</div>
              <div className="text-[#FFCC00] font-semibold">{formatSOL(stake.totalValue)} SOL</div>
            </div>
            <div>
              <div className="text-white/40 text-[12px]">Transaction</div>
              <a
                href={`https://solscan.io/tx/${stake.tx_signature}`}
                target="_blank"
                rel="noopener noreferrer"
                className="text-[#FFCC00] hover:underline flex items-center gap-1"
              >
                View
                <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M18 13V19C18 20.1046 17.1046 21 16 21H5C3.89543 21 3 20.1046 3 19V8C3 6.89543 3.89543 6 5 6H11"/>
                  <path d="M15 3H21V9"/>
                  <path d="M10 14L21 3"/>
                </svg>
              </a>
            </div>
          </div>

          <div className="flex gap-3">
            <button
              onClick={onUnstake}
              disabled={isUnstaking || stake.isLocked}
              className="flex-1 py-3 rounded-xl border border-[#FFCC00]/30 text-[#FFCC00] font-inter font-semibold text-[14px] hover:bg-[#FFCC00]/10 disabled:opacity-50 disabled:cursor-not-allowed transition-all flex items-center justify-center gap-2"
            >
              {isUnstaking ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <>
                  <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <rect x="3" y="11" width="18" height="11" rx="2" ry="2"/>
                    <path d="M7 11V7a5 5 0 0 1 9.9-1"/>
                  </svg>
                  Unstake All
                </>
              )}
            </button>
          </div>

          {stake.isLocked && (
            <p className="text-orange-400/80 text-[12px] text-center font-inter">
              Unstaking available after lockup period ends
            </p>
          )}
        </div>
      )}
    </div>
  );
}
