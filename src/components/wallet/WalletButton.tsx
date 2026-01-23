import { FC, useCallback, useMemo } from "react";
import { useWallet } from "@solana/wallet-adapter-react";
import { useWalletModal } from "@solana/wallet-adapter-react-ui";
import { LogOut } from "lucide-react";
import wallet from "@/assets/wallet.svg";

interface WalletButtonProps {
  className?: string;
}

export const WalletButton: FC<WalletButtonProps> = ({ className }) => {
  const { publicKey, wallet: connectedWallet, disconnect, connecting } = useWallet();
  const { setVisible } = useWalletModal();

  // Format wallet address for display
  const walletAddress = useMemo(() => {
    if (!publicKey) return null;
    const address = publicKey.toBase58();
    return `${address.slice(0, 4)}...${address.slice(-4)}`;
  }, [publicKey]);

  const handleConnect = useCallback(() => {
    setVisible(true);
  }, [setVisible]);

  const handleDisconnect = useCallback(() => {
    disconnect();
  }, [disconnect]);

  // When connected, show wallet address + logout button
  if (publicKey) {
    return (
      <div className={`flex items-center gap-2 ${className || ""}`}>
        <div className="flex items-center gap-2 px-4 py-2 rounded-lg bg-wallet text-wallet-foreground text-[12px] font-semibold">
          {connectedWallet?.adapter.icon ? (
            <img
              src={connectedWallet.adapter.icon}
              alt={connectedWallet.adapter.name}
              className="h-4 w-4"
            />
          ) : (
            <img src={wallet} alt="Wallet" className="h-4 w-4" />
          )}
          {walletAddress}
        </div>
        <button
          onClick={handleDisconnect}
          className="flex items-center justify-center p-2 rounded-lg bg-white/10 text-white hover:bg-red-500/20 hover:text-red-400 transition-all duration-200"
          title="Disconnect wallet"
        >
          <LogOut className="h-4 w-4" />
        </button>
      </div>
    );
  }

  // When not connected, show connect button
  return (
    <button
      onClick={handleConnect}
      disabled={connecting}
      className={`flex items-center gap-2 px-4 py-2 rounded-lg bg-wallet text-wallet-foreground text-[12px] font-semibold cursor-pointer hover:bg-wallet-hover focus:outline-none focus:bg-wallet focus:shadow-wallet disabled:bg-muted disabled:cursor-not-allowed transition-all duration-200 ${className || ""}`}
    >
      <img src={wallet} alt="Wallet" className="h-4 w-4" />
      {connecting ? (
        <span className="flex items-center gap-2">
          <svg className="animate-spin h-3 w-3" viewBox="0 0 24 24">
            <circle
              className="opacity-25"
              cx="12"
              cy="12"
              r="10"
              stroke="currentColor"
              strokeWidth="4"
              fill="none"
            />
            <path
              className="opacity-75"
              fill="currentColor"
              d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"
            />
          </svg>
          Connecting...
        </span>
      ) : (
        "Connect Wallet"
      )}
    </button>
  );
};
