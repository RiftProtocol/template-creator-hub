// Umbra SDK Types
// These types mirror the Umbra SDK structure for seamless integration

export type PoolType = "SOL" | "USDC" | "USDT" | "BONK";

export interface PoolInfo {
  type: PoolType;
  name: string;
  symbol: string;
  decimals: number;
  totalDeposits: number;
  anonymitySet: number;
  mintAddress?: string;
  iconUrl?: string;
}

export interface DepositResult {
  signature: string;
  commitment: string;
  nullifierHash: string;
  timestamp: number;
}

export interface WithdrawResult {
  signature: string;
  nullifierHash: string;
  timestamp: number;
}

export interface DepositNote {
  commitment: string;
  nullifier: string;
  secret: string;
  poolType: PoolType;
  amount: number;
  timestamp: number;
}

export interface ProofInput {
  commitment: string;
  nullifierHash: string;
  recipient: string;
  relayer?: string;
  fee?: number;
}

export interface ZkProof {
  proof: {
    pi_a: string[];
    pi_b: string[][];
    pi_c: string[];
  };
  publicSignals: string[];
}

export interface UmbraConfig {
  network: "mainnet-beta" | "devnet" | "testnet";
  rpcEndpoint?: string;
  relayerUrl?: string;
}

export const POOL_INFO: Record<PoolType, PoolInfo> = {
  SOL: {
    type: "SOL",
    name: "Solana",
    symbol: "SOL",
    decimals: 9,
    totalDeposits: 15420,
    anonymitySet: 2847,
  },
  USDC: {
    type: "USDC",
    name: "USD Coin",
    symbol: "USDC",
    decimals: 6,
    totalDeposits: 8923000,
    anonymitySet: 1563,
    mintAddress: "EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v",
  },
  USDT: {
    type: "USDT",
    name: "Tether USD",
    symbol: "USDT",
    decimals: 6,
    totalDeposits: 5678000,
    anonymitySet: 982,
    mintAddress: "Es9vMFrzaCERmJfrF4H2FYD4KCoNkY11McCe8BenwNYB",
  },
  BONK: {
    type: "BONK",
    name: "Bonk",
    symbol: "BONK",
    decimals: 5,
    totalDeposits: 892000000000,
    anonymitySet: 456,
    mintAddress: "DezXAZ8z7PnrnRJjz3wXBoRgixCa6xjnB7YaB1pPB263",
  },
};

// Fixed deposit amounts for each pool (in lamports/smallest unit)
export const DEPOSIT_AMOUNTS: Record<PoolType, number[]> = {
  SOL: [0.1, 1, 10, 100].map((n) => n * 1e9),
  USDC: [10, 100, 1000, 10000].map((n) => n * 1e6),
  USDT: [10, 100, 1000, 10000].map((n) => n * 1e6),
  BONK: [1000000, 10000000, 100000000, 1000000000].map((n) => n * 1e5),
};

// Human readable deposit amounts
export const DEPOSIT_AMOUNTS_DISPLAY: Record<PoolType, string[]> = {
  SOL: ["0.1 SOL", "1 SOL", "10 SOL", "100 SOL"],
  USDC: ["$10", "$100", "$1,000", "$10,000"],
  USDT: ["$10", "$100", "$1,000", "$10,000"],
  BONK: ["1M BONK", "10M BONK", "100M BONK", "1B BONK"],
};
