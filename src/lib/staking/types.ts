// Staking Configuration
export const STAKING_CONFIG = {
  TREASURY_WALLET: "FnAexERfb2d91Th9fgqzKi41rpAztv8aSgD4WDqSmjwX",
  DAILY_REWARD_RATE: 0.007, // 0.7% daily
  LOCKUP_DAYS: 3,
  MIN_STAKE_SOL: 0.1,
  MAX_STAKE_SOL: 1000,
} as const;

export interface Stake {
  id: string;
  user_wallet: string;
  amount_sol: number;
  staked_at: string;
  lockup_ends_at: string;
  status: "active" | "unstaking" | "completed";
  tx_signature: string;
  created_at: string;
  updated_at: string;
  claimed_rewards_sol: number;
  last_claimed_at: string | null;
}

export interface RewardClaim {
  id: string;
  stake_id: string;
  amount_sol: number;
  claimed_at: string;
  tx_signature: string | null;
  status: "pending" | "processing" | "completed" | "failed";
}

export interface UnstakeRequest {
  id: string;
  stake_id: string;
  amount_sol: number;
  rewards_sol: number;
  recipient_wallet: string;
  requested_at: string;
  processed_at: string | null;
  tx_signature: string | null;
  status: "pending" | "processing" | "completed" | "failed";
}

export interface StakeWithRewards extends Stake {
  totalEarnedRewards: number;  // Total rewards earned since staking
  claimableRewards: number;    // Rewards available to claim (total - claimed)
  totalValue: number;          // Principal + claimable rewards
  daysStaked: number;
  isLocked: boolean;
  lockupRemaining: number;     // hours remaining
}

// Calculate rewards based on stake data
export function calculateRewards(stake: Stake): StakeWithRewards {
  const now = new Date();
  const stakedAt = new Date(stake.staked_at);
  const lockupEndsAt = new Date(stake.lockup_ends_at);
  
  const msPerDay = 24 * 60 * 60 * 1000;
  const daysStaked = Math.max(0, (now.getTime() - stakedAt.getTime()) / msPerDay);
  
  // Simple interest: principal × rate × time
  const totalEarnedRewards = stake.amount_sol * STAKING_CONFIG.DAILY_REWARD_RATE * daysStaked;
  
  // Claimable = total earned - already claimed
  const claimableRewards = Math.max(0, totalEarnedRewards - (stake.claimed_rewards_sol || 0));
  
  // Total value = principal + claimable rewards
  const totalValue = stake.amount_sol + claimableRewards;
  
  const isLocked = now < lockupEndsAt;
  const lockupRemaining = isLocked 
    ? Math.ceil((lockupEndsAt.getTime() - now.getTime()) / (60 * 60 * 1000)) 
    : 0;
  
  return {
    ...stake,
    totalEarnedRewards,
    claimableRewards,
    totalValue,
    daysStaked,
    isLocked,
    lockupRemaining,
  };
}

// Format SOL amount
export function formatSOL(amount: number, decimals = 4): string {
  return amount.toLocaleString(undefined, {
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals,
  });
}
