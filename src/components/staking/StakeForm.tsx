import { useState } from "react";
import { Loader2, RefreshCw, AlertCircle } from "lucide-react";
import { useStaking } from "@/hooks/useStaking";
import { useWalletConnection } from "@/hooks/useWalletConnection";
import { useWalletVerification } from "@/hooks/useWalletVerification";
import { STAKING_CONFIG, formatSOL } from "@/lib/staking";
import { WalletButton } from "@/components/wallet";

const QUICK_AMOUNTS = [0.5, 1, 5, 10];

export function StakeForm() {
  const [amount, setAmount] = useState("");
  const { stake, isStaking } = useStaking();
  const { connected, balance, isLoadingBalance, balanceError, refetchBalance } = useWalletConnection();
  const { isVerified, isVerifying, verifyWallet } = useWalletVerification();

  const numAmount = parseFloat(amount) || 0;
  const isValidAmount = numAmount >= STAKING_CONFIG.MIN_STAKE_SOL && 
                        numAmount <= STAKING_CONFIG.MAX_STAKE_SOL &&
                        (balance === null || numAmount <= balance);

  const handleStake = async () => {
    if (!isValidAmount || !isVerified) return;
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
      const maxStake = Math.min(balance - 0.01, STAKING_CONFIG.MAX_STAKE_SOL);
      setAmount(Math.max(0, maxStake).toFixed(4));
    }
  };

  // Not connected state
  if (!connected) {
    return (
      <div className="text-center py-12">
        <svg xmlns="http://www.w3.org/2000/svg" width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" className="mx-auto mb-6 text-white/20">
          <rect x="3" y="11" width="18" height="11" rx="2" ry="2"/>
          <path d="M7 11V7a5 5 0 0 1 10 0v4"/>
        </svg>
        <p className="text-white/60 text-[18px] mb-6 font-inter">Connect your wallet to start staking</p>
        <div className="flex justify-center">
          <WalletButton />
        </div>
      </div>
    );
  }

  // Verifying state
  if (isVerifying) {
    return (
      <div className="text-center py-12">
        <Loader2 className="mx-auto mb-6 h-12 w-12 text-[#FFCC00] animate-spin" />
        <p className="text-white text-[18px] mb-2 font-inter font-semibold">Verifying Wallet</p>
        <p className="text-white/60 text-[14px] font-inter">Please sign the message in your wallet to verify ownership</p>
      </div>
    );
  }

  // Not verified state
  if (!isVerified) {
    return (
      <div className="text-center py-12">
        <AlertCircle className="mx-auto mb-6 h-12 w-12 text-[#FFCC00]" />
        <p className="text-white text-[18px] mb-2 font-inter font-semibold">Verification Required</p>
        <p className="text-white/60 text-[14px] mb-6 font-inter">Sign a message to verify wallet ownership</p>
        <button
          onClick={() => verifyWallet()}
          className="px-6 py-3 rounded-xl bg-[#FFCC00] text-black font-inter text-[14px] font-semibold hover:bg-[#FFD735] transition-all duration-200"
        >
          Verify Wallet
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Balance Display */}
      <div className="flex justify-between items-center">
        <span className="text-white/60 text-[14px] font-inter">Your Balance</span>
        <div className="flex items-center gap-2">
          {isLoadingBalance ? (
            <span className="text-white/60 font-inter flex items-center gap-2">
              <Loader2 className="h-4 w-4 animate-spin" />
              Loading...
            </span>
          ) : balanceError ? (
            <span className="text-red-400 font-inter flex items-center gap-2">
              <AlertCircle className="h-4 w-4" />
              Error
              <button
                onClick={() => refetchBalance()}
                className="text-[#FFCC00] hover:text-[#FFD735] ml-1"
              >
                <RefreshCw className="h-4 w-4" />
              </button>
            </span>
          ) : (
            <span className="text-white font-inter font-semibold flex items-center gap-2">
              {formatSOL(balance ?? 0)} SOL
              <button
                onClick={() => refetchBalance()}
                className="text-white/40 hover:text-white transition-colors"
                title="Refresh balance"
              >
                <RefreshCw className="h-4 w-4" />
              </button>
            </span>
          )}
        </div>
      </div>

      {/* Amount Input */}
      <div className="space-y-2">
        <div className="relative">
          <input
            type="number"
            value={amount}
            onChange={(e) => setAmount(e.target.value)}
            placeholder="0.00"
            className="w-full bg-white/5 border border-white/10 rounded-xl text-white text-[32px] h-20 px-6 pr-24 font-inter font-bold focus:outline-none focus:border-[#FFCC00] transition-all"
          />
          <div className="absolute right-6 top-1/2 -translate-y-1/2 flex items-center gap-3">
            <button
              onClick={handleMaxClick}
              className="text-[12px] text-[#FFCC00] hover:text-[#FFD735] font-inter font-semibold"
            >
              MAX
            </button>
            <span className="text-white/40 text-[14px] font-inter">SOL</span>
          </div>
        </div>
        
        {numAmount > 0 && !isValidAmount && (
          <p className="text-red-400 text-[12px] font-inter">
            {numAmount < STAKING_CONFIG.MIN_STAKE_SOL
              ? `Minimum ${STAKING_CONFIG.MIN_STAKE_SOL} SOL`
              : numAmount > STAKING_CONFIG.MAX_STAKE_SOL
              ? `Maximum ${STAKING_CONFIG.MAX_STAKE_SOL} SOL`
              : "Insufficient balance"}
          </p>
        )}
      </div>

      {/* Quick Amounts */}
      <div className="grid grid-cols-4 gap-3">
        {QUICK_AMOUNTS.map((val) => (
          <button
            key={val}
            onClick={() => handleQuickAmount(val)}
            className={`py-3 px-4 rounded-xl text-[14px] font-inter font-medium transition-all duration-200 ${
              amount === val.toString()
                ? "bg-[#FFCC00] text-black"
                : "bg-white/5 text-white/80 hover:bg-white/10 border border-white/10"
            }`}
          >
            {val} SOL
          </button>
        ))}
      </div>

      {/* Rewards Preview */}
      {numAmount > 0 && isValidAmount && (
        <div className="rounded-2xl bg-gradient-to-r from-[#FFCC00]/10 to-green-500/10 border border-[#FFCC00]/20 p-6 space-y-3">
          <div className="flex justify-between text-[14px] font-inter">
            <span className="text-white/60">Daily Rewards</span>
            <span className="text-green-400 font-semibold">
              +{formatSOL(numAmount * STAKING_CONFIG.DAILY_REWARD_RATE)} SOL
            </span>
          </div>
          <div className="flex justify-between text-[14px] font-inter">
            <span className="text-white/60">Monthly Rewards</span>
            <span className="text-green-400 font-semibold">
              +{formatSOL(numAmount * STAKING_CONFIG.DAILY_REWARD_RATE * 30)} SOL
            </span>
          </div>
          <div className="flex justify-between text-[14px] font-inter">
            <span className="text-white/60">Lockup Period</span>
            <span className="text-[#FFCC00] font-semibold">
              {STAKING_CONFIG.LOCKUP_DAYS} days
            </span>
          </div>
        </div>
      )}

      {/* Stake Button */}
      <button
        onClick={handleStake}
        disabled={!isValidAmount || isStaking}
        className="w-full h-16 rounded-xl bg-[#FFCC00] text-black font-inter text-[16px] font-semibold hover:bg-[#FFD735] active:shadow-[0_0_20px_0_#FFCC00] disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200 flex items-center justify-center gap-2"
      >
        {isStaking ? (
          <>
            <Loader2 className="h-5 w-5 animate-spin" />
            Staking...
          </>
        ) : (
          <>
            <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2"/>
            </svg>
            Stake {numAmount > 0 ? `${numAmount} SOL` : "SOL"}
          </>
        )}
      </button>

      {/* Info */}
      <p className="text-center text-white/40 text-[12px] font-inter">
        Your SOL helps expand protocol reserves while earning you 0.7% daily
      </p>
    </div>
  );
}
