interface VideoBackgroundProps {
  children: React.ReactNode;
  overlayOpacity?: number;
}

export const VideoBackground = ({ children, overlayOpacity = 0.8 }: VideoBackgroundProps) => {
  return (
    <section className="relative w-full min-h-screen overflow-hidden">
      {/* Background - gradient fallback since video is too large */}
      <div 
        className="absolute top-0 left-0 w-full h-full"
        style={{
          background: 'linear-gradient(135deg, #0a0a0a 0%, #1a1a2e 50%, #0a0a0a 100%)',
        }}
      />

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
