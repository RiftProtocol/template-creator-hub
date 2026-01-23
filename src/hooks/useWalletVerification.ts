import { useWallet } from "@solana/wallet-adapter-react";
import { useCallback, useState, useEffect } from "react";
import { toast } from "sonner";

const VERIFICATION_KEY = "rift_wallet_verification";

interface VerificationData {
  publicKey: string;
  signature: string;
  timestamp: number;
}

export const useWalletVerification = () => {
  const { publicKey, signMessage, connected, disconnect } = useWallet();
  const [isVerified, setIsVerified] = useState(false);
  const [isVerifying, setIsVerifying] = useState(false);

  // Check if wallet was previously verified (within 24 hours)
  const checkStoredVerification = useCallback(() => {
    if (!publicKey) return false;

    try {
      const stored = localStorage.getItem(VERIFICATION_KEY);
      if (!stored) return false;

      const data: VerificationData = JSON.parse(stored);
      const isValidKey = data.publicKey === publicKey.toBase58();
      const isNotExpired = Date.now() - data.timestamp < 24 * 60 * 60 * 1000; // 24 hours

      return isValidKey && isNotExpired;
    } catch {
      return false;
    }
  }, [publicKey]);

  // Verify wallet ownership by signing a message
  const verifyWallet = useCallback(async (): Promise<boolean> => {
    if (!publicKey || !signMessage) {
      toast.error("Wallet does not support message signing");
      return false;
    }

    setIsVerifying(true);

    try {
      const timestamp = Date.now();
      const message = `RIFT Protocol Verification\n\nWallet: ${publicKey.toBase58()}\nTimestamp: ${timestamp}\n\nSign this message to verify wallet ownership.`;

      const encodedMessage = new TextEncoder().encode(message);
      const signature = await signMessage(encodedMessage);
      const signatureBase64 = btoa(String.fromCharCode(...signature));

      // Store verification
      const verificationData: VerificationData = {
        publicKey: publicKey.toBase58(),
        signature: signatureBase64,
        timestamp,
      };

      localStorage.setItem(VERIFICATION_KEY, JSON.stringify(verificationData));
      setIsVerified(true);
      toast.success("Wallet verified successfully!");
      return true;
    } catch (error: any) {
      console.error("Verification failed:", error);
      
      if (error?.message?.includes("User rejected")) {
        toast.error("Verification cancelled - please sign to continue");
      } else {
        toast.error("Verification failed - please try again");
      }
      
      // Disconnect if verification fails
      disconnect();
      return false;
    } finally {
      setIsVerifying(false);
    }
  }, [publicKey, signMessage, disconnect]);

  // Clear verification on disconnect
  const clearVerification = useCallback(() => {
    localStorage.removeItem(VERIFICATION_KEY);
    setIsVerified(false);
  }, []);

  // Auto-verify when wallet connects
  useEffect(() => {
    if (connected && publicKey) {
      // Check if already verified
      if (checkStoredVerification()) {
        setIsVerified(true);
      } else {
        // Request verification
        setIsVerified(false);
        verifyWallet();
      }
    } else {
      setIsVerified(false);
    }
  }, [connected, publicKey, checkStoredVerification, verifyWallet]);

  return {
    isVerified,
    isVerifying,
    verifyWallet,
    clearVerification,
  };
};
