import { useState } from "react";
import { Link } from "react-router-dom";
import { Header } from "@/components/layout/Header";
import { Footer } from "@/components/layout/Footer";
import { VideoBackground } from "@/components/layout/VideoBackground";
import { StakeForm, ActiveStakes } from "@/components/staking";
import { STAKING_CONFIG } from "@/lib/staking";

type TabType = "stake" | "positions";

export default function Staking() {
  const [activeTab, setActiveTab] = useState<TabType>("stake");

  return (
    <div className="relative w-full">
      <Header />

      <VideoBackground>
        <div className="relative z-10 pt-[150px]">
          {/* Hero Section */}
          <div className="lg:container mx-auto px-8 grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
            {/* LEFT */}
            <div className="lg:w-[90%] flex flex-col gap-6">
              <h1 className="text-[#FFCC00] font-inter text-[48px] lg:text-[56px] font-semibold leading-[66px]">
                Stake SOL <span className="text-white">Earn 0.7% Daily</span>
              </h1>

              <p className="text-white text-[24px] leading-[32px]">
                Expand protocol reserves and earn fixed daily rewards forever
              </p>

              <div className="flex gap-4 mt-4">
                <Link
                  to="/stats"
                  className="w-1/2 lg:w-auto px-4 py-3 rounded-[8px] border border-white/20 text-white text-[12px] font-semibold hover:bg-white/20 transition flex items-center justify-center gap-2 font-inter leading-[12px] focus-visible:outline-none focus-visible:border-[#FFCC00] active:border-[#FFCC00] transition-all duration-200"
                >
                  View Stats
                </Link>

                <Link
                  to="/mixer"
                  className="lg:w-auto w-[50%] flex items-center justify-center gap-2 px-4 py-3 rounded-[8px] bg-[#FFCC00] text-black font-inter text-[12px] font-semibold leading-[12px] hover:bg-[#FFD735] active:bg-[#FFCC00] active:shadow-[0_0_20px_0_#FFCC00] focus-visible:outline-none focus-visible:shadow-[0_0_20px_0_#FFCC00] transition-all duration-200"
                >
                  Privacy Mixer
                </Link>
              </div>
            </div>

            {/* RIGHT - Feature Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 p-8 gap-x-10 gap-y-8 rounded-3xl bg-white/5 backdrop-blur-[20px]">
              <div className="flex flex-col gap-2">
                <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none">
                  <path d="M12 2L2 7L12 12L22 7L12 2Z" stroke="#FFCC00" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                  <path d="M2 17L12 22L22 17" stroke="#FFCC00" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                  <path d="M2 12L12 17L22 12" stroke="#FFCC00" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                </svg>
                <h3 className="text-white font-inter text-[18px] font-semibold">0.7% Daily</h3>
                <p className="text-white/60 text-[14px]">Fixed rewards paid daily on your staked amount</p>
              </div>

              <div className="flex flex-col gap-2">
                <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none">
                  <path d="M12 22C17.5228 22 22 17.5228 22 12C22 6.47715 17.5228 2 12 2C6.47715 2 2 6.47715 2 12C2 17.5228 6.47715 22 12 22Z" stroke="#FFCC00" strokeWidth="2"/>
                  <path d="M12 6V12L16 14" stroke="#FFCC00" strokeWidth="2" strokeLinecap="round"/>
                </svg>
                <h3 className="text-white font-inter text-[18px] font-semibold">3-Day Lockup</h3>
                <p className="text-white/60 text-[14px]">Short lockup period to protect protocol stability</p>
              </div>

              <div className="flex flex-col gap-2">
                <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none">
                  <path d="M12 2V6M12 18V22M4.93 4.93L7.76 7.76M16.24 16.24L19.07 19.07M2 12H6M18 12H22M4.93 19.07L7.76 16.24M16.24 7.76L19.07 4.93" stroke="#FFCC00" strokeWidth="2" strokeLinecap="round"/>
                </svg>
                <h3 className="text-white font-inter text-[18px] font-semibold">255.5% APY</h3>
                <p className="text-white/60 text-[14px]">Compounding daily rewards for maximum returns</p>
              </div>

              <div className="flex flex-col gap-2">
                <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none">
                  <path d="M21 12C21 16.9706 16.9706 21 12 21C7.02944 21 3 16.9706 3 12C3 7.02944 7.02944 3 12 3C16.9706 3 21 7.02944 21 12Z" stroke="#FFCC00" strokeWidth="2"/>
                  <path d="M15 9L9 15M9 9L15 15" stroke="#FFCC00" strokeWidth="2" strokeLinecap="round"/>
                </svg>
                <h3 className="text-white font-inter text-[18px] font-semibold">Claim Anytime</h3>
                <p className="text-white/60 text-[14px]">Withdraw rewards without unstaking principal</p>
              </div>
            </div>
          </div>

          {/* How It Works Steps */}
          <div className="lg:container mx-auto px-8 pb-20 mt-20">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-12">
              <div className="flex items-center gap-6">
                <span className="text-[56px] font-semibold bg-gradient-to-b from-[#BABABA] to-black bg-clip-text text-transparent">
                  1
                </span>
                <div>
                  <h4 className="text-[#FFCC00] text-[18px] tracking-wider">Stake</h4>
                  <p className="text-white text-[14px]">Connect wallet and deposit SOL</p>
                </div>
              </div>

              <div className="flex items-center gap-6">
                <span className="text-[56px] font-semibold bg-gradient-to-b from-[#BABABA] to-black bg-clip-text text-transparent">
                  2
                </span>
                <div>
                  <h4 className="text-[#FFCC00] text-[18px] tracking-wider">Earn</h4>
                  <p className="text-white text-[14px]">Receive 0.7% rewards daily</p>
                </div>
              </div>

              <div className="flex items-center gap-6">
                <span className="text-[56px] font-semibold bg-gradient-to-b from-[#BABABA] to-black bg-clip-text text-transparent">
                  3
                </span>
                <div>
                  <h4 className="text-[#FFCC00] text-[18px] tracking-wider">Withdraw</h4>
                  <p className="text-white text-[14px]">Claim rewards or unstake after 3 days</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </VideoBackground>

      {/* Staking Interface Section */}
      <div className="bg-[#0a0a0a] py-20">
        <div className="lg:container mx-auto px-8">
          <div className="max-w-xl mx-auto">
            {/* Tab Selector */}
            <div className="flex p-1 bg-white/5 rounded-xl mb-8">
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

      <Footer />
    </div>
  );
}
