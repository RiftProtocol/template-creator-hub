import { cn } from "@/lib/utils";
import { PoolType, DEPOSIT_AMOUNTS_DISPLAY } from "@/lib/umbra";

interface AmountSelectorProps {
  poolType: PoolType;
  selectedIndex: number;
  onSelectIndex: (index: number) => void;
}

export function AmountSelector({
  poolType,
  selectedIndex,
  onSelectIndex,
}: AmountSelectorProps) {
  const amounts = DEPOSIT_AMOUNTS_DISPLAY[poolType];

  return (
    <div className="grid grid-cols-2 gap-3">
      {amounts.map((amount, index) => (
        <button
          key={index}
          onClick={() => onSelectIndex(index)}
          className={cn(
            "p-4 rounded-xl border text-center font-semibold transition-all duration-200",
            "hover:border-wallet hover:bg-wallet/5",
            selectedIndex === index
              ? "border-wallet bg-wallet/10 text-wallet shadow-[0_0_20px_0_hsl(48_100%_50%/0.2)]"
              : "border-white/10 bg-white/5 text-white"
          )}
        >
          {amount}
        </button>
      ))}
    </div>
  );
}
