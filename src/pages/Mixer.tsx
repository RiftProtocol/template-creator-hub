import { useState } from "react";
import { Link } from "react-router-dom";
import { ArrowLeft, Shield, ArrowDownToLine, ArrowUpFromLine } from "lucide-react";
import { cn } from "@/lib/utils";
import { Header } from "@/components/layout/Header";
import { DepositForm, WithdrawForm, PoolStats } from "@/components/mixer";

type TabType = "deposit" | "withdraw";

export default function Mixer() {
  const [activeTab, setActiveTab] = useState<TabType>("deposit");

  return (
    <div className="min-h-screen bg-[#0a0a0a]">
      <Header />
      
      <main className="pt-24 pb-16 px-4">
        <div className="max-w-lg mx-auto">
          {/* Back Link */}
          <Link
            to="/"
            className="inline-flex items-center gap-2 text-white/60 hover:text-white mb-8 transition-colors"
          >
            <ArrowLeft className="h-4 w-4" />
            Back to Home
          </Link>

          {/* Header */}
          <div className="text-center mb-8">
            <div className="w-16 h-16 rounded-full bg-wallet/20 flex items-center justify-center mx-auto mb-4">
              <Shield className="h-8 w-8 text-wallet" />
            </div>
            <h1 className="text-3xl font-bold text-white mb-2">
              Privacy Mixer
            </h1>
            <p className="text-white/60">
              Zero-knowledge privacy for your Solana transactions
            </p>
          </div>

          {/* Stats */}
          <div className="mb-6">
            <PoolStats />
          </div>

          {/* Tab Selector */}
          <div className="flex p-1 bg-white/5 rounded-xl mb-6">
            <button
              onClick={() => setActiveTab("deposit")}
              className={cn(
                "flex-1 flex items-center justify-center gap-2 py-3 px-4 rounded-lg font-semibold transition-all duration-200",
                activeTab === "deposit"
                  ? "bg-wallet text-black"
                  : "text-white/60 hover:text-white hover:bg-white/5"
              )}
            >
              <ArrowDownToLine className="h-4 w-4" />
              Deposit
            </button>
            <button
              onClick={() => setActiveTab("withdraw")}
              className={cn(
                "flex-1 flex items-center justify-center gap-2 py-3 px-4 rounded-lg font-semibold transition-all duration-200",
                activeTab === "withdraw"
                  ? "bg-wallet text-black"
                  : "text-white/60 hover:text-white hover:bg-white/5"
              )}
            >
              <ArrowUpFromLine className="h-4 w-4" />
              Withdraw
            </button>
          </div>

          {/* Form Card */}
          <div className="bg-white/5 border border-white/10 rounded-2xl p-6 backdrop-blur-sm">
            {activeTab === "deposit" ? <DepositForm /> : <WithdrawForm />}
          </div>

          {/* Info Section */}
          <div className="mt-8 grid gap-4">
            <div className="bg-white/5 border border-white/10 rounded-xl p-4">
              <h3 className="text-white font-semibold mb-2 flex items-center gap-2">
                <Shield className="h-4 w-4 text-wallet" />
                How It Works
              </h3>
              <ol className="text-white/60 text-sm space-y-2">
                <li>1. <strong className="text-white">Deposit</strong> - Send tokens to the privacy pool and receive a secret note</li>
                <li>2. <strong className="text-white">Wait</strong> - Let your deposit mix with others in the anonymity set</li>
                <li>3. <strong className="text-white">Withdraw</strong> - Use your note to withdraw to any address with zero-knowledge proof</li>
              </ol>
            </div>

            <div className="text-center text-white/40 text-sm">
              Powered by Umbra Protocol • Zero-Knowledge Privacy
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
