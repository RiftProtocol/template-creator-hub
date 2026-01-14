import { useEffect, useState } from "react";
import { TrendingUp, Users, Coins, Percent } from "lucide-react";
import { useStaking } from "@/hooks/useStaking";
import { formatSOL, STAKING_CONFIG } from "@/lib/staking";

interface ProtocolStats {
  tvl: number;
  totalStakers: number;
  apy: number;
}

export function StakeStats() {
  const { fetchProtocolStats } = useStaking();
  const [stats, setStats] = useState<ProtocolStats>({
    tvl: 0,
    totalStakers: 0,
    apy: 255.5,
  });

  useEffect(() => {
    fetchProtocolStats().then(setStats);
  }, [fetchProtocolStats]);

  const statItems = [
    {
      label: "Total Value Locked",
      value: `${formatSOL(stats.tvl, 2)} SOL`,
      icon: Coins,
      color: "text-wallet",
    },
    {
      label: "Daily Rewards",
      value: `${(STAKING_CONFIG.DAILY_REWARD_RATE * 100).toFixed(1)}%`,
      icon: TrendingUp,
      color: "text-green-400",
    },
    {
      label: "APY",
      value: `${stats.apy.toFixed(1)}%`,
      icon: Percent,
      color: "text-purple-400",
    },
    {
      label: "Active Stakers",
      value: stats.totalStakers.toString(),
      icon: Users,
      color: "text-blue-400",
    },
  ];

  return (
    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
      {statItems.map((item) => (
        <div
          key={item.label}
          className="bg-white/5 border border-white/10 rounded-xl p-4 text-center"
        >
          <item.icon className={`h-6 w-6 ${item.color} mx-auto mb-2`} />
          <div className="text-xl font-bold text-white">{item.value}</div>
          <div className="text-sm text-white/60">{item.label}</div>
        </div>
      ))}
    </div>
  );
}
