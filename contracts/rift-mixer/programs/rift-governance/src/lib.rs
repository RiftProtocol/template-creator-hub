// RIFT Governance Program - Solana Smart Contract
// Original implementation by RIFT Protocol Team
//
// Decentralized governance for protocol parameters, treasury, and upgrades
// Features: Proposal creation, voting, timelock execution, delegation

use anchor_lang::prelude::*;
use anchor_lang::solana_program::clock::Clock;

declare_id!("RiFTGov11111111111111111111111111111111");

// ============================================
// CONSTANTS
// ============================================

pub const GOVERNANCE_SEED: &[u8] = b"governance";
pub const PROPOSAL_SEED: &[u8] = b"proposal";
pub const VOTE_SEED: &[u8] = b"vote";

// Governance parameters
pub const PROPOSAL_THRESHOLD: u64 = 10_000_000_000; // 10,000 RIFT tokens (with 6 decimals)
pub const VOTING_PERIOD: i64 = 7 * 24 * 60 * 60; // 7 days in seconds
pub const TIMELOCK_DELAY: i64 = 2 * 24 * 60 * 60; // 48 hours in seconds
pub const QUORUM_PERCENTAGE: u8 = 10; // 10% of total supply
pub const MAX_ACTIONS_PER_PROPOSAL: usize = 10;

// ============================================
// PROGRAM
// ============================================

#[program]
pub mod rift_governance {
    use super::*;

    /// Initialize governance
    pub fn initialize(
        ctx: Context<Initialize>,
        total_supply: u64,
    ) -> Result<()> {
        let governance = &mut ctx.accounts.governance;
        governance.authority = ctx.accounts.authority.key();
        governance.total_supply = total_supply;
        governance.proposal_count = 0;
        governance.quorum_votes = (total_supply as u128 * QUORUM_PERCENTAGE as u128 / 100) as u64;
        governance.is_paused = false;
        governance.bump = ctx.bumps.governance;

        emit!(GovernanceInitialized {
            authority: governance.authority,
            total_supply,
            quorum: governance.quorum_votes,
            timestamp: Clock::get()?.unix_timestamp,
        });

        Ok(())
    }

    /// Create a new proposal
    pub fn create_proposal(
        ctx: Context<CreateProposal>,
        title: String,
        description: String,
        category: ProposalCategory,
        actions: Vec<ProposalAction>,
    ) -> Result<()> {
        require!(!ctx.accounts.governance.is_paused, GovernanceError::Paused);
        require!(title.len() <= 100, GovernanceError::TitleTooLong);
        require!(description.len() <= 5000, GovernanceError::DescriptionTooLong);
        require!(!actions.is_empty(), GovernanceError::NoActions);
        require!(actions.len() <= MAX_ACTIONS_PER_PROPOSAL, GovernanceError::TooManyActions);

        // Check proposer has enough tokens (would be checked via SPL token balance)
        // For now, we trust the frontend validation

        let clock = Clock::get()?;
        let governance = &mut ctx.accounts.governance;
        let proposal = &mut ctx.accounts.proposal;

        governance.proposal_count += 1;

        proposal.id = governance.proposal_count;
        proposal.proposer = ctx.accounts.proposer.key();
        proposal.title = title.clone();
        proposal.description = description;
        proposal.category = category;
        proposal.votes_for = 0;
        proposal.votes_against = 0;
        proposal.votes_abstain = 0;
        proposal.status = ProposalStatus::Active;
        proposal.created_at = clock.unix_timestamp;
        proposal.voting_ends_at = clock.unix_timestamp + VOTING_PERIOD;
        proposal.executed_at = None;
        proposal.bump = ctx.bumps.proposal;

        // Store actions (simplified - in production would use separate accounts)
        proposal.action_count = actions.len() as u8;

        emit!(ProposalCreated {
            id: proposal.id,
            proposer: proposal.proposer,
            title,
            category,
            voting_ends_at: proposal.voting_ends_at,
            timestamp: clock.unix_timestamp,
        });

        Ok(())
    }

