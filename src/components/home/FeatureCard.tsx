interface FeatureCardProps {
  children: React.ReactNode;
  title: string;
  desc: string;
}

export default function FeatureCard({ children, title, desc }: FeatureCardProps) {
  return (
    <div>
      {/* SVG SLOT */}
      <div className="mb-4">
        {children}
      </div>

      <h3 className="text-white text-[24px] font-inter mb-1">
        {title}
      </h3>

      <p className="text-white text-[16px] leading-relaxed">
        {desc}
      </p>
    </div>
  );
}
