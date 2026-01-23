import { useState } from "react";
import { Header } from "@/components/layout/Header";
import { Footer } from "@/components/layout/Footer";
import { VideoBackground } from "@/components/layout/VideoBackground";
import { StakeForm, ActiveStakes } from "@/components/staking";

type TabType = "stake" | "positions";

export default function Staking() {
  const [activeTab, setActiveTab] = useState<TabType>("stake");

  return (
    <div className="relative w-full min-h-screen flex flex-col">
      <Header />

      <VideoBackground>
        <div className="relative z-10 flex-1 flex items-center justify-center pt-[120px] pb-20">
          <div className="lg:container mx-auto px-8">
            <div className="max-w-xl mx-auto">
              {/* Page Title */}
              <div className="text-center mb-8">
                <h1 className="text-[#FFCC00] font-inter text-[36px] lg:text-[42px] font-semibold leading-tight">
                  Stake SOL
                </h1>
                <p className="text-white/60 text-[16px] mt-2 font-inter">
                  Earn 1.45% daily rewards • 3-day lockup
                </p>
                
                {/* Value Proposition */}
                <div className="mt-6 text-left bg-white/5 border border-white/10 rounded-2xl p-5 space-y-3">
                  <div className="flex items-start gap-3">
                    <div className="w-8 h-8 rounded-lg bg-[#FFCC00]/20 flex items-center justify-center flex-shrink-0 mt-0.5">
                      <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#FFCC00" strokeWidth="2">
                        <path d="M12 2L2 7L12 12L22 7L12 2Z"/>
                        <path d="M2 17L12 22L22 17"/>
                        <path d="M2 12L12 17L22 12"/>
                      </svg>
                    </div>
                    <div>
                      <h3 className="text-white font-inter font-semibold text-[14px]">Power the Privacy Network</h3>
                      <p className="text-white/50 text-[13px] font-inter leading-relaxed">
                        Your staked SOL provides liquidity for mixing pools, enabling anonymous transactions across the network.
                      </p>
                    </div>
                  </div>
                  
                  <div className="flex items-start gap-3">
                    <div className="w-8 h-8 rounded-lg bg-green-500/20 flex items-center justify-center flex-shrink-0 mt-0.5">
                      <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#22c55e" strokeWidth="2">
                        <line x1="12" y1="1" x2="12" y2="23"/>
                        <path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"/>
                      </svg>
                    </div>
                    <div>
                      <h3 className="text-white font-inter font-semibold text-[14px]">Earn Protocol Fees</h3>
                      <p className="text-white/50 text-[13px] font-inter leading-relaxed">
                        Every mix transaction generates fees that flow directly to stakers. More network usage means higher rewards.
                      </p>
                    </div>
                  </div>
                  
                  <div className="flex items-start gap-3">
                    <div className="w-8 h-8 rounded-lg bg-purple-500/20 flex items-center justify-center flex-shrink-0 mt-0.5">
                      <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#a855f7" strokeWidth="2">
                        <rect x="3" y="11" width="18" height="11" rx="2" ry="2"/>
                        <path d="M7 11V7a5 5 0 0 1 10 0v4"/>
                      </svg>
                    </div>
                    <div>
                      <h3 className="text-white font-inter font-semibold text-[14px]">3-Day Security Lockup</h3>
                      <p className="text-white/50 text-[13px] font-inter leading-relaxed">
                        Short lockup period ensures pool stability while keeping your capital accessible.
                      </p>
                    </div>
                  </div>
                </div>
              </div>

              {/* Tab Selector */}
              <div className="flex p-1 bg-white/5 backdrop-blur-[20px] rounded-xl mb-6">
                <button
                  onClick={() => setActiveTab("stake")}
                  className={`flex-1 flex items-center justify-center gap-2 py-4 px-4 rounded-lg font-inter font-semibold text-[14px] transition-all duration-200 ${
                    activeTab === "stake"
                      ? "bg-[#FFCC00] text-black"
                      : "text-white/60 hover:text-white hover:bg-white/5"
                  }`}
                >
                  <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M12 2L2 7L12 12L22 7L12 2Z"/>
                    <path d="M2 17L12 22L22 17"/>
                    <path d="M2 12L12 17L22 12"/>
                  </svg>
                  Stake SOL
                </button>
                <button
                  onClick={() => setActiveTab("positions")}
                  className={`flex-1 flex items-center justify-center gap-2 py-4 px-4 rounded-lg font-inter font-semibold text-[14px] transition-all duration-200 ${
                    activeTab === "positions"
                      ? "bg-[#FFCC00] text-black"
                      : "text-white/60 hover:text-white hover:bg-white/5"
                  }`}
                >
                  <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M22 12H18L15 21L9 3L6 12H2"/>
                  </svg>
                  My Positions
                </button>
              </div>

              {/* Form Card */}
              <div className="rounded-3xl bg-white/5 backdrop-blur-[20px] p-8">
                {activeTab === "stake" ? <StakeForm /> : <ActiveStakes />}
              </div>
            </div>
          </div>
        </div>
      </VideoBackground>

      <Footer />
    </div>
  );
}