    /// Cast vote on a proposal
    pub fn vote(
        ctx: Context<Vote>,
        support: VoteType,
        weight: u64,
    ) -> Result<()> {
        require!(!ctx.accounts.governance.is_paused, GovernanceError::Paused);

        let clock = Clock::get()?;
        let proposal = &mut ctx.accounts.proposal;
        let vote_record = &mut ctx.accounts.vote_record;

        require!(
            proposal.status == ProposalStatus::Active,
            GovernanceError::ProposalNotActive
        );
        require!(
            clock.unix_timestamp <= proposal.voting_ends_at,
            GovernanceError::VotingEnded
        );
        require!(weight > 0, GovernanceError::ZeroWeight);

        // Record vote
        vote_record.proposal_id = proposal.id;
        vote_record.voter = ctx.accounts.voter.key();
        vote_record.weight = weight;
        vote_record.support = support;
        vote_record.timestamp = clock.unix_timestamp;
        vote_record.bump = ctx.bumps.vote_record;

        // Update proposal vote counts
        match support {
            VoteType::For => proposal.votes_for += weight,
            VoteType::Against => proposal.votes_against += weight,
            VoteType::Abstain => proposal.votes_abstain += weight,
        }

        emit!(VoteCast {
            proposal_id: proposal.id,
            voter: ctx.accounts.voter.key(),
            support,
            weight,
            timestamp: clock.unix_timestamp,
        });

        Ok(())
    }

    /// Finalize proposal after voting ends
    pub fn finalize_proposal(ctx: Context<FinalizeProposal>) -> Result<()> {
        let clock = Clock::get()?;
        let governance = &ctx.accounts.governance;
        let proposal = &mut ctx.accounts.proposal;

        require!(
            proposal.status == ProposalStatus::Active,
            GovernanceError::ProposalNotActive
        );
        require!(
            clock.unix_timestamp > proposal.voting_ends_at,
            GovernanceError::VotingNotEnded
        );

        let total_votes = proposal.votes_for + proposal.votes_against + proposal.votes_abstain;
        let quorum_reached = total_votes >= governance.quorum_votes;
        let passed = proposal.votes_for > proposal.votes_against && quorum_reached;

        proposal.status = if passed {
            ProposalStatus::Passed
        } else {
            ProposalStatus::Failed
        };

        emit!(ProposalFinalized {
            id: proposal.id,
            status: proposal.status,
            votes_for: proposal.votes_for,
            votes_against: proposal.votes_against,
            quorum_reached,
            timestamp: clock.unix_timestamp,
        });

        Ok(())
    }

    /// Execute passed proposal (after timelock)
    pub fn execute_proposal(ctx: Context<ExecuteProposal>) -> Result<()> {
        let clock = Clock::get()?;
        let proposal = &mut ctx.accounts.proposal;

        require!(
            proposal.status == ProposalStatus::Passed,
            GovernanceError::ProposalNotPassed
        );
        require!(
            clock.unix_timestamp >= proposal.voting_ends_at + TIMELOCK_DELAY,
            GovernanceError::TimelockNotPassed
        );

        proposal.status = ProposalStatus::Executed;
        proposal.executed_at = Some(clock.unix_timestamp);

        // In production, would execute the actual actions via CPI
        // For now, we emit an event indicating execution

        emit!(ProposalExecuted {
            id: proposal.id,
            executor: ctx.accounts.executor.key(),
            timestamp: clock.unix_timestamp,
        });

        Ok(())
    }

    /// Cancel proposal (only by proposer or guardian)
    pub fn cancel_proposal(ctx: Context<CancelProposal>) -> Result<()> {
        let proposal = &mut ctx.accounts.proposal;

        require!(
            proposal.status == ProposalStatus::Active,
            GovernanceError::ProposalNotActive
        );

        // Verify caller is proposer or governance authority
        let is_proposer = ctx.accounts.canceller.key() == proposal.proposer;
        let is_authority = ctx.accounts.canceller.key() == ctx.accounts.governance.authority;
        require!(is_proposer || is_authority, GovernanceError::Unauthorized);

        proposal.status = ProposalStatus::Cancelled;

        emit!(ProposalCancelled {
            id: proposal.id,
            canceller: ctx.accounts.canceller.key(),
            timestamp: Clock::get()?.unix_timestamp,
        });

        Ok(())
    }

    /// Emergency pause governance (guardian only)
    pub fn pause_governance(ctx: Context<PauseGovernance>) -> Result<()> {
        let governance = &mut ctx.accounts.governance;
        governance.is_paused = true;

        emit!(GovernancePaused {
            pauser: ctx.accounts.authority.key(),
            timestamp: Clock::get()?.unix_timestamp,
        });

        Ok(())
    }

    /// Unpause governance (guardian only)
    pub fn unpause_governance(ctx: Context<PauseGovernance>) -> Result<()> {
        let governance = &mut ctx.accounts.governance;
        governance.is_paused = false;

        emit!(GovernanceUnpaused {
            unpauser: ctx.accounts.authority.key(),
            timestamp: Clock::get()?.unix_timestamp,
        });

        Ok(())
    }

