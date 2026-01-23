import { useWallet } from "@solana/wallet-adapter-react";
import { useConnection } from "@solana/wallet-adapter-react";
import { useCallback, useEffect, useState, useRef } from "react";
import { LAMPORTS_PER_SOL } from "@solana/web3.js";
import { supabase } from "@/integrations/supabase/client";

export const useWalletConnection = () => {
  const { publicKey, connected, connecting, disconnecting, wallet, disconnect } = useWallet();
  const { connection } = useConnection();
  const [balance, setBalance] = useState<number | null>(null);
  const [isLoadingBalance, setIsLoadingBalance] = useState(false);
  const [balanceError, setBalanceError] = useState<string | null>(null);
  const retryCount = useRef(0);
  const maxRetries = 3;

  // Fetch SOL balance when connected
  const fetchBalance = useCallback(async () => {
    if (!publicKey || !connection) {
      setBalance(null);
      setBalanceError(null);
      return;
    }

    setIsLoadingBalance(true);
    setBalanceError(null);

    try {
      // Add a small delay to ensure connection is ready
      await new Promise(resolve => setTimeout(resolve, 500));
      
      const lamports = await connection.getBalance(publicKey, "confirmed");
      setBalance(lamports / LAMPORTS_PER_SOL);
      retryCount.current = 0; // Reset retry count on success
      setBalanceError(null);
    } catch (error: any) {
      console.error("Error fetching balance:", error);

      // If the browser RPC is blocked (common 403/CORS/provider restriction), fallback to backend call.
      try {
        const { data, error: fnError } = await supabase.functions.invoke("get-sol-balance", {
          body: { publicKey: publicKey.toBase58() },
        });
        if (!fnError && data?.lamports != null) {
          setBalance(Number(data.lamports) / LAMPORTS_PER_SOL);
          retryCount.current = 0;
          setBalanceError(null);
          return;
        }
      } catch (fallbackErr) {
        // ignore; continue to retry logic below
      }
      
      // Retry logic for transient errors
      if (retryCount.current < maxRetries) {
        retryCount.current++;
        console.log(`Retrying balance fetch (${retryCount.current}/${maxRetries})...`);
        setTimeout(() => fetchBalance(), 1000 * retryCount.current);
        return;
      }
      
      setBalanceError(error?.message || "Failed to fetch balance");
      setBalance(null);
    } finally {
      setIsLoadingBalance(false);
    }
  }, [publicKey, connection]);

  // Fetch balance on connection
  useEffect(() => {
    if (connected && publicKey) {
      retryCount.current = 0;
      fetchBalance();
    } else {
      setBalance(null);
      setBalanceError(null);
    }
  }, [connected, publicKey, fetchBalance]);

  // Refresh balance periodically when connected (every 30 seconds)
  useEffect(() => {
    if (!connected || !publicKey) return;

    const interval = setInterval(() => {
      fetchBalance();
    }, 30000);

    return () => clearInterval(interval);
  }, [connected, publicKey, fetchBalance]);

  // Format wallet address
  const formattedAddress = publicKey
    ? `${publicKey.toBase58().slice(0, 4)}...${publicKey.toBase58().slice(-4)}`
    : null;

  const fullAddress = publicKey?.toBase58() || null;

  return {
    publicKey,
    connected,
    connecting,
    disconnecting,
    wallet,
    disconnect,
    balance,
    isLoadingBalance,
    balanceError,
    formattedAddress,
    fullAddress,
    refetchBalance: fetchBalance,
  };
};
