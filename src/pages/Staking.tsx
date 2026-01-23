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
                  Earn 0.7% daily rewards • 3-day lockup
                </p>
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
