// RIFT Protocol Type Definitions
// Original architecture by RIFT Team

// ============================================
// CORE PRIVACY TYPES
// ============================================

export interface Commitment {
  hash: Uint8Array;
  nullifier: Uint8Array;
  secret: Uint8Array;
  amount: number;
  poolId: string;
  timestamp: number;
}

export interface MerkleProof {
  root: Uint8Array;
  pathElements: Uint8Array[];
  pathIndices: number[];
  leaf: Uint8Array;
}

export interface ZeroKnowledgeProof {
  pi_a: [string, string];
  pi_b: [[string, string], [string, string]];
  pi_c: [string, string];
  protocol: "groth16";
  curve: "bn254";
}

export interface DepositNote {
  poolId: string;
  commitment: string;
  nullifier: string;
  secret: string;
  amount: number;
  timestamp: number;
  leafIndex: number;
  txSignature: string;
}

export interface WithdrawRequest {
  noteHash: string;
  recipient: string;
  relayer?: string;
  fee: number;
  proof: ZeroKnowledgeProof;
  merkleProof: MerkleProof;
}

// ============================================
// PRIVACY POOL TYPES
// ============================================

export interface PrivacyPool {
  id: string;
  name: string;
  amount: number;
  symbol: string;
  totalDeposits: number;
  totalWithdrawals: number;
  anonymitySet: number;
  merkleRoot: string;
  nextLeafIndex: number;
  isPaused: boolean;
  feeRate: number;
  createdAt: number;
}

export interface PoolStats {
  poolId: string;
  depositsLast24h: number;
  withdrawalsLast24h: number;
  uniqueDepositors: number;
  averageWaitTime: number; // in hours
  anonymityScore: number;
  volumeUSD: number;
}

// ============================================
// STAKING TYPES
// ============================================

export interface StakePosition {
  id: string;
  owner: string;
  amount: number;
  stakedAt: number;
  lockupEndsAt: number;
  lastClaimAt: number;
  totalClaimed: number;
  isRelayer: boolean;
  relayerAddress?: string;
  delegatedTo?: string;
  status: "active" | "unstaking" | "withdrawn";
}

export interface StakingRewards {
  baseRewards: number; // From inflation
  feeRewards: number; // From mixer fees
  relayerRewards: number; // From running relayer
  totalRewards: number;
  pendingRewards: number;
  claimedRewards: number;
}

export interface RelayerNode {
  address: string;
  stakedAmount: number;
  successfulRelays: number;
  failedRelays: number;
  reputation: number;
  fee: number;
  isActive: boolean;
  registeredAt: number;
}

// ============================================
// GOVERNANCE TYPES
// ============================================

export interface Proposal {
  id: string;
  proposer: string;
  title: string;
  description: string;
  category: ProposalCategory;
  actions: ProposalAction[];
  votesFor: number;
  votesAgainst: number;
  votesAbstain: number;
  status: ProposalStatus;
  createdAt: number;
  votingEndsAt: number;
  executedAt?: number;
}

export type ProposalCategory = 
  | "parameter"
  | "treasury"
  | "upgrade"
  | "emergency"
  | "community";

export type ProposalStatus =
  | "pending"
  | "active"
  | "passed"
  | "failed"
  | "executed"
  | "cancelled";

export interface ProposalAction {
  target: string;
  method: string;
  args: unknown[];
  value: number;
}

export interface Vote {
  proposalId: string;
  voter: string;
  weight: number;
  support: "for" | "against" | "abstain";
  timestamp: number;
}

// ============================================
// PRIVACY SCORE SYSTEM
// ============================================

export interface PrivacyScore {
  userId: string;
  totalScore: number;
  depositCount: number;
  averageWaitTime: number;
  poolDiversity: number;
  lastActivity: number;
  tier: PrivacyTier;
  badges: PrivacyBadge[];
}

export type PrivacyTier =
  | "novice"
  | "enthusiast"
  | "advocate"
  | "guardian"
  | "legend";

export interface PrivacyBadge {
  id: string;
  name: string;
  description: string;
  icon: string;
  earnedAt: number;
}

// ============================================
// ANALYTICS TYPES
// ============================================

export interface ProtocolMetrics {
  totalValueLocked: number;
  totalDeposits: number;
  totalWithdrawals: number;
  uniqueUsers: number;
  averageAnonymitySet: number;
  totalStaked: number;
  totalRelayers: number;
  circulatingSupply: number;
  marketCap: number;
}

export interface TimeSeriesData {
  timestamp: number;
  value: number;
}

export interface PoolAnalytics {
  poolId: string;
  depositHistory: TimeSeriesData[];
  withdrawHistory: TimeSeriesData[];
  anonymityHistory: TimeSeriesData[];
  feeHistory: TimeSeriesData[];
}

// ============================================
// EVENT TYPES
// ============================================

export interface DepositEvent {
  poolId: string;
  commitment: string;
  leafIndex: number;
  timestamp: number;
  txSignature: string;
}

export interface WithdrawEvent {
  poolId: string;
  nullifierHash: string;
  recipient: string;
  relayer?: string;
  fee: number;
  timestamp: number;
  txSignature: string;
}

export interface StakeEvent {
  staker: string;
  amount: number;
  lockupDays: number;
  timestamp: number;
  txSignature: string;
}

export interface GovernanceEvent {
  proposalId: string;
  action: "created" | "voted" | "executed" | "cancelled";
  actor: string;
  timestamp: number;
  txSignature: string;
}
