import { useState, useCallback, useEffect } from "react";
import { useConnection, useWallet } from "@solana/wallet-adapter-react";
import { 
  PublicKey, 
  Transaction, 
  SystemProgram, 
  LAMPORTS_PER_SOL 
} from "@solana/web3.js";
import { supabase } from "@/integrations/supabase/client";
import { 
  STAKING_CONFIG, 
  Stake, 
  StakeWithRewards, 
  calculateRewards,
  RewardClaim,
  UnstakeRequest
} from "@/lib/staking";
import { useToast } from "@/hooks/use-toast";

export function useStaking() {
  const { connection } = useConnection();
  const { publicKey, sendTransaction, connected } = useWallet();
  const { toast } = useToast();
  
  const [stakes, setStakes] = useState<StakeWithRewards[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isStaking, setIsStaking] = useState(false);
  const [isUnstaking, setIsUnstaking] = useState(false);
  const [isClaiming, setIsClaiming] = useState(false);
  const [totalStaked, setTotalStaked] = useState(0);
  const [totalRewards, setTotalRewards] = useState(0);

  // Fetch user's stakes
  const fetchStakes = useCallback(async () => {
    if (!publicKey) {
      setStakes([]);
      return;
    }

    setIsLoading(true);
    try {
      const { data, error } = await supabase
        .from("stakes")
        .select("*")
        .eq("user_wallet", publicKey.toBase58())
        .eq("status", "active")
        .order("staked_at", { ascending: false });

      if (error) throw error;

      const stakesWithRewards = (data as Stake[]).map(calculateRewards);
      setStakes(stakesWithRewards);
      
      // Calculate totals
      const staked = stakesWithRewards.reduce((sum, s) => sum + s.amount_sol, 0);
      const rewards = stakesWithRewards.reduce((sum, s) => sum + s.earnedRewards, 0);
      setTotalStaked(staked);
      setTotalRewards(rewards);
    } catch (error) {
      console.error("Error fetching stakes:", error);
      toast({
        title: "Error",
        description: "Failed to fetch your stakes",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  }, [publicKey, toast]);

  // Stake SOL
  const stake = useCallback(async (amountSOL: number) => {
    if (!publicKey || !connected) {
      toast({
        title: "Wallet not connected",
        description: "Please connect your wallet to stake",
        variant: "destructive",
      });
      return null;
    }

    if (amountSOL < STAKING_CONFIG.MIN_STAKE_SOL) {
      toast({
        title: "Amount too low",
        description: `Minimum stake is ${STAKING_CONFIG.MIN_STAKE_SOL} SOL`,
        variant: "destructive",
      });
      return null;
    }

    setIsStaking(true);
    try {
      const treasuryPubkey = new PublicKey(STAKING_CONFIG.TREASURY_WALLET);
      const lamports = Math.floor(amountSOL * LAMPORTS_PER_SOL);

      // Create transaction
      const transaction = new Transaction().add(
        SystemProgram.transfer({
          fromPubkey: publicKey,
          toPubkey: treasuryPubkey,
          lamports,
        })
      );

      // Get latest blockhash
      const { blockhash, lastValidBlockHeight } = await connection.getLatestBlockhash();
      transaction.recentBlockhash = blockhash;
      transaction.feePayer = publicKey;

      // Send transaction
      const signature = await sendTransaction(transaction, connection);

      // Wait for confirmation
      await connection.confirmTransaction({
        signature,
        blockhash,
        lastValidBlockHeight,
      });

      // Record stake in database
      const { data, error } = await supabase
        .from("stakes")
        .insert({
          user_wallet: publicKey.toBase58(),
          amount_sol: amountSOL,
          tx_signature: signature,
        })
        .select()
        .single();

      if (error) throw error;

      toast({
        title: "Stake successful!",
        description: `You staked ${amountSOL} SOL. Earning 0.7% daily!`,
      });

      // Refresh stakes
      await fetchStakes();

      return data;
    } catch (error: any) {
      console.error("Staking error:", error);
      toast({
        title: "Staking failed",
        description: error.message || "Transaction failed",
        variant: "destructive",
      });
      return null;
    } finally {
      setIsStaking(false);
    }
  }, [publicKey, connected, connection, sendTransaction, toast, fetchStakes]);

  // Claim rewards
  const claimRewards = useCallback(async (stakeId: string, amount: number) => {
    if (!publicKey) return null;

    setIsClaiming(true);
    try {
      // Create claim request
      const { data, error } = await supabase
        .from("reward_claims")
        .insert({
          stake_id: stakeId,
          amount_sol: amount,
        })
        .select()
        .single();

      if (error) throw error;

      // Call edge function to process payout
      const response = await supabase.functions.invoke("process-payout", {
        body: {
          type: "reward",
          claimId: data.id,
          recipientWallet: publicKey.toBase58(),
          amount,
        },
      });

      if (response.error) throw response.error;

      toast({
        title: "Rewards claimed!",
        description: `${amount.toFixed(4)} SOL sent to your wallet`,
      });

      await fetchStakes();
      return data;
    } catch (error: any) {
      console.error("Claim error:", error);
      toast({
        title: "Claim failed",
        description: error.message || "Failed to claim rewards",
        variant: "destructive",
      });
      return null;
    } finally {
      setIsClaiming(false);
    }
  }, [publicKey, toast, fetchStakes]);

  // Unstake
  const unstake = useCallback(async (stakeId: string, amountSol: number, rewardsSol: number) => {
    if (!publicKey) return null;

    setIsUnstaking(true);
    try {
      // Update stake status
      await supabase
        .from("stakes")
        .update({ status: "unstaking" })
        .eq("id", stakeId);

      // Create unstake request
      const { data, error } = await supabase
        .from("unstake_requests")
        .insert({
          stake_id: stakeId,
          amount_sol: amountSol,
          rewards_sol: rewardsSol,
          recipient_wallet: publicKey.toBase58(),
        })
        .select()
        .single();

      if (error) throw error;

      // Call edge function to process payout
      const response = await supabase.functions.invoke("process-payout", {
        body: {
          type: "unstake",
          requestId: data.id,
          recipientWallet: publicKey.toBase58(),
          amount: amountSol + rewardsSol,
        },
      });

      if (response.error) throw response.error;

      toast({
        title: "Unstake successful!",
        description: `${(amountSol + rewardsSol).toFixed(4)} SOL sent to your wallet`,
      });

      await fetchStakes();
      return data;
    } catch (error: any) {
      console.error("Unstake error:", error);
      toast({
        title: "Unstake failed",
        description: error.message || "Failed to unstake",
        variant: "destructive",
      });
      return null;
    } finally {
      setIsUnstaking(false);
    }
  }, [publicKey, toast, fetchStakes]);

  // Fetch protocol stats
  const fetchProtocolStats = useCallback(async () => {
    try {
      const { data, error } = await supabase
        .from("stakes")
        .select("amount_sol")
        .eq("status", "active");

      if (error) throw error;

      const tvl = (data || []).reduce((sum, s) => sum + Number(s.amount_sol), 0);
      return {
        tvl,
        totalStakers: data?.length || 0,
        apy: STAKING_CONFIG.DAILY_REWARD_RATE * 365 * 100, // 255.5% APY
      };
    } catch (error) {
      console.error("Error fetching stats:", error);
      return { tvl: 0, totalStakers: 0, apy: 255.5 };
    }
  }, []);

  // Auto-refresh stakes every 30 seconds
  useEffect(() => {
    if (connected && publicKey) {
      fetchStakes();
      const interval = setInterval(fetchStakes, 30000);
      return () => clearInterval(interval);
    }
  }, [connected, publicKey, fetchStakes]);

  return {
    stakes,
    totalStaked,
    totalRewards,
    isLoading,
    isStaking,
    isUnstaking,
    isClaiming,
    stake,
    unstake,
    claimRewards,
    fetchStakes,
    fetchProtocolStats,
  };
}
