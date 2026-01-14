import { useState } from "react";
import { Clock, TrendingUp, Unlock, Loader2, Gift, ExternalLink } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useStaking } from "@/hooks/useStaking";
import { formatSOL, StakeWithRewards } from "@/lib/staking";
import { cn } from "@/lib/utils";

export function ActiveStakes() {
  const { stakes, totalStaked, totalRewards, isLoading, unstake, claimRewards, isUnstaking, isClaiming } = useStaking();
  const [expandedStake, setExpandedStake] = useState<string | null>(null);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="h-8 w-8 animate-spin text-wallet" />
      </div>
    );
  }

  if (stakes.length === 0) {
    return (
      <div className="text-center py-12">
        <TrendingUp className="h-12 w-12 text-white/20 mx-auto mb-4" />
        <p className="text-white/60 mb-2">No active stakes</p>
        <p className="text-white/40 text-sm">Stake SOL to start earning 0.7% daily rewards</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Summary */}
      <div className="grid grid-cols-2 gap-4">
        <div className="bg-white/5 border border-white/10 rounded-xl p-4">
          <div className="text-white/60 text-sm mb-1">Total Staked</div>
          <div className="text-2xl font-bold text-white">{formatSOL(totalStaked)} SOL</div>
        </div>
        <div className="bg-gradient-to-r from-green-500/10 to-green-500/5 border border-green-500/20 rounded-xl p-4">
          <div className="text-green-400/80 text-sm mb-1">Total Earned</div>
          <div className="text-2xl font-bold text-green-400">+{formatSOL(totalRewards)} SOL</div>
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
            onUnstake={() => unstake(stake.id, stake.amount_sol, stake.earnedRewards)}
            onClaimRewards={() => claimRewards(stake.id, stake.earnedRewards)}
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
    <div
      className={cn(
        "bg-white/5 border border-white/10 rounded-xl overflow-hidden transition-all",
        isExpanded && "border-wallet/30"
      )}
    >
      {/* Header */}
      <button
        onClick={onToggle}
        className="w-full p-4 flex items-center justify-between hover:bg-white/5 transition-colors"
      >
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-full bg-wallet/20 flex items-center justify-center">
            <TrendingUp className="h-5 w-5 text-wallet" />
          </div>
          <div className="text-left">
            <div className="text-white font-semibold">{formatSOL(stake.amount_sol)} SOL</div>
            <div className="text-white/60 text-sm">
              {stake.isLocked ? (
                <span className="flex items-center gap-1 text-orange-400">
                  <Clock className="h-3 w-3" />
                  {stake.lockupRemaining}h remaining
                </span>
              ) : (
                <span className="flex items-center gap-1 text-green-400">
                  <Unlock className="h-3 w-3" />
                  Unlocked
                </span>
              )}
            </div>
          </div>
        </div>
        <div className="text-right">
          <div className="text-green-400 font-semibold">+{formatSOL(stake.earnedRewards)} SOL</div>
          <div className="text-white/40 text-xs">{stake.daysStaked.toFixed(1)} days</div>
        </div>
      </button>

      {/* Expanded Content */}
      {isExpanded && (
        <div className="px-4 pb-4 space-y-4 border-t border-white/10 pt-4">
          {/* Details */}
          <div className="grid grid-cols-2 gap-3 text-sm">
            <div>
              <div className="text-white/40">Staked</div>
              <div className="text-white">{formatDate(stake.staked_at)}</div>
            </div>
            <div>
              <div className="text-white/40">Unlocks</div>
              <div className="text-white">{formatDate(stake.lockup_ends_at)}</div>
            </div>
            <div>
              <div className="text-white/40">Total Value</div>
              <div className="text-wallet font-semibold">{formatSOL(stake.totalValue)} SOL</div>
            </div>
            <div>
              <div className="text-white/40">Transaction</div>
              <a
                href={`https://solscan.io/tx/${stake.tx_signature}`}
                target="_blank"
                rel="noopener noreferrer"
                className="text-wallet hover:underline flex items-center gap-1"
              >
                View <ExternalLink className="h-3 w-3" />
              </a>
            </div>
          </div>

          {/* Actions */}
          <div className="flex gap-2">
            <Button
              onClick={onClaimRewards}
              disabled={isClaiming || stake.earnedRewards < 0.001}
              variant="outline"
              className="flex-1 border-green-500/30 text-green-400 hover:bg-green-500/10"
            >
              {isClaiming ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <>
                  <Gift className="h-4 w-4 mr-2" />
                  Claim Rewards
                </>
              )}
            </Button>
            <Button
              onClick={onUnstake}
              disabled={isUnstaking || stake.isLocked}
              variant="outline"
              className="flex-1 border-wallet/30 text-wallet hover:bg-wallet/10"
            >
              {isUnstaking ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <>
                  <Unlock className="h-4 w-4 mr-2" />
                  Unstake All
                </>
              )}
            </Button>
          </div>

          {stake.isLocked && (
            <p className="text-orange-400/80 text-xs text-center">
              Unstaking available after lockup period ends
            </p>
          )}
        </div>
      )}
    </div>
  );
}
