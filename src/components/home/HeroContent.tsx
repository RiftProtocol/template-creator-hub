import { Link } from "react-router-dom";
import FeatureGrid from "./FeatureGrid";
import HowItWorks from "./HowItWorks";

export default function HeroContent() {
  return (
    <>
      <div className="lg:container mx-auto px-8 grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
        {/* LEFT */}
        <div className="lg:w-[80%] flex flex-col gap-6">
          <h1 className="text-[#FFCC00] font-inter text-[48px] lg:text-[56px] font-semibold leading-[66px]">
            Private <span className="text-white">Transactions on Solana</span>
          </h1>

          <p className="text-white text-[24px] leading-[32px]">
            Zero-knowledge privacy mixer with auto-buyback tokenomics
          </p>

          <div className="flex gap-4 mt-4">
            <Link
              to="/stats"
              className="w-1/2 lg:w-auto px-4 py-3 rounded-[8px] border border-white/20 text-white text-[12px] font-semibold hover:bg-white/20 transition flex items-center justify-center gap-2 font-inter leading-[12px] focus-visible:outline-none focus-visible:border-[#FFCC00] active:border-[#FFCC00] transition-all duration-200"
            >
              View Stats
            </Link>

            <Link
              to="/mix"
              className="lg:w-auto w-[50%] flex items-center justify-center gap-2 px-4 py-3 rounded-[8px] bg-[#FFCC00] text-black font-inter text-[12px] font-semibold leading-[12px] hover:bg-[#FFD735] active:bg-[#FFCC00] active:shadow-[0_0_20px_0_#FFCC00] focus-visible:outline-none focus-visible:shadow-[0_0_20px_0_#FFCC00] transition-all duration-200"
            >
              Launch App
            </Link>
          </div>
        </div>

        {/* RIGHT */}
        <FeatureGrid />
      </div>

      <HowItWorks />
    </>
  );
}
