import { Link } from "react-router-dom";
import { ArrowLeft, Shield, Lock, Zap, Users, Code, FileText, ChevronDown } from "lucide-react";
import { Header } from "@/components/layout/Header";
import { Footer } from "@/components/layout/Footer";
import { RIFT_FEATURES, PRIVACY_POOLS, CRYPTO_PARAMS, TOKENOMICS } from "@/lib/protocol/constants";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { useState } from "react";

export default function Protocol() {
  return (
    <div className="min-h-screen bg-[#0a0a0a]">
      <Header />
      
      <main className="pt-24 pb-16 px-4">
        <div className="max-w-6xl mx-auto">
          {/* Back Link */}
          <Link
            to="/"
            className="inline-flex items-center gap-2 text-white/60 hover:text-white mb-8 transition-colors"
          >
            <ArrowLeft className="h-4 w-4" />
            Back to Home
          </Link>

          {/* Hero */}
          <div className="text-center mb-16">
            <div className="w-16 h-16 rounded-full bg-wallet/20 flex items-center justify-center mx-auto mb-4">
              <Shield className="h-8 w-8 text-wallet" />
            </div>
            <h1 className="text-4xl md:text-5xl font-bold text-white mb-4">RIFT Protocol</h1>
            <p className="text-xl text-white/60 max-w-2xl mx-auto">
              Privacy-first DeFi infrastructure powered by zero-knowledge proofs, 
              stake-powered economics, and decentralized governance.
            </p>
          </div>

          {/* Core Features */}
          <section className="mb-16">
            <h2 className="text-2xl font-bold mb-8 flex items-center gap-2 text-white">
              <Shield className="w-6 h-6 text-wallet" /> Core Innovations
            </h2>
            <div className="grid md:grid-cols-3 gap-6">
              <div className="bg-white/5 border border-white/10 rounded-2xl p-6 backdrop-blur-sm">
                <div className="w-12 h-12 bg-wallet/20 rounded-lg flex items-center justify-center mb-4">
                  <Lock className="w-6 h-6 text-wallet" />
                </div>
                <h3 className="text-lg font-semibold mb-2 text-white">Stake-Powered Privacy</h3>
                <p className="text-white/60 text-sm">
                  {(RIFT_FEATURES.STAKING_FEE_SHARE * 100)}% of mixer fees flow to stakers, 
                  creating self-sustaining privacy infrastructure.
                </p>
              </div>
              <div className="bg-white/5 border border-white/10 rounded-2xl p-6 backdrop-blur-sm">
                <div className="w-12 h-12 bg-wallet/20 rounded-lg flex items-center justify-center mb-4">
                  <Zap className="w-6 h-6 text-wallet" />
                </div>
                <h3 className="text-lg font-semibold mb-2 text-white">Dynamic Anonymity</h3>
                <p className="text-white/60 text-sm">
                  Pools with {RIFT_FEATURES.ANONYMITY_TIERS.MAXIMUM.minDeposits}+ deposits unlock 
                  {RIFT_FEATURES.ANONYMITY_TIERS.MAXIMUM.multiplier}x reward multipliers.
                </p>
              </div>
              <div className="bg-white/5 border border-white/10 rounded-2xl p-6 backdrop-blur-sm">
                <div className="w-12 h-12 bg-wallet/20 rounded-lg flex items-center justify-center mb-4">
                  <Users className="w-6 h-6 text-wallet" />
                </div>
                <h3 className="text-lg font-semibold mb-2 text-white">Relayer Network</h3>
                <p className="text-white/60 text-sm">
                  Stake {RIFT_FEATURES.RELAYER.MIN_STAKE_TO_RUN} SOL to run a relayer node and 
                  earn {RIFT_FEATURES.RELAYER.FEE_SHARE * 100}% of transaction fees.
                </p>
              </div>
            </div>
          </section>

          {/* Privacy Pools */}
          <section className="mb-16">
            <h2 className="text-2xl font-bold mb-8 text-white">Privacy Pools</h2>
            <div className="bg-white/5 border border-white/10 rounded-2xl overflow-hidden backdrop-blur-sm">
              <table className="w-full">
                <thead className="bg-white/5">
                  <tr>
                    <th className="text-left p-4 font-medium text-white/60">Pool</th>
                    <th className="text-right p-4 font-medium text-white/60">Amount</th>
                    <th className="text-right p-4 font-medium text-white/60">Target Anonymity</th>
                    <th className="text-right p-4 font-medium text-white/60">Fee</th>
                  </tr>
                </thead>
                <tbody>
                  {Object.values(PRIVACY_POOLS).map((pool) => (
                    <tr key={pool.id} className="border-t border-white/10">
                      <td className="p-4 font-medium text-white">{pool.name}</td>
                      <td className="p-4 text-right text-white">{pool.amount} {pool.symbol}</td>
                      <td className="p-4 text-right text-white">{pool.anonymityTarget} deposits</td>
                      <td className="p-4 text-right text-white/60">{pool.feeRate * 100}%</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </section>

          {/* Cryptography */}
          <section className="mb-16">
            <h2 className="text-2xl font-bold mb-8 flex items-center gap-2 text-white">
              <Code className="w-6 h-6 text-wallet" /> Cryptographic Design
            </h2>
            <div className="grid md:grid-cols-2 gap-6">
              <div className="bg-white/5 border border-white/10 rounded-2xl p-6 backdrop-blur-sm">
                <h3 className="font-semibold mb-4 text-white">Parameters</h3>
                <ul className="space-y-2 text-sm">
                  <li className="flex justify-between">
                    <span className="text-white/60">Merkle Tree Height</span>
                    <span className="text-white">{CRYPTO_PARAMS.MERKLE_TREE_HEIGHT} levels (1M+ deposits)</span>
                  </li>
                  <li className="flex justify-between">
                    <span className="text-white/60">Hash Function</span>
                    <span className="text-white uppercase">{CRYPTO_PARAMS.HASH_FUNCTION}</span>
                  </li>
                  <li className="flex justify-between">
                    <span className="text-white/60">Proof System</span>
                    <span className="text-white uppercase">{CRYPTO_PARAMS.PROOF_SYSTEM}</span>
                  </li>
                  <li className="flex justify-between">
                    <span className="text-white/60">Curve</span>
                    <span className="text-white uppercase">{CRYPTO_PARAMS.CURVE}</span>
                  </li>
                </ul>
              </div>
              <div className="bg-white/5 border border-white/10 rounded-2xl p-6 backdrop-blur-sm">
                <h3 className="font-semibold mb-4 text-white">Security Features</h3>
                <ul className="space-y-2 text-sm text-white/60">
                  <li className="flex items-center gap-2">
                    <span className="text-wallet">✓</span> On-chain nullifier tracking prevents double-spend
                  </li>
                  <li className="flex items-center gap-2">
                    <span className="text-wallet">✓</span> Root history enables async withdrawals
                  </li>
                  <li className="flex items-center gap-2">
                    <span className="text-wallet">✓</span> Groth16 proofs verify in &lt;1ms
                  </li>
                  <li className="flex items-center gap-2">
                    <span className="text-wallet">✓</span> 128-bit security level
                  </li>
                </ul>
              </div>
            </div>
          </section>


          {/* Smart Contracts - Inline Code */}
          <section className="mb-16">
            <h2 className="text-2xl font-bold mb-8 flex items-center gap-2 text-white">
              <Code className="w-6 h-6 text-wallet" /> Smart Contracts (Open Source)
            </h2>
            <p className="text-white/60 mb-6">
              All contracts are in the codebase at <code className="text-wallet bg-white/5 px-2 py-1 rounded">contracts/rift-mixer/programs/</code>. 
              View the full source code below:
            </p>
            <div className="space-y-4">
              <ContractSection 
                name="Privacy Mixer"
                path="contracts/rift-mixer/programs/rift-mixer/src/lib.rs"
                description="ZK-proof deposits & withdrawals with Merkle tree commitments"
                lines={516}
              />
              <ContractSection 
                name="Staking"
                path="contracts/rift-mixer/programs/rift-staking/src/lib.rs"
                description="Tiered staking rewards & relayer node registration"
                lines={770}
              />
              <ContractSection 
                name="Governance"
                path="contracts/rift-mixer/programs/rift-governance/src/lib.rs"
                description="DAO proposals, voting & timelock execution"
                lines={645}
              />
            </div>
          </section>

          {/* CTA */}
          <section className="text-center">
            <div className="bg-wallet/10 border border-wallet/30 rounded-2xl p-8">
              <h2 className="text-2xl font-bold mb-4 text-white">Ready to Build?</h2>
              <p className="text-white/60 mb-6">
                Review the whitepaper, explore the contracts, and join the privacy revolution.
              </p>
              <div className="flex flex-wrap justify-center gap-4">
                <Link 
                  to="/mix" 
                  className="bg-wallet text-black px-6 py-3 rounded-xl font-semibold hover:bg-wallet-hover transition-colors"
                >
                  Launch Mixer
                </Link>
                <Link 
                  to="/stake" 
                  className="bg-white/5 border border-white/10 px-6 py-3 rounded-xl font-semibold text-white hover:bg-white/10 transition-colors"
                >
                  Start Staking
                </Link>
              </div>
            </div>
          </section>
        </div>
      </main>

      <Footer />
    </div>
  );
}

function ContractSection({ name, path, description, lines }: { 
  name: string; 
  path: string; 
  description: string;
  lines: number;
}) {
  const [isOpen, setIsOpen] = useState(false);
  
  return (
    <Collapsible open={isOpen} onOpenChange={setIsOpen}>
      <div className="bg-white/5 border border-white/10 rounded-2xl overflow-hidden backdrop-blur-sm">
        <CollapsibleTrigger className="w-full p-6 flex items-center justify-between hover:bg-white/5 transition-colors">
          <div className="text-left">
            <h3 className="font-semibold text-white mb-1">{name}</h3>
            <p className="text-sm text-white/60">{description}</p>
            <code className="text-xs text-wallet mt-2 block">{path}</code>
          </div>
          <div className="flex items-center gap-3">
            <span className="text-xs text-white/40">{lines} lines</span>
            <ChevronDown className={`w-5 h-5 text-white/60 transition-transform ${isOpen ? 'rotate-180' : ''}`} />
          </div>
        </CollapsibleTrigger>
        <CollapsibleContent>
          <div className="border-t border-white/10 p-4 bg-black/30 max-h-96 overflow-auto">
            <pre className="text-xs text-white/80 font-mono whitespace-pre-wrap">
              {getContractPreview(name)}
            </pre>
          </div>
        </CollapsibleContent>
      </div>
    </Collapsible>
  );
}

function getContractPreview(name: string): string {
  const previews: Record<string, string> = {
    "Privacy Mixer": `// RIFT Privacy Mixer - Solana Anchor Program
use anchor_lang::prelude::*;
use anchor_lang::solana_program::keccak;

declare_id!("RiFTMixer111111111111111111111111111111111");

// Constants
pub const MERKLE_TREE_HEIGHT: usize = 20;
pub const MAX_DEPOSITS: usize = 1_048_576; // 2^20
pub const DEPOSIT_0_1_SOL: u64 = 100_000_000;   // 0.1 SOL
pub const DEPOSIT_1_SOL: u64 = 1_000_000_000;    // 1 SOL
pub const DEPOSIT_10_SOL: u64 = 10_000_000_000;  // 10 SOL
pub const DEPOSIT_100_SOL: u64 = 100_000_000_000; // 100 SOL
pub const RELAYER_FEE_BPS: u64 = 30; // 0.3%

#[program]
pub mod rift_mixer {
    use super::*;

    /// Initialize the mixer pool
    pub fn initialize(ctx: Context<Initialize>, pool_type: PoolType) -> Result<()> { ... }

    /// Deposit SOL with ZK commitment
    pub fn deposit(ctx: Context<Deposit>, commitment: [u8; 32]) -> Result<()> { ... }

    /// Withdraw SOL with ZK proof (nullifier prevents double-spend)
    pub fn withdraw(
        ctx: Context<Withdraw>,
        proof: ZkProof,
        nullifier_hash: [u8; 32],
        recipient: Pubkey,
        relayer: Option<Pubkey>,
        fee: u64,
    ) -> Result<()> { ... }
}

// Pool types: 0.1, 1, 10, 100 SOL
#[derive(AnchorSerialize, AnchorDeserialize, Clone)]
pub enum PoolType { Sol0_1, Sol1, Sol10, Sol100 }

// Groth16 ZK Proof structure
#[derive(AnchorSerialize, AnchorDeserialize, Clone)]
pub struct ZkProof {
    pub a: [u8; 64],
    pub b: [u8; 128],
    pub c: [u8; 64],
}

// Full source: 516 lines - see contracts/rift-mixer/programs/rift-mixer/src/lib.rs`,

    "Staking": `// RIFT Staking Program - Solana Smart Contract
use anchor_lang::prelude::*;

declare_id!("RiFTStake1111111111111111111111111111111");

// Staking parameters
pub const MIN_STAKE_AMOUNT: u64 = 100_000_000; // 0.1 SOL
pub const MAX_STAKE_AMOUNT: u64 = 1_000_000_000_000; // 1000 SOL
pub const LOCKUP_DURATION: i64 = 3 * 24 * 60 * 60; // 3 days
pub const DAILY_REWARD_RATE: u64 = 145; // 1.45% daily

// Tier thresholds
pub const BRONZE_THRESHOLD: u64 = 10_000_000_000; // 10 SOL
pub const SILVER_THRESHOLD: u64 = 50_000_000_000; // 50 SOL
pub const GOLD_THRESHOLD: u64 = 100_000_000_000; // 100 SOL
pub const PLATINUM_THRESHOLD: u64 = 500_000_000_000; // 500 SOL
pub const DIAMOND_THRESHOLD: u64 = 1_000_000_000_000; // 1000 SOL

// Relayer parameters
pub const MIN_RELAYER_STAKE: u64 = 100_000_000_000; // 100 SOL
pub const RELAYER_FEE_SHARE: u64 = 1000; // 10%
pub const SLASHING_RATE: u64 = 500; // 5%

#[program]
pub mod rift_staking {
    use super::*;

    pub fn stake(ctx: Context<Stake>, amount: u64) -> Result<()> { ... }
    pub fn claim_rewards(ctx: Context<ClaimRewards>) -> Result<()> { ... }
    pub fn unstake(ctx: Context<Unstake>) -> Result<()> { ... }
    pub fn register_relayer(ctx: Context<RegisterRelayer>, fee: u64) -> Result<()> { ... }
    pub fn slash_relayer(ctx: Context<SlashRelayer>, reason: String) -> Result<()> { ... }
    pub fn deposit_fees(ctx: Context<DepositFees>, amount: u64) -> Result<()> { ... }
}

// Full source: 770 lines - see contracts/rift-mixer/programs/rift-staking/src/lib.rs`,

    "Governance": `// RIFT Governance Program - Solana Smart Contract
use anchor_lang::prelude::*;

declare_id!("RiFTGov11111111111111111111111111111111");

// Governance parameters
pub const PROPOSAL_THRESHOLD: u64 = 10_000_000_000; // 10,000 RIFT
pub const VOTING_PERIOD: i64 = 7 * 24 * 60 * 60; // 7 days
pub const TIMELOCK_DELAY: i64 = 2 * 24 * 60 * 60; // 48 hours
pub const QUORUM_PERCENTAGE: u8 = 10; // 10%
pub const MAX_ACTIONS_PER_PROPOSAL: usize = 10;

#[program]
pub mod rift_governance {
    use super::*;

    pub fn create_proposal(
        ctx: Context<CreateProposal>,
        title: String,
        description: String,
        category: ProposalCategory,
        actions: Vec<ProposalAction>,
    ) -> Result<()> { ... }

    pub fn vote(ctx: Context<Vote>, support: VoteType, weight: u64) -> Result<()> { ... }
    pub fn finalize_proposal(ctx: Context<FinalizeProposal>) -> Result<()> { ... }
    pub fn execute_proposal(ctx: Context<ExecuteProposal>) -> Result<()> { ... }
    pub fn cancel_proposal(ctx: Context<CancelProposal>) -> Result<()> { ... }
}

#[derive(AnchorSerialize, AnchorDeserialize, Clone)]
pub enum VoteType { For, Against, Abstain }

#[derive(AnchorSerialize, AnchorDeserialize, Clone)]
pub enum ProposalStatus { Active, Passed, Failed, Executed, Cancelled }

// Full source: 645 lines - see contracts/rift-mixer/programs/rift-governance/src/lib.rs`
  };
  
  return previews[name] || "// Contract source code";
}
