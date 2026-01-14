import { cn } from "@/lib/utils";
import { PoolType, POOL_INFO } from "@/lib/umbra";

interface PoolSelectorProps {
  selectedPool: PoolType;
  onSelectPool: (pool: PoolType) => void;
}

const poolIcons: Record<PoolType, string> = {
  SOL: "◎",
  USDC: "$",
  USDT: "₮",
  BONK: "🐕",
};

export function PoolSelector({ selectedPool, onSelectPool }: PoolSelectorProps) {
  const pools = Object.values(POOL_INFO);

  return (
    <div className="grid grid-cols-2 gap-3">
      {pools.map((pool) => (
        <button
          key={pool.type}
          onClick={() => onSelectPool(pool.type)}
          className={cn(
            "flex items-center gap-3 p-4 rounded-xl border transition-all duration-200",
            "hover:border-wallet hover:bg-wallet/5",
            selectedPool === pool.type
              ? "border-wallet bg-wallet/10 shadow-[0_0_20px_0_hsl(48_100%_50%/0.2)]"
              : "border-white/10 bg-white/5"
          )}
        >
          <span className="text-2xl">{poolIcons[pool.type]}</span>
          <div className="text-left">
            <p className="text-white font-semibold">{pool.symbol}</p>
            <p className="text-white/60 text-sm">{pool.name}</p>
          </div>
        </button>
      ))}
    </div>
  );
}
