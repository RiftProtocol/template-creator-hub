import bannerVideo from "@/assets/banner.mp4";

interface VideoBackgroundProps {
  children?: React.ReactNode;
  overlayOpacity?: number;
}

export const VideoBackground = ({ children, overlayOpacity = 0.7 }: VideoBackgroundProps) => {
  return (
    <section className="relative w-full min-h-screen overflow-hidden">
      {/* Video Background */}
      <video
        autoPlay
        loop
        muted
        playsInline
        className="absolute top-0 left-0 w-full h-full object-cover"
      >
        <source src={bannerVideo} type="video/mp4" />
      </video>

      {/* Overlay */}
      <div
        className="absolute top-0 left-0 w-full h-full"
        style={{
          background: `linear-gradient(0deg, rgba(0,0,0,${overlayOpacity}) 0%, rgba(0,0,0,${overlayOpacity}) 100%)`,
        }}
      />

      {children}
    </section>
  );
};