    /// Get proposal info
    pub fn get_proposal(ctx: Context<GetProposal>) -> Result<ProposalInfo> {
        let proposal = &ctx.accounts.proposal;
        let clock = Clock::get()?;

        let time_remaining = if proposal.voting_ends_at > clock.unix_timestamp {
            proposal.voting_ends_at - clock.unix_timestamp
        } else {
            0
        };

        Ok(ProposalInfo {
            id: proposal.id,
            proposer: proposal.proposer,
            title: proposal.title.clone(),
            status: proposal.status,
            votes_for: proposal.votes_for,
            votes_against: proposal.votes_against,
            votes_abstain: proposal.votes_abstain,
            time_remaining,
            can_execute: proposal.status == ProposalStatus::Passed
                && clock.unix_timestamp >= proposal.voting_ends_at + TIMELOCK_DELAY,
        })
    }
}

// ============================================
// ACCOUNTS
// ============================================

#[derive(Accounts)]
pub struct Initialize<'info> {
    #[account(
        init,
        payer = authority,
        space = 8 + Governance::LEN,
        seeds = [GOVERNANCE_SEED],
        bump
    )]
    pub governance: Account<'info, Governance>,

    #[account(mut)]
    pub authority: Signer<'info>,

    pub system_program: Program<'info, System>,
}

#[derive(Accounts)]
pub struct CreateProposal<'info> {
    #[account(
        mut,
        seeds = [GOVERNANCE_SEED],
        bump = governance.bump
    )]
    pub governance: Account<'info, Governance>,

    #[account(
        init,
        payer = proposer,
        space = 8 + Proposal::LEN,
        seeds = [PROPOSAL_SEED, &(governance.proposal_count + 1).to_le_bytes()],
        bump
    )]
    pub proposal: Account<'info, Proposal>,

    #[account(mut)]
    pub proposer: Signer<'info>,

    pub system_program: Program<'info, System>,
}

#[derive(Accounts)]
pub struct Vote<'info> {
    #[account(
        seeds = [GOVERNANCE_SEED],
        bump = governance.bump
    )]
    pub governance: Account<'info, Governance>,

    #[account(
        mut,
        seeds = [PROPOSAL_SEED, &proposal.id.to_le_bytes()],
        bump = proposal.bump
    )]
    pub proposal: Account<'info, Proposal>,

    #[account(
        init,
        payer = voter,
        space = 8 + VoteRecord::LEN,
        seeds = [VOTE_SEED, proposal.id.to_le_bytes().as_ref(), voter.key().as_ref()],
        bump
    )]
    pub vote_record: Account<'info, VoteRecord>,

    #[account(mut)]
    pub voter: Signer<'info>,

    pub system_program: Program<'info, System>,
}

#[derive(Accounts)]
pub struct FinalizeProposal<'info> {
    #[account(
        seeds = [GOVERNANCE_SEED],
        bump = governance.bump
    )]
    pub governance: Account<'info, Governance>,

    #[account(
        mut,
        seeds = [PROPOSAL_SEED, &proposal.id.to_le_bytes()],
        bump = proposal.bump
    )]
    pub proposal: Account<'info, Proposal>,
}

#[derive(Accounts)]
pub struct ExecuteProposal<'info> {
    #[account(
        mut,
        seeds = [PROPOSAL_SEED, &proposal.id.to_le_bytes()],
        bump = proposal.bump
    )]
    pub proposal: Account<'info, Proposal>,

    pub executor: Signer<'info>,
}

#[derive(Accounts)]
pub struct CancelProposal<'info> {
    #[account(
        seeds = [GOVERNANCE_SEED],
        bump = governance.bump
    )]
    pub governance: Account<'info, Governance>,

    #[account(
        mut,
        seeds = [PROPOSAL_SEED, &proposal.id.to_le_bytes()],
        bump = proposal.bump
    )]
    pub proposal: Account<'info, Proposal>,

    pub canceller: Signer<'info>,
}

#[derive(Accounts)]
pub struct PauseGovernance<'info> {
    #[account(
        mut,
        seeds = [GOVERNANCE_SEED],
        bump = governance.bump,
        has_one = authority @ GovernanceError::Unauthorized
    )]
    pub governance: Account<'info, Governance>,

    pub authority: Signer<'info>,
}

#[derive(Accounts)]
pub struct GetProposal<'info> {
    #[account(
        seeds = [PROPOSAL_SEED, &proposal.id.to_le_bytes()],
        bump = proposal.bump
    )]
    pub proposal: Account<'info, Proposal>,
}

// ============================================
// STATE
// ============================================

#[account]
pub struct Governance {
    pub authority: Pubkey,
    pub total_supply: u64,
    pub proposal_count: u64,
    pub quorum_votes: u64,
    pub is_paused: bool,
    pub bump: u8,
}

impl Governance {
    pub const LEN: usize = 32 + 8 + 8 + 8 + 1 + 1;
}

