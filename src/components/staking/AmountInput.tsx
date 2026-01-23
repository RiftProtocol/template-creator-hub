import { Loader2, RefreshCw, AlertCircle } from "lucide-react";
import { STAKING_CONFIG, formatSOL } from "@/lib/staking";

const QUICK_AMOUNTS = [0.5, 1, 5, 10];

interface AmountInputProps {
  amount: string;
  onAmountChange: (amount: string) => void;
  balance: number | null;
  isLoadingBalance: boolean;
  balanceError: string | null;
  onRefetchBalance: () => void;
  onContinue: () => void;
  isValid: boolean;
}

export function AmountInput({
  amount,
  onAmountChange,
  balance,
  isLoadingBalance,
  balanceError,
  onRefetchBalance,
  onContinue,
  isValid,
}: AmountInputProps) {
  const numAmount = parseFloat(amount) || 0;
  
  const handleMaxClick = () => {
    if (balance !== null) {
      const maxStake = Math.min(balance - 0.01, STAKING_CONFIG.MAX_STAKE_SOL);
      onAmountChange(Math.max(0, maxStake).toFixed(4));
    }
  };

  const handleQuickAmount = (val: number) => {
    onAmountChange(val.toString());
  };

  const getValidationError = () => {
    if (numAmount <= 0) return null;
    if (numAmount < STAKING_CONFIG.MIN_STAKE_SOL) {
      return `Minimum ${STAKING_CONFIG.MIN_STAKE_SOL} SOL`;
    }
    if (numAmount > STAKING_CONFIG.MAX_STAKE_SOL) {
      return `Maximum ${STAKING_CONFIG.MAX_STAKE_SOL} SOL`;
    }
    if (balance !== null && numAmount > balance) {
      return "Insufficient balance";
    }
    return null;
  };

  const validationError = getValidationError();

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
                onClick={onRefetchBalance}
                className="text-[#FFCC00] hover:text-[#FFD735] ml-1"
              >
                <RefreshCw className="h-4 w-4" />
              </button>
            </span>
          ) : (
            <span className="text-white font-inter font-semibold flex items-center gap-2">
              {formatSOL(balance ?? 0)} SOL
              <button
                onClick={onRefetchBalance}
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
            onChange={(e) => onAmountChange(e.target.value)}
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
        
        {validationError && (
          <p className="text-red-400 text-[12px] font-inter">{validationError}</p>
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
      {numAmount > 0 && isValid && (
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

      {/* Continue Button */}
      <button
        onClick={onContinue}
        disabled={!isValid}
        className="w-full h-16 rounded-xl bg-[#FFCC00] text-black font-inter text-[16px] font-semibold hover:bg-[#FFD735] active:shadow-[0_0_20px_0_#FFCC00] disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200 flex items-center justify-center gap-2"
      >
        <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2"/>
        </svg>
        Continue to Payment
      </button>

      {/* Info */}
      <p className="text-center text-white/40 text-[12px] font-inter">
        Your SOL helps expand protocol reserves while earning you 1.45% daily
      </p>
    </div>
  );
}
