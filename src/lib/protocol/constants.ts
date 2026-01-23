// RIFT Protocol Constants & Configuration
// Original design by RIFT Team

export const PROTOCOL_VERSION = "1.0.0";

// Unique Protocol Features
export const RIFT_FEATURES = {
  // Staking-Powered Privacy: Stakers fund the privacy infrastructure
  STAKING_FEE_SHARE: 0.3, // 30% of mixer fees go to stakers
  
  // Privacy Score System
  PRIVACY_SCORE: {
    BASE_SCORE: 100,
    DEPOSIT_BONUS: 10,
    WAIT_TIME_MULTIPLIER: 5, // per hour waited
    MAX_SCORE: 1000,
  },
  
  // Anonymity Sets
  ANONYMITY_TIERS: {
    LOW: { minDeposits: 5, multiplier: 1.0 },
    MEDIUM: { minDeposits: 20, multiplier: 1.5 },
    HIGH: { minDeposits: 50, multiplier: 2.0 },
    MAXIMUM: { minDeposits: 100, multiplier: 3.0 },
  },
  
  // Relayer Network
  RELAYER: {
    MIN_STAKE_TO_RUN: 100, // 100 SOL minimum to run a relayer
    FEE_SHARE: 0.1, // 10% of transaction fees
    SLASHING_RATE: 0.05, // 5% slash for misbehavior
  },
  
  // Governance
  GOVERNANCE: {
    PROPOSAL_THRESHOLD: 10000, // RIFT tokens to create proposal
    VOTING_PERIOD_DAYS: 7,
    QUORUM_PERCENTAGE: 10,
    EXECUTION_DELAY_DAYS: 2,
  },
} as const;

// Pool Architecture
export const PRIVACY_POOLS = {
  SOL_001: {
    id: "sol-0.01",
    name: "Micro Pool",
    amount: 0.01,
    symbol: "SOL",
    anonymityTarget: 1000,
    feeRate: 0.001, // 0.1%
  },
  SOL_01: {
    id: "sol-0.1",
    name: "Standard Pool", 
    amount: 0.1,
    symbol: "SOL",
    anonymityTarget: 500,
    feeRate: 0.002, // 0.2%
  },
  SOL_1: {
    id: "sol-1",
    name: "Premium Pool",
    amount: 1,
    symbol: "SOL",
    anonymityTarget: 200,
    feeRate: 0.003, // 0.3%
  },
  SOL_10: {
    id: "sol-10",
    name: "Whale Pool",
    amount: 10,
    symbol: "SOL",
    anonymityTarget: 50,
    feeRate: 0.005, // 0.5%
  },
  SOL_100: {
    id: "sol-100",
    name: "Institution Pool",
    amount: 100,
    symbol: "SOL",
    anonymityTarget: 20,
    feeRate: 0.01, // 1%
  },
} as const;

// Cryptographic Parameters
export const CRYPTO_PARAMS = {
  MERKLE_TREE_HEIGHT: 20, // 2^20 = ~1M deposits per pool
  HASH_FUNCTION: "keccak256",
  COMMITMENT_SCHEME: "pedersen",
  PROOF_SYSTEM: "groth16",
  CURVE: "bn254",
  NULLIFIER_BITS: 256,
} as const;

// Security Features
export const SECURITY = {
  ROOT_HISTORY_SIZE: 100, // Store last 100 Merkle roots
  MIN_WAIT_BLOCKS: 10, // Minimum blocks between deposit and withdraw
  MAX_DEPOSIT_PER_BLOCK: 5, // Rate limiting
  EMERGENCY_PAUSE: true,
  TIMELOCK_HOURS: 48, // Governance timelock
} as const;

// Token Economics
export const TOKENOMICS = {
  TOTAL_SUPPLY: 1_000_000_000, // 1 billion RIFT
  DISTRIBUTION: {
    COMMUNITY: 0.40, // 40% - Staking rewards, airdrops
    TEAM: 0.15, // 15% - 4 year vesting
    TREASURY: 0.20, // 20% - Protocol development
    INVESTORS: 0.15, // 15% - Early supporters
    LIQUIDITY: 0.10, // 10% - DEX liquidity
  },
  EMISSION_SCHEDULE: {
    YEAR_1: 0.30, // 30% of community allocation
    YEAR_2: 0.25,
    YEAR_3: 0.20,
    YEAR_4: 0.15,
    YEAR_5_PLUS: 0.10,
  },
} as const;

// Smart Contract Addresses (to be updated after deployment)
export const CONTRACTS = {
  MIXER_PROGRAM: "RiFT1111111111111111111111111111111111111",
  STAKING_PROGRAM: "RiFTStake1111111111111111111111111111111",
  GOVERNANCE_PROGRAM: "RiFTGov11111111111111111111111111111111",
  TOKEN_MINT: "RiFToken1111111111111111111111111111111",
  TREASURY: "FnAexERfb2d91Th9fgqzKi41rpAztv8aSgD4WDqSmjwX",
} as const;