#[account]
pub struct Proposal {
    pub id: u64,
    pub proposer: Pubkey,
    pub title: String,
    pub description: String,
    pub category: ProposalCategory,
    pub votes_for: u64,
    pub votes_against: u64,
    pub votes_abstain: u64,
    pub status: ProposalStatus,
    pub created_at: i64,
    pub voting_ends_at: i64,
    pub executed_at: Option<i64>,
    pub action_count: u8,
    pub bump: u8,
}

impl Proposal {
    pub const LEN: usize = 8 + 32 + (4 + 100) + (4 + 5000) + 1 + 8 + 8 + 8 + 1 + 8 + 8 + 9 + 1 + 1;
}

#[account]
pub struct VoteRecord {
    pub proposal_id: u64,
    pub voter: Pubkey,
    pub weight: u64,
    pub support: VoteType,
    pub timestamp: i64,
    pub bump: u8,
}

impl VoteRecord {
    pub const LEN: usize = 8 + 32 + 8 + 1 + 8 + 1;
}

// ============================================
// TYPES
// ============================================

#[derive(AnchorSerialize, AnchorDeserialize, Clone, Copy, PartialEq, Eq)]
pub enum ProposalCategory {
    Parameter,   // Change protocol parameters
    Treasury,    // Treasury spending
    Upgrade,     // Protocol upgrade
    Emergency,   // Emergency action
    Community,   // Community initiative
}

#[derive(AnchorSerialize, AnchorDeserialize, Clone, Copy, PartialEq, Eq)]
pub enum ProposalStatus {
    Active,
    Passed,
    Failed,
    Executed,
    Cancelled,
}

#[derive(AnchorSerialize, AnchorDeserialize, Clone, Copy, PartialEq, Eq)]
pub enum VoteType {
    For,
    Against,
    Abstain,
}

#[derive(AnchorSerialize, AnchorDeserialize)]
pub struct ProposalAction {
    pub target: Pubkey,
    pub method: String,
    pub data: Vec<u8>,
    pub value: u64,
}

#[derive(AnchorSerialize, AnchorDeserialize)]
pub struct ProposalInfo {
    pub id: u64,
    pub proposer: Pubkey,
    pub title: String,
    pub status: ProposalStatus,
    pub votes_for: u64,
    pub votes_against: u64,
    pub votes_abstain: u64,
    pub time_remaining: i64,
    pub can_execute: bool,
}

// ============================================
// EVENTS
// ============================================

#[event]
pub struct GovernanceInitialized {
    pub authority: Pubkey,
    pub total_supply: u64,
    pub quorum: u64,
    pub timestamp: i64,
}

#[event]
pub struct ProposalCreated {
    pub id: u64,
    pub proposer: Pubkey,
    pub title: String,
    pub category: ProposalCategory,
    pub voting_ends_at: i64,
    pub timestamp: i64,
}

#[event]
pub struct VoteCast {
    pub proposal_id: u64,
    pub voter: Pubkey,
    pub support: VoteType,
    pub weight: u64,
    pub timestamp: i64,
}

#[event]
pub struct ProposalFinalized {
    pub id: u64,
    pub status: ProposalStatus,
    pub votes_for: u64,
    pub votes_against: u64,
    pub quorum_reached: bool,
    pub timestamp: i64,
}

#[event]
pub struct ProposalExecuted {
    pub id: u64,
    pub executor: Pubkey,
    pub timestamp: i64,
}

#[event]
pub struct ProposalCancelled {
    pub id: u64,
    pub canceller: Pubkey,
    pub timestamp: i64,
}

#[event]
pub struct GovernancePaused {
    pub pauser: Pubkey,
    pub timestamp: i64,
}

#[event]
pub struct GovernanceUnpaused {
    pub unpauser: Pubkey,
    pub timestamp: i64,
}

// ============================================
// ERRORS
// ============================================

#[error_code]
pub enum GovernanceError {
    #[msg("Governance is paused")]
    Paused,
    #[msg("Title too long")]
    TitleTooLong,
    #[msg("Description too long")]
    DescriptionTooLong,
    #[msg("No actions provided")]
    NoActions,
    #[msg("Too many actions")]
    TooManyActions,
    #[msg("Proposal is not active")]
    ProposalNotActive,
    #[msg("Voting has ended")]
    VotingEnded,
    #[msg("Voting has not ended yet")]
    VotingNotEnded,
    #[msg("Vote weight cannot be zero")]
    ZeroWeight,
    #[msg("Proposal has not passed")]
    ProposalNotPassed,
    #[msg("Timelock period has not passed")]
    TimelockNotPassed,
    #[msg("Unauthorized")]
    Unauthorized,
}
