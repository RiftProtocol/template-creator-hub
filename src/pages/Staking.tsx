import { useState } from "react";
import { Link } from "react-router-dom";
import { ArrowLeft, Coins, TrendingUp, Shield, Clock, Sparkles } from "lucide-react";
import { cn } from "@/lib/utils";
import { Header } from "@/components/layout/Header";
import { StakeForm, StakeStats, ActiveStakes } from "@/components/staking";
import { STAKING_CONFIG } from "@/lib/staking";

type TabType = "stake" | "positions";

export default function Staking() {
  const [activeTab, setActiveTab] = useState<TabType>("stake");

  return (
    <div className="min-h-screen bg-[#0a0a0a]">
      <Header />

      <main className="pt-24 pb-16 px-4">
        <div className="max-w-2xl mx-auto">
          {/* Back Link */}
          <Link
            to="/"
            className="inline-flex items-center gap-2 text-white/60 hover:text-white mb-8 transition-colors"
          >
            <ArrowLeft className="h-4 w-4" />
            Back to Home
          </Link>

          {/* Hero Section */}
          <div className="text-center mb-10">
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-wallet/10 border border-wallet/20 mb-6">
              <Sparkles className="h-4 w-4 text-wallet" />
              <span className="text-wallet text-sm font-medium">Earn 0.7% Daily</span>
            </div>
            
            <h1 className="text-4xl md:text-5xl font-bold text-white mb-4">
              SOL Staking
            </h1>
            <p className="text-white/60 text-lg max-w-md mx-auto">
              Stake your SOL to expand protocol reserves and earn fixed daily rewards
            </p>
          </div>

          {/* Stats */}
          <div className="mb-8">
            <StakeStats />
          </div>

          {/* Tab Selector */}
          <div className="flex p-1 bg-white/5 rounded-xl mb-6">
            <button
              onClick={() => setActiveTab("stake")}
              className={cn(
                "flex-1 flex items-center justify-center gap-2 py-3 px-4 rounded-lg font-semibold transition-all duration-200",
                activeTab === "stake"
                  ? "bg-wallet text-black"
                  : "text-white/60 hover:text-white hover:bg-white/5"
              )}
            >
              <Coins className="h-4 w-4" />
              Stake
            </button>
            <button
              onClick={() => setActiveTab("positions")}
              className={cn(
                "flex-1 flex items-center justify-center gap-2 py-3 px-4 rounded-lg font-semibold transition-all duration-200",
                activeTab === "positions"
                  ? "bg-wallet text-black"
                  : "text-white/60 hover:text-white hover:bg-white/5"
              )}
            >
              <TrendingUp className="h-4 w-4" />
              My Positions
            </button>
          </div>

          {/* Form Card */}
          <div className="bg-white/5 border border-white/10 rounded-2xl p-6 backdrop-blur-sm mb-8">
            {activeTab === "stake" ? <StakeForm /> : <ActiveStakes />}
          </div>

          {/* How It Works */}
          <div className="bg-gradient-to-br from-wallet/5 to-purple-500/5 border border-wallet/10 rounded-2xl p-6 mb-6">
            <h2 className="text-xl font-bold text-white mb-4 flex items-center gap-2">
              <Shield className="h-5 w-5 text-wallet" />
              How Staking Works
            </h2>
            
            <div className="grid gap-4">
              <div className="flex gap-4">
                <div className="w-8 h-8 rounded-full bg-wallet/20 flex items-center justify-center flex-shrink-0">
                  <span className="text-wallet font-bold text-sm">1</span>
                </div>
                <div>
                  <h3 className="text-white font-semibold">Stake Your SOL</h3>
                  <p className="text-white/60 text-sm">
                    Connect your wallet and deposit SOL into the protocol reserves
                  </p>
                </div>
              </div>
              
              <div className="flex gap-4">
                <div className="w-8 h-8 rounded-full bg-wallet/20 flex items-center justify-center flex-shrink-0">
                  <span className="text-wallet font-bold text-sm">2</span>
                </div>
                <div>
                  <h3 className="text-white font-semibold">Earn 0.7% Daily</h3>
                  <p className="text-white/60 text-sm">
                    Receive fixed rewards of 0.7% per day on your staked amount — forever while active
                  </p>
                </div>
              </div>
              
              <div className="flex gap-4">
                <div className="w-8 h-8 rounded-full bg-wallet/20 flex items-center justify-center flex-shrink-0">
                  <span className="text-wallet font-bold text-sm">3</span>
                </div>
                <div>
                  <h3 className="text-white font-semibold">Claim or Unstake</h3>
                  <p className="text-white/60 text-sm">
                    Claim rewards anytime, or unstake principal + rewards after {STAKING_CONFIG.LOCKUP_DAYS}-day lockup
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Info Cards */}
          <div className="grid md:grid-cols-2 gap-4">
            <div className="bg-white/5 border border-white/10 rounded-xl p-4">
              <div className="flex items-center gap-2 mb-2">
                <Clock className="h-4 w-4 text-orange-400" />
                <h3 className="text-white font-semibold">Lockup Period</h3>
              </div>
              <p className="text-white/60 text-sm">
                {STAKING_CONFIG.LOCKUP_DAYS}-day lockup protects protocol stability. After lockup, unstake anytime.
              </p>
            </div>
            
            <div className="bg-white/5 border border-white/10 rounded-xl p-4">
              <div className="flex items-center gap-2 mb-2">
                <Shield className="h-4 w-4 text-green-400" />
                <h3 className="text-white font-semibold">Expanding Reserves</h3>
              </div>
              <p className="text-white/60 text-sm">
                Your stake helps grow protocol liquidity, enabling larger privacy pools for all users.
              </p>
            </div>
          </div>

          {/* Footer */}
          <div className="text-center text-white/40 text-sm mt-8">
            Treasury: {STAKING_CONFIG.TREASURY_WALLET.slice(0, 8)}...{STAKING_CONFIG.TREASURY_WALLET.slice(-8)}
          </div>
        </div>
      </main>
    </div>
  );
}
