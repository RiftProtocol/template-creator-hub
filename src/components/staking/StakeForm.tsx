import { useState, useEffect, useCallback, useRef } from "react";
import { Loader2, AlertCircle } from "lucide-react";
import { useWalletConnection } from "@/hooks/useWalletConnection";
import { useWalletVerification } from "@/hooks/useWalletVerification";
import { STAKING_CONFIG } from "@/lib/staking";
import { WalletButton } from "@/components/wallet";
import { AmountInput } from "./AmountInput";
import { QRCodePayment } from "./QRCodePayment";
import { StakeSuccess } from "./StakeSuccess";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

type StakeStep = "amount" | "payment" | "success";

interface StakeFormProps {
  onViewPositions?: () => void;
}

export function StakeForm({ onViewPositions }: StakeFormProps) {
  const [step, setStep] = useState<StakeStep>("amount");
  const [amount, setAmount] = useState("");
  const [isDetecting, setIsDetecting] = useState(false);
  const [successData, setSuccessData] = useState<{ signature: string; amount: number } | null>(null);
  
  const { connected, balance, isLoadingBalance, balanceError, refetchBalance, publicKey } = useWalletConnection();
  const { isVerified, isVerifying, verifyWallet } = useWalletVerification();
  const { toast } = useToast();
  
  const detectionIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const detectionTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  const numAmount = parseFloat(amount) || 0;
  const isValidAmount = numAmount >= STAKING_CONFIG.MIN_STAKE_SOL && 
                        numAmount <= STAKING_CONFIG.MAX_STAKE_SOL &&
                        (balance === null || numAmount <= balance);

  // Cleanup function for detection polling
  const stopDetection = useCallback(() => {
    if (detectionIntervalRef.current) {
      clearInterval(detectionIntervalRef.current);
      detectionIntervalRef.current = null;
    }
    if (detectionTimeoutRef.current) {
      clearTimeout(detectionTimeoutRef.current);
      detectionTimeoutRef.current = null;
    }
    setIsDetecting(false);
  }, []);

  // Cleanup on unmount
  useEffect(() => {
    return () => stopDetection();
  }, [stopDetection]);

  // Check for incoming transaction
  const checkForTransaction = useCallback(async () => {
    if (!publicKey) return false;

    try {
      const response = await supabase.functions.invoke("detect-stake-transaction", {
        body: {
          senderWallet: publicKey.toBase58(),
          expectedAmount: numAmount,
        },
      });

      if (response.error) {
        console.error("Detection error:", response.error);
        return false;
      }

      const data = response.data;
      
      if (data.success && data.found) {
        console.log("Transaction found:", data.signature);
        stopDetection();
        
        setSuccessData({
          signature: data.signature,
          amount: data.amount,
        });
        setStep("success");
        
        toast({
          title: "Stake Activated!",
          description: `${data.amount} SOL is now earning 1.45% daily`,
        });
        
        return true;
      }
      
      return false;
    } catch (error) {
      console.error("Detection check failed:", error);
      return false;
    }
  }, [publicKey, numAmount, stopDetection, toast]);

  // Start transaction detection polling
  const startDetection = useCallback(() => {
    if (!publicKey || isDetecting) return;

    setIsDetecting(true);
    
    // Poll every 5 seconds
    detectionIntervalRef.current = setInterval(() => {
      checkForTransaction();
    }, 5000);
    
    // Timeout after 10 minutes
    detectionTimeoutRef.current = setTimeout(() => {
      stopDetection();
      toast({
        title: "Detection timeout",
        description: "No transaction detected. Please try again.",
        variant: "destructive",
      });
      setStep("amount");
    }, 10 * 60 * 1000);
    
    // Initial check
    checkForTransaction();
  }, [publicKey, isDetecting, checkForTransaction, stopDetection, toast]);

  const handleContinueToPayment = () => {
    if (!isValidAmount) return;
    setStep("payment");
    startDetection();
  };

  const handleCancelPayment = () => {
    stopDetection();
    setStep("amount");
  };

  const handleNewStake = () => {
    setAmount("");
    setSuccessData(null);
    setStep("amount");
  };

  const handleViewPositions = () => {
    if (onViewPositions) {
      onViewPositions();
    }
  };

  // Not connected state
  if (!connected) {
    return (
      <div className="text-center py-12">
        <svg xmlns="http://www.w3.org/2000/svg" width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" className="mx-auto mb-6 text-white/20">
          <rect x="3" y="11" width="18" height="11" rx="2" ry="2"/>
          <path d="M7 11V7a5 5 0 0 1 10 0v4"/>
        </svg>
        <p className="text-white/60 text-[18px] mb-6 font-inter">Connect your wallet to start staking</p>
        <div className="flex justify-center">
          <WalletButton />
        </div>
      </div>
    );
  }

  // Verifying state
  if (isVerifying) {
    return (
      <div className="text-center py-12">
        <Loader2 className="mx-auto mb-6 h-12 w-12 text-[#FFCC00] animate-spin" />
        <p className="text-white text-[18px] mb-2 font-inter font-semibold">Verifying Wallet</p>
        <p className="text-white/60 text-[14px] font-inter">Please sign the message in your wallet to verify ownership</p>
      </div>
    );
  }

  // Not verified state
  if (!isVerified) {
    return (
      <div className="text-center py-12">
        <AlertCircle className="mx-auto mb-6 h-12 w-12 text-[#FFCC00]" />
        <p className="text-white text-[18px] mb-2 font-inter font-semibold">Verification Required</p>
        <p className="text-white/60 text-[14px] mb-6 font-inter">Sign a message to verify wallet ownership</p>
        <button
          onClick={() => verifyWallet()}
          className="px-6 py-3 rounded-xl bg-[#FFCC00] text-black font-inter text-[14px] font-semibold hover:bg-[#FFD735] transition-all duration-200"
        >
          Verify Wallet
        </button>
      </div>
    );
  }

  // Render based on step
  switch (step) {
    case "payment":
      return (
        <QRCodePayment
          amount={numAmount}
          isDetecting={isDetecting}
          onCancel={handleCancelPayment}
        />
      );
    
    case "success":
      if (!successData) return null;
      return (
        <StakeSuccess
          amount={successData.amount}
          signature={successData.signature}
          onViewPositions={handleViewPositions}
          onNewStake={handleNewStake}
        />
      );
    
    default:
      return (
        <AmountInput
          amount={amount}
          onAmountChange={setAmount}
          balance={balance}
          isLoadingBalance={isLoadingBalance}
          balanceError={balanceError}
          onRefetchBalance={refetchBalance}
          onContinue={handleContinueToPayment}
          isValid={isValidAmount}
        />
      );
  }
}
