import { useState } from "react";
import { Loader2, Zap, Lock } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useStaking } from "@/hooks/useStaking";
import { useWalletConnection } from "@/hooks/useWalletConnection";
import { STAKING_CONFIG, formatSOL } from "@/lib/staking";
import { cn } from "@/lib/utils";

const QUICK_AMOUNTS = [0.5, 1, 5, 10];

export function StakeForm() {
  const [amount, setAmount] = useState("");
  const { stake, isStaking } = useStaking();
  const { connected, balance } = useWalletConnection();

  const numAmount = parseFloat(amount) || 0;
  const isValidAmount = numAmount >= STAKING_CONFIG.MIN_STAKE_SOL && 
                        numAmount <= STAKING_CONFIG.MAX_STAKE_SOL &&
                        (balance === null || numAmount <= balance);

  const handleStake = async () => {
    if (!isValidAmount) return;
    const result = await stake(numAmount);
    if (result) {
      setAmount("");
    }
  };

  const handleQuickAmount = (val: number) => {
    setAmount(val.toString());
  };

  const handleMaxClick = () => {
    if (balance !== null) {
      // Leave some for tx fees
      const maxStake = Math.min(balance - 0.01, STAKING_CONFIG.MAX_STAKE_SOL);
      setAmount(Math.max(0, maxStake).toFixed(4));
    }
  };

  if (!connected) {
    return (
      <div className="text-center py-8">
        <Lock className="h-12 w-12 text-white/40 mx-auto mb-4" />
        <p className="text-white/60 mb-4">Connect your wallet to start staking</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Balance Display */}
      <div className="flex justify-between items-center text-sm">
        <span className="text-white/60">Your Balance</span>
        <span className="text-white font-medium">
          {balance !== null ? `${formatSOL(balance)} SOL` : "Loading..."}
        </span>
      </div>

      {/* Amount Input */}
      <div className="space-y-2">
        <div className="relative">
          <Input
            type="number"
            value={amount}
            onChange={(e) => setAmount(e.target.value)}
            placeholder="0.00"
            className="bg-white/5 border-white/10 text-white text-2xl h-16 pr-20 font-bold focus:border-wallet focus:ring-wallet"
          />
          <div className="absolute right-4 top-1/2 -translate-y-1/2 flex items-center gap-2">
            <button
              onClick={handleMaxClick}
              className="text-xs text-wallet hover:text-wallet-hover font-semibold"
            >
              MAX
            </button>
            <span className="text-white/60 text-sm">SOL</span>
          </div>
        </div>
        
        {numAmount > 0 && !isValidAmount && (
          <p className="text-red-400 text-sm">
            {numAmount < STAKING_CONFIG.MIN_STAKE_SOL
              ? `Minimum ${STAKING_CONFIG.MIN_STAKE_SOL} SOL`
              : numAmount > STAKING_CONFIG.MAX_STAKE_SOL
              ? `Maximum ${STAKING_CONFIG.MAX_STAKE_SOL} SOL`
              : "Insufficient balance"}
          </p>
        )}
      </div>

      {/* Quick Amounts */}
      <div className="grid grid-cols-4 gap-2">
        {QUICK_AMOUNTS.map((val) => (
          <button
            key={val}
            onClick={() => handleQuickAmount(val)}
            className={cn(
              "py-2 px-3 rounded-lg text-sm font-medium transition-all",
              amount === val.toString()
                ? "bg-wallet text-black"
                : "bg-white/5 text-white/80 hover:bg-white/10"
            )}
          >
            {val} SOL
          </button>
        ))}
      </div>

      {/* Rewards Preview */}
      {numAmount > 0 && isValidAmount && (
        <div className="bg-gradient-to-r from-wallet/10 to-green-500/10 border border-wallet/20 rounded-xl p-4 space-y-2">
          <div className="flex justify-between text-sm">
            <span className="text-white/60">Daily Rewards</span>
            <span className="text-green-400 font-semibold">
              +{formatSOL(numAmount * STAKING_CONFIG.DAILY_REWARD_RATE)} SOL
            </span>
          </div>
          <div className="flex justify-between text-sm">
            <span className="text-white/60">Monthly Rewards</span>
            <span className="text-green-400 font-semibold">
              +{formatSOL(numAmount * STAKING_CONFIG.DAILY_REWARD_RATE * 30)} SOL
            </span>
          </div>
          <div className="flex justify-between text-sm">
            <span className="text-white/60">Lockup Period</span>
            <span className="text-wallet font-semibold">
              {STAKING_CONFIG.LOCKUP_DAYS} days
            </span>
          </div>
        </div>
      )}

      {/* Stake Button */}
      <Button
        onClick={handleStake}
        disabled={!isValidAmount || isStaking}
        className="w-full h-14 text-lg font-bold bg-gradient-to-r from-wallet to-yellow-500 hover:from-wallet-hover hover:to-yellow-400 text-black disabled:opacity-50"
      >
        {isStaking ? (
          <>
            <Loader2 className="mr-2 h-5 w-5 animate-spin" />
            Staking...
          </>
        ) : (
          <>
            <Zap className="mr-2 h-5 w-5" />
            Stake {numAmount > 0 ? `${numAmount} SOL` : "SOL"}
          </>
        )}
      </Button>

      {/* Info */}
      <p className="text-center text-white/40 text-xs">
        Your SOL helps expand protocol reserves while earning you 0.7% daily
      </p>
    </div>
  );
}
