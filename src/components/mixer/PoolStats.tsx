import { Shield, Users, TrendingUp, Lock } from "lucide-react";
import { POOL_INFO, PoolType } from "@/lib/umbra";

interface PoolStatsProps {
  poolType?: PoolType;
}

export function PoolStats({ poolType }: PoolStatsProps) {
  const pool = poolType ? POOL_INFO[poolType] : null;
  
  const totalDeposits = Object.values(POOL_INFO).reduce(
    (acc, p) => acc + p.totalDeposits,
    0
  );
  
  const totalAnonymitySet = Object.values(POOL_INFO).reduce(
    (acc, p) => acc + p.anonymitySet,
    0
  );

  const stats = pool
    ? [
        {
          label: "Pool Deposits",
          value: pool.totalDeposits.toLocaleString(),
          suffix: pool.symbol,
          icon: TrendingUp,
        },
        {
          label: "Anonymity Set",
          value: pool.anonymitySet.toLocaleString(),
          suffix: "deposits",
          icon: Users,
        },
      ]
    : [
        {
          label: "Total Value Locked",
          value: "$14.2M",
          icon: Lock,
        },
        {
          label: "Total Anonymity Set",
          value: totalAnonymitySet.toLocaleString(),
          suffix: "deposits",
          icon: Users,
        },
        {
          label: "Privacy Score",
          value: "99.9%",
          icon: Shield,
        },
        {
          label: "Active Pools",
          value: Object.keys(POOL_INFO).length.toString(),
          icon: TrendingUp,
        },
      ];

  return (
    <div className="grid grid-cols-2 gap-3">
      {stats.map((stat, i) => (
        <div
          key={i}
          className="bg-white/5 border border-white/10 rounded-xl p-4"
        >
          <div className="flex items-center gap-2 mb-2">
            <stat.icon className="h-4 w-4 text-wallet" />
            <span className="text-white/60 text-sm">{stat.label}</span>
          </div>
          <p className="text-white text-xl font-semibold">
            {stat.value}
            {stat.suffix && (
              <span className="text-white/60 text-sm ml-1">{stat.suffix}</span>
            )}
          </p>
        </div>
      ))}
    </div>
  );
}
