import { VideoBackground } from "@/components/layout/VideoBackground";
import HeroContent from "./HeroContent";

export default function Hero() {
  return (
    <VideoBackground>
      <div className="relative z-10 pt-[150px]">
        <HeroContent />
      </div>
    </VideoBackground>
  );
}
